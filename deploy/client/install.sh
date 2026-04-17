#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════
#  Remnawave Node 一键部署脚本
#  适用系统: Debian / Ubuntu / CentOS
# ═══════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/opt/remnanode"
LOG_DIR="/var/log/remnanode"

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── 检查 root ──
[[ $EUID -ne 0 ]] && err "请使用 root 用户运行此脚本"

# ── 1. 修复 apt 源 (Debian/Ubuntu 过期仓库) ──
fix_apt_sources() {
  local fixed=0
  # 移除已失效的 backports / 过期源
  for f in /etc/apt/sources.list /etc/apt/sources.list.d/*.list; do
    [[ -f "$f" ]] || continue
    if grep -qE 'bullseye-backports|buster-backports' "$f" 2>/dev/null; then
      info "修复过期源: $f"
      sed -i '/bullseye-backports/d; /buster-backports/d' "$f"
      fixed=1
    fi
  done
  # 如果 sources.list 中有 ftp.hk.debian.org 等已失效镜像，替换为 deb.debian.org
  if grep -q 'ftp\..*\.debian\.org' /etc/apt/sources.list 2>/dev/null; then
    info "替换过期 Debian 镜像为 deb.debian.org ..."
    sed -i 's|ftp\.[a-z]*\.debian\.org|deb.debian.org|g' /etc/apt/sources.list
    fixed=1
  fi
  if [[ $fixed -eq 1 ]]; then
    info "正在更新 apt 索引 ..."
    apt-get update -qq >/dev/null 2>&1 || warn "apt update 部分失败，继续安装"
    ok "apt 源已修复"
  fi
}

fix_apt_sources

# ── 2. 安装 Docker ──
if command -v docker &>/dev/null; then
  ok "Docker 已安装: $(docker --version)"
else
  info "正在安装 Docker ..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  ok "Docker 安装完成"
fi

# ── 3. 交互输入 ──
echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}  Remnawave Node 配置${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

read -rp "$(echo -e "${YELLOW}请输入 NODE_PORT [默认 2222]: ${NC}")" NODE_PORT
NODE_PORT="${NODE_PORT:-2222}"

read -rp "$(echo -e "${YELLOW}请输入 SECRET_KEY (从 Remna 后台获取): ${NC}")" SECRET_KEY
[[ -z "$SECRET_KEY" ]] && err "SECRET_KEY 不能为空"

echo ""
info "NODE_PORT  = ${NODE_PORT}"
info "SECRET_KEY = ${SECRET_KEY:0:30}..."
echo ""
read -rp "$(echo -e "${YELLOW}确认以上配置? [Y/n]: ${NC}")" CONFIRM
CONFIRM="${CONFIRM:-Y}"
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { warn "已取消"; exit 0; }

# ── 4. 创建目录 ──
info "创建工作目录 ${INSTALL_DIR} ..."
mkdir -p "${INSTALL_DIR}"
mkdir -p "${LOG_DIR}"
chmod 777 "${LOG_DIR}"

# ── 5. 生成 docker-compose.yml ──
info "生成 docker-compose.yml ..."
cat > "${INSTALL_DIR}/docker-compose.yml" <<EOF
services:
  remnanode:
    container_name: remnanode
    hostname: remnanode
    image: remnawave/node:latest
    cap_add:
      - NET_ADMIN
    restart: always
    network_mode: host
    ulimits:
      nofile:
        soft: 1048576
        hard: 1048576
    environment:
      - NODE_PORT=${NODE_PORT}
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - '${LOG_DIR}:/var/log/remnanode'
EOF

ok "docker-compose.yml 已生成"

# ── 6. 启动容器 ──
info "正在拉取镜像并启动容器 ..."
cd "${INSTALL_DIR}"
docker compose pull
docker compose up -d

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Remnawave Node 部署完成!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "  📁 安装目录: ${CYAN}${INSTALL_DIR}${NC}"
echo -e "  📋 日志目录: ${CYAN}${LOG_DIR}${NC}"
echo -e "  🔌 端口:     ${CYAN}${NODE_PORT}${NC}"
echo ""
echo -e "  常用命令:"
echo -e "    查看日志:  ${YELLOW}cd ${INSTALL_DIR} && docker compose logs -f${NC}"
echo -e "    重启节点:  ${YELLOW}cd ${INSTALL_DIR} && docker compose restart${NC}"
echo -e "    停止节点:  ${YELLOW}cd ${INSTALL_DIR} && docker compose down${NC}"
echo -e "    更新节点:  ${YELLOW}cd ${INSTALL_DIR} && docker compose pull && docker compose up -d${NC}"
echo ""

# ── 7. 显示实时日志 ──
info "正在显示实时日志 (Ctrl+C 退出，不影响容器运行) ..."
echo ""
docker compose logs -f -t

