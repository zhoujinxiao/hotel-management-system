package com.zhoujinxiao.hotel.booking.infrastructure;

import com.zhoujinxiao.hotel.booking.domain.Booking;
import com.zhoujinxiao.hotel.booking.domain.BookingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBookingNo(String bookingNo);

    @EntityGraph(attributePaths = {"guest", "room", "room.roomType"})
    @Query("select distinct b from Booking b order by b.createdAt desc")
    List<Booking> findAllDetailed();

    @EntityGraph(attributePaths = {"guest", "room", "room.roomType"})
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"guest", "room", "room.roomType"})
    @Query("select distinct b from Booking b where b.checkIn <= :date and b.checkOut > :date and b.status in :statuses order by b.room.roomNumber")
    List<Booking> findStayingOn(@Param("date") LocalDate date, @Param("statuses") List<BookingStatus> statuses);
}
