package com.archive.community.entity;

import com.archive.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "post_bookmarks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PostBookmark {

    @EmbeddedId
    private PostBookmarkId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt = Instant.now();

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class PostBookmarkId implements Serializable {
        @Column(name = "user_id") private Long userId;
        @Column(name = "post_id") private Long postId;
    }
}
