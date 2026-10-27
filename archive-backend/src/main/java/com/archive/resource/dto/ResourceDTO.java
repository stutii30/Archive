package com.archive.resource.dto;

import com.archive.auth.dto.UserDTO;
import com.archive.resource.entity.Resource;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * Full resource projection — used on detail page and after upload.
 */
@Data
@Builder
public class ResourceDTO {

    private Long id;
    private String title;
    private String description;
    private String type;
    private String subject;
    private String degree;
    private String department;
    private Byte semester;
    private String chapter;
    private String fileType;
    private Integer fileSizeKb;
    private Integer downloadCount;
    private Integer bookmarkCount;
    private Instant createdAt;

    /** Uploader info (never includes passwordHash). */
    private UserDTO uploader;

    /** Present only when returned from the download endpoint — not stored. */
    private String downloadUrl;

    /** Whether the requesting user has bookmarked this resource. */
    private boolean bookmarked;

    private Double averageRating;
    private Integer reviewCount;

    private String status;
    private String moderationFlag;
    private String aiNotice;

    public static ResourceDTO from(Resource r, UserDTO uploader) {
        return ResourceDTO.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .type(r.getType().name())
                .subject(r.getSubject())
                .degree(r.getDegree())
                .department(r.getDepartment())
                .semester(r.getSemester())
                .chapter(r.getChapter())
                .fileType(r.getFileType())
                .fileSizeKb(r.getFileSizeKb())
                .downloadCount(r.getDownloadCount())
                .bookmarkCount(r.getBookmarkCount())
                .createdAt(r.getCreatedAt())
                .uploader(uploader)
                .status(r.getStatus() != null ? r.getStatus().name() : Resource.Status.APPROVED.name())
                .moderationFlag(r.getModerationFlag())
                .aiNotice(r.getAiNotice())
                .build();
    }
}
