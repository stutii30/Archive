package com.archive.auth;

import com.archive.auth.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads the Authorization header, validates the JWT, and populates the
 * SecurityContext with a {@link UsernamePasswordAuthenticationToken}.
 *
 * The principal is set to the {@code Long} userId so controllers can use
 * {@code @AuthenticationPrincipal Long userId} directly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtService.isTokenValid(token)) {
                try {
                    Long userId = Long.parseLong(jwtService.extractUserId(token));
                    // Set userId as principal; Spring Security checks roles separately
                    var auth = new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_AUTHENTICATED"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (NumberFormatException e) {
                    log.warn("JWT subject is not a valid user id");
                }
            }
        }

        chain.doFilter(request, response);
    }
}
