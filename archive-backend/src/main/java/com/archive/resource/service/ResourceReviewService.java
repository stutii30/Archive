package com.archive.resource.service;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.resource.dto.CreateReviewRequest;
import com.archive.resource.dto.ResourceReviewDTO;
import com.archive.resource.entity.Resource;
import com.archive.resource.entity.ResourceReview;
import com.archive.resource.repository.ResourceRepository;
import com.archive.resource.repository.ResourceReviewRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResourceReviewService {

    private final ResourceReviewRepository reviewRepo;
    private final ResourceRepository resourceRepo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public Page<ResourceReviewDTO> getReviews(Long resourceId, Pageable pageable) {
        return reviewRepo.findByResourceIdOrderByCreatedAtDesc(resourceId, pageable)
                .map(ResourceReviewDTO::from);
    }

    @Transactional
    public ResourceReviewDTO addOrUpdateReview(Long resourceId, CreateReviewRequest req, Long userId) {
        Resource resource = resourceRepo.findById(resourceId)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found: " + resourceId));
        if (resource.getIsDeleted()) {
            throw new EntityNotFoundException("Resource not found: " + resourceId);
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        ResourceReview review = reviewRepo.findByResourceIdAndUserId(resourceId, userId)
                .orElseGet(() -> ResourceReview.builder()
                        .resource(resource)
                        .user(user)
                        .build());

        review.setRating(req.getRating());
        review.setComment(req.getComment() != null ? req.getComment().trim() : null);

        return ResourceReviewDTO.from(reviewRepo.save(review));
    }

    @Transactional
    public void deleteReview(Long resourceId, Long reviewId, Long userId, User.Role role) {
        ResourceReview review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found: " + reviewId));

        if (!review.getResource().getId().equals(resourceId)) {
            throw new IllegalArgumentException("Review does not belong to resource: " + resourceId);
        }

        boolean isAuthor = review.getUser().getId().equals(userId);
        boolean isMod = role == User.Role.MODERATOR || role == User.Role.ADMIN;

        if (!isAuthor && !isMod) {
            throw new AccessDeniedException("Not authorized to delete this review.");
        }

        reviewRepo.delete(review);
    }
}
