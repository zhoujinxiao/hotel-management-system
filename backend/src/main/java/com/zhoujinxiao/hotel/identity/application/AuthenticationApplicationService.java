package com.zhoujinxiao.hotel.identity.application;

import com.zhoujinxiao.hotel.audit.application.AuditService;
import com.zhoujinxiao.hotel.common.api.BusinessException;
import com.zhoujinxiao.hotel.identity.api.LoginRequest;
import com.zhoujinxiao.hotel.identity.api.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationApplicationService {
    private static final Logger log = LoggerFactory.getLogger(AuthenticationApplicationService.class);

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final AuditService auditService;

    public AuthenticationApplicationService(AuthenticationManager authenticationManager, SecurityContextRepository securityContextRepository, AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.auditService = auditService;
    }

    @Transactional
    public UserResponse login(LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (AuthenticationException exception) {
            log.warn("Authentication failed for user '{}': {}", request.username(), exception.getClass().getSimpleName());
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "用户名或密码错误");
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, servletRequest, servletResponse);
        HotelUserPrincipal principal = (HotelUserPrincipal) authentication.getPrincipal();
        auditService.record(principal.getId(), "AUTH_LOGIN", "APP_USER", String.valueOf(principal.getId()), null, null, servletRequest.getRemoteAddr());
        return UserResponse.from(principal);
    }
}
