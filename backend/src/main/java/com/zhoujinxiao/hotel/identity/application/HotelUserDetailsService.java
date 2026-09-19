package com.zhoujinxiao.hotel.identity.application;

import com.zhoujinxiao.hotel.identity.infrastructure.AppUserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HotelUserDetailsService implements UserDetailsService {
    private final AppUserRepository repository;

    public HotelUserDetailsService(AppUserRepository repository) { this.repository = repository; }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return repository.findForAuthentication(username)
                .map(HotelUserPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("用户名或密码错误"));
    }
}
