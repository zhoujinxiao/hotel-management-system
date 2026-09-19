package com.zhoujinxiao.hotel.identity.infrastructure;

import com.zhoujinxiao.hotel.identity.domain.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
}
