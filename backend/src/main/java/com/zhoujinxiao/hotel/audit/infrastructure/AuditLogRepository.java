package com.zhoujinxiao.hotel.audit.infrastructure;

import com.zhoujinxiao.hotel.audit.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
