package com.zhoujinxiao.hotel.room.api;

import com.zhoujinxiao.hotel.room.application.CreateRoomTypeRequest;
import com.zhoujinxiao.hotel.room.application.RoomCatalogService;
import com.zhoujinxiao.hotel.room.application.RoomTypeResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/room-types")
public class RoomTypeController {

    private final RoomCatalogService roomCatalogService;

    public RoomTypeController(RoomCatalogService roomCatalogService) {
        this.roomCatalogService = roomCatalogService;
    }

    @GetMapping
    public List<RoomTypeResponse> list() {
        return roomCatalogService.listRoomTypes();
    }

    @PostMapping
    public ResponseEntity<RoomTypeResponse> create(@Valid @RequestBody CreateRoomTypeRequest request) {
        RoomTypeResponse response = roomCatalogService.createRoomType(request);
        return ResponseEntity.created(URI.create("/api/v1/room-types/" + response.id())).body(response);
    }
}
