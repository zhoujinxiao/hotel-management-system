package com.zhoujinxiao.hotel.identity.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Entity
@Table(name = "app_user")
public class AppUser {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    protected AppUser() {}

    public static AppUser create(String username, String passwordHash, String displayName, Set<Role> roles) {
        if (username == null || username.isBlank()) throw new IllegalArgumentException("用户名不能为空");
        if (passwordHash == null || passwordHash.isBlank()) throw new IllegalArgumentException("密码哈希不能为空");
        if (displayName == null || displayName.isBlank()) throw new IllegalArgumentException("显示名称不能为空");
        if (roles == null || roles.isEmpty()) throw new IllegalArgumentException("用户至少需要一个角色");
        AppUser user = new AppUser();
        user.username = username.trim().toLowerCase(Locale.ROOT);
        user.passwordHash = passwordHash;
        user.displayName = displayName.trim();
        user.roles.addAll(roles);
        return user;
    }

    public void disable() { this.active = false; }
    public void registerSuccessfulLogin() { this.failedLoginAttempts = 0; this.lockedUntil = null; }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getDisplayName() { return displayName; }
    public boolean isActive() { return active; }
    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public Instant getLockedUntil() { return lockedUntil; }
    public Set<Role> getRoles() { return roles; }
}
