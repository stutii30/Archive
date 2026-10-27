package com.archive.community.entity;

import com.archive.auth.entity.User;
import com.archive.resource.entity.Resource;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PostType type = PostType.DOUBT;

    @Column(nullable = false, length = 400)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_resource_id")
    private Resource linkedResource;

    /** Tags stored in a separate post_tags table. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag", length = 80)
    @Builder.Default
    private Set<String> tags = new HashSet<>();

    @Column(name = "upvote_count", nullable = false)   @Builder.Default private Integer upvoteCount   = 0;
    @Column(name = "reply_count",  nullable = false)   @Builder.Default private Integer replyCount    = 0;
    @Column(name = "bookmark_count", nullable = false) @Builder.Default private Integer bookmarkCount = 0;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "trending_score", nullable = false)
    @Builder.Default
    private Double trendingScore = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum PostType {
        DOUBT, PLACEMENT, RESOURCE_SHARE, QA_PROBLEM, DSA_PROBLEM
    }
}
