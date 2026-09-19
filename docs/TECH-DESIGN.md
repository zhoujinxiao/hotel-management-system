# 酒店运营系统技术设计

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v0.1 |
| 状态 | 开发基线 |
| 对应 PRD | `docs/PRD.md` v0.1 |
| 前端 | Vue 3 + TypeScript + Vite + Pinia + Vue Router |
| 后端 | Java 21 + Spring Boot 4.1 + Spring Security |
| ORM | Spring Data JPA |
| 数据库 | MySQL 8 + Flyway |
| 测试 | JUnit 5 + Spring Boot Test + Testcontainers + Vitest |
| 部署 | 本地独立服务器，局域网 HTTPS |

## 1. 架构原则

- 采用模块化单体，第一版不拆微服务。
- 业务模块按领域划分，避免按 Controller、Service、Repository 全局横向堆放。
- 数据库约束是最终防线，前后端校验不能代替数据库约束。
- 订单、账务、审计只追加不物理删除。
- API 使用 `/api/v1` 前缀。
- 第一版只服务单店，不提前实现多租户。

## 2. 后端模块

```text
com.zhoujinxiao.hotel
├─ common
│  ├─ api
│  ├─ audit
│  ├─ security
│  └─ time
├─ room
│  ├─ api
│  ├─ application
│  ├─ domain
│  └─ infrastructure
├─ guest
├─ booking
├─ stay
├─ housekeeping
├─ folio
├─ shift
├─ reporting
└─ system
```

第一阶段实际实现顺序：

1. `room`：房型、房间、状态、日期房价。
2. `booking`：预订、订单号、房晚库存和冲突保护。
3. `stay`：入住、续住、换房和退房。
4. `housekeeping`：清洁任务和查房。
5. `folio`：押金、房费、消费、收款、退款和挂账。
6. `shift`：班次结算和营业日关闭。
7. `security/audit`：账号、角色、审批和审计。

## 3. 数据库设计

### 3.1 房型和房间

- `room_type`
- `room`
- `daily_rate`
- `tax_config`

房间状态独立存储：

- `occupancy_status`：`VACANT`、`RESERVED`、`OCCUPIED`
- `cleanliness_status`：`DIRTY`、`CLEAN`、`INSPECTED`
- `usability_status`：`USABLE`、`OUT_OF_ORDER`

### 3.2 预订和库存

- `guest`
- `booking`
- `booking_status_history`
- `booking_night`

`booking_night` 是防止重复售房的核心表：

```text
booking_night
- id
- booking_id
- room_id
- stay_date
- UNIQUE(room_id, stay_date)
```

日期范围为 `[checkIn, checkOut)`。系统为每个住宿夜创建一行；数据库唯一约束负责阻止并发重复占房。

### 3.3 入住和客房

- `stay`
- `room_move`
- `housekeeping_task`
- `room_status_history`

### 3.4 账务和班次

- `folio`
- `charge`
- `payment`
- `refund`
- `shift_session`
- `cashier_difference`
- `business_day`

金额在 Java 使用 `BigDecimal`，MySQL 使用 `DECIMAL(12,2)`。

### 3.5 身份和审计

- `app_user`
- `role`
- `permission`
- `user_role`
- `role_permission`
- `audit_log`

## 4. API 约定

- 基础路径：`/api/v1`
- JSON 字段：`camelCase`
- 日期：`yyyy-MM-dd`
- 时间：ISO 8601，时区 `Asia/Shanghai`
- 请求和响应统一使用 DTO，禁止直接暴露 JPA Entity
- 业务错误使用稳定的错误码和可读消息
- 分页参数：`page` 从 0 开始，`size` 默认 20，最大 100

核心接口：

```text
GET    /api/v1/room-types
POST   /api/v1/room-types
GET    /api/v1/rooms
POST   /api/v1/rooms
PATCH  /api/v1/rooms/{id}/status

GET    /api/v1/availability
POST   /api/v1/bookings
GET    /api/v1/bookings/{id}
PATCH  /api/v1/bookings/{id}
POST   /api/v1/bookings/{id}/cancel
POST   /api/v1/bookings/{id}/no-show

POST   /api/v1/stays/check-in
POST   /api/v1/stays/{id}/extend
POST   /api/v1/stays/{id}/move
POST   /api/v1/stays/{id}/check-out

GET    /api/v1/housekeeping/tasks
POST   /api/v1/housekeeping/tasks/{id}/clean
POST   /api/v1/housekeeping/tasks/{id}/inspect

GET    /api/v1/folios/{id}
POST   /api/v1/folios/{id}/charges
POST   /api/v1/folios/{id}/payments
POST   /api/v1/folios/{id}/refunds
```

## 5. 前端结构

```text
src/
├─ layouts/
├─ router/
├─ stores/
├─ services/
├─ types/
├─ components/
├─ views/
└─ style.css
```

已确认页面：

- 值班控制台
- 预订管理
- 房态中心
- 入住与退房
- 宾客档案
- 账单与班次
- 客房任务
- 用户与权限
- 审计日志

## 6. 安全基线

- Spring Security 负责认证和授权。
- 第一版优先使用同源 Session Cookie，不提前引入 JWT。
- 前端路由守卫只改善体验，权限必须由后端最终校验。
- 手机号和证件号码加密存储，证件号码额外生成哈希。
- 密码使用 BCrypt 或 Argon2id。
- 敏感操作进行二次认证并写审计日志。

## 7. 备份和运维

- MySQL 每日全量备份。
- Binlog 或增量机制满足 RPO 不超过 15 分钟。
- 备份加密后写外置硬盘和云对象存储。
- 每月执行恢复演练。
- 应用提供健康检查、备份结果、磁盘空间和错误日志状态。

## 8. 当前决策

- 采用模块化单体，暂不拆服务。
- ORM 采用 Spring Data JPA。
- 预订占房使用 `booking_night` + 唯一约束。
- 前端使用自建设计系统，暂不引入重型 UI 组件库。
- 第一版使用 Session 认证，不优先引入 JWT。
