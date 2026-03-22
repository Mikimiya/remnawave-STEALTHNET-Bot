# STEALTHNET 部署指南

## 架构

```
┌──────────────────────────────────────────────────────┐
│  宿主机                                               │
│                                                      │
│  Caddy (systemd)                                     │
│  ├── :443 → 前端静态文件 (SPA)                        │
│  └── :443/api/* → reverse_proxy → 127.0.0.1:5000     │
│                                                      │
│  ┌─── Docker ──────────────────────────────────────┐ │
│  │  postgres:16 ─── stealthnet-api ─── stealthnet-bot│ │
│  │       :5432          :5000                      │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

- **Docker 容器**：PostgreSQL、API、Bot — 镜像从 GHCR 拉取
- **Caddy**：宿主机直接运行，自动 HTTPS，反向代理 API，托管前端静态文件
- **前端**：从 GHCR 的 frontend 镜像中提取静态文件到宿主机目录

## 快速开始

### 1. 准备服务器

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 make（如果没有）
sudo apt-get install -y make

# 克隆部署配置
git clone https://github.com/Mikimiya/remnawave-STEALTHNET-Bot.git
cd remnawave-STEALTHNET-Bot/deploy
```

### 2. 配置环境变量

```bash
cp .env.example .env
vim .env
```

**必须修改的变量：**
| 变量 | 说明 |
|------|------|
| `DOMAIN` | 你的域名（需已解析到服务器 IP） |
| `POSTGRES_PASSWORD` | 数据库密码 |
| `JWT_SECRET` | JWT 密钥，运行 `openssl rand -hex 32` 生成 |
| `INIT_ADMIN_PASSWORD` | 初始管理员密码 |
| `BOT_TOKEN` | Telegram Bot Token |

### 3. 一键安装

```bash
make install
```

这个命令会：
1. ✅ 检查 `.env` 是否存在
2. 📦 安装 Caddy（如果未安装）
3. 📦 拉取 Docker 镜像（api, bot, frontend）
4. 📂 提取前端静态文件
5. 🐳 启动 Docker 容器（postgres, api, bot）
6. 📝 生成 Caddyfile 配置
7. 🚀 启动 Caddy

安装完成后访问 `https://你的域名` 即可。

## 常用命令

```bash
make help           # 显示所有命令
make up             # 启动容器
make down           # 停止容器
make restart        # 重启容器
make logs           # 查看容器日志
make ps             # 查看容器状态
make status         # 检查所有服务状态

make caddy-logs     # 查看 Caddy 日志
make caddy-stop     # 停止 Caddy

make upgrade        # 升级到最新版本（拉取镜像 + 重启）
make clean          # 清理 Docker 缓存
```

## 升级

```bash
cd deploy
make upgrade
```

## Docker 镜像

镜像通过 GitHub Actions 自动构建并推送到 GHCR：

| 镜像 | 说明 |
|------|------|
| `ghcr.io/<owner>/stealthnet-api` | 后端 API |
| `ghcr.io/<owner>/stealthnet-bot` | Telegram Bot |
| `ghcr.io/<owner>/stealthnet-frontend` | 前端静态文件 |

触发条件：
- 推送到 `main` 分支
- 创建 `v*` 标签
- 手动触发
