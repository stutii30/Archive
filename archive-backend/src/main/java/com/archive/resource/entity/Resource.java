package com.archive.resource.entity;

import com.archive.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResourceType type = ResourceType.OTHER;

    @Column(length = 150)
    private String subject;

    @Column(length = 100)
    private String degree;

    @Column(length = 100)
    private String department;

    private Byte semester;

    @Column(length = 200)
    private String chapter;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    /** Object key in MinIO — used to generate presigned URLs. */
    @Column(name = "file_key", nullable = false, length = 500)
    private String fileKey;

    /** e.g. pdf, docx, pptx, jpg */
    @Column(name = "file_type", length = 20)
    private String fileType;

    @Column(name = "file_size_kb")
    private Integer fileSizeKb;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "bookmark_count", nullable = false)
    @Builder.Default
    private Integer bookmarkCount = 0;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "trending_score", nullable = false)
    @Builder.Default
    private Double trendingScore = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.APPROVED;

    @Column(name = "moderation_flag", length = 100)
    private String moderationFlag;

    @Column(name = "ai_notice", length = 500)
    private String aiNotice;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum ResourceType {
        NOTES, PYQ, DSA, QA, LAB_MANUAL, PLACEMENT, OTHER
    }

    public enum Status {
        APPROVED, PENDING_REVIEW, REJECTED
    }
}
