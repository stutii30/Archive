package com.archive.resource.dto;

import com.archive.resource.entity.Resource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResourceMetadataRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 300)
    private String title;

    @Size(max = 5000)
    private String description;

    private Resource.ResourceType type = Resource.ResourceType.OTHER;

    @NotBlank(message = "Subject is required")
    @Size(max = 150)
    private String subject;

    @Size(max = 100)
    private String degree;

    @Size(max = 100)
    private String department;

    @jakarta.validation.constraints.NotNull(message = "Semester is required")
    private Byte semester;

    @Size(max = 200)
    private String chapter;
}
