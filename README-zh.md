<p align="center">
  <img src="https://img.shields.io/badge/STEALTHNET-3.0-blueviolet?style=for-the-badge&logoColor=white" alt="STEALTHNET 3.0" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

<h1 align="center">STEALTHNET 3.0</h1>

<p align="center">
  <b>完整的 VPN 订阅销售平台</b><br/>
  Telegram 机器人 &bull; Mini App &bull; 用户中心 &bull; 管理面板<br/>
  <i>开箱即用，一键安装。</i>
</p>

<p align="center">
  <a href="https://t.me/stealthnet_admin_panel"><img src="https://img.shields.io/badge/Telegram-频道-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" /></a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/ecd37b8e-68ef-4616-92da-550f8bd9cdb5" width="830" alt="STEALTHNET 截图 1" />
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/5c504c46-0b00-47d1-b767-7afed7f36983" width="830" alt="STEALTHNET 截图 2" />
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> &bull;
  <a href="#架构">架构</a> &bull;
  <a href="#功能特性">功能特性</a> &bull;
  <a href="#telegram-机器人">Telegram 机器人</a> &bull;
  <a href="#网页面板">网页面板</a> &bull;
  <a href="#api">API</a> &bull;
  <a href="#配置说明">配置说明</a> &bull;
  <a href="#数据迁移">数据迁移</a> &bull;
  <a href="#服务器要求">服务器要求</a>
</p>

---

## 快速开始

> [!CAUTION]
> 为避免任何冲突，强烈建议将本项目**安装在独立服务器上**！

```bash
apt install git -y
curl -fsSL https://get.docker.com | sh
cd /opt
git clone https://github.com/systemmaster1200-eng/remnawave-STEALTHNET-Bot.git
cd remnawave-STEALTHNET-Bot
bash install-zh.sh
```

> [!WARNING]
> 如果启动后 **API 服务崩溃**，机器人报告「**❌ fetch failed**」，且 `docker compose logs -f api` 日志中出现「**Error: P1000: Authentication failed**」错误，请确认服务器上没有其他重要项目，然后执行以下命令清理旧数据：
>
> `docker system prune -a --volumes`

> **如果启动时出现** `invalid option nameet: pipefail` 错误，说明脚本换行符格式为 Windows CRLF。修复方法：`sed -i 's/\r$//' install-zh.sh`，然后再次运行 `bash install-zh.sh`。

交互式安装程序将在约 2 分钟内完成以下配置：

- 域名与 SSL 证书（Let's Encrypt）
- PostgreSQL、JWT 密钥、管理员账号
- Remnawave API 连接
- Telegram 机器人
- Nginx（内置自动 SSL 或使用自定义反向代理）

---

## 服务器要求

运行所有服务（API、前端、机器人、Nginx、PostgreSQL）的参考配置（Docker 环境）：

| 等级 | CPU | 内存 | 磁盘 | 用途 |
|------|-----|------|------|------|
| **最低配置** | 1 vCPU | 1.5–2 GB | 20 GB | 测试/演示，最多约 50 名活跃用户 |
| **中等配置** | 2 vCPU | 4 GB | 40 GB SSD | 小型生产环境，最多约 500 用户，运行稳定 |
| **推荐配置** | 4 vCPU | 8 GB | 80 GB SSD | 生产环境，支持数千用户，响应迅速 |

**通用要求：**

- 操作系统：Linux（Debian 13、Ubuntu 24.04 LTS 或同类系统），需安装 Docker 及 Docker Compose v2+。
- 开放端口：**80**（HTTP）、**443**（HTTPS）；使用 `install-zh.sh` 安装时仅需这两个端口。
- 中等及推荐配置建议使用 SSD，并定期备份数据库。

---

## 架构

```
┌──────────────────────────────────────────────────────────┐
│                      STEALTHNET 3.0                      │
├──────────────┬──────────────┬──────────────┬─────────────┤
│  Telegram    │  Mini App    │  用户中心    │  管理面板   │
│  机器人      │  (WebApp)    │  React       │  React      │
│  Grammy      │  React       │              │             │
├──────────────┴──────────────┴──────────────┴─────────────┤
│                   后端 API (Express)                      │
│            JWT 认证  ·  Prisma ORM  ·  Webhooks          │
├──────────────────────────────────────────────────────────┤
│          PostgreSQL          │       Remnawave API        │
│          （数据存储）         │       （VPN 核心）         │
├──────────────────────────────┴───────────────────────────┤
│         Nginx + Let's Encrypt  ·  Docker Compose         │
└──────────────────────────────────────────────────────────┘
```

| 服务 | 技术栈 | 用途 |
|------|--------|------|
| **backend** | Node.js、Express、Prisma、PostgreSQL | REST API：认证、用户、套餐、支付、推荐、促销、统计分析 |
| **frontend** | React 18、Vite、Tailwind CSS、shadcn/ui、Framer Motion | 管理面板 + 用户中心 + Telegram Mini App |
| **bot** | Grammy (TypeScript) | 完整的 Telegram 机器人，内含用户中心 |
| **nginx** | Nginx + Certbot | 反向代理、SSL、静态资源、gzip 压缩 |
| **postgres** | PostgreSQL 16 | 所有数据的存储 |

---

## 功能特性

### 支付与订阅

- **Platega.io** — 接收支付（银行卡、SBP、加密货币等）；回调 URL 可在管理后台一键复制
- **ЮMoney** — 银行卡充值与套餐购买（转账表单，HTTP 通知）；Webhook URL 带「复制」按钮
- **ЮKassa** — 通过 API 接收银行卡与 SBP 支付（仅限 RUB）；支持 54-ФЗ 收据；监听 `payment.succeeded` 事件；Webhook URL 可在管理后台复制
- **余额支付** — 充值与从内部余额扣款
- **自动激活** — 支付完成后通过 Webhook（Platega、ЮMoney、ЮKassa）立即激活套餐
- **支付描述** — 所有支付渠道（Platega、ЮMoney、ЮKassa）的描述中自动填入管理后台「常规设置 → 服务名称」中配置的名称
- **灵活套餐** — 支持分类、时长、流量与设备数限制，可绑定 Remnawave Squad
- **多币种** — 支持多种货币（USD、RUB 等）

### 推荐计划

- **三级推荐** — 可从邀请用户及其推荐用户的消费中获得分成
- **可配置比例** — 每级独立设置返佣比例
- **自动结算** — 推荐用户每次付款时自动将奖励发放到余额
- **推荐链接** — 支持机器人链接和网页链接两种形式

### 促销系统

- **促销组** — 通过链接（`/start promo_CODE`）免费领取订阅，可设置激活次数上限
- **促销码** — 折扣（百分比或固定金额）以及赠送天数
- **使用限制** — 总次数限制、单用户限制及有效期
- **激活统计** — 记录使用次数、使用人及时间

### 试用期

- **免费试用** — 可配置时长、流量和设备数限制
- **单次激活** — 每位用户仅可激活一次
- **Squad 绑定** — 为试用用户设置独立 Squad

### Remnawave 集成

- **用户管理** — 在 Remnawave 中创建、删除、封禁用户
- **订阅管理** — 激活、续期、状态查询
- **节点管理** — 监控、启用/禁用、重启节点
- **Squad 管理** — 按服务器分配用户
- **双向同步** — Remnawave ↔ STEALTHNET 数据同步
- **Webhook** — 自动处理来自 Remnawave 的事件

### 移动端与 Mini App

- **可折叠套餐分类** — 在窄屏和 Mini App 中，多个套餐分类以手风琴形式展示：默认展开第一个，其余点击展开
- **紧凑型套餐卡片** — 移动端单列布局，名称和参数在左，价格和「购买」按钮在右
- **统一移动端界面** — 底部导航栏、紧凑页头，浏览器和 Telegram WebApp 中体验一致

### 分析与报表

- **仪表盘** — 实时关键指标
- **营收图表** — 近 90 天每日数据
- **用户增长** — 注册量动态变化
- **热门套餐** — 销量最高的方案
- **推荐统计** — 各级返佣金额
- **转化率** — 试用 → 付费转化
- **销售报表** — 按日期和支付渠道筛选

### 安全性

- **JWT 认证** — Access Token + Refresh Token 双令牌机制
- **强制改密** — 管理员首次登录时强制修改密码
- **邮箱验证** — 通过邮件链接确认注册
- **封禁用户** — 可填写封禁原因
- **SSL/TLS** — Let's Encrypt 自动签发并续期证书

---

## Telegram 机器人

完整的用户中心直接嵌入 Telegram：

| 命令 / 按钮 | 功能说明 |
|------------|---------|
| `/start` | 注册并进入主菜单 |
| `/start ref_CODE` | 通过推荐链接注册 |
| `/start promo_CODE` | 激活促销组 |
| **主菜单** | 订阅状态、余额、剩余天数、流量、设备数上限 |
| **套餐** | 浏览分类与套餐，购买订阅 |
| **充值** | 充值余额（预设金额或自定义金额） |
| **个人资料** | 语言和货币设置 |
| **推荐** | 推荐统计与推荐链接 |
| **试用** | 激活免费试用期 |
| **VPN** | 订阅页面（Mini App） |
| **促销码** | 输入促销码享受折扣或赠送天数 |
| **支持** | 支持链接、协议、须知、使用说明 |

**机器人亮点：**
- 自定义 Emoji（Premium Emoji）
- 彩色按钮（primary / success / danger）
- 流量使用进度条
- 集成 Telegram Mini App（WebApp）
- 可自定义文案与 Logo

---

## 网页面板

### 管理面板（`/admin`）

| 模块 | 说明 |
|------|------|
| **仪表盘** | 统计数据、节点状态、快捷操作 |
| **用户管理** | 用户列表、搜索、筛选、封禁/解封、重置密码 |
| **套餐管理** | 套餐分类与套餐的增删改查 |
| **促销组** | 创建与管理促销链接 |
| **促销码** | 创建折扣码和免费天数码 |
| **数据分析** | 营收、用户、推荐、转化率图表 |
| **销售报表** | 带筛选器的详细销售明细 |
| **系统设置** | 品牌（服务名称、Logo）、SMTP、**Platega / ЮMoney / ЮKassa**（Webhook URL 带「复制」按钮）、机器人、Remnawave、推荐系统 |

### 用户中心（`/cabinet`）

| 模块 | 说明 |
|------|------|
| **登录** | 邮箱 + 密码，或 Telegram 组件 |
| **注册** | 含邮箱验证 |
| **仪表盘** | 订阅状态、余额、支付历史、试用 |
| **套餐** | 浏览并购买套餐 |
| **订阅** | VPN 页面：按平台展示应用及 Deep Link |
| **推荐** | 推荐统计与邀请链接 |
| **个人资料** | 语言、货币、修改密码 |

**前端技术栈：**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion（动画效果）
- Recharts（图表）
- 深色 / 浅色主题
- 自适应设计（移动端 + 桌面端）
- PWA（Service Worker）
- Telegram Mini App
- **国际化（i18n）** — 支持中文（zh）与俄文（ru）切换

---

## API

### 用户端接口（`/api/client`）

```
POST   /auth/register          — 注册（邮箱 + 密码）
POST   /auth/login             — 登录
POST   /auth/telegram-miniapp  — 通过 Telegram Mini App 登录
GET    /auth/me                — 获取当前用户信息

GET    /subscription           — 订阅状态
GET    /tariffs                — 可用套餐列表

POST   /payments/platega       — 创建 Platega 支付
POST   /payments/balance       — 余额支付
POST   /yookassa/create-payment — 创建 ЮKassa 支付（银行卡/SBP，仅 RUB），跳转支付页面
GET    /yoomoney/auth-url      — ЮMoney OAuth 授权 URL
POST   /yoomoney/request-topup — 通过 ЮMoney 钱包发起充值请求
POST   /yoomoney/create-form-payment — ЮMoney 银行卡支付表单，返回 paymentUrl

POST   /trial                  — 激活试用期
POST   /promo/activate         — 激活促销组
POST   /promo-code/check       — 检查促销码
POST   /promo-code/activate    — 使用促销码

GET    /referral-stats         — 推荐统计数据
```

### 管理端接口（`/api/admin`）

```
GET    /dashboard/stats        — 仪表盘统计数据
GET    /clients                — 用户列表（分页、搜索）
GET    /clients/:id            — 用户详情
PATCH  /clients/:id            — 更新用户信息

CRUD   /tariff-categories      — 套餐分类
CRUD   /tariffs                — 套餐
CRUD   /promo-groups           — 促销组
CRUD   /promo-codes            — 促销码

GET    /analytics              — 数据分析
GET    /sales-report           — 销售报表
GET/PATCH /settings            — 系统设置

GET    /remna/*                — 代理转发至 Remnawave
POST   /sync/from-remna        — 从 Remnawave 同步数据
POST   /sync/to-remna          — 向 Remnawave 同步数据
```

### 公开接口（`/api/public`）

```
GET    /config                 — 公开配置
GET    /tariffs                — 套餐列表
GET    /subscription-page      — 订阅页面配置
GET    /deeplink               — VPN 应用 Deep Link
```

### Webhook

```
POST   /webhooks/remna         — 来自 Remnawave 的事件
POST   /webhooks/platega       — Platega 回调（自动激活）
POST   /webhooks/yoomoney      — ЮMoney HTTP 通知（充值、套餐支付）
POST   /webhooks/yookassa      — ЮKassa 事件（payment.succeeded → 到账/激活套餐）
```

---

## Docker 服务

```bash
docker compose ps
```

| 容器 | 端口 | 说明 |
|------|------|------|
| `stealthnet-postgres` | 5432（内部） | PostgreSQL 16 — 数据库 |
| `stealthnet-api` | 5000 | 后端 API |
| `stealthnet-bot` | — | Telegram 机器人 |
| `stealthnet-nginx` | 80, 443 | Nginx + SSL（内置模式） |
| `stealthnet-certbot` | — | SSL 证书自动续期 |

---

## 常用命令

```bash
# 更新到最新提交（main 分支，不一定稳定）
git pull origin main

# 更新到指定版本（更稳定，推荐）
git fetch --tags
git checkout v3.1.3

# 查看服务状态
docker compose ps

# 实时查看日志
docker compose logs -f api
docker compose logs -f bot
docker compose logs -f nginx

# 重启 API 和机器人
docker compose restart api bot

# 完全停止
docker compose down

# 启动（不含内置 Nginx）
docker compose up -d

# 启动（含内置 Nginx + SSL）
docker compose --profile builtin-nginx up -d

# 停止（含内置 Nginx + SSL）
docker compose --profile builtin-nginx down

# 更新代码后重新构建
docker compose build api bot
docker compose up frontend        # 重新构建前端
docker compose restart api bot
```

### Git pull 注意事项

- **`nginx/nginx.conf`** — 已加入 `.gitignore`（由 install.sh 根据域名生成）。若 Git 仍在 pull 时更新它，执行一次：  
  `git rm --cached nginx/nginx.conf && git commit -m "Stop tracking nginx.conf"`
- **源代码**（`backend/...`、`nginx/nginx.conf.template` 等）不要加入忽略列表。`git pull` 前请先提交或暂存本地修改：  
  `git stash && git pull && git stash pop`

---

## 配置说明

### 环境变量

所有变量均已在 `.env.example` 中说明：

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `DOMAIN` | 是 | 面板域名（例如 `vpn.example.com`） |
| `POSTGRES_DB` | 是 | 数据库名称 |
| `POSTGRES_USER` | 是 | PostgreSQL 用户名 |
| `POSTGRES_PASSWORD` | 是 | PostgreSQL 密码 |
| `JWT_SECRET` | 是 | JWT 密钥（至少 32 位） |
| `JWT_ACCESS_EXPIRES_IN` | 否 | Access Token 有效期（默认 `15m`） |
| `JWT_REFRESH_EXPIRES_IN` | 否 | Refresh Token 有效期（默认 `7d`） |
| `INIT_ADMIN_EMAIL` | 是 | 初始管理员邮箱 |
| `INIT_ADMIN_PASSWORD` | 是 | 初始管理员密码 |
| `REMNA_API_URL` | 是 | Remnawave 面板地址 |
| `REMNA_ADMIN_TOKEN` | 是 | Remnawave API Token |
| `BOT_TOKEN` | 否 | Telegram 机器人 Token |
| `USE_BUILTIN_NGINX` | 否 | `true` 使用内置 Nginx |
| `CERTBOT_EMAIL` | 否 | Let's Encrypt 邮箱 |

### 使用自定义 Nginx（替代内置）

安装时选择外部 Nginx 时：

1. 配置示例：`nginx/external.conf.example`
2. API 代理到 `http://127.0.0.1:5000`
3. 前端静态文件目录：`/var/www/stealthnet/` 或 `frontend/dist/`

```bash
# 申请 SSL 证书
sudo certbot --nginx -d your-domain.com

# 启用配置
sudo cp nginx/external.conf.example /etc/nginx/sites-available/stealthnet.conf
sudo ln -s /etc/nginx/sites-available/stealthnet.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 项目结构

```
remnawave-STEALTHNET-Bot/
├── backend/                  # 后端 API
│   ├── src/
│   │   ├── index.ts          # 入口文件
│   │   ├── modules/
│   │   │   ├── auth/         # JWT 认证
│   │   │   ├── admin/        # 管理端路由与控制器
│   │   │   └── client/       # 用户端路由与控制器
│   │   └── ...
│   └── prisma/
│       └── schema.prisma     # 数据库 Schema
├── bot/                      # Telegram 机器人
│   ├── src/
│   │   ├── index.ts          # 机器人逻辑
│   │   ├── api.ts            # 后端 API 客户端
│   │   └── keyboard.ts       # 键盘与按钮
│   └── ...
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── pages/            # 页面（admin + cabinet）
│   │   ├── components/       # 可复用组件
│   │   ├── i18n/             # 国际化（ru.ts / zh.ts）
│   │   └── ...
│   └── ...
├── nginx/                    # Nginx 配置
│   ├── nginx.conf.template   # 内置 Nginx 配置模板
│   ├── nginx-initial.conf    # Certbot 初始配置
│   └── external.conf.example # 外部 Nginx 示例配置
├── scripts/                  # 辅助脚本
├── docker-compose.yml        # 服务编排
├── install.sh                # 交互式安装程序（俄文版）
├── install-zh.sh             # 交互式安装程序（中文版）
├── .env.example              # 环境变量模板
├── README.md                 # 俄文说明文档
└── README-zh.md              # 本文件（中文说明文档）
```

---

## 数据迁移

从其他面板迁移？支持以下两种数据源：

| 来源 | 脚本 | 文档 |
|------|------|------|
| **旧版 STEALTHNET 面板（Flask）** | `scripts/migrate-from-old-panel.js` | [详细说明](MIGRATION.md#вариант-1-миграция-из-старой-панели-flask) |
| **Bedolaga Bot** | `scripts/migrate-from-bedolaga.js` | [详细说明](MIGRATION.md#вариант-2-миграция-из-бедолага-бот) |

### 快速迁移

```bash
# 1. 安装脚本依赖（仅需一次）
cd scripts && npm install && cd ..

# 2a. 从旧版 Flask 面板迁移
OLD_DB_HOST=localhost OLD_DB_NAME=stealthnet_old \
NEW_DB_HOST=localhost NEW_DB_NAME=stealthnet \
node scripts/migrate-from-old-panel.js

# 2b. 从 Bedolaga 迁移（指定备份文件路径）
node scripts/migrate-from-bedolaga.js ./backup_20260126_000000.tar.gz
```

> 货币自动从系统设置中读取（`default_currency`）。  
> 脚本具有幂等性 — 可重复执行，不会产生重复数据。  
> 完整文档、变量说明、常见问题 — 参见 **[MIGRATION.md](MIGRATION.md)**。

---

## 支持与社区

问题反馈、功能建议、Bug 报告，欢迎加入：

<p align="center">
  <a href="https://t.me/stealthnet_admin_panel"><img src="https://img.shields.io/badge/Telegram-@stealthnet__admin__panel-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram 频道" /></a>
</p>

---

## 许可证

本项目基于 **GNU AGPL-3.0** 协议发布。

[![AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

完整许可证文本见 [LICENSE](LICENSE) 文件。使用、修改或分发本代码时，须遵守 AGPL-3.0 条款（包括在网络服务中使用时披露派生作品的源代码）。

---

<p align="center">
  <b>STEALTHNET 3.0</b> — 优雅地销售 VPN。<br/>
  <sub>使用 TypeScript、React、Grammy、Prisma、Docker 构建</sub><br/><br/>
  <a href="https://t.me/stealthnet_admin_panel">Telegram 频道</a>
</p>
