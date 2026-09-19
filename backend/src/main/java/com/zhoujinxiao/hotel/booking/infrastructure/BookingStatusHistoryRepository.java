package com.zhoujinxiao.hotel.booking.infrastructure;

import com.zhoujinxiao.hotel.booking.domain.BookingStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingStatusHistoryRepository extends JpaRepository<BookingStatusHistory, Long> {
}
