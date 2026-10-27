package com.archive.events.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateStageRequest {
    @NotBlank(message = "Stage title is required")
    private String title;

    private String description;

    private LocalDateTime startDt;

    private LocalDateTime endDt;
}
