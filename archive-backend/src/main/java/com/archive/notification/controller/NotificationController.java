package com.archive.notification.controller;

import com.archive.common.response.ApiResponse;
import com.archive.notification.dto.NotificationDto;
import com.archive.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<NotificationDto>> getUserNotifications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        return ApiResponse.ok(notificationService.getUserNotifications(userId, pageable));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal Long userId) {
        long count = notificationService.getUnreadCount(userId);
        return ApiResponse.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationDto> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(notificationService.markAsRead(id, userId));
    }

    @PostMapping("/read-all")
    public ApiResponse<Map<String, Integer>> markAllAsRead(@AuthenticationPrincipal Long userId) {
        int updatedCount = notificationService.markAllAsRead(userId);
        return ApiResponse.ok(Map.of("updated", updatedCount));
    }
}
