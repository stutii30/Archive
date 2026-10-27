package com.archive.events.entity;

import com.archive.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "event_saves")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventSave {

    @EmbeddedId
    private EventSaveId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("eventId")
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    @Builder.Default
    private Boolean remind = true;

    @Column(name = "saved_at", nullable = false)
    @Builder.Default
    private Instant savedAt = Instant.now();

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class EventSaveId implements Serializable {
        @Column(name = "user_id") private Long userId;
        @Column(name = "event_id") private Long eventId;
    }
}
