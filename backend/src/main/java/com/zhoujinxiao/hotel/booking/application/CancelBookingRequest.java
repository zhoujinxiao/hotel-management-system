package com.zhoujinxiao.hotel.booking.application;

import jakarta.validation.constraints.NotBlank;

public record CancelBookingRequest(@NotBlank String reason) {
}
