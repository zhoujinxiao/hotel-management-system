package com.zhoujinxiao.hotel.room.application;

import com.zhoujinxiao.hotel.room.domain.RoomType;

import java.math.BigDecimal;
import java.time.Instant;

public record RoomTypeResponse(Long id, String code, String name, String bedType, int standardOccupancy, int maxOccupancy, BigDecimal defaultRate, boolean active, Instant createdAt, Instant updatedAt) {
    public static RoomTypeResponse from(RoomType roomType) {
        return new RoomTypeResponse(roomType.getId(), roomType.getCode(), roomType.getName(), roomType.getBedType(), roomType.getStandardOccupancy(), roomType.getMaxOccupancy(), roomType.getDefaultRate(), roomType.isActive(), roomType.getCreatedAt(), roomType.getUpdatedAt());
    }
}
