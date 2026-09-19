package com.zhoujinxiao.hotel.booking.api;

import com.zhoujinxiao.hotel.booking.application.*;
import com.zhoujinxiao.hotel.identity.application.HotelUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {
    private final BookingApplicationService bookingService;

    public BookingController(BookingApplicationService bookingService) { this.bookingService = bookingService; }

    @GetMapping
    public List<BookingResponse> list() {
        return bookingService.listBookings();
    }

    @GetMapping("/{id}")
    public BookingResponse get(@PathVariable Long id) {
        return bookingService.getBooking(id);
    }

    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal HotelUserPrincipal principal
    ) {
        BookingResponse response = bookingService.create(request, principal.getId());
        return ResponseEntity.created(URI.create("/api/v1/bookings/" + response.id())).body(response);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(
            @PathVariable Long id,
            @Valid @RequestBody CancelBookingRequest request,
            @AuthenticationPrincipal HotelUserPrincipal principal
    ) {
        return bookingService.cancel(id, request.reason(), principal.getId());
    }

    @PostMapping("/{id}/no-show")
    public BookingResponse noShow(
            @PathVariable Long id,
            @Valid @RequestBody CancelBookingRequest request,
            @AuthenticationPrincipal HotelUserPrincipal principal
    ) {
        return bookingService.markNoShow(id, request.reason(), principal.getId());
    }
}
