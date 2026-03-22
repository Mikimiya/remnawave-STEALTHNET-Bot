###############################################################################
#  STEALTHNET — Makefile
#  一键部署: make install
#  常用命令: make up | make down | make logs | make pull | make restart
###############################################################################

SHELL      := /bin/bash
DEPLOY_DIR := /opt/stealthnet
COMPOSE    := docker compose
ENV_FILE   := .env

# GHCR 镜像前缀（从 .env 读取）
-include $(ENV_FILE)
GHCR_IMAGE_PREFIX ?= ghcr.io/mikimiya/stealthnet
IMAGE_TAG         ?= latest
DOMAIN            ?= localhost
FRONTEND_DIST     ?= $(DEPLOY_DIR)/frontend

.PHONY: help install env caddy-install caddy-config caddy-start \
        pull up down restart logs ps \
        frontend-pull frontend-extract \
        db-backup db-restore \
        status clean

# ── 帮助 ─────────────────────────────────────────────────────────
help: ## 显示帮助
	@echo ""
	@echo "  STEALTHNET 部署命令"
	@echo "  ════════════════════════════════════════"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ── 完整安装 ─────────────────────────────────────────────────────
install: env caddy-install pull frontend-extract up caddy-config caddy-start ## 完整安装（首次部署用）
	@echo ""
	@echo "  ✅  STEALTHNET 部署完成！"
	@echo "  🌐  https://$(DOMAIN)"
	@echo ""

# ── 环境变量 ─────────────────────────────────────────────────────
env: ## 初始化 .env 文件
	@if [ ! -f $(ENV_FILE) ]; then \
		cp .env.example $(ENV_FILE); \
		echo "📝 已创建 .env，请编辑后重新运行:"; \
		echo "   vim $(ENV_FILE)"; \
		echo "   make install"; \
		exit 1; \
	fi
	@echo "✅  .env 已存在"

# ── Caddy 安装 ───────────────────────────────────────────────────
caddy-install: ## 安装 Caddy（Debian/Ubuntu）
	@if command -v caddy &>/dev/null; then \
		echo "✅  Caddy 已安装: $$(caddy version)"; \
	else \
		echo "📦  安装 Caddy..."; \
		sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl; \
		curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg; \
		curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list; \
		sudo apt-get update && sudo apt-get install -y caddy; \
		echo "✅  Caddy 安装完成"; \
	fi

# ── Caddy 配置 ───────────────────────────────────────────────────
caddy-config: ## 部署 Caddyfile 到系统
	@sudo mkdir -p /etc/caddy /var/log/caddy
	@echo "📝  生成 Caddyfile..."
	@DOMAIN=$(DOMAIN) FRONTEND_DIST=$(FRONTEND_DIST) envsubst '$$DOMAIN $$FRONTEND_DIST' < Caddyfile | sudo tee /etc/caddy/Caddyfile > /dev/null
	@echo "✅  Caddyfile 已写入 /etc/caddy/Caddyfile"

caddy-start: ## 启动/重载 Caddy
	@sudo systemctl enable caddy
	@sudo systemctl reload caddy 2>/dev/null || sudo systemctl start caddy
	@echo "✅  Caddy 已启动"

caddy-stop: ## 停止 Caddy
	@sudo systemctl stop caddy
	@echo "🛑  Caddy 已停止"

caddy-logs: ## 查看 Caddy 日志
	@sudo journalctl -u caddy -f --no-pager -n 50

# ── Docker 操作 ──────────────────────────────────────────────────
pull: ## 拉取最新 Docker 镜像
	@echo "📦  拉取镜像..."
	$(COMPOSE) pull
	@echo "✅  镜像已更新"

up: ## 启动所有容器
	$(COMPOSE) up -d
	@echo "✅  容器已启动"

down: ## 停止所有容器
	$(COMPOSE) down
	@echo "🛑  容器已停止"

restart: ## 重启所有容器
	$(COMPOSE) restart
	@echo "🔄  容器已重启"

logs: ## 查看容器日志
	$(COMPOSE) logs -f --tail=100

ps: ## 查看容器状态
	$(COMPOSE) ps

# ── 前端静态文件 ──────────────────────────────────────────────────
frontend-pull: ## 拉取前端镜像
	@docker pull $(GHCR_IMAGE_PREFIX)-frontend:$(IMAGE_TAG)

frontend-extract: frontend-pull ## 提取前端静态文件
	@echo "📂  提取前端文件到 $(FRONTEND_DIST)..."
	@sudo mkdir -p $(FRONTEND_DIST)
	@CONTAINER_ID=$$(docker create $(GHCR_IMAGE_PREFIX)-frontend:$(IMAGE_TAG)); \
		sudo docker cp $$CONTAINER_ID:/dist/. $(FRONTEND_DIST)/; \
		docker rm $$CONTAINER_ID > /dev/null
	@echo "✅  前端文件已提取"

# ── 升级 ─────────────────────────────────────────────────────────
upgrade: pull frontend-extract ## 升级到最新版本
	$(COMPOSE) up -d --remove-orphans
	@sudo systemctl reload caddy
	@echo ""
	@echo "  ✅  STEALTHNET 已升级到最新版本！"
	@echo ""

# ── 状态检查 ──────────────────────────────────────────────────────
status: ## 检查所有服务状态
	@echo ""
	@echo "  ══ Docker 容器 ══"
	@$(COMPOSE) ps
	@echo ""
	@echo "  ══ Caddy ══"
	@sudo systemctl is-active caddy && echo "  Caddy: 运行中" || echo "  Caddy: 未运行"
	@echo ""
	@echo "  ══ 磁盘 ══"
	@df -h / | tail -1
	@echo ""

# ── 清理 ─────────────────────────────────────────────────────────
clean: ## 清理未使用的 Docker 资源
	@docker system prune -f
	@echo "🧹  清理完成"

# ── 数据库备份/恢复 ───────────────────────────────────────────────
BACKUP_DIR  := ./backup
BACKUP_FILE ?= $(BACKUP_DIR)/stealthnet.sql
DB_CONTAINER := stealthnet-postgres

db-backup: ## 备份数据库到 backup/stealthnet.sql
	@mkdir -p $(BACKUP_DIR)
	@echo "💾  备份数据库..."
	@docker exec $(DB_CONTAINER) pg_dump \
		-U $(POSTGRES_USER) \
		-d $(POSTGRES_DB) \
		--clean --if-exists --no-owner --no-privileges \
		> $(BACKUP_FILE)
	@echo "✅  数据库已备份到 $(BACKUP_FILE) ($$(wc -c < $(BACKUP_FILE) | tr -d ' ') bytes)"

db-restore: ## 从 backup/stealthnet.sql 恢复数据库
	@if [ ! -f "$(BACKUP_FILE)" ]; then \
		echo "❌  备份文件不存在: $(BACKUP_FILE)"; \
		exit 1; \
	fi
	@echo ""
	@echo "  ⚠️  即将恢复数据库！当前数据将被覆盖！"
	@echo "  📄  备份文件: $(BACKUP_FILE) ($$(wc -c < $(BACKUP_FILE) | tr -d ' ') bytes)"
	@echo ""
	@read -p "  确认恢复？(y/N) " confirm; \
	if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
		echo "  取消恢复"; \
		exit 0; \
	fi
	@echo "🔄  停止 API 和 Bot..."
	@$(COMPOSE) stop api bot 2>/dev/null || true
	@echo "🔄  恢复数据库..."
	@docker exec -i $(DB_CONTAINER) psql \
		-U $(POSTGRES_USER) \
		-d $(POSTGRES_DB) \
		< $(BACKUP_FILE)
	@echo "🔄  重新启动 API 和 Bot..."
	@$(COMPOSE) start api bot
	@echo ""
	@echo "  ✅  数据库恢复完成！"
	@echo ""
