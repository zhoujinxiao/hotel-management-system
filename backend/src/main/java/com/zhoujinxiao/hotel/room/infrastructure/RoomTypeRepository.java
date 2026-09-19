package com.zhoujinxiao.hotel.room.infrastructure;

import com.zhoujinxiao.hotel.room.domain.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<RoomType> findByCodeIgnoreCase(String code);
    List<RoomType> findAllByOrderByCodeAsc();
}
