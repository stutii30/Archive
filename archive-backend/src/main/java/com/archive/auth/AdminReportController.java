package com.archive.auth;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.common.response.ApiResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminReportController {

    private final UserRepository userRepository;

    @GetMapping("/reports")
    public ApiResponse<Page<ReportDto>> getReports(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getRole() != User.Role.MODERATOR && user.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Only moderators and admins can access reports.");
        }

        // Return empty paginated queue (or mock queue ready for flagged item persistence)
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        return ApiResponse.ok(new PageImpl<>(Collections.emptyList(), pageable, 0));
    }

    @Getter
    @Builder
    public static class ReportDto {
        private Long id;
        private String contentType; // 'RESOURCE' | 'POST' | 'REPLY'
        private Long contentId;
        private String reason;
        private Long reporterId;
        private Instant createdAt;
    }
}
