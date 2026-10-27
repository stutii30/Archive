package com.archive.auth;

import com.archive.auth.entity.User;
import com.archive.auth.service.JwtService;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    // 64-char secret (min for HS512)
    private static final String SECRET =
            "testSecretKeyForUnitTestsMustBeAtLeast64CharsLongToBeValidHS512!";
    private static final long EXPIRY_MS = 900_000L; // 15 min

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRY_MS);
    }

    @Test
    @DisplayName("Generated access token is valid and contains correct userId")
    void generateAndValidate() {
        User user = User.builder()
                .id(42L)
                .email("test@archive.dev")
                .role(User.Role.STUDENT)
                .build();

        String token = jwtService.generateAccessToken(user);

        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo("42");
    }

    @Test
    @DisplayName("Tampered token fails validation")
    void tamperedToken() {
        User user = User.builder().id(1L).email("x@x.com").role(User.Role.STUDENT).build();
        String token = jwtService.generateAccessToken(user);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    @DisplayName("Expired token fails validation")
    void expiredToken() {
        JwtService shortLived = new JwtService(SECRET, 1L); // 1 ms expiry
        User user = User.builder().id(1L).email("x@x.com").role(User.Role.STUDENT).build();
        String token = shortLived.generateAccessToken(user);

        // Sleep just to be safe — 1ms is already in the past by the time we call this
        assertThatThrownBy(() -> shortLived.extractUserId(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("Raw refresh token is 128 hex chars (64 bytes)")
    void refreshTokenLength() {
        String raw = jwtService.generateRawRefreshToken();
        assertThat(raw).hasSize(128);
        assertThat(raw).matches("[0-9a-f]+");
    }
}
