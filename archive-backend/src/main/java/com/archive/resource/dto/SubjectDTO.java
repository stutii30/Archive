package com.archive.resource.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectDTO {
    private Long id;
    private Long creatorId;
    private String name;
    private String code;
    private String department;
    private Byte semester;
    private LocalDateTime createdAt;
}
