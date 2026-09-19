package com.zhoujinxiao.hotel.identity.application;

import com.zhoujinxiao.hotel.identity.domain.AppUser;
import com.zhoujinxiao.hotel.identity.domain.Permission;
import com.zhoujinxiao.hotel.identity.domain.Role;
import com.zhoujinxiao.hotel.identity.infrastructure.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HotelUserDetailsServiceTest {

    @Mock
    private AppUserRepository repository;

    @Test
    void loadsRolesAndPermissions() {
        Permission permission = mock(Permission.class);
        when(permission.getCode()).thenReturn("ROOM_READ");
        Role role = mock(Role.class);
        when(role.getCode()).thenReturn("FRONT_DESK");
        when(role.getPermissions()).thenReturn(Set.of(permission));
        AppUser user = AppUser.create("frontdesk", "hash", "前台值班", Set.of(role));
        when(repository.findForAuthentication("frontdesk")).thenReturn(Optional.of(user));

        UserDetails details = new HotelUserDetailsService(repository).loadUserByUsername("frontdesk");

        assertThat(details.getUsername()).isEqualTo("frontdesk");
        assertThat(details.getAuthorities()).extracting("authority").contains("ROLE_FRONT_DESK", "ROOM_READ");
    }

    @Test
    void rejectsUnknownUser() {
        when(repository.findForAuthentication("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> new HotelUserDetailsService(repository).loadUserByUsername("missing"))
                .hasMessage("用户名或密码错误");
    }
}
