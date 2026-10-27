package com.archive.auth.service;

import com.archive.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Handles JWT access token generation and validation.
 * Refresh tokens are random UUIDs — this service does NOT deal with them.
 */
@Slf4j
@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long accessTokenExpiryMs;

    public JwtService(
            @Value("${jwt.secret:devSecretKeyMustBeAtLeast64CharactersLongForHS512AlgorithmToWork!!}") String secret,
            @Value("${jwt.access-token-expiry-ms:900000}") long accessTokenExpiryMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiryMs = accessTokenExpiryMs;
    }

    /** Generate a signed JWT access token for the given user. */
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpiryMs)))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Generate a cryptographically random raw refresh token (UUID v4).
     * The caller is responsible for hashing it before storing in DB.
     */
    public String generateRawRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Validate a JWT and return the subject (userId as String).
     * Throws {@link JwtException} on any validation failure.
     */
    public String extractUserId(String token) {
        return parseClaims(token).getSubject();
    }

    /** Returns true if the token is valid (not expired, correctly signed). */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
