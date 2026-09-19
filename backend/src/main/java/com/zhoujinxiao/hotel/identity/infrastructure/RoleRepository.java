package com.zhoujinxiao.hotel.identity.infrastructure;

import com.zhoujinxiao.hotel.identity.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findByCodeIn(Collection<String> codes);
}
