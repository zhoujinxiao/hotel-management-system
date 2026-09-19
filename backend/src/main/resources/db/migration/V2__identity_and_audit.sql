CREATE TABLE app_user (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_app_user_username (username),
    CONSTRAINT chk_app_user_failed_attempts CHECK (failed_login_attempts >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(300) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permission (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(300) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_permission_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES role (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permission (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES role (id),
    CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES permission (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NULL,
    target_id VARCHAR(80) NULL,
    details_json JSON NULL,
    reason VARCHAR(500) NULL,
    ip_address VARCHAR(64) NULL,
    occurred_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_audit_actor_time (actor_user_id, occurred_at),
    KEY idx_audit_target (target_type, target_id, occurred_at),
    KEY idx_audit_action_time (action, occurred_at),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES app_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO role (code, name, description) VALUES
('ADMIN', '管理员', '系统配置、用户、权限和全部业务数据'),
('MANAGER', '经理', '业务审批、退款、挂账、改价和例外处理'),
('FRONT_DESK', '前台', '预订、排房、入住、退房、收款和交班'),
('FINANCE', '财务', '对账、报表、收款核对和账务修正');

INSERT INTO permission (code, name, description) VALUES
('ROOM_READ', '查看房态', '查看房型、房间和房态'),
('ROOM_WRITE', '维护房态', '维护房型、房间和房态'),
('BOOKING_READ', '查看预订', '查询预订和宾客信息'),
('BOOKING_WRITE', '维护预订', '创建、修改、取消和未到店'),
('STAY_EXECUTE', '办理住店', '入住、续住、换房和退房'),
('HOUSEKEEPING_EXECUTE', '执行客房任务', '清洁、查房和维修状态'),
('FOLIO_READ', '查看房账', '查看房账、收款和余额'),
('FOLIO_WRITE', '维护房账', '增加消费、收款和调整账务'),
('REFUND_APPROVE', '审批退款', '审批退款和挂账'),
('SHIFT_MANAGE', '管理班次', '开班、交班、差异确认和营业日'),
('REPORT_READ', '查看报表', '查看日报和经营报表'),
('USER_MANAGE', '管理用户', '维护账号、角色和密码'),
('AUDIT_READ', '查看审计', '查看关键业务审计日志');

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r CROSS JOIN permission p WHERE r.code = 'ADMIN';

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p ON p.code IN (
'ROOM_READ','ROOM_WRITE','BOOKING_READ','BOOKING_WRITE','STAY_EXECUTE',
'HOUSEKEEPING_EXECUTE','FOLIO_READ','FOLIO_WRITE','REFUND_APPROVE',
'SHIFT_MANAGE','REPORT_READ','USER_MANAGE','AUDIT_READ'
) WHERE r.code = 'MANAGER';

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p ON p.code IN (
'ROOM_READ','BOOKING_READ','BOOKING_WRITE','STAY_EXECUTE',
'HOUSEKEEPING_EXECUTE','FOLIO_READ','FOLIO_WRITE','SHIFT_MANAGE'
) WHERE r.code = 'FRONT_DESK';

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r JOIN permission p ON p.code IN (
'ROOM_READ','BOOKING_READ','FOLIO_READ','FOLIO_WRITE','SHIFT_MANAGE','REPORT_READ'
) WHERE r.code = 'FINANCE';
