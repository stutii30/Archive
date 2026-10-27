package com.archive.community.entity;

import com.archive.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "post_upvotes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PostUpvote {

    @EmbeddedId
    private PostUpvoteId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class PostUpvoteId implements Serializable {
        @Column(name = "user_id") private Long userId;
        @Column(name = "post_id") private Long postId;
    }
}
