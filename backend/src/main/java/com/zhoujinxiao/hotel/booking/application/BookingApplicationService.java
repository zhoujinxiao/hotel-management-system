package com.zhoujinxiao.hotel.booking.application;

import com.zhoujinxiao.hotel.booking.domain.*;
import com.zhoujinxiao.hotel.booking.infrastructure.*;
import com.zhoujinxiao.hotel.common.api.BusinessException;
import com.zhoujinxiao.hotel.common.security.AesEncryptionService;
import com.zhoujinxiao.hotel.guest.domain.Guest;
import com.zhoujinxiao.hotel.guest.infrastructure.GuestRepository;
import com.zhoujinxiao.hotel.room.domain.CleanlinessStatus;
import com.zhoujinxiao.hotel.room.domain.Room;
import com.zhoujinxiao.hotel.room.domain.UsabilityStatus;
import com.zhoujinxiao.hotel.room.infrastructure.RoomRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BookingApplicationService {
    private static final List<BookingStatus> OCCUPYING_STATUSES = List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN);

    private final BookingRepository bookingRepository;
    private final BookingNightRepository bookingNightRepository;
    private final BookingStatusHistoryRepository statusHistoryRepository;
    private final DailyRateRepository dailyRateRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;
    private final AesEncryptionService encryptionService;

    public BookingApplicationService(
            BookingRepository bookingRepository,
            BookingNightRepository bookingNightRepository,
            BookingStatusHistoryRepository statusHistoryRepository,
            DailyRateRepository dailyRateRepository,
            TaxConfigRepository taxConfigRepository,
            GuestRepository guestRepository,
            RoomRepository roomRepository,
            AesEncryptionService encryptionService
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingNightRepository = bookingNightRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.dailyRateRepository = dailyRateRepository;
        this.taxConfigRepository = taxConfigRepository;
        this.guestRepository = guestRepository;
        this.roomRepository = roomRepository;
        this.encryptionService = encryptionService;
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> listBookings() {
        return bookingRepository.findAllDetailed().stream().map(BookingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long id) {
        return BookingResponse.from(findBooking(id));
    }

    @Transactional(readOnly = true)
    public List<AvailabilityRoomResponse> findAvailability(LocalDate checkIn, LocalDate checkOut, Long roomTypeId, int adults, int children) {
        validateStay(checkIn, checkOut);
        if (adults < 1 || children < 0) throw new IllegalArgumentException("入住人数无效");
        Set<Long> occupiedRoomIds = new HashSet<>(bookingNightRepository.findOccupiedRoomIds(checkIn, checkOut, OCCUPYING_STATUSES));
        return roomRepository.findAllByOrderByFloorNumberAscRoomNumberAsc().stream()
                .filter(room -> roomTypeId == null || Objects.equals(room.getRoomType().getId(), roomTypeId))
                .filter(room -> room.getUsabilityStatus() == UsabilityStatus.USABLE)
                .filter(room -> room.getCleanlinessStatus() == CleanlinessStatus.INSPECTED)
                .filter(room -> room.getRoomType().getMaxOccupancy() >= adults + children)
                .filter(room -> !occupiedRoomIds.contains(room.getId()))
                .map(room -> toAvailability(room, checkIn, checkOut))
                .toList();
    }

    @Transactional
    public BookingResponse create(CreateBookingRequest request, Long actorUserId) {
        validateStay(request.checkIn(), request.checkOut());
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND", "房间不存在"));
        if (room.getUsabilityStatus() != UsabilityStatus.USABLE) throw new BusinessException(HttpStatus.CONFLICT, "ROOM_OUT_OF_ORDER", "房间当前停用");
        if (room.getCleanlinessStatus() != CleanlinessStatus.INSPECTED) throw new BusinessException(HttpStatus.CONFLICT, "ROOM_NOT_INSPECTED", "房间尚未完成查房");
        if (room.getRoomType().getMaxOccupancy() < request.adults() + request.children()) throw new BusinessException(HttpStatus.BAD_REQUEST, "OCCUPANCY_EXCEEDED", "入住人数超过房型上限");

        RatePlan ratePlan = resolveRate(room, request.checkIn(), request.checkOut());
        Guest guest = Guest.create(request.guestName(), encryptionService.encrypt(request.phone()), Guest.lastFour(request.phone()), request.city(), request.notes());
        guestRepository.save(guest);
        Booking booking = Booking.create(generateBookingNo(), guest, room, request.checkIn(), request.checkOut(), request.adults(), request.children(), request.source(), request.guaranteeStatus(), ratePlan.nightlyRate(), ratePlan.taxRate(), request.notes());
        bookingRepository.saveAndFlush(booking);
        List<BookingNight> nights = stayDates(request.checkIn(), request.checkOut()).stream().map(date -> BookingNight.create(booking, room, date)).toList();
        try {
            bookingNightRepository.saveAllAndFlush(nights);
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException(HttpStatus.CONFLICT, "ROOM_DATE_CONFLICT", "所选房间在该日期范围内已被占用");
        }
        statusHistoryRepository.save(BookingStatusHistory.record(booking, null, booking.getStatus().name(), "创建预订", actorUserId));
        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse cancel(Long id, String reason, Long actorUserId) {
        Booking booking = findBooking(id);
        String from = booking.getStatus().name();
        try {
            booking.cancel();
        } catch (IllegalStateException exception) {
            throw new BusinessException(HttpStatus.CONFLICT, "INVALID_BOOKING_STATUS", exception.getMessage());
        }
        bookingNightRepository.deleteAllByBooking_Id(id);
        statusHistoryRepository.save(BookingStatusHistory.record(booking, from, booking.getStatus().name(), reason, actorUserId));
        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse markNoShow(Long id, String reason, Long actorUserId) {
        Booking booking = findBooking(id);
        String from = booking.getStatus().name();
        try {
            booking.markNoShow();
        } catch (IllegalStateException exception) {
            throw new BusinessException(HttpStatus.CONFLICT, "INVALID_BOOKING_STATUS", exception.getMessage());
        }
        bookingNightRepository.deleteAllByBooking_Id(id);
        statusHistoryRepository.save(BookingStatusHistory.record(booking, from, booking.getStatus().name(), reason, actorUserId));
        return BookingResponse.from(booking);
    }

    private Booking findBooking(Long id) {
        return bookingRepository.findDetailedById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND", "预订不存在"));
    }

    private AvailabilityRoomResponse toAvailability(Room room, LocalDate checkIn, LocalDate checkOut) {
        RatePlan plan = resolveRate(room, checkIn, checkOut);
        return new AvailabilityRoomResponse(room.getId(), room.getRoomNumber(), room.getFloorNumber(), room.getRoomType().getId(), room.getRoomType().getCode(), room.getRoomType().getName(), room.getRoomType().getMaxOccupancy(), plan.totalAmount(), plan.nightRates());
    }

    private RatePlan resolveRate(Room room, LocalDate checkIn, LocalDate checkOut) {
        List<LocalDate> dates = stayDates(checkIn, checkOut);
        Map<LocalDate, BigDecimal> overrides = new HashMap<>();
        dailyRateRepository.findByRoomTypeIdAndStayDateIn(room.getRoomType().getId(), dates).forEach(rate -> overrides.put(rate.getStayDate(), rate.getRate()));
        List<AvailabilityRoomResponse.NightlyRate> nightRates = dates.stream().map(date -> new AvailabilityRoomResponse.NightlyRate(date, overrides.getOrDefault(date, room.getRoomType().getDefaultRate()))).toList();
        BigDecimal total = nightRates.stream().map(AvailabilityRoomResponse.NightlyRate::rate).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxRate = taxConfigRepository.findFirstByActiveTrueAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(checkIn).map(TaxConfig::getTaxRate).orElse(BigDecimal.ZERO);
        return new RatePlan(total, taxRate, nightRates);
    }

    private List<LocalDate> stayDates(LocalDate checkIn, LocalDate checkOut) {
        List<LocalDate> dates = new ArrayList<>();
        for (LocalDate date = checkIn; date.isBefore(checkOut); date = date.plusDays(1)) dates.add(date);
        return dates;
    }

    private void validateStay(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) throw new IllegalArgumentException("离店日期必须晚于到店日期");
        if (checkIn.isBefore(LocalDate.now())) throw new IllegalArgumentException("到店日期不能早于今天");
    }

    private String generateBookingNo() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
        return "BK-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + suffix;
    }

    private record RatePlan(BigDecimal totalAmount, BigDecimal taxRate, List<AvailabilityRoomResponse.NightlyRate> nightRates) {
        BigDecimal nightlyRate() {
            if (nightRates.isEmpty()) return BigDecimal.ZERO;
            return totalAmount.divide(BigDecimal.valueOf(nightRates.size()), 2, RoundingMode.HALF_UP);
        }
    }
}
