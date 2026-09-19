package com.zhoujinxiao.hotel.room.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;

@Entity
@Table(name = "room_type")
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "bed_type", nullable = false, length = 80)
    private String bedType;

    @Column(name = "standard_occupancy", nullable = false)
    private int standardOccupancy;

    @Column(name = "max_occupancy", nullable = false)
    private int maxOccupancy;

    @Column(name = "default_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal defaultRate;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected RoomType() {
    }

    public static RoomType create(String code, String name, String bedType, int standardOccupancy, int maxOccupancy, BigDecimal defaultRate) {
        if (standardOccupancy < 1) throw new IllegalArgumentException("标准入住人数必须大于 0");
        if (maxOccupancy < standardOccupancy) throw new IllegalArgumentException("最大入住人数不能小于标准入住人数");
        if (defaultRate == null || defaultRate.signum() < 0) throw new IllegalArgumentException("默认房价不能为负数");
        RoomType roomType = new RoomType();
        roomType.code = requireText(code, "房型编码不能为空").toUpperCase(Locale.ROOT);
        roomType.name = requireText(name, "房型名称不能为空");
        roomType.bedType = requireText(bedType, "床型不能为空");
        roomType.standardOccupancy = standardOccupancy;
        roomType.maxOccupancy = maxOccupancy;
        roomType.defaultRate = defaultRate;
        return roomType;
    }

    public void deactivate() { this.active = false; }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getBedType() { return bedType; }
    public int getStandardOccupancy() { return standardOccupancy; }
    public int getMaxOccupancy() { return maxOccupancy; }
    public BigDecimal getDefaultRate() { return defaultRate; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
