package com.archive.auth.dto;

import com.archive.auth.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserDTO {

    private Long id;
    private String name;
    private String email;
    private String college;
    private String degree;
    private String department;
    private Byte year;
    private String avatarUrl;
    private String role;
    private Instant createdAt;

    public static UserDTO from(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .college(user.getCollege())
                .degree(user.getDegree())
                .department(user.getDepartment())
                .year(user.getYear())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
