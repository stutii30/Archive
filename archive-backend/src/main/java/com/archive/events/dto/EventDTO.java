package com.archive.events.dto;

import com.archive.auth.dto.UserDTO;
import com.archive.events.entity.Event;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class EventDTO {
    private Long id;
    private UserDTO creator;
    private String title;
    private String description;
    private String organizer;
    private String type;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private String registrationLink;
    private Integer registrantCount;
    private Long daysUntil;
    private boolean saved;
    private boolean remind;
    private List<EventStageDTO> stages;
    private Instant createdAt;
    private Instant updatedAt;

    public static EventDTO from(Event e, UserDTO creator, boolean saved, boolean remind) {
        Long days = null;
        if (e.getStartDate() != null) {
            days = ChronoUnit.DAYS.between(LocalDate.now(), e.getStartDate());
        }

        List<EventStageDTO> stageDTOs = null;
        if (e.getStages() != null) {
            stageDTOs = e.getStages().stream()
                    .map(EventStageDTO::from)
                    .collect(Collectors.toList());
        }

        return EventDTO.builder()
                .id(e.getId())
                .creator(creator)
                .title(e.getTitle())
                .description(e.getDescription())
                .organizer(e.getOrganizer())
                .type(e.getType().name())
                .location(e.getLocation())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .registrationLink(e.getRegistrationLink())
                .registrantCount(e.getRegistrantCount())
                .daysUntil(days)
                .saved(saved)
                .remind(remind)
                .stages(stageDTOs)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
