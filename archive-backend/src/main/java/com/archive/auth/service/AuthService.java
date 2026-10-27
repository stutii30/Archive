package com.archive.auth.service;

import com.archive.auth.dto.*;
import com.archive.auth.entity.RefreshToken;
import com.archive.auth.entity.User;
import com.archive.auth.entity.VerificationCode;
import com.archive.auth.exception.InvalidTokenException;
import com.archive.auth.repository.RefreshTokenRepository;
import com.archive.auth.repository.UserRepository;
import com.archive.auth.repository.VerificationCodeRepository;
import com.archive.common.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    private static final SecureRandom RANDOM = new SecureRandom();

    // ── Register ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResult register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email is already registered.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .college(request.getCollege())
                .degree(request.getDegree())
                .department(request.getDepartment())
                .year(request.getYear())
                .role(User.Role.STUDENT)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {} (id={})", user.getEmail(), user.getId());
        return issueTokens(user);
    }

    // ── Forgot Password OTP ───────────────────────────────────────────────────

    @Transactional
    public void sendForgotPasswordOtp(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with email " + request.getEmail()));

        String code = generate6DigitCode();
        VerificationCode vc = VerificationCode.builder()
                .email(email)
                .code(code)
                .purpose(VerificationCode.Purpose.FORGOT_PASSWORD)
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .used(false)
                .build();

        verificationCodeRepository.save(vc);

        String subject = "Archive - Password Reset Request";
        String html = "<div style='font-family: sans-serif; padding: 20px; color: #1e293b;'>" +
                "<h2>Password Reset Request</h2>" +
                "<p>Hi " + user.getName() + ",</p>" +
                "<p>Use the 6-digit code below to reset your Archive account password:</p>" +
                "<div style='background-color: #f1f5f9; font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 16px; border-radius: 8px; display: inline-block; color: #ef4444; margin: 12px 0;'>" +
                code + "</div>" +
                "<p>This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>" +
                "<p>Best regards,<br>The Archive Team</p>" +
                "</div>";

        emailService.sendEmail(email, subject, html);
        log.info("Sent password reset OTP to {}", email);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with email " + request.getEmail()));

        VerificationCode code = verificationCodeRepository.findLatestValidCode(
                email, VerificationCode.Purpose.FORGOT_PASSWORD, request.getOtp().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP code. Please request a new code."));

        if (!code.isValid()) {
            throw new IllegalArgumentException("Reset code has expired or already been used.");
        }

        code.setUsed(true);
        verificationCodeRepository.save(code);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Revoke active refresh tokens for security
        refreshTokenRepository.deleteByUserId(user.getId());
        log.info("Password successfully reset for user {}", email);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResult login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Account does not exist. Please register first."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Incorrect password. Please try again.");
        }

        return issueTokens(user);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        String hash = sha256Hex(rawRefreshToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found."));

        if (!stored.isValid()) {
            throw new InvalidTokenException("Refresh token is expired or revoked.");
        }

        // Rotate — revoke old, issue new
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(stored.getUser());
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;
        String hash = sha256Hex(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    // ── Get current user ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDTO getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found."));
        return UserDTO.from(user);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private AuthResult issueTokens(User user) {
        String rawRefreshToken = jwtService.generateRawRefreshToken();
        String hash = sha256Hex(rawRefreshToken);

        RefreshToken rt = RefreshToken.builder()
                .tokenHash(hash)
                .user(user)
                .expiresAt(Instant.now().plusMillis(refreshTokenExpiryMs))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);

        String accessToken = jwtService.generateAccessToken(user);
        return new AuthResult(accessToken, rawRefreshToken, UserDTO.from(user));
    }

    private static String sha256Hex(String input) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String generate6DigitCode() {
        int number = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(number);
    }

    /** Value object holding the three outputs of a successful auth event. */
    public record AuthResult(String accessToken, String rawRefreshToken, UserDTO user) {}
}
