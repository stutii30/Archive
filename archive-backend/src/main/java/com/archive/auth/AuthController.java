package com.archive.auth;

import com.archive.auth.dto.*;
import com.archive.auth.service.AuthService;
import com.archive.common.response.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final AuthService authService;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    // ── POST /api/auth/register ───────────────────────────────────────────────

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {

        AuthService.AuthResult result = authService.register(request);
        setRefreshCookie(response, result.rawRefreshToken());

        return ApiResponse.ok(AuthResponse.builder()
                .accessToken(result.accessToken())
                .user(result.user())
                .build());
    }

    // ── Forgot Password Endpoints ─────────────────────────────────────────────

    @PostMapping("/forgot-password/send-otp")
    public ApiResponse<String> sendForgotPasswordOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.sendForgotPasswordOtp(request);
        return ApiResponse.ok("Password reset OTP code sent to your email.");
    }

    @PostMapping("/forgot-password/reset")
    public ApiResponse<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Password reset successfully. You can now sign in with your new password.");
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthService.AuthResult result = authService.login(request);
        setRefreshCookie(response, result.rawRefreshToken());

        return ApiResponse.ok(AuthResponse.builder()
                .accessToken(result.accessToken())
                .user(result.user())
                .build());
    }

    // ── POST /api/auth/refresh ────────────────────────────────────────────────

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        String rawToken = extractRefreshCookie(request);
        AuthService.AuthResult result = authService.refresh(rawToken);
        setRefreshCookie(response, result.rawRefreshToken());

        return ApiResponse.ok(AuthResponse.builder()
                .accessToken(result.accessToken())
                .user(result.user())
                .build());
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            String rawToken = extractRefreshCookie(request);
            authService.logout(rawToken);
        } catch (Exception ignored) {
            // Ignore if refresh cookie is missing or invalid on logout
        }
        clearRefreshCookie(response);
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────

    @GetMapping("/me")
    public ApiResponse<UserDTO> me(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(authService.getMe(userId));
    }

    // ── Cookie helpers ────────────────────────────────────────────────────────

    private void setRefreshCookie(HttpServletResponse response, String rawToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, rawToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) (refreshTokenExpiryMs / 1000));
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new com.archive.auth.exception.InvalidTokenException("No refresh token cookie.");
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(() -> new com.archive.auth.exception.InvalidTokenException("Refresh token cookie missing."));
    }
}
