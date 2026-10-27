package com.archive.events;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.common.response.ApiResponse;
import com.archive.events.dto.CreateEventRequest;
import com.archive.events.dto.CreateStageRequest;
import com.archive.events.dto.EventDTO;
import com.archive.events.dto.EventStageDTO;
import com.archive.events.entity.Event;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final UserRepository userRepository;

    // GET /api/events
    @GetMapping
    public ApiResponse<Page<EventDTO>> list(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Long userId) {

        Event.EventType eventType = null;
        if (type != null && !type.isBlank()) {
            try {
                eventType = Event.EventType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        PageRequest pageable = PageRequest.of(page, Math.min(size, 50),
                Sort.by(Sort.Direction.ASC, "startDate"));

        return ApiResponse.ok(eventService.list(eventType, pageable, userId));
    }

    // GET /api/events/:id
    @GetMapping("/{id}")
    public ApiResponse<EventDTO> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(eventService.getById(id, userId));
    }

    // POST /api/events
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EventDTO> create(
            @Valid @RequestBody CreateEventRequest req,
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(eventService.create(req, userId));
    }

    // PUT /api/events/:id
    @PutMapping("/{id}")
    public ApiResponse<EventDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateEventRequest req,
            @AuthenticationPrincipal Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
        return ApiResponse.ok(eventService.update(id, req, userId, user.getRole()));
    }

    // DELETE /api/events/:id
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
        eventService.delete(id, userId, user.getRole());
    }

    // POST /api/events/:id/stages
    @PostMapping("/{id}/stages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EventStageDTO> addStage(
            @PathVariable Long id,
            @Valid @RequestBody CreateStageRequest req,
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(eventService.addStage(id, req, userId));
    }

    // PUT /api/events/:id/stages/:stageId
    @PutMapping("/{id}/stages/{stageId}")
    public ApiResponse<EventStageDTO> editStage(
            @PathVariable Long id,
            @PathVariable Long stageId,
            @Valid @RequestBody CreateStageRequest req,
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(eventService.editStage(id, stageId, req, userId));
    }

    // DELETE /api/events/:id/stages/:stageId
    @DeleteMapping("/{id}/stages/{stageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStage(
            @PathVariable Long id,
            @PathVariable Long stageId,
            @AuthenticationPrincipal Long userId) {
        eventService.deleteStage(id, stageId, userId);
    }

    // POST /api/events/:id/save
    @PostMapping("/{id}/save")
    public ApiResponse<Map<String, Object>> toggleSave(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        boolean saved = eventService.toggleSave(id, userId);
        return ApiResponse.ok(Map.of("saved", saved));
    }
}
