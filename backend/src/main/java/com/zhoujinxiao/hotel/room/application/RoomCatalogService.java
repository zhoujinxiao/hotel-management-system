package com.zhoujinxiao.hotel.room.application;

import com.zhoujinxiao.hotel.common.api.BusinessException;
import com.zhoujinxiao.hotel.room.domain.Room;
import com.zhoujinxiao.hotel.room.domain.RoomType;
import com.zhoujinxiao.hotel.room.infrastructure.RoomRepository;
import com.zhoujinxiao.hotel.room.infrastructure.RoomTypeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoomCatalogService {

    private final RoomTypeRepository roomTypeRepository;
    private final RoomRepository roomRepository;

    public RoomCatalogService(RoomTypeRepository roomTypeRepository, RoomRepository roomRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomTypeResponse> listRoomTypes() {
        return roomTypeRepository.findAllByOrderByCodeAsc().stream().map(RoomTypeResponse::from).toList();
    }

    @Transactional
    public RoomTypeResponse createRoomType(CreateRoomTypeRequest request) {
        String normalizedCode = request.code().trim().toUpperCase();
        if (roomTypeRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new BusinessException(HttpStatus.CONFLICT, "ROOM_TYPE_CODE_EXISTS", "房型编码已存在");
        }
        RoomType roomType = RoomType.create(
                normalizedCode,
                request.name(),
                request.bedType(),
                request.standardOccupancy(),
                request.maxOccupancy(),
                request.defaultRate()
        );
        return RoomTypeResponse.from(roomTypeRepository.save(roomType));
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> listRooms(Integer floorNumber) {
        List<Room> rooms = floorNumber == null
                ? roomRepository.findAllByOrderByFloorNumberAscRoomNumberAsc()
                : roomRepository.findByFloorNumberOrderByRoomNumberAsc(floorNumber);
        return rooms.stream().map(RoomResponse::from).toList();
    }

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request) {
        RoomType roomType = roomTypeRepository.findById(request.roomTypeId())
                .filter(RoomType::isActive)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ROOM_TYPE_NOT_FOUND", "启用中的房型不存在"));
        String roomNumber = request.roomNumber().trim().toUpperCase();
        if (roomRepository.existsByRoomNumberIgnoreCase(roomNumber)) {
            throw new BusinessException(HttpStatus.CONFLICT, "ROOM_NUMBER_EXISTS", "房号已存在");
        }
        Room room = Room.create(roomType, roomNumber, request.floorNumber(), request.notes());
        return RoomResponse.from(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse updateRoomStatus(Long roomId, UpdateRoomStatusRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "房间不存在"));
        room.updateStatus(request.occupancyStatus(), request.cleanlinessStatus(), request.usabilityStatus());
        return RoomResponse.from(room);
    }
}
