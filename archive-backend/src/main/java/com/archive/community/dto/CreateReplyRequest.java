package com.archive.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateReplyRequest {
    @NotBlank @Size(max = 5000)
    private String body;

    /** null = top-level; set for nested reply (one level only). */
    private Long parentReplyId;
}
