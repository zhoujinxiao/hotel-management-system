CREATE TABLE room_type (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(80) NOT NULL,
    bed_type VARCHAR(80) NOT NULL,
    standard_occupancy INT NOT NULL,
    max_occupancy INT NOT NULL,
    default_rate DECIMAL(12, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_room_type_code (code),
    CONSTRAINT chk_room_type_occupancy CHECK (standard_occupancy >= 1 AND max_occupancy >= standard_occupancy),
    CONSTRAINT chk_room_type_rate CHECK (default_rate >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE room (
    id BIGINT NOT NULL AUTO_INCREMENT,
    room_type_id BIGINT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    floor_number INT NOT NULL,
    occupancy_status VARCHAR(20) NOT NULL DEFAULT 'VACANT',
    cleanliness_status VARCHAR(20) NOT NULL DEFAULT 'DIRTY',
    usability_status VARCHAR(20) NOT NULL DEFAULT 'USABLE',
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_room_number (room_number),
    KEY idx_room_type (room_type_id),
    KEY idx_room_status (occupancy_status, cleanliness_status, usability_status),
    CONSTRAINT fk_room_room_type FOREIGN KEY (room_type_id) REFERENCES room_type (id),
    CONSTRAINT chk_room_occupancy_status CHECK (occupancy_status IN ('VACANT', 'RESERVED', 'OCCUPIED')),
    CONSTRAINT chk_room_cleanliness_status CHECK (cleanliness_status IN ('DIRTY', 'CLEAN', 'INSPECTED')),
    CONSTRAINT chk_room_usability_status CHECK (usability_status IN ('USABLE', 'OUT_OF_ORDER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE guest (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    phone_encrypted VARBINARY(512) NOT NULL,
    phone_last4 CHAR(4) NOT NULL,
    id_type VARCHAR(30) NULL,
    id_number_encrypted VARBINARY(768) NULL,
    id_number_hash CHAR(64) NULL,
    city VARCHAR(80) NULL,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_guest_phone_last4 (phone_last4),
    UNIQUE KEY uk_guest_id_number_hash (id_number_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE booking (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_no VARCHAR(30) NOT NULL,
    guest_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    source VARCHAR(30) NOT NULL,
    guarantee_status VARCHAR(20) NOT NULL,
    rate DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    notes VARCHAR(500) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_booking_no (booking_no),
    KEY idx_booking_guest (guest_id),
    KEY idx_booking_room_dates (room_id, check_in, check_out),
    KEY idx_booking_status_dates (status, check_in, check_out),
    CONSTRAINT fk_booking_guest FOREIGN KEY (guest_id) REFERENCES guest (id),
    CONSTRAINT fk_booking_room FOREIGN KEY (room_id) REFERENCES room (id),
    CONSTRAINT chk_booking_dates CHECK (check_out > check_in),
    CONSTRAINT chk_booking_status CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELED', 'NO_SHOW')),
    CONSTRAINT chk_booking_source CHECK (source IN ('WALK_IN', 'PHONE', 'WECHAT')),
    CONSTRAINT chk_booking_guarantee CHECK (guarantee_status IN ('GUARANTEED', 'NOT_GUARANTEED')),
    CONSTRAINT chk_booking_amounts CHECK (rate >= 0 AND total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE booking_night (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    stay_date DATE NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_booking_night_room_date (room_id, stay_date),
    KEY idx_booking_night_booking (booking_id),
    CONSTRAINT fk_booking_night_booking FOREIGN KEY (booking_id) REFERENCES booking (id),
    CONSTRAINT fk_booking_night_room FOREIGN KEY (room_id) REFERENCES room (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE booking_status_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    from_status VARCHAR(20) NULL,
    to_status VARCHAR(20) NOT NULL,
    reason VARCHAR(500) NULL,
    actor_user_id BIGINT NULL,
    changed_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_booking_status_history_booking (booking_id, changed_at),
    CONSTRAINT fk_booking_status_history_booking FOREIGN KEY (booking_id) REFERENCES booking (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
