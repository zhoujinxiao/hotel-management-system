package com.zhoujinxiao.hotel.booking.application;

import com.zhoujinxiao.hotel.booking.domain.Booking;
import com.zhoujinxiao.hotel.booking.domain.BookingSource;
import com.zhoujinxiao.hotel.booking.domain.BookingStatus;
import com.zhoujinxiao.hotel.booking.domain.GuaranteeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record BookingResponse(
        Long id,
        String bookingNo,
        String guestName,
        String phoneLast4,
        String roomNumber,
        String roomTypeName,
        LocalDate checkIn,
        LocalDate checkOut,
        int adults,
        int children,
        BookingStatus status,
        BookingSource source,
        GuaranteeStatus guaranteeStatus,
        BigDecimal rate,
        BigDecimal totalAmount,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal netAmount,
        String notes,
        Instant createdAt
) {
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBookingNo(),
                booking.getGuest().getName(),
                booking.getGuest().getPhoneLast4(),
                booking.getRoom().getRoomNumber(),
                booking.getRoom().getRoomType().getName(),
                booking.getCheckIn(),
                booking.getCheckOut(),
                booking.getAdults(),
                booking.getChildren(),
                booking.getStatus(),
                booking.getSource(),
                booking.getGuaranteeStatus(),
                booking.getRate(),
                booking.getTotalAmount(),
                booking.getTaxRate(),
                booking.getTaxAmount(),
                booking.getNetAmount(),
                booking.getNotes(),
                booking.getCreatedAt()
        );
    }
}
