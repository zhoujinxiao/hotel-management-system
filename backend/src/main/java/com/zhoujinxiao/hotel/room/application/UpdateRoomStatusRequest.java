package com.zhoujinxiao.hotel.room.application;

import com.zhoujinxiao.hotel.room.domain.CleanlinessStatus;
import com.zhoujinxiao.hotel.room.domain.OccupancyStatus;
import com.zhoujinxiao.hotel.room.domain.UsabilityStatus;

public record UpdateRoomStatusRequest(
        OccupancyStatus occupancyStatus,
        CleanlinessStatus cleanlinessStatus,
        UsabilityStatus usabilityStatus
) {
}
