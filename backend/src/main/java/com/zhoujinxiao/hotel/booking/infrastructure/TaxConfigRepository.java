package com.zhoujinxiao.hotel.booking.infrastructure;

import com.zhoujinxiao.hotel.booking.domain.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface TaxConfigRepository extends JpaRepository<TaxConfig, Long> {
    Optional<TaxConfig> findFirstByActiveTrueAndEffectiveFromLessThanEqualOrderByEffectiveFromDesc(LocalDate date);
}
