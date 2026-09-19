# 云栖酒店运营系统

单体酒店内部使用的桌面 Web 运营系统。当前仓库包含需求文档、UI 原型、前端工程和后端工程。

## 当前结构

```text
.
├─ backend/                  # Java 21 + Spring Boot 4.1 + Spring Data JPA
├─ frontend/                 # Vue 3 + TypeScript + Vite
├─ docs/                     # PRD、技术设计
├─ prototype/                # 已确认的 UI 原型
├─ infra/                    # 本地 MySQL Compose 配置
├─ public/                   # 早期演示 MVP，不作为生产实现
└─ server.mjs                # 早期演示服务器
```

## 开发环境

- Java 21
- Node.js 24+
- MySQL 8
- Docker 可选，用于启动本地 MySQL

环境变量示例见 `.env.example`。

## 前端

```powershell
cd frontend
npm install
npm run dev
```

生产构建：

```powershell
npm run build
```

## 后端

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

首次运行前需要准备 MySQL，并配置：

```text
DB_URL
DB_USERNAME
DB_PASSWORD
```

如果本机有 Docker：

```powershell
docker compose -f infra/compose.yaml up -d
```

## 当前开发状态

- 已建立 PRD、技术设计和前端信息架构。
- 已创建 Vue 3 前端工程并实现值班控制台首屏。
- 已创建 Spring Boot 后端工程。
- 已建立第一版 Flyway 数据库迁移。
- 数据库实跑、业务 API 和完整权限系统尚未完成。
- 现有 `public/` 和 `server.mjs` 是早期演示，不继续扩展为生产架构。

## 文档

- `docs/PRD.md`
- `docs/TECH-DESIGN.md`
- `prototype/README.md`
- `AGENTS.md`

## 首次管理员账号

系统不会提交默认管理员密码。首次部署时设置：

```text
APP_ADMIN_USERNAME
APP_ADMIN_PASSWORD
APP_ADMIN_DISPLAY_NAME
```

应用启动时只有在用户表为空且账号密码已配置的情况下，才会创建第一个管理员。生产环境的 `SESSION_COOKIE_SECURE` 必须设置为 `true`。
## 初始化本机 MySQL

使用 MySQL 管理员账号执行：

```text
infra/bootstrap-dev-db.sql
```

脚本会创建：

- 数据库：`hotel_management`
- 开发用户：`hotel`
- 本地开发密码：`hotel_dev_password`

正式部署必须替换开发密码，并通过环境变量注入。
## Local encryption key

Guest phone and identity data require a 32-byte Base64 AES key. Generate one locally:

```powershell
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Set the result as `APP_ENCRYPTION_KEY`. Do not commit the real key or change it after storing encrypted guest data.