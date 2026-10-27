package com.archive.resource;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.common.response.ApiResponse;
import com.archive.resource.dto.CreateReviewRequest;
import com.archive.resource.dto.ResourceReviewDTO;
import com.archive.resource.service.ResourceReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resources/{resourceId}/reviews")
@RequiredArgsConstructor
public class ResourceReviewController {

    private final ResourceReviewService reviewService;
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<Page<ResourceReviewDTO>> getReviews(
            @PathVariable Long resourceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.ok(reviewService.getReviews(resourceId, pageable));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ResourceReviewDTO> addOrUpdateReview(
            @PathVariable Long resourceId,
            @Valid @RequestBody CreateReviewRequest req,
            @AuthenticationPrincipal Long userId) {

        return ApiResponse.ok(reviewService.addOrUpdateReview(resourceId, req, userId));
    }

    @DeleteMapping("/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(
            @PathVariable Long resourceId,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
        reviewService.deleteReview(resourceId, reviewId, userId, user.getRole());
    }
}
