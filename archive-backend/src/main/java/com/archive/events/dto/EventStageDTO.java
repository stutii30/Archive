package com.archive.events.dto;

import com.archive.events.entity.EventStage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EventStageDTO {
    private Long id;
    private Long eventId;
    private Integer stageNumber;
    private String title;
    private String description;
    private LocalDateTime startDt;
    private LocalDateTime endDt;

    public static EventStageDTO from(EventStage stage) {
        if (stage == null) return null;
        return EventStageDTO.builder()
                .id(stage.getId())
                .eventId(stage.getEvent() != null ? stage.getEvent().getId() : null)
                .stageNumber(stage.getStageNumber())
                .title(stage.getTitle())
                .description(stage.getDescription())
                .startDt(stage.getStartDt())
                .endDt(stage.getEndDt())
                .build();
    }
}
