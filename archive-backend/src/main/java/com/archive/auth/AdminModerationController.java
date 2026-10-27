package com.archive.auth;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.common.response.ApiResponse;
import com.archive.resource.ResourceService;
import com.archive.resource.dto.ResourceDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/moderation")
@RequiredArgsConstructor
public class AdminModerationController {

    private final ResourceService resourceService;
    private final UserRepository userRepository;

    private void requireAdminOrMod(Long userId) {
        if (userId == null) {
            throw new AccessDeniedException("Admin privileges required for moderation.");
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.MODERATOR)) {
            throw new AccessDeniedException("Admin privileges required for moderation.");
        }
    }

    @GetMapping("/pending")
    public ApiResponse<Page<ResourceDTO>> getPendingModeration(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdminOrMod(userId);
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.ok(resourceService.getPendingModerationResources(pageable));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<ResourceDTO> approveResource(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        requireAdminOrMod(userId);
        return ApiResponse.ok(resourceService.approveResource(id));
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<Map<String, String>> rejectResource(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        requireAdminOrMod(userId);
        resourceService.rejectResource(id);
        return ApiResponse.ok(Map.of("message", "Resource rejected and removed."));
    }
}
