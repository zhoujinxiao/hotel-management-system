package com.zhoujinxiao.hotel.booking.domain;

import com.zhoujinxiao.hotel.guest.domain.Guest;
import com.zhoujinxiao.hotel.room.domain.Room;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "booking")
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_no", nullable = false, unique = true, length = 30)
    private String bookingNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "check_in", nullable = false)
    private LocalDate checkIn;

    @Column(name = "check_out", nullable = false)
    private LocalDate checkOut;

    @Column(nullable = false)
    private int adults;

    @Column(nullable = false)
    private int children;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingSource source;

    @Enumerated(EnumType.STRING)
    @Column(name = "guarantee_status", nullable = false, length = 20)
    private GuaranteeStatus guaranteeStatus;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "tax_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal taxRate;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "net_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Booking() {}

    public static Booking create(String bookingNo, Guest guest, Room room, LocalDate checkIn, LocalDate checkOut, int adults, int children, BookingSource source, GuaranteeStatus guaranteeStatus, BigDecimal rate, BigDecimal taxRate, String notes) {
        if (checkOut == null || checkIn == null || !checkOut.isAfter(checkIn)) throw new IllegalArgumentException("离店日期必须晚于到店日期");
        if (adults < 1) throw new IllegalArgumentException("成人数至少为 1");
        if (children < 0) throw new IllegalArgumentException("儿童数不能为负数");
        long nights = java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal total = rate.multiply(BigDecimal.valueOf(nights)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = total.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        Booking booking = new Booking();
        booking.bookingNo = bookingNo;
        booking.guest = guest;
        booking.room = room;
        booking.checkIn = checkIn;
        booking.checkOut = checkOut;
        booking.adults = adults;
        booking.children = children;
        booking.status = BookingStatus.CONFIRMED;
        booking.source = source;
        booking.guaranteeStatus = guaranteeStatus;
        booking.rate = rate;
        booking.totalAmount = total;
        booking.taxRate = taxRate;
        booking.taxAmount = tax;
        booking.netAmount = total.subtract(tax);
        booking.notes = notes == null ? null : notes.trim();
        return booking;
    }

    public void cancel() {
        if (status != BookingStatus.CONFIRMED) throw new IllegalStateException("只有已确认预订可以取消");
        status = BookingStatus.CANCELED;
    }

    public void markNoShow() {
        if (status != BookingStatus.CONFIRMED) throw new IllegalStateException("只有已确认预订可以标记未到店");
        status = BookingStatus.NO_SHOW;
    }

    public Long getId() { return id; }
    public String getBookingNo() { return bookingNo; }
    public Guest getGuest() { return guest; }
    public Room getRoom() { return room; }
    public LocalDate getCheckIn() { return checkIn; }
    public LocalDate getCheckOut() { return checkOut; }
    public int getAdults() { return adults; }
    public int getChildren() { return children; }
    public BookingStatus getStatus() { return status; }
    public BookingSource getSource() { return source; }
    public GuaranteeStatus getGuaranteeStatus() { return guaranteeStatus; }
    public BigDecimal getRate() { return rate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getTaxRate() { return taxRate; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
