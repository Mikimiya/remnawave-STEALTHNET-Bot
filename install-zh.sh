#!/usr/bin/env bash
set -euo pipefail

# ╔═══════════════════════════════════════════════════════════════╗
# ║          STEALTHNET v3 — 自动安装程序（中文版）               ║
# ╚═══════════════════════════════════════════════════════════════╝

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── 颜色 ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

banner() {
  echo ""
  echo -e "${CYAN}${BOLD}"
  echo "  ███████╗████████╗███████╗ █████╗ ██╗  ████████╗██╗  ██╗"
  echo "  ██╔════╝╚══██╔══╝██╔════╝██╔══██╗██║  ╚══██╔══╝██║  ██║"
  echo "  ███████╗   ██║   █████╗  ███████║██║     ██║   ███████║"
  echo "  ╚════██║   ██║   ██╔══╝  ██╔══██║██║     ██║   ██╔══██║"
  echo "  ███████║   ██║   ███████╗██║  ██║███████╗██║   ██║  ██║"
  echo "  ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝  ╚═╝"
  echo -e "                         ${YELLOW}v3${NC}"
  echo -e "  ${NC}github.com/STEALTHNET-APP/remnawave-STEALTHNET-Bot${NC}"
  echo ""
}

info()    { echo -e "${CYAN}[信息]${NC} $1"; }
success() { echo -e "${GREEN}[成功]${NC} $1"; }
warn()    { echo -e "${YELLOW}[警告]${NC} $1"; }
error()   { echo -e "${RED}[错误]${NC} $1"; }

ask() {
  local prompt="$1" default="$2" var="$3"
  if [ -n "$default" ]; then
    read -rp "$(echo -e "${BOLD}$prompt${NC} [${default}]: ")" input
    eval "$var=\"\${input:-$default}\""
  else
    read -rp "$(echo -e "${BOLD}$prompt${NC}: ")" input
    eval "$var=\"\$input\""
  fi
}

ask_secret() {
  local prompt="$1" default="$2" var="$3"
  if [ -n "$default" ]; then
    read -rsp "$(echo -e "${BOLD}$prompt${NC} [***]: ")" input
    echo ""
    eval "$var=\"\${input:-$default}\""
  else
    read -rsp "$(echo -e "${BOLD}$prompt${NC}: ")" input
    echo ""
    eval "$var=\"\$input\""
  fi
}

# ── 检查依赖 ──────────────────────────────────────────────────────
check_deps() {
  info "正在检查依赖..."

  if ! command -v docker &>/dev/null; then
    error "未安装 Docker！"
    echo ""
    echo "  请先安装 Docker："
    echo "  curl -fsSL https://get.docker.com | sh"
    echo ""
    exit 1
  fi

  if ! docker compose version &>/dev/null 2>&1; then
    error "未找到 Docker Compose V2！"
    echo "  请升级 Docker 或安装 docker-compose-plugin"
    exit 1
  fi

  success "已找到 Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
  success "已找到 Docker Compose $(docker compose version --short 2>/dev/null || echo 'OK')"
}

# ── 清理旧数据 ────────────────────────────────────────────────────
clean_old_data() {
  echo ""
  echo -e "${BOLD}${CYAN}═══ 清理 ═══${NC}"

  warn "是否要执行全新安装？"
  echo -e "  此操作将执行："
  echo -e "  1. 停止当前容器。"
  echo -e "  2. ${RED}删除数据库${NC}（解决密码冲突问题）。"
  echo -e "  3. 删除本项目的旧镜像和缓存。"
  echo ""
  echo -e "  ${YELLOW}重新安装时：若保留旧数据库 (N)，.env 中的密码和用户名"
  echo -e "  必须与数据库创建时一致，否则会报 «Authentication failed» (P1000) 错误。"
  echo -e "  遇到此情况请选择 «y»。${NC}"
  echo ""

  read -rp "$(echo -e "${BOLD}删除旧数据和数据库？[y/N]${NC}: ")" CLEANUP
  if [[ "$CLEANUP" =~ ^[Yy]$ ]]; then
    info "正在清理系统..."

    # 1. 清理 docker-compose.yml 相关的所有内容
    # -v: 删除 Volume（数据库）
    # --rmi local: 删除已构建的镜像
    # --remove-orphans: 删除孤立容器
    docker compose down -v --rmi local --remove-orphans 2>/dev/null || true

    # 2. 额外清理未使用的数据卷
    # prune -f 不需要二次确认
    docker volume prune -f

    success "系统已完全清理，将从零开始安装。"
  else
    info "跳过清理，保留旧数据库。"
  fi
}

# ── 交互式配置 .env ───────────────────────────────────────────────
configure_env() {
  echo ""
  echo -e "${BOLD}${CYAN}═══ 项目配置 ═══${NC}"
  echo ""

  # 域名
  ask "请输入 StealthNet 面板域名（例如 web.example.com），而非 Remnawave 面板域名！" "" DOMAIN
  while [ -z "$DOMAIN" ]; do
    warn "域名不能为空！"
    ask "请输入域名" "" DOMAIN
  done

  echo ""
  echo -e "${BOLD}${CYAN}── PostgreSQL ──${NC}"
  ask "数据库名称" "stealthnet" POSTGRES_DB
  ask "数据库用户" "stealthnet" POSTGRES_USER

  # 生成不含 =, +, / 的密码，避免 .env 和 DATABASE_URL 解析问题
  DEFAULT_PG_PASS=$(openssl rand -base64 18 2>/dev/null | tr -d $'=+/\n' | head -c 24)
  [ -z "$DEFAULT_PG_PASS" ] && DEFAULT_PG_PASS=$(head -c 24 /dev/urandom | base64 | tr -d $'=+/\n' | head -c 24)
  ask_secret "数据库密码（回车自动生成）" "$DEFAULT_PG_PASS" POSTGRES_PASSWORD

  echo ""
  echo -e "${BOLD}${CYAN}── JWT ──${NC}"
  DEFAULT_JWT=$(openssl rand -base64 36 2>/dev/null | tr -d $'=+/\n' | head -c 48)
  [ -z "$DEFAULT_JWT" ] && DEFAULT_JWT=$(head -c 48 /dev/urandom | base64 | tr -d $'=+/\n' | head -c 48)
  ask_secret "JWT 密钥（回车自动生成）" "$DEFAULT_JWT" JWT_SECRET
  ask "Access Token 有效期" "15m" JWT_ACCESS_EXPIRES_IN
  ask "Refresh Token 有效期" "7d" JWT_REFRESH_EXPIRES_IN

  echo ""
  echo -e "${BOLD}${CYAN}── 管理员 ──${NC}"
  ask "管理员 Email" "admin@stealthnet.local" INIT_ADMIN_EMAIL
  DEFAULT_ADMIN_PASS=$(openssl rand -base64 14 2>/dev/null | tr -d $'=+/\n' | head -c 20)
  [ -z "$DEFAULT_ADMIN_PASS" ] && DEFAULT_ADMIN_PASS=$(head -c 20 /dev/urandom | base64 | tr -d $'=+/\n' | head -c 20)
  ask_secret "管理员密码（回车自动生成）" "$DEFAULT_ADMIN_PASS" INIT_ADMIN_PASSWORD

  echo ""
  echo -e "${BOLD}${CYAN}── Remnawave ──${NC}"
  ask "Remnawave 面板地址（例如 https://panel.example.com）" "" REMNA_API_URL
  if [ -n "$REMNA_API_URL" ]; then
    ask_secret "Remnawave API Token（从 Remnawave 面板获取）" "" REMNA_ADMIN_TOKEN
  else
    REMNA_ADMIN_TOKEN=""
  fi

  echo ""
  echo -e "${BOLD}${CYAN}── Telegram Bot ──${NC}"
  ask "Bot Token（从 @BotFather 获取）" "" BOT_TOKEN
  if [ -z "$BOT_TOKEN" ]; then
    warn "未填写 Bot Token — 机器人将无法启动，可稍后在 .env 中补充"
  fi

  echo ""
  echo -e "${BOLD}${CYAN}── Nginx ──${NC}"
  echo ""
  echo -e "  ${BOLD}1)${NC} 内置 Nginx + 自动 SSL（Let's Encrypt）— 推荐"
  echo -e "  ${BOLD}2)${NC} 使用自己的 Nginx / Caddy / 反向代理 — 手动配置"
  echo ""
  read -rp "$(echo -e "${BOLD}请选择 [1/2]${NC} [1]: ")" NGINX_CHOICE
  NGINX_CHOICE="${NGINX_CHOICE:-1}"

  USE_BUILTIN_NGINX="true"
  CERTBOT_EMAIL=""
  if [ "$NGINX_CHOICE" = "1" ]; then
    USE_BUILTIN_NGINX="true"
    ask "Let's Encrypt 邮箱" "$INIT_ADMIN_EMAIL" CERTBOT_EMAIL
  else
    USE_BUILTIN_NGINX="false"
    echo ""
    info "Nginx 配置示例：${BOLD}nginx/external.conf.example${NC}"
    info "API 端口：5000，前端静态文件目录：./frontend/dist/"
  fi

  # 写入 .env
  cat > "$SCRIPT_DIR/.env" << ENVEOF
# STEALTHNET v3 — 由 install-zh.sh 生成于 $(date '+%Y-%m-%d %H:%M')
DOMAIN=$DOMAIN

# PostgreSQL
POSTGRES_DB=$POSTGRES_DB
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET
JWT_ACCESS_EXPIRES_IN=$JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN=$JWT_REFRESH_EXPIRES_IN

# 管理员
INIT_ADMIN_EMAIL=$INIT_ADMIN_EMAIL
INIT_ADMIN_PASSWORD=$INIT_ADMIN_PASSWORD

# Remnawave
REMNA_API_URL=$REMNA_API_URL
REMNA_ADMIN_TOKEN=$REMNA_ADMIN_TOKEN

# Telegram Bot
BOT_TOKEN=$BOT_TOKEN

# Nginx
USE_BUILTIN_NGINX=$USE_BUILTIN_NGINX
CERTBOT_EMAIL=$CERTBOT_EMAIL
ENVEOF

  success ".env 文件已创建"
}

# ── 从模板生成 nginx.conf ─────────────────────────────────────────
generate_nginx_conf() {
  info "正在为域名 $DOMAIN 生成 nginx.conf ..."
  sed "s/REPLACE_DOMAIN/$DOMAIN/g" "$SCRIPT_DIR/nginx/nginx.conf.template" \
    > "$SCRIPT_DIR/nginx/nginx.conf"
  success "nginx/nginx.conf 已生成"
}

generate_nginx_initial() {
  info "正在生成初始 nginx.conf（仅 HTTP，用于 certbot）..."
  sed "s/REPLACE_DOMAIN/$DOMAIN/g" "$SCRIPT_DIR/nginx/nginx-initial.conf" \
    > "$SCRIPT_DIR/nginx/nginx.conf"
  success "nginx/nginx.conf（仅 HTTP）已生成"
}

# ── 申请 SSL 证书 ─────────────────────────────────────────────────
obtain_ssl() {
  info "正在向 Let's Encrypt 申请 SSL 证书..."

  # 1. 使用仅 HTTP 配置启动 nginx
  generate_nginx_initial

  info "启动 nginx（仅 HTTP）以完成 ACME 验证..."
  docker compose --profile builtin-nginx up -d nginx 2>/dev/null || true
  sleep 3

  # 2. 运行 certbot 申请证书
  info "启动 certbot..."
  docker compose --profile builtin-nginx run --rm --entrypoint certbot certbot \
    certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    --force-renewal 2>&1 || {
      error "SSL 证书申请失败！"
      echo ""
      echo "  请检查以下内容："
      echo "  1. 域名 $DOMAIN 的 DNS A 记录是否指向本服务器"
      echo "  2. 防火墙是否开放了 80 和 443 端口"
      echo "  3. 域名 $DOMAIN 是否可从外网访问"
      echo ""
      echo "  修复后重新运行：bash install-zh.sh"
      exit 1
    }

  success "SSL 证书已成功申请"

  # 3. 停止 nginx，生成完整的 SSL 配置
  docker compose --profile builtin-nginx stop nginx 2>/dev/null || true
  generate_nginx_conf
}

# ── 构建并启动 ────────────────────────────────────────────────────
build_and_start() {
  echo ""
  echo -e "${BOLD}${CYAN}═══ 构建项目 ═══${NC}"
  echo ""

  # 确定 compose profiles
  PROFILES=""
  if [ "$USE_BUILTIN_NGINX" = "true" ]; then
    PROFILES="--profile builtin-nginx"
  fi

  # 构建镜像
  info "正在构建 Docker 镜像（可能需要几分钟）..."
  docker compose $PROFILES build 2>&1 | tail -5
  success "镜像构建完成"

  # 启动数据库
  info "正在启动 PostgreSQL..."
  docker compose up -d postgres
  echo "  等待数据库就绪..."
  sleep 5

  # 启动 API
  info "正在启动后端 API..."
  docker compose up -d api
  sleep 3

  # 启动机器人（如果填写了 Token）
  if [ -n "$BOT_TOKEN" ]; then
    info "正在启动 Telegram Bot..."
    docker compose up -d bot
  else
    warn "未填写 BOT_TOKEN — 机器人未启动"
  fi

  # 构建前端
  info "正在构建前端..."
  docker compose up frontend 2>&1 | tail -3

  # Nginx
  if [ "$USE_BUILTIN_NGINX" = "true" ]; then
    info "正在启动 Nginx..."
    docker compose $PROFILES up -d nginx

    info "正在启动 Certbot（自动续期）..."
    docker compose $PROFILES up -d certbot
  else
    # 外部 nginx — 将 dist 复制到指定目录
    info "正在将前端文件复制到 /var/www/stealthnet ..."
    sudo mkdir -p /var/www/stealthnet
    docker compose cp frontend:/dist/. /var/www/stealthnet/ 2>/dev/null || {
      # 备用方案：从 volume 复制
      docker run --rm -v stealthnet_frontend_dist:/src -v /var/www/stealthnet:/dst alpine sh -c "cp -r /src/* /dst/"
    }
    success "前端文件已复制到 /var/www/stealthnet/"
  fi
}

# ── 最终检查 ──────────────────────────────────────────────────────
show_status() {
  echo ""
  echo -e "${BOLD}${CYAN}═══ 运行状态 ═══${NC}"
  echo ""
  docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps
  echo ""
}

show_summary() {
  echo ""
  echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║          STEALTHNET v3 — 安装完成！                           ║${NC}"
  echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}管理面板：${NC}    https://$DOMAIN/admin"
  echo -e "  ${BOLD}用户中心：${NC}    https://$DOMAIN/cabinet"
  echo -e "  ${BOLD}管理员账号：${NC}  $INIT_ADMIN_EMAIL / $INIT_ADMIN_PASSWORD"
  echo ""
  if [ -n "$BOT_TOKEN" ]; then
    echo -e "  ${BOLD}Telegram Bot：${NC}已启动"
  else
    echo -e "  ${YELLOW}Telegram Bot：${NC}未配置，请在 .env 中添加 BOT_TOKEN"
  fi
  echo ""
  if [ "$USE_BUILTIN_NGINX" != "true" ]; then
    echo -e "  ${YELLOW}Nginx：${NC}请配置您的反向代理"
    echo -e "  配置示例：${BOLD}nginx/external.conf.example${NC}"
    echo -e "  API 端口：${BOLD}5000${NC}"
    echo -e "  前端目录：${BOLD}/var/www/stealthnet/${NC}"
    echo ""
  fi
  echo -e "  ${BOLD}常用命令：${NC}"
  echo "    docker compose ps                  — 查看服务状态"
  echo "    docker compose logs -f api         — 查看 API 日志"
  echo "    docker compose logs -f bot         — 查看机器人日志"
  echo "    docker compose restart api bot     — 重启服务"
  echo "    docker compose down                — 停止所有服务"
  echo "    docker compose up -d               — 启动所有服务"
  echo ""
}

# ── 主流程 ────────────────────────────────────────────────────────
main() {
  banner
  check_deps

  # 如果 .env 已存在 — 询问是否覆盖
  if [ -f "$SCRIPT_DIR/.env" ]; then
    echo ""
    warn ".env 文件已存在！"
    read -rp "$(echo -e "${BOLD}是否覆盖？[y/N]${NC}: ")" OVERWRITE
    if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
      configure_env
    else
      info "使用现有 .env 文件"
      # 加载变量
      set -a
      source "$SCRIPT_DIR/.env"
      set +a
    fi
  else
    configure_env
  fi

  # 加载 .env
  set -a
  source "$SCRIPT_DIR/.env"
  set +a

  # 询问是否清理旧数据
  clean_old_data

  # SSL + nginx
  if [ "$USE_BUILTIN_NGINX" = "true" ]; then
    obtain_ssl
  fi

  build_and_start
  show_status
  show_summary
}

main "$@"
