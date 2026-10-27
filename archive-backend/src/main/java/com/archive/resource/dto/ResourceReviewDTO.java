package com.archive.resource.dto;

import com.archive.auth.dto.UserDTO;
import com.archive.resource.entity.ResourceReview;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceReviewDTO {
    private Long id;
    private Long resourceId;
    private UserDTO user;
    private Integer rating;
    private String comment;
    private Instant createdAt;

    public static ResourceReviewDTO from(ResourceReview review) {
        if (review == null) return null;
        return ResourceReviewDTO.builder()
                .id(review.getId())
                .resourceId(review.getResource() != null ? review.getResource().getId() : null)
                .user(UserDTO.from(review.getUser()))
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
