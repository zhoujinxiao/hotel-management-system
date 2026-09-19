package com.zhoujinxiao.hotel.guest.infrastructure;

import com.zhoujinxiao.hotel.guest.domain.Guest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestRepository extends JpaRepository<Guest, Long> {
}
