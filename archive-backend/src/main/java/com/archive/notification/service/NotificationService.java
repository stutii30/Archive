package com.archive.notification.service;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.notification.dto.NotificationDto;
import com.archive.notification.entity.Notification;
import com.archive.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationDto notify(Long userId, String type, String title, String body, String link) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return NotificationDto.fromEntity(saved);
    }

    private Long resolveUserId(Long userId) {
        if (userId != null) return userId;
        return userRepository.findAll().stream().findFirst().map(User::getId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(Long userId, Pageable pageable) {
        Long targetUserId = resolveUserId(userId);
        if (targetUserId == null) return Page.empty();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(targetUserId, pageable)
                .map(NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        Long targetUserId = resolveUserId(userId);
        if (targetUserId == null) return 0L;
        return notificationRepository.countByUserIdAndReadFalse(targetUserId);
    }

    @Transactional
    public NotificationDto markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + notificationId));

        Long targetUserId = resolveUserId(userId);
        if (targetUserId == null || !notification.getUser().getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Unauthorized action for notification id: " + notificationId);
        }

        notification.setRead(true);
        return NotificationDto.fromEntity(notificationRepository.save(notification));
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        Long targetUserId = resolveUserId(userId);
        if (targetUserId == null) return 0;
        return notificationRepository.markAllReadByUserId(targetUserId);
    }
}
