package com.zhoujinxiao.hotel.room.application;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateRoomTypeRequest(
        @NotBlank String code,
        @NotBlank String name,
        @NotBlank String bedType,
        @Min(1) int standardOccupancy,
        @Min(1) int maxOccupancy,
        @NotNull @DecimalMin("0.00") BigDecimal defaultRate
) {
}
