package com.zhoujinxiao.hotel.audit.application;

import com.zhoujinxiao.hotel.audit.domain.AuditLog;
import com.zhoujinxiao.hotel.audit.infrastructure.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) { this.repository = repository; }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Long actorUserId, String action, String targetType, String targetId, String detailsJson, String reason, String ipAddress) {
        repository.save(AuditLog.record(actorUserId, action, targetType, targetId, detailsJson, reason, ipAddress));
    }
}
