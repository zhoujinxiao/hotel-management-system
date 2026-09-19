package com.zhoujinxiao.hotel.booking.api;

import com.zhoujinxiao.hotel.booking.application.AvailabilityRoomResponse;
import com.zhoujinxiao.hotel.booking.application.BookingApplicationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/availability")
public class AvailabilityController {
    private final BookingApplicationService bookingService;

    public AvailabilityController(BookingApplicationService bookingService) { this.bookingService = bookingService; }

    @GetMapping
    public List<AvailabilityRoomResponse> find(
            @RequestParam LocalDate checkIn,
            @RequestParam LocalDate checkOut,
            @RequestParam(required = false) Long roomTypeId,
            @RequestParam(defaultValue = "2") int adults,
            @RequestParam(defaultValue = "0") int children
    ) {
        return bookingService.findAvailability(checkIn, checkOut, roomTypeId, adults, children);
    }
}
