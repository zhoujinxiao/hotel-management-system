package com.zhoujinxiao.hotel.common.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(String encryptionKey) {
}
