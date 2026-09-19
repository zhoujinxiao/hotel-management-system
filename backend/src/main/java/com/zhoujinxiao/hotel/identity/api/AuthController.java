package com.zhoujinxiao.hotel.identity.api;

import com.zhoujinxiao.hotel.identity.application.AuthenticationApplicationService;
import com.zhoujinxiao.hotel.identity.application.HotelUserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthenticationApplicationService authenticationService;

    public AuthController(AuthenticationApplicationService authenticationService) { this.authenticationService = authenticationService; }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        return authenticationService.login(request, servletRequest, servletResponse);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return UserResponse.from((HotelUserPrincipal) authentication.getPrincipal());
    }
}
