package com.zhoujinxiao.hotel.booking.domain;

import com.zhoujinxiao.hotel.room.domain.RoomType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "daily_rate", uniqueConstraints = @UniqueConstraint(name = "uk_daily_rate_type_date", columnNames = {"room_type_id", "stay_date"}))
public class DailyRate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(name = "stay_date", nullable = false)
    private LocalDate stayDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal rate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected DailyRate() {}

    public RoomType getRoomType() { return roomType; }
    public LocalDate getStayDate() { return stayDate; }
    public BigDecimal getRate() { return rate; }
}
