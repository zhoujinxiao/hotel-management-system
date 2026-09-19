package com.zhoujinxiao.hotel.audit.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(name = "target_type", length = 80)
    private String targetType;

    @Column(name = "target_id", length = 80)
    private String targetId;

    @Column(name = "details_json", columnDefinition = "json")
    private String detailsJson;

    @Column(length = 500)
    private String reason;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected AuditLog() {}

    public static AuditLog record(Long actorUserId, String action, String targetType, String targetId, String detailsJson, String reason, String ipAddress) {
        AuditLog log = new AuditLog();
        log.actorUserId = actorUserId;
        log.action = action;
        log.targetType = targetType;
        log.targetId = targetId;
        log.detailsJson = detailsJson;
        log.reason = reason;
        log.ipAddress = ipAddress;
        return log;
    }

    public Long getId() { return id; }
    public Long getActorUserId() { return actorUserId; }
    public String getAction() { return action; }
    public String getTargetType() { return targetType; }
    public String getTargetId() { return targetId; }
    public String getDetailsJson() { return detailsJson; }
    public String getReason() { return reason; }
    public String getIpAddress() { return ipAddress; }
    public Instant getOccurredAt() { return occurredAt; }
}
