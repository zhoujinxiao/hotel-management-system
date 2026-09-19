package com.zhoujinxiao.hotel.identity.application;

import com.zhoujinxiao.hotel.identity.domain.AppUser;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.Set;

public class HotelUserPrincipal implements UserDetails {
    private final Long id;
    private final String username;
    private final String password;
    private final String displayName;
    private final boolean enabled;
    private final Instant lockedUntil;
    private final Set<GrantedAuthority> authorities;

    public HotelUserPrincipal(Long id, String username, String password, String displayName, boolean enabled, Instant lockedUntil, Set<GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.displayName = displayName;
        this.enabled = enabled;
        this.lockedUntil = lockedUntil;
        this.authorities = Set.copyOf(authorities);
    }

    public static HotelUserPrincipal from(AppUser user) {
        Set<GrantedAuthority> authorities = new java.util.HashSet<>();
        user.getRoles().forEach(role -> {
            authorities.add(() -> "ROLE_" + role.getCode());
            role.getPermissions().forEach(permission -> authorities.add(() -> permission.getCode()));
        });
        return new HotelUserPrincipal(user.getId(), user.getUsername(), user.getPasswordHash(), user.getDisplayName(), user.isActive(), user.getLockedUntil(), authorities);
    }

    public Long getId() { return id; }
    public String getDisplayName() { return displayName; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return lockedUntil == null || lockedUntil.isBefore(Instant.now()); }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return enabled; }
}
