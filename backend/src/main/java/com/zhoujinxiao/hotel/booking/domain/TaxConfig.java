package com.zhoujinxiao.hotel.booking.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "tax_config")
public class TaxConfig {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "tax_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal taxRate;

    @Column(name = "effective_from", nullable = false, unique = true)
    private LocalDate effectiveFrom;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TaxConfig() {}

    public BigDecimal getTaxRate() { return taxRate; }
    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public boolean isActive() { return active; }
}
