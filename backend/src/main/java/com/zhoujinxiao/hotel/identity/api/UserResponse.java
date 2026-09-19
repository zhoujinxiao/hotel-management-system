package com.zhoujinxiao.hotel.identity.api;

import com.zhoujinxiao.hotel.identity.application.HotelUserPrincipal;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public record UserResponse(Long id, String username, String displayName, List<String> roles, List<String> permissions) {
    public static UserResponse from(HotelUserPrincipal principal) {
        Set<String> authorities = principal.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
        List<String> roles = authorities.stream().filter(value -> value.startsWith("ROLE_")).map(value -> value.substring(5)).sorted().toList();
        List<String> permissions = authorities.stream().filter(value -> !value.startsWith("ROLE_")).sorted().toList();
        return new UserResponse(principal.getId(), principal.getUsername(), principal.getDisplayName(), roles, permissions);
    }
}
