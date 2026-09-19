package com.zhoujinxiao.hotel.booking.application;

import com.zhoujinxiao.hotel.booking.domain.Booking;
import com.zhoujinxiao.hotel.booking.domain.BookingNight;
import com.zhoujinxiao.hotel.booking.domain.BookingSource;
import com.zhoujinxiao.hotel.booking.domain.GuaranteeStatus;
import com.zhoujinxiao.hotel.booking.infrastructure.*;
import com.zhoujinxiao.hotel.common.api.BusinessException;
import com.zhoujinxiao.hotel.common.security.AesEncryptionService;
import com.zhoujinxiao.hotel.guest.domain.Guest;
import com.zhoujinxiao.hotel.guest.infrastructure.GuestRepository;
import com.zhoujinxiao.hotel.room.domain.CleanlinessStatus;
import com.zhoujinxiao.hotel.room.domain.Room;
import com.zhoujinxiao.hotel.room.domain.RoomType;
import com.zhoujinxiao.hotel.room.domain.UsabilityStatus;
import com.zhoujinxiao.hotel.room.infrastructure.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingApplicationServiceTest {
    @Mock BookingRepository bookingRepository;
    @Mock BookingNightRepository bookingNightRepository;
    @Mock BookingStatusHistoryRepository statusHistoryRepository;
    @Mock DailyRateRepository dailyRateRepository;
    @Mock TaxConfigRepository taxConfigRepository;
    @Mock GuestRepository guestRepository;
    @Mock RoomRepository roomRepository;
    @Mock AesEncryptionService encryptionService;

    private BookingApplicationService service;
    private Room room;

    @BeforeEach
    void setUp() {
        service = new BookingApplicationService(bookingRepository, bookingNightRepository, statusHistoryRepository, dailyRateRepository, taxConfigRepository, guestRepository, roomRepository, encryptionService);
        RoomType roomType = mock(RoomType.class);
        when(roomType.getId()).thenReturn(1L);
        when(roomType.getCode()).thenReturn("KING");
        when(roomType.getName()).thenReturn("高级大床房");
        when(roomType.getMaxOccupancy()).thenReturn(2);
        when(roomType.getDefaultRate()).thenReturn(new BigDecimal("100.00"));
        room = Room.create(roomType, "701", 7, null);
        room.updateStatus(null, CleanlinessStatus.INSPECTED, UsabilityStatus.USABLE);
        when(roomRepository.findById(701L)).thenReturn(Optional.of(room));
        when(encryptionService.encrypt("13800000000")).thenReturn(new byte[]{1, 2, 3});
        when(guestRepository.save(any(Guest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dailyRateRepository.findByRoomTypeIdAndStayDateIn(eq(1L), anyCollection())).thenReturn(List.of());
        when(taxConfigRepository.findFirstByActiveTrueAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any())).thenReturn(Optional.empty());
    }

    @Test
    void createsBookingNightsAndCalculatesAmount() {
        when(bookingNightRepository.saveAllAndFlush(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        LocalDate checkIn = LocalDate.now().plusDays(1);

        BookingResponse response = service.create(new CreateBookingRequest(
                "测试宾客", "13800000000", "杭州", 701L, checkIn, checkIn.plusDays(2),
                2, 0, BookingSource.PHONE, GuaranteeStatus.GUARANTEED, "高层"
        ), 1L);

        assertThat(response.roomNumber()).isEqualTo("701");
        assertThat(response.totalAmount()).isEqualByComparingTo("200.00");
        verify(bookingNightRepository).saveAllAndFlush(argThat(nights -> { var list = java.util.stream.StreamSupport.stream(nights.spliterator(), false).toList(); return list.size() == 2 && list.stream().allMatch(night -> night.getStayDate().isBefore(checkIn.plusDays(2))); }));
    }

    @Test
    void translatesDatabaseConflictToBusinessError() {
        when(bookingNightRepository.saveAllAndFlush(anyList())).thenThrow(new DataIntegrityViolationException("duplicate"));
        LocalDate checkIn = LocalDate.now().plusDays(1);

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(
                "测试宾客", "13800000000", "杭州", 701L, checkIn, checkIn.plusDays(1),
                2, 0, BookingSource.PHONE, GuaranteeStatus.NOT_GUARANTEED, null
        ), 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("所选房间在该日期范围内已被占用");
    }
}
