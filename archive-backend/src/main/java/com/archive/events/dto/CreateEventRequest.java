package com.archive.events.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateEventRequest {

    @NotBlank(message = "Event title is required")
    private String title;

    private String description;

    private String organizer;

    private String type; // HACKATHON, FEST, PLACEMENT, CONTEST, SEMINAR, OTHER

    private String location;

    private LocalDate startDate;

    private LocalDate endDate;

    private String registrationLink;

    private List<CreateStageRequest> stages;
}
