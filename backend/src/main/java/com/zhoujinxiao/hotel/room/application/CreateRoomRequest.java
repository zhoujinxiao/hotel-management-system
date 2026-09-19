package com.zhoujinxiao.hotel.room.application;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRoomRequest(
        @NotNull Long roomTypeId,
        @NotBlank String roomNumber,
        @Min(1) int floorNumber,
        String notes
) {
}
