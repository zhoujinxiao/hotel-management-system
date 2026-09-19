CREATE TABLE daily_rate (
    id BIGINT NOT NULL AUTO_INCREMENT,
    room_type_id BIGINT NOT NULL,
    stay_date DATE NOT NULL,
    rate DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_daily_rate_type_date (room_type_id, stay_date),
    KEY idx_daily_rate_date (stay_date),
    CONSTRAINT fk_daily_rate_room_type FOREIGN KEY (room_type_id) REFERENCES room_type (id),
    CONSTRAINT chk_daily_rate_value CHECK (rate >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tax_config (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    tax_rate DECIMAL(6, 4) NOT NULL,
    effective_from DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_tax_config_effective_from (effective_from),
    CONSTRAINT chk_tax_config_rate CHECK (tax_rate >= 0 AND tax_rate < 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE booking
    ADD COLUMN adults INT NOT NULL DEFAULT 2 AFTER room_id,
    ADD COLUMN children INT NOT NULL DEFAULT 0 AFTER adults,
    ADD COLUMN tax_rate DECIMAL(6, 4) NOT NULL DEFAULT 0 AFTER total_amount,
    ADD COLUMN tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER tax_rate,
    ADD COLUMN net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER tax_amount;

ALTER TABLE booking
    ADD CONSTRAINT chk_booking_occupancy CHECK (adults >= 1 AND children >= 0),
    ADD CONSTRAINT chk_booking_tax CHECK (tax_rate >= 0 AND tax_rate < 1 AND tax_amount >= 0 AND net_amount >= 0);
