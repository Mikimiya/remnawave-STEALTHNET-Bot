/**
 * ePay (易支付) 通用接口 — 创建订单 & 验签。
 * 签名算法：MD5，参数按 ASCII 升序排列，拼接密钥后取 md5。
 * 文档参考：https://motionpay.net/doc.html
 */

import { createHash } from "crypto";

export type EpayConfig = {
  pid: string;       // 商户 ID
  key: string;       // 商户密钥
  apiUrl: string;    // 接口地址，例如 https://motionpay.net
};

export function isEpayConfigured(config: EpayConfig | null): boolean {
  return Boolean(config?.pid?.trim() && config?.key?.trim() && config?.apiUrl?.trim());
}

/**
 * ePay MD5 签名：
 * 1. 过滤掉 sign、sign_type、值为空或 "0" 的参数
 * 2. 按 key ASCII 升序排列
 * 3. 拼接成 a=b&c=d 格式（值不做 URL 编码）
 * 4. 末尾追加密钥，md5 取小写
 */
export function buildEpaySign(params: Record<string, string>, key: string): string {
  const filtered = Object.entries(params)
    .filter(([k, v]) => k !== "sign" && k !== "sign_type" && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  const str = filtered.map(([k, v]) => `${k}=${v}`).join("&");
  return createHash("md5").update(str + key).digest("hex");
}

export type CreateEpayPaymentParams = {
  config: EpayConfig;
  outTradeNo: string;      // 商户订单号
  notifyUrl: string;       // 异步通知地址
  returnUrl?: string;      // 页面跳转通知地址
  name: string;            // 商品名称
  money: string;           // 金额（元，最多2位小数）
  clientip?: string;       // 用户 IP
  type?: string;           // 支付方式：alipay / wxpay / usdt / cashier
  device?: string;         // 设备类型：pc / mobile
  param?: string;          // 业务扩展参数（支付后原样返回）
};

export type CreateEpayPaymentResult =
  | { ok: true; tradeNo: string; payUrl: string; qrcode?: string; urlscheme?: string }
  | { ok: false; error: string; status?: number };

/**
 * 构建 submit.php 页面跳转 URL（推荐方式）。
 * 用户浏览器直接跳转到易支付收银台，由收银台自动处理设备适配和支付渠道。
 * 比 mapi.php API 接口更可靠，尤其是支付宝 H5 场景。
 *
 * submit.php 参数（文档）：pid, type, out_trade_no, notify_url, return_url, name, money, param, sign, sign_type
 * 注意：submit.php 没有 clientip / device / rawurl 参数（那些是 mapi.php 独有的）
 * type 不传则跳转收银台（用户自选支付方式）
 */
export function buildEpaySubmitUrl(params: CreateEpayPaymentParams): CreateEpayPaymentResult {
  const { config, outTradeNo, notifyUrl, returnUrl, name, money, type, param } = params;
  const pid = config.pid?.trim();
  const key = config.key?.trim();
  const apiUrl = config.apiUrl?.trim()?.replace(/\/$/, "");
  if (!pid || !key || !apiUrl) return { ok: false, error: "ePay not configured" };
  if (!returnUrl) return { ok: false, error: "ePay submit.php requires return_url" };

  const reqParams: Record<string, string> = {
    pid,
    out_trade_no: outTradeNo,
    notify_url: notifyUrl,
    return_url: returnUrl,
    name: name.slice(0, 127),
    money,
  };
  // type 不传则跳收银台（用户自选），传了则直接跳对应支付方式
  if (type) reqParams.type = type;
  if (param) reqParams.param = param;

  reqParams.sign = buildEpaySign(reqParams, key);
  reqParams.sign_type = "MD5";

  const qs = Object.entries(reqParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  return {
    ok: true,
    tradeNo: outTradeNo,
    payUrl: `${apiUrl}/submit.php?${qs}`,
  };
}

/**
 * 通过 API 接口 (mapi.php) 创建订单，返回支付链接。
 * 注意：mapi.php 返回的 payurl 在某些易支付平台上不稳定（尤其支付宝 H5），
 *       推荐优先使用 buildEpaySubmitUrl (submit.php) 方式。
 */
export async function createEpayPayment(params: CreateEpayPaymentParams): Promise<CreateEpayPaymentResult> {
  const { config, outTradeNo, notifyUrl, returnUrl, name, money, clientip, type, device, param } = params;
  const pid = config.pid?.trim();
  const key = config.key?.trim();
  const apiUrl = config.apiUrl?.trim()?.replace(/\/$/, "");
  if (!pid || !key || !apiUrl) return { ok: false, error: "ePay not configured" };

  const reqParams: Record<string, string> = {
    pid,
    type: type || "cashier",
    out_trade_no: outTradeNo,
    notify_url: notifyUrl,
    name: name.slice(0, 127),
    money,
  };
  if (returnUrl) reqParams.return_url = returnUrl;
  if (clientip) reqParams.clientip = clientip;
  if (device) reqParams.device = device;
  if (param) reqParams.param = param;

  reqParams.sign = buildEpaySign(reqParams, key);
  reqParams.sign_type = "MD5";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const formBody = Object.entries(reqParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const res = await fetch(`${apiUrl}/mapi.php`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    clearTimeout(timeoutId);

    let data: {
      code?: number;
      msg?: string;
      trade_no?: string;
      payurl?: string;
      qrcode?: string;
      urlscheme?: string;
    };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      return { ok: false, error: `ePay: invalid response (${res.status})`, status: res.status };
    }

    if (data.code !== 1) {
      return { ok: false, error: `ePay: ${data.msg || "unknown error"}`, status: res.status };
    }

    const payUrl = data.payurl || data.qrcode || data.urlscheme;
    if (!payUrl) {
      return { ok: false, error: "ePay: no payment URL in response" };
    }

    return {
      ok: true,
      tradeNo: data.trade_no ?? outTradeNo,
      payUrl,
      qrcode: data.qrcode,
      urlscheme: data.urlscheme,
    };
  } catch (e) {
    clearTimeout(timeoutId);
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("fetch") || message.includes("ECONNREFUSED") || message.includes("ENOTFOUND") || message.includes("ETIMEDOUT") || (e instanceof Error && e.name === "AbortError")) {
      return { ok: false, error: "ePay: connection failed. Check network and settings." };
    }
    return { ok: false, error: message };
  }
}

/**
 * 验证 ePay 异步/同步通知签名。
 * 参数中的 sign 和 sign_type 不参与签名。
 */
export function verifyEpayNotification(queryParams: Record<string, string>, key: string): boolean {
  const signFromNotify = queryParams.sign;
  if (!signFromNotify?.trim() || !key?.trim()) return false;
  const expected = buildEpaySign(queryParams, key);
  return expected === signFromNotify;
}
