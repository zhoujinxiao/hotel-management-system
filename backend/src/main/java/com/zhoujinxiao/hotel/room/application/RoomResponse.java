package com.zhoujinxiao.hotel.room.application;

import com.zhoujinxiao.hotel.room.domain.*;

import java.time.Instant;

public record RoomResponse(Long id, Long roomTypeId, String roomTypeCode, String roomTypeName, String roomNumber, int floorNumber, OccupancyStatus occupancyStatus, CleanlinessStatus cleanlinessStatus, UsabilityStatus usabilityStatus, String notes, Instant createdAt, Instant updatedAt) {
    public static RoomResponse from(Room room) {
        return new RoomResponse(room.getId(), room.getRoomType().getId(), room.getRoomType().getCode(), room.getRoomType().getName(), room.getRoomNumber(), room.getFloorNumber(), room.getOccupancyStatus(), room.getCleanlinessStatus(), room.getUsabilityStatus(), room.getNotes(), room.getCreatedAt(), room.getUpdatedAt());
    }
}
