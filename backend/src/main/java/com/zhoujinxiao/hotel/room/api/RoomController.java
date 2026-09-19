package com.zhoujinxiao.hotel.room.api;

import com.zhoujinxiao.hotel.room.application.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomCatalogService roomCatalogService;

    public RoomController(RoomCatalogService roomCatalogService) {
        this.roomCatalogService = roomCatalogService;
    }

    @GetMapping
    public List<RoomResponse> list(@RequestParam(required = false) Integer floorNumber) {
        return roomCatalogService.listRooms(floorNumber);
    }

    @PostMapping
    public ResponseEntity<RoomResponse> create(@Valid @RequestBody CreateRoomRequest request) {
        RoomResponse response = roomCatalogService.createRoom(request);
        return ResponseEntity.created(URI.create("/api/v1/rooms/" + response.id())).body(response);
    }

    @PatchMapping("/{id}/status")
    public RoomResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateRoomStatusRequest request) {
        return roomCatalogService.updateRoomStatus(id, request);
    }
}
