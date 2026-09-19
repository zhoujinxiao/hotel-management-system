package com.zhoujinxiao.hotel.identity.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.identity.bootstrap-admin")
public record IdentityBootstrapProperties(String username, String password, String displayName) {
    public boolean configured() {
        return username != null && !username.isBlank() && password != null && !password.isBlank();
    }
}
