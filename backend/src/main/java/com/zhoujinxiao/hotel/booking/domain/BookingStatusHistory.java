package com.zhoujinxiao.hotel.booking.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "booking_status_history")
public class BookingStatusHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "from_status", length = 20)
    private String fromStatus;

    @Column(name = "to_status", nullable = false, length = 20)
    private String toStatus;

    @Column(length = 500)
    private String reason;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    protected BookingStatusHistory() {}

    public static BookingStatusHistory record(Booking booking, String fromStatus, String toStatus, String reason, Long actorUserId) {
        BookingStatusHistory history = new BookingStatusHistory();
        history.booking = booking;
        history.fromStatus = fromStatus;
        history.toStatus = toStatus;
        history.reason = reason;
        history.actorUserId = actorUserId;
        return history;
    }
}
