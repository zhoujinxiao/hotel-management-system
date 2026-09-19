package com.zhoujinxiao.hotel.booking.application;

import java.math.BigDecimal;
import java.util.List;

public record AvailabilityRoomResponse(
        Long roomId,
        String roomNumber,
        int floorNumber,
        Long roomTypeId,
        String roomTypeCode,
        String roomTypeName,
        int maxOccupancy,
        BigDecimal totalAmount,
        List<NightlyRate> nightlyRates
) {
    public record NightlyRate(java.time.LocalDate date, BigDecimal rate) {
    }
}
