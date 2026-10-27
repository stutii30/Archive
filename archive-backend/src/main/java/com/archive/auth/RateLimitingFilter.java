package com.archive.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class RateLimitingFilter implements Filter {

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long TIME_WINDOW_MS = 60_000;

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        if (isRateLimitedPath(path)) {
            String clientIp = getClientIp(req);
            long now = System.currentTimeMillis();

            RequestCounter counter = requestCounts.compute(clientIp, (ip, current) -> {
                if (current == null || (now - current.startTime) > TIME_WINDOW_MS) {
                    return new RequestCounter(now, new AtomicInteger(1));
                }
                current.count.incrementAndGet();
                return current;
            });

            if (counter.count.get() > MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
                res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                res.setContentType("application/json");
                res.getWriter().write("{\"success\":false,\"data\":null,\"error\":\"Too many requests. Please try again in a minute.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isRateLimitedPath(String path) {
        return path != null && (path.endsWith("/api/auth/login") || path.endsWith("/api/auth/register"));
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RequestCounter {
        final long startTime;
        final AtomicInteger count;

        RequestCounter(long startTime, AtomicInteger count) {
            this.startTime = startTime;
            this.count = count;
        }
    }
}
