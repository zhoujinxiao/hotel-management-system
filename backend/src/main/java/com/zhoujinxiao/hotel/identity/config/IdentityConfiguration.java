package com.zhoujinxiao.hotel.identity.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(IdentityBootstrapProperties.class)
public class IdentityConfiguration {
}
