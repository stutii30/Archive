package com.archive.resource.entity;

import com.archive.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "resource_bookmarks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResourceBookmark {

    @EmbeddedId
    private ResourceBookmarkId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("resourceId")
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt = Instant.now();

    // ── Composite PK ─────────────────────────────────────────────────────────
    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ResourceBookmarkId implements Serializable {
        @Column(name = "user_id")
        private Long userId;

        @Column(name = "resource_id")
        private Long resourceId;
    }
}
