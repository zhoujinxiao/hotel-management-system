package com.zhoujinxiao.hotel.booking.domain;

import com.zhoujinxiao.hotel.room.domain.Room;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "booking_night", uniqueConstraints = @UniqueConstraint(name = "uk_booking_night_room_date", columnNames = {"room_id", "stay_date"}))
public class BookingNight {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "stay_date", nullable = false)
    private LocalDate stayDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected BookingNight() {}

    public static BookingNight create(Booking booking, Room room, LocalDate stayDate) {
        BookingNight night = new BookingNight();
        night.booking = booking;
        night.room = room;
        night.stayDate = stayDate;
        return night;
    }

    public Long getId() { return id; }
    public Booking getBooking() { return booking; }
    public Room getRoom() { return room; }
    public LocalDate getStayDate() { return stayDate; }
}
