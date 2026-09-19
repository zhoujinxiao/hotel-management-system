package com.zhoujinxiao.hotel.room.infrastructure;

import com.zhoujinxiao.hotel.room.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    boolean existsByRoomNumberIgnoreCase(String roomNumber);
    Optional<Room> findByRoomNumberIgnoreCase(String roomNumber);
    List<Room> findAllByOrderByFloorNumberAscRoomNumberAsc();
    List<Room> findByFloorNumberOrderByRoomNumberAsc(int floorNumber);
}
