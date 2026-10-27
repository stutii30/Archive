package com.archive.auth.dto;

import com.archive.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String college;
    private String degree;
    private String department;
    private Byte year;
    private String avatarUrl;
    private User.Role role;
    private Instant createdAt;

    // Contribution Statistics
    private long uploadCount;
    private long postCount;
    private long totalDownloadsReceived;
    private long resourceBookmarkCount;
    private long postBookmarkCount;

    public static UserProfileResponse from(User user, long uploadCount, long postCount, long totalDownloads, long rBookmarks, long pBookmarks) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .college(user.getCollege())
                .degree(user.getDegree())
                .department(user.getDepartment())
                .year(user.getYear())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .uploadCount(uploadCount)
                .postCount(postCount)
                .totalDownloadsReceived(totalDownloads)
                .resourceBookmarkCount(rBookmarks)
                .postBookmarkCount(pBookmarks)
                .build();
    }
}
