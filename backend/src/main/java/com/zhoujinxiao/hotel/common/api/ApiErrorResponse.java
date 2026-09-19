package com.zhoujinxiao.hotel.common.api;

import java.time.Instant;
import java.util.Map;

public record ApiErrorResponse(String code, String message, Instant timestamp, Map<String, String> fields) {
    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(code, message, Instant.now(), Map.of());
    }
}
