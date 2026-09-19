package com.zhoujinxiao.hotel.booking.infrastructure;

import com.zhoujinxiao.hotel.booking.domain.BookingNight;
import com.zhoujinxiao.hotel.booking.domain.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface BookingNightRepository extends JpaRepository<BookingNight, Long> {
    boolean existsByRoomIdAndStayDate(Long roomId, LocalDate stayDate);
    List<BookingNight> findAllByBookingIdOrderByStayDate(Long bookingId);
    void deleteAllByBooking_Id(Long bookingId);

    @Query("""
            select distinct n.room.id from BookingNight n
            where n.stayDate >= :checkIn and n.stayDate < :checkOut
              and n.booking.status in :statuses
            """)
    List<Long> findOccupiedRoomIds(
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("statuses") Collection<BookingStatus> statuses
    );
}
