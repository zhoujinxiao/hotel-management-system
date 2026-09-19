package com.zhoujinxiao.hotel.guest.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Locale;

@Entity
@Table(name = "guest")
public class Guest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "phone_encrypted", nullable = false, length = 512)
    private byte[] phoneEncrypted;

    @Column(name = "phone_last4", nullable = false, length = 4)
    private String phoneLast4;

    @Column(name = "id_type", length = 30)
    private String idType;

    @Column(name = "id_number_encrypted", length = 768)
    private byte[] idNumberEncrypted;

    @Column(name = "id_number_hash", length = 64)
    private String idNumberHash;

    @Column(length = 80)
    private String city;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Guest() {}

    public static Guest create(String name, byte[] phoneEncrypted, String phoneLast4, String city, String notes) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("宾客姓名不能为空");
        if (phoneEncrypted == null || phoneEncrypted.length == 0) throw new IllegalArgumentException("手机号不能为空");
        if (phoneLast4 == null || phoneLast4.length() != 4) throw new IllegalArgumentException("手机号后四位不能为空");
        Guest guest = new Guest();
        guest.name = name.trim();
        guest.phoneEncrypted = phoneEncrypted.clone();
        guest.phoneLast4 = phoneLast4;
        guest.city = city == null ? null : city.trim();
        guest.notes = notes == null ? null : notes.trim();
        return guest;
    }

    public static String lastFour(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (digits.length() < 4) throw new IllegalArgumentException("手机号至少需要四位数字");
        return digits.substring(digits.length() - 4);
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public byte[] getPhoneEncrypted() { return phoneEncrypted.clone(); }
    public String getPhoneLast4() { return phoneLast4; }
    public String getIdType() { return idType; }
    public String getCity() { return city; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
