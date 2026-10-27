package com.archive.auth.service;

import com.archive.auth.dto.UpdateProfileRequest;
import com.archive.auth.dto.UserProfileResponse;
import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.community.repository.PostBookmarkRepository;
import com.archive.community.repository.PostRepository;
import com.archive.resource.repository.ResourceBookmarkRepository;
import com.archive.resource.repository.ResourceRepository;
import com.archive.storage.StorageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.archive.auth.repository.RefreshTokenRepository;
import com.archive.community.repository.PostUpvoteRepository;
import com.archive.community.repository.ReplyRepository;
import com.archive.events.repository.EventRepository;
import com.archive.events.repository.EventSaveRepository;
import com.archive.notification.repository.NotificationRepository;
import com.archive.resource.repository.ResourceReviewRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final PostRepository postRepository;
    private final ResourceBookmarkRepository resourceBookmarkRepository;
    private final PostBookmarkRepository postBookmarkRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EventSaveRepository eventSaveRepository;
    private final PostUpvoteRepository postUpvoteRepository;
    private final NotificationRepository notificationRepository;
    private final ResourceReviewRepository resourceReviewRepository;
    private final ReplyRepository replyRepository;
    private final EventRepository eventRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        long uploadCount = resourceRepository.countByUploaderIdAndIsDeletedFalse(id);
        long postCount = postRepository.countByAuthorIdAndIsDeletedFalse(id);
        long totalDownloads = resourceRepository.sumDownloadsByUploaderId(id);
        long rBookmarks = resourceBookmarkRepository.countByIdUserId(id);
        long pBookmarks = postBookmarkRepository.countByIdUserId(id);

        return UserProfileResponse.from(user, uploadCount, postCount, totalDownloads, rBookmarks, pBookmarks);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getCollege() != null) user.setCollege(request.getCollege().trim());
        if (request.getDegree() != null) user.setDegree(request.getDegree().trim());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment().trim());
        if (request.getYear() != null) user.setYear(request.getYear());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl().trim());

        userRepository.save(user);
        return getUserProfile(userId);
    }

    @Transactional
    public String uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        String objectKey = storageService.uploadFile(file, "avatars");
        String presignedUrl = storageService.presignedDownloadUrl(objectKey);

        user.setAvatarUrl(presignedUrl);
        userRepository.save(user);
        return presignedUrl;
    }

    @Transactional
    public void deleteAccount(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found");
        }

        refreshTokenRepository.deleteByUserId(userId);
        notificationRepository.deleteByUserId(userId);
        resourceBookmarkRepository.deleteByUserId(userId);
        postBookmarkRepository.deleteByUserId(userId);
        eventSaveRepository.deleteByUserId(userId);
        postUpvoteRepository.deleteByUserId(userId);
        resourceReviewRepository.deleteByUserId(userId);
        replyRepository.deleteByAuthorId(userId);
        postRepository.deleteByAuthorId(userId);
        resourceRepository.deleteByUploaderId(userId);
        eventRepository.deleteByCreatorId(userId);

        userRepository.deleteById(userId);
    }
}
