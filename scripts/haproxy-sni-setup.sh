#!/usr/bin/env bash
# ============================================================================
#  HAProxy SNI 分流一键安装脚本
#  用途：中转机上通过单个 443 端口，按 SNI 分流到多个 Reality 落地机
#
#  功能：
#    install   — 安装 HAProxy 并生成初始配置
#    add       — 批量添加落地机（交互式 / 文件导入）
#    remove    — 删除指定后端
#    list      — 列出所有已配置的后端
#    status    — 查看 HAProxy 运行状态
#    restart   — 重启 HAProxy
#    uninstall — 卸载 HAProxy 并清理配置
#
#  用法：
#    bash haproxy-sni-setup.sh install
#    bash haproxy-sni-setup.sh add
#    bash haproxy-sni-setup.sh add -f backends.txt
#    bash haproxy-sni-setup.sh list
#    bash haproxy-sni-setup.sh remove <backend_name>
#    bash haproxy-sni-setup.sh status
#    bash haproxy-sni-setup.sh uninstall
#
#  批量导入文件格式 (backends.txt)：
#    每行一条，格式: 名称,SNI域名,落地机IP,落地机端口
#    示例:
#      us1,www.microsoft.com,1.2.3.4,443
#      hk1,www.hkjc.com,5.6.7.8,443
#      jp1,www.nintendo.co.jp,9.10.11.12,443
# ============================================================================

set -euo pipefail

# ── 颜色 ────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── 路径 ────────────────────────────────────────────────────────
HAPROXY_CFG="/etc/haproxy/haproxy.cfg"
HAPROXY_CFG_BAK="/etc/haproxy/haproxy.cfg.bak"
BACKENDS_DIR="/etc/haproxy/backends.d"
SCRIPT_NAME=$(basename "$0")

# ── 工具函数 ────────────────────────────────────────────────────
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

check_root() {
  if [[ $EUID -ne 0 ]]; then
    error "请使用 root 用户运行此脚本：sudo bash $SCRIPT_NAME $*"
  fi
}

# ── 安装 HAProxy ────────────────────────────────────────────────
do_install() {
  info "========================================="
  info " HAProxy SNI 分流 — 一键安装"
  info "========================================="
  echo ""

  # 检测系统
  if command -v apt-get &>/dev/null; then
    PKG_MGR="apt"
  elif command -v yum &>/dev/null; then
    PKG_MGR="yum"
  elif command -v dnf &>/dev/null; then
    PKG_MGR="dnf"
  else
    error "不支持的系统，仅支持 Debian/Ubuntu/CentOS/RHEL"
  fi

  # 安装 HAProxy
  if command -v haproxy &>/dev/null; then
    warn "HAProxy 已安装：$(haproxy -v 2>&1 | head -1)"
  else
    info "正在安装 HAProxy ..."
    case $PKG_MGR in
      apt) apt-get update -qq && apt-get install -y -qq haproxy ;;
      yum) yum install -y haproxy ;;
      dnf) dnf install -y haproxy ;;
    esac
    success "HAProxy 安装完成"
  fi

  # 创建后端配置目录
  mkdir -p "$BACKENDS_DIR"

  # 备份原始配置
  if [[ -f "$HAPROXY_CFG" ]]; then
    cp "$HAPROXY_CFG" "$HAPROXY_CFG_BAK"
    info "原配置已备份到 $HAPROXY_CFG_BAK"
  fi

  # 生成默认回落域名
  echo ""
  read -rp "$(echo -e "${CYAN}请输入默认回落域名 [www.microsoft.com]: ${NC}")" DEFAULT_FALLBACK
  DEFAULT_FALLBACK="${DEFAULT_FALLBACK:-www.microsoft.com}"

  # 写入基础配置
  generate_config "$DEFAULT_FALLBACK"

  # 启动
  systemctl enable haproxy
  systemctl restart haproxy
  success "HAProxy 已启动并设为开机自启"
  echo ""

  # 检查 443 端口
  if ss -tlnp | grep -q ':443 '; then
    success "443 端口已监听"
  else
    warn "443 端口未监听，请检查是否有其他服务占用"
  fi

  echo ""
  info "========================================="
  success " 安装完成！"
  info "========================================="
  echo ""
  echo -e "  添加落地机:  ${GREEN}bash $SCRIPT_NAME add${NC}"
  echo -e "  批量导入:    ${GREEN}bash $SCRIPT_NAME add -f backends.txt${NC}"
  echo -e "  查看列表:    ${GREEN}bash $SCRIPT_NAME list${NC}"
  echo -e "  删除后端:    ${GREEN}bash $SCRIPT_NAME remove <name>${NC}"
  echo -e "  查看状态:    ${GREEN}bash $SCRIPT_NAME status${NC}"
  echo ""
}

# ── 生成 HAProxy 主配置 ────────────────────────────────────────
generate_config() {
  local fallback_domain="${1:-www.microsoft.com}"

  cat > "$HAPROXY_CFG" <<HAPCFG
# ============================================================
#  HAProxy SNI 分流配置 — 自动生成，请勿手动编辑
#  生成时间: $(date '+%Y-%m-%d %H:%M:%S')
#  默认回落: ${fallback_domain}
# ============================================================

global
    log /dev/log local0
    log /dev/log local1 notice
    maxconn 50000
    daemon

defaults
    mode tcp
    log global
    option tcplog
    option dontlognull
    timeout connect 5s
    timeout client 300s
    timeout server 300s
    timeout tunnel 1h
    retries 3

# ── 前端：监听 443，按 SNI 分流 ─────────────────────────────
frontend tls-in
    bind *:443
    tcp-request inspect-delay 5s
    tcp-request content accept if { req_ssl_hello_type 1 }

    # === SNI 路由规则（自动生成，勿手动修改此区域）===
    # --- BEGIN SNI RULES ---
    # --- END SNI RULES ---

    # 默认回落
    default_backend fallback

# ── 默认回落后端 ─────────────────────────────────────────────
backend fallback
    server fallback ${fallback_domain}:443

# === 落地机后端（自动生成，勿手动修改此区域）===
# --- BEGIN BACKENDS ---
# --- END BACKENDS ---
HAPCFG

  info "HAProxy 配置已生成"
}

# ── 添加后端 ────────────────────────────────────────────────────
do_add() {
  # 检查是否批量导入
  if [[ "${1:-}" == "-f" && -n "${2:-}" ]]; then
    do_batch_import "$2"
    return
  fi

  echo ""
  info "========================================="
  info " 添加落地机后端"
  info "========================================="
  echo ""
  echo -e "${CYAN}可以一次添加多个，输入完成后输入 'done' 结束${NC}"
  echo ""

  local count=0

  while true; do
    echo -e "${YELLOW}--- 第 $((count + 1)) 个后端 ---${NC}"

    # 名称
    read -rp "  后端名称 (如 us1, hk1，输入 done 结束): " name
    [[ "$name" == "done" || -z "$name" ]] && break

    # 验证名称格式
    if [[ ! "$name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
      warn "名称只能包含字母、数字、下划线和连字符，请重新输入"
      continue
    fi

    # 检查是否已存在
    if grep -q "backend ${name}$" "$HAPROXY_CFG" 2>/dev/null; then
      warn "后端 '$name' 已存在，跳过"
      continue
    fi

    # SNI 域名
    read -rp "  SNI 域名 (如 www.microsoft.com): " sni
    if [[ -z "$sni" ]]; then
      warn "SNI 不能为空，跳过"
      continue
    fi

    # 检查 SNI 是否已被使用
    if grep -q "req_ssl_sni -i ${sni}" "$HAPROXY_CFG" 2>/dev/null; then
      warn "SNI '$sni' 已被其他后端使用，请选择不同的域名"
      continue
    fi

    # 落地机 IP
    read -rp "  落地机 IP: " ip
    if [[ -z "$ip" ]]; then
      warn "IP 不能为空，跳过"
      continue
    fi

    # 落地机端口
    read -rp "  落地机端口 [443]: " port
    port="${port:-443}"

    # 确认
    echo ""
    echo -e "  ${GREEN}名称:${NC} $name"
    echo -e "  ${GREEN}SNI:${NC}  $sni"
    echo -e "  ${GREEN}目标:${NC} $ip:$port"
    read -rp "  确认添加？(Y/n): " confirm
    if [[ "${confirm,,}" == "n" ]]; then
      warn "已跳过"
      continue
    fi

    # 添加到配置
    add_backend "$name" "$sni" "$ip" "$port"
    count=$((count + 1))
    echo ""
  done

  if [[ $count -gt 0 ]]; then
    # 重载 HAProxy
    reload_haproxy
    success "成功添加 $count 个后端"
    echo ""
    do_list
  else
    info "未添加任何后端"
  fi
}

# ── 批量导入 ────────────────────────────────────────────────────
do_batch_import() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    error "文件不存在: $file"
  fi

  echo ""
  info "========================================="
  info " 批量导入落地机配置"
  info " 文件: $file"
  info "========================================="
  echo ""

  local count=0
  local skipped=0
  local line_num=0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line_num=$((line_num + 1))

    # 跳过空行和注释
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    # 解析: 名称,SNI,IP,端口
    IFS=',' read -r name sni ip port <<< "$line"

    # 去除空格
    name=$(echo "$name" | xargs)
    sni=$(echo "$sni" | xargs)
    ip=$(echo "$ip" | xargs)
    port=$(echo "${port:-443}" | xargs)

    # 验证
    if [[ -z "$name" || -z "$sni" || -z "$ip" ]]; then
      warn "第 $line_num 行格式错误，跳过: $line"
      skipped=$((skipped + 1))
      continue
    fi

    if [[ ! "$name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
      warn "第 $line_num 行名称格式错误，跳过: $name"
      skipped=$((skipped + 1))
      continue
    fi

    # 检查重复
    if grep -q "backend ${name}$" "$HAPROXY_CFG" 2>/dev/null; then
      warn "后端 '$name' 已存在，跳过"
      skipped=$((skipped + 1))
      continue
    fi

    if grep -q "req_ssl_sni -i ${sni}" "$HAPROXY_CFG" 2>/dev/null; then
      warn "SNI '$sni' 已被使用，跳过: $name"
      skipped=$((skipped + 1))
      continue
    fi

    echo -e "  ${GREEN}+${NC} $name → $sni → $ip:$port"
    add_backend "$name" "$sni" "$ip" "$port"
    count=$((count + 1))

  done < "$file"

  echo ""
  if [[ $count -gt 0 ]]; then
    reload_haproxy
    success "成功导入 $count 个后端（跳过 $skipped 个）"
    echo ""
    do_list
  else
    warn "未导入任何后端（跳过 $skipped 个）"
  fi
}

# ── 添加单个后端到配置文件 ────────────────────────────────────
add_backend() {
  local name="$1"
  local sni="$2"
  local ip="$3"
  local port="$4"

  # 添加 SNI 路由规则
  sed -i "/# --- END SNI RULES ---/i\\    use_backend ${name}  if { req_ssl_sni -i ${sni} }" "$HAPROXY_CFG"

  # 添加后端定义
  sed -i "/# --- END BACKENDS ---/i\\backend ${name}\n    server ${name} ${ip}:${port}\n" "$HAPROXY_CFG"

  # 保存后端信息（用于 list 显示）
  echo "${name},${sni},${ip},${port}" >> "$BACKENDS_DIR/backends.csv"
}

# ── 删除后端 ────────────────────────────────────────────────────
do_remove() {
  local name="${1:-}"

  if [[ -z "$name" ]]; then
    error "请指定要删除的后端名称：bash $SCRIPT_NAME remove <name>"
  fi

  # 检查是否存在
  if ! grep -q "backend ${name}$" "$HAPROXY_CFG" 2>/dev/null; then
    error "后端 '$name' 不存在"
  fi

  echo ""
  read -rp "$(echo -e "${YELLOW}确认删除后端 '$name'？(y/N): ${NC}")" confirm
  if [[ "${confirm,,}" != "y" ]]; then
    info "已取消"
    return
  fi

  # 删除 SNI 规则（匹配 use_backend name）
  sed -i "/use_backend ${name} /d" "$HAPROXY_CFG"

  # 删除后端块（backend name 到下一个空行）
  sed -i "/^backend ${name}$/,/^$/d" "$HAPROXY_CFG"

  # 从 CSV 中删除
  if [[ -f "$BACKENDS_DIR/backends.csv" ]]; then
    sed -i "/^${name},/d" "$BACKENDS_DIR/backends.csv"
  fi

  reload_haproxy
  success "后端 '$name' 已删除"
}

# ── 列出所有后端 ────────────────────────────────────────────────
do_list() {
  echo ""
  info "========================================="
  info " 已配置的落地机后端"
  info "========================================="
  echo ""

  if [[ ! -f "$BACKENDS_DIR/backends.csv" ]] || [[ ! -s "$BACKENDS_DIR/backends.csv" ]]; then
    warn "暂无已配置的后端"
    echo ""
    echo -e "  添加后端: ${GREEN}bash $SCRIPT_NAME add${NC}"
    return
  fi

  printf "  ${CYAN}%-12s %-30s %-20s %-8s${NC}\n" "名称" "SNI 域名" "落地机 IP" "端口"
  printf "  %-12s %-30s %-20s %-8s\n" "────────" "──────────────────────" "──────────────" "─────"

  while IFS=',' read -r name sni ip port; do
    printf "  %-12s %-30s %-20s %-8s\n" "$name" "$sni" "$ip" "$port"
  done < "$BACKENDS_DIR/backends.csv"

  local total
  total=$(wc -l < "$BACKENDS_DIR/backends.csv")
  echo ""
  info "共 $total 个后端，全部走 443 端口"
  echo ""
}

# ── 查看状态 ────────────────────────────────────────────────────
do_status() {
  echo ""
  info "========================================="
  info " HAProxy 状态"
  info "========================================="
  echo ""

  # 服务状态
  if systemctl is-active --quiet haproxy; then
    success "HAProxy 运行中"
  else
    error "HAProxy 未运行"
  fi

  # 版本
  echo -e "  版本: $(haproxy -v 2>&1 | head -1)"

  # 443 端口
  echo ""
  if ss -tlnp | grep -q ':443 '; then
    success "443 端口已监听"
    ss -tlnp | grep ':443 ' | head -3 | sed 's/^/  /'
  else
    warn "443 端口未监听"
  fi

  # 连接数
  echo ""
  local conns
  conns=$(ss -tn | grep -c ':443 ' 2>/dev/null || echo "0")
  info "当前活跃连接数: $conns"

  # 后端数量
  echo ""
  if [[ -f "$BACKENDS_DIR/backends.csv" ]]; then
    local total
    total=$(wc -l < "$BACKENDS_DIR/backends.csv")
    info "已配置后端数: $total"
  fi

  # 配置检查
  echo ""
  if haproxy -c -f "$HAPROXY_CFG" &>/dev/null; then
    success "配置文件语法正确"
  else
    warn "配置文件有语法错误："
    haproxy -c -f "$HAPROXY_CFG" 2>&1 | sed 's/^/  /'
  fi
  echo ""
}

# ── 重启 ────────────────────────────────────────────────────────
do_restart() {
  info "正在重启 HAProxy ..."
  systemctl restart haproxy
  success "HAProxy 已重启"
}

# ── 重载（不中断连接）────────────────────────────────────────────
reload_haproxy() {
  if haproxy -c -f "$HAPROXY_CFG" &>/dev/null; then
    systemctl reload haproxy 2>/dev/null || systemctl restart haproxy
    success "HAProxy 配置已重载"
  else
    warn "配置文件有语法错误，未重载："
    haproxy -c -f "$HAPROXY_CFG" 2>&1 | sed 's/^/  /'
  fi
}

# ── 卸载 ────────────────────────────────────────────────────────
do_uninstall() {
  echo ""
  read -rp "$(echo -e "${RED}确认卸载 HAProxy 并删除所有配置？(y/N): ${NC}")" confirm
  if [[ "${confirm,,}" != "y" ]]; then
    info "已取消"
    return
  fi

  systemctl stop haproxy 2>/dev/null || true
  systemctl disable haproxy 2>/dev/null || true

  if command -v apt-get &>/dev/null; then
    apt-get remove -y haproxy
  elif command -v yum &>/dev/null; then
    yum remove -y haproxy
  elif command -v dnf &>/dev/null; then
    dnf remove -y haproxy
  fi

  rm -rf "$BACKENDS_DIR"
  success "HAProxy 已卸载，配置已清理"
  info "原始配置备份保留在: $HAPROXY_CFG_BAK"
}

# ── 生成示例批量导入文件 ────────────────────────────────────────
do_example() {
  local example_file="backends-example.txt"
  cat > "$example_file" <<'EXAMPLE'
# HAProxy SNI 分流 — 落地机批量导入文件
# 格式: 名称,SNI域名,落地机IP,落地机端口
# 每行一条，# 开头为注释

# ── 美国节点 ──
us1,www.microsoft.com,1.2.3.4,443
us2,www.spacex.com,1.2.3.5,443
us3,www.aboutamazon.com,1.2.3.6,443

# ── 香港节点 ──
hk1,www.hkjc.com,5.6.7.8,443
hk2,www.hkex.com.hk,5.6.7.9,443
hk3,www.cathaypacific.com,5.6.7.10,443

# ── 日本节点 ──
jp1,www.nintendo.co.jp,9.10.11.12,443
jp2,www.sony.co.jp,9.10.11.13,443

# ── 新加坡节点 ──
sg1,www.grab.com,13.14.15.16,443
sg2,shopee.sg,13.14.15.17,443

# ── 台湾节点 ──
tw1,www.asus.com,17.18.19.20,443

# ── 德国节点 ──
de1,www.siemens.com,21.22.23.24,443

# ── 韩国节点 ──
kr1,www.samsung.com,25.26.27.28,443
EXAMPLE

  success "示例文件已生成: $example_file"
  echo ""
  echo -e "  编辑文件:   ${GREEN}nano $example_file${NC}"
  echo -e "  批量导入:   ${GREEN}bash $SCRIPT_NAME add -f $example_file${NC}"
  echo ""
}

# ── 显示帮助 ────────────────────────────────────────────────────
do_help() {
  echo ""
  echo -e "${CYAN}HAProxy SNI 分流管理脚本${NC}"
  echo ""
  echo "用法: bash $SCRIPT_NAME <命令> [参数]"
  echo ""
  echo "命令:"
  echo -e "  ${GREEN}install${NC}              安装 HAProxy 并生成初始配置"
  echo -e "  ${GREEN}add${NC}                  交互式添加落地机"
  echo -e "  ${GREEN}add -f <file>${NC}        从文件批量导入落地机"
  echo -e "  ${GREEN}remove <name>${NC}        删除指定后端"
  echo -e "  ${GREEN}list${NC}                 列出所有已配置的后端"
  echo -e "  ${GREEN}status${NC}               查看 HAProxy 运行状态"
  echo -e "  ${GREEN}restart${NC}              重启 HAProxy"
  echo -e "  ${GREEN}example${NC}              生成示例批量导入文件"
  echo -e "  ${GREEN}uninstall${NC}            卸载 HAProxy 并清理配置"
  echo -e "  ${GREEN}help${NC}                 显示此帮助"
  echo ""
  echo "架构说明:"
  echo ""
  echo "  用户 ──→ 中转机:443 ──→ HAProxy (按 SNI 分流)"
  echo "                            ├── SNI=microsoft.com  → 落地机A(美国)"
  echo "                            ├── SNI=hkjc.com       → 落地机B(香港)"
  echo "                            ├── SNI=nintendo.co.jp  → 落地机C(日本)"
  echo "                            └── 未匹配 SNI          → 回落真实网站"
  echo ""
  echo "批量导入文件格式 (每行一条):"
  echo "  名称,SNI域名,落地机IP,落地机端口"
  echo ""
  echo "示例:"
  echo "  us1,www.microsoft.com,1.2.3.4,443"
  echo "  hk1,www.hkjc.com,5.6.7.8,443"
  echo ""
}

# ── 主入口 ──────────────────────────────────────────────────────
main() {
  local cmd="${1:-help}"

  case "$cmd" in
    install)
      check_root "$@"
      do_install
      ;;
    add)
      check_root "$@"
      shift
      do_add "$@"
      ;;
    remove)
      check_root "$@"
      do_remove "${2:-}"
      ;;
    list)
      do_list
      ;;
    status)
      do_status
      ;;
    restart)
      check_root "$@"
      do_restart
      ;;
    example)
      do_example
      ;;
    uninstall)
      check_root "$@"
      do_uninstall
      ;;
    help|--help|-h)
      do_help
      ;;
    *)
      warn "未知命令: $cmd"
      do_help
      ;;
  esac
}

main "$@"
