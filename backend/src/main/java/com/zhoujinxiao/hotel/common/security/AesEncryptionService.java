package com.zhoujinxiao.hotel.common.security;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AesEncryptionService {
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SecretKeySpec key;

    public AesEncryptionService(SecurityProperties properties) {
        this.key = buildKey(properties.encryptionKey());
    }

    public byte[] encrypt(String plaintext) {
        if (plaintext == null) return null;
        ensureConfigured();
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            byte[] result = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, result, 0, iv.length);
            System.arraycopy(ciphertext, 0, result, iv.length, ciphertext.length);
            return result;
        } catch (Exception exception) {
            throw new IllegalStateException("敏感数据加密失败", exception);
        }
    }

    public String decrypt(byte[] encrypted) {
        if (encrypted == null) return null;
        ensureConfigured();
        try {
            byte[] iv = java.util.Arrays.copyOfRange(encrypted, 0, IV_LENGTH);
            byte[] ciphertext = java.util.Arrays.copyOfRange(encrypted, IV_LENGTH, encrypted.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(ciphertext), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("敏感数据解密失败", exception);
        }
    }

    private void ensureConfigured() {
        if (key == null) throw new IllegalStateException("APP_ENCRYPTION_KEY 未配置");
    }

    private SecretKeySpec buildKey(String value) {
        if (value == null || value.isBlank()) return null;
        byte[] decoded = Base64.getDecoder().decode(value);
        if (decoded.length != 32) throw new IllegalStateException("APP_ENCRYPTION_KEY 必须是 32 字节 Base64 密钥");
        return new SecretKeySpec(decoded, "AES");
    }
}
