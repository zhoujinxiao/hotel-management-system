package com.zhoujinxiao.hotel.booking.infrastructure;

import com.zhoujinxiao.hotel.booking.domain.DailyRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface DailyRateRepository extends JpaRepository<DailyRate, Long> {
    List<DailyRate> findByRoomTypeIdAndStayDateIn(Long roomTypeId, Collection<LocalDate> stayDates);
}
