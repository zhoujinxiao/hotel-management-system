package com.zhoujinxiao.hotel.booking.application;

import com.zhoujinxiao.hotel.booking.domain.BookingSource;
import com.zhoujinxiao.hotel.booking.domain.GuaranteeStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateBookingRequest(
        @NotBlank String guestName,
        @NotBlank String phone,
        String city,
        @NotNull Long roomId,
        @NotNull LocalDate checkIn,
        @NotNull LocalDate checkOut,
        @Min(1) int adults,
        @Min(0) int children,
        @NotNull BookingSource source,
        @NotNull GuaranteeStatus guaranteeStatus,
        String notes
) {
}
