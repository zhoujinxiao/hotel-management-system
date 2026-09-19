package com.zhoujinxiao.hotel.room.application;

import com.zhoujinxiao.hotel.common.api.BusinessException;
import com.zhoujinxiao.hotel.room.domain.CleanlinessStatus;
import com.zhoujinxiao.hotel.room.domain.OccupancyStatus;
import com.zhoujinxiao.hotel.room.domain.Room;
import com.zhoujinxiao.hotel.room.domain.RoomType;
import com.zhoujinxiao.hotel.room.domain.UsabilityStatus;
import com.zhoujinxiao.hotel.room.infrastructure.RoomRepository;
import com.zhoujinxiao.hotel.room.infrastructure.RoomTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomCatalogServiceTest {

    @Mock
    private RoomTypeRepository roomTypeRepository;

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private RoomCatalogService service;

    @Test
    void createsRoomTypeWithNormalizedCode() {
        when(roomTypeRepository.existsByCodeIgnoreCase("KING")).thenReturn(false);
        when(roomTypeRepository.save(any(RoomType.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoomTypeResponse response = service.createRoomType(new CreateRoomTypeRequest(
                "king", "高级大床房", "1.8 米大床", 2, 2, new BigDecimal("100.00")
        ));

        assertThat(response.code()).isEqualTo("KING");
        assertThat(response.name()).isEqualTo("高级大床房");
        assertThat(response.defaultRate()).isEqualByComparingTo("100.00");
        verify(roomTypeRepository).save(any(RoomType.class));
    }

    @Test
    void rejectsDuplicateRoomTypeCode() {
        when(roomTypeRepository.existsByCodeIgnoreCase("KING")).thenReturn(true);

        assertThatThrownBy(() -> service.createRoomType(new CreateRoomTypeRequest(
                "king", "高级大床房", "1.8 米大床", 2, 2, new BigDecimal("100.00")
        )))
                .isInstanceOf(BusinessException.class)
                .hasMessage("房型编码已存在");
    }

    @Test
    void updatesSeparateRoomStatuses() {
        RoomType roomType = RoomType.create("KING", "高级大床房", "1.8 米大床", 2, 2, new BigDecimal("100.00"));
        Room room = Room.create(roomType, "701", 7, null);
        when(roomRepository.findById(701L)).thenReturn(Optional.of(room));

        RoomResponse response = service.updateRoomStatus(701L, new UpdateRoomStatusRequest(
                OccupancyStatus.VACANT,
                CleanlinessStatus.INSPECTED,
                UsabilityStatus.USABLE
        ));

        assertThat(response.occupancyStatus()).isEqualTo(OccupancyStatus.VACANT);
        assertThat(response.cleanlinessStatus()).isEqualTo(CleanlinessStatus.INSPECTED);
        assertThat(response.usabilityStatus()).isEqualTo(UsabilityStatus.USABLE);
    }
}
