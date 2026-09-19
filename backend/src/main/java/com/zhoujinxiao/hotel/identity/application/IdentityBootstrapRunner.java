package com.zhoujinxiao.hotel.identity.application;

import com.zhoujinxiao.hotel.identity.config.IdentityBootstrapProperties;
import com.zhoujinxiao.hotel.identity.domain.AppUser;
import com.zhoujinxiao.hotel.identity.domain.Role;
import com.zhoujinxiao.hotel.identity.infrastructure.AppUserRepository;
import com.zhoujinxiao.hotel.identity.infrastructure.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class IdentityBootstrapRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(IdentityBootstrapRunner.class);

    private final IdentityBootstrapProperties properties;
    private final AppUserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public IdentityBootstrapRunner(IdentityBootstrapProperties properties, AppUserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) return;
        if (!properties.configured()) {
            log.warn("No application users exist. Set APP_ADMIN_USERNAME and APP_ADMIN_PASSWORD to bootstrap the first administrator.");
            return;
        }
        Role adminRole = roleRepository.findByCodeIn(Set.of("ADMIN")).stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("ADMIN role is missing; run Flyway migrations first"));
        String displayName = properties.displayName() == null || properties.displayName().isBlank() ? "系统管理员" : properties.displayName();
        AppUser user = AppUser.create(properties.username(), passwordEncoder.encode(properties.password()), displayName, Set.of(adminRole));
        userRepository.save(user);
        log.info("Bootstrapped administrator account '{}'", user.getUsername());
    }
}
