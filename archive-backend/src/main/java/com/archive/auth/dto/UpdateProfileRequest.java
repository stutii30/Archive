package com.archive.auth.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String college;
    private String degree;
    private String department;
    private Byte year;
    private String avatarUrl;
}
