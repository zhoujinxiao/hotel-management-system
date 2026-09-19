package com.zhoujinxiao.hotel.identity.infrastructure;

import com.zhoujinxiao.hotel.identity.domain.AppUser;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    boolean existsByUsernameIgnoreCase(String username);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    @Query("select distinct u from AppUser u where lower(u.username) = lower(:username)")
    Optional<AppUser> findForAuthentication(@Param("username") String username);
}
