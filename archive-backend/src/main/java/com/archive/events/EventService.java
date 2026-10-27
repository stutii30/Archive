package com.archive.events;

import com.archive.auth.dto.UserDTO;
import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.events.dto.*;
import com.archive.events.entity.Event;
import com.archive.events.entity.Event.EventType;
import com.archive.events.entity.EventSave;
import com.archive.events.entity.EventSave.EventSaveId;
import com.archive.events.entity.EventStage;
import com.archive.events.repository.EventRepository;
import com.archive.events.repository.EventSaveRepository;
import com.archive.events.repository.EventStageRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final EventStageRepository eventStageRepository;
    private final EventSaveRepository eventSaveRepository;
    private final UserRepository userRepository;

    public Page<EventDTO> list(EventType type, Pageable pageable, Long userId) {
        Page<Event> page = (type != null)
                ? eventRepository.findByTypeAndIsDeletedFalse(type, pageable)
                : eventRepository.findByIsDeletedFalse(pageable);

        return page.map(e -> toDTO(e, userId));
    }

    public EventDTO getById(Long id, Long userId) {
        Event event = eventRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + id));
        return toDTO(event, userId);
    }

    @Transactional
    public EventDTO create(CreateEventRequest req, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        EventType eventType = EventType.OTHER;
        if (req.getType() != null && !req.getType().isBlank()) {
            try {
                eventType = EventType.valueOf(req.getType().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Event event = Event.builder()
                .creator(creator)
                .title(req.getTitle())
                .description(req.getDescription())
                .organizer(req.getOrganizer())
                .type(eventType)
                .location(req.getLocation())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .registrationLink(req.getRegistrationLink())
                .stages(new ArrayList<>())
                .build();

        if (req.getStages() != null && !req.getStages().isEmpty()) {
            int num = 1;
            for (CreateStageRequest stageReq : req.getStages()) {
                EventStage stage = EventStage.builder()
                        .event(event)
                        .stageNumber(num++)
                        .title(stageReq.getTitle())
                        .description(stageReq.getDescription())
                        .startDt(stageReq.getStartDt())
                        .endDt(stageReq.getEndDt())
                        .build();
                event.getStages().add(stage);
            }
        }

        Event savedEvent = eventRepository.save(event);
        return toDTO(savedEvent, userId);
    }

    @Transactional
    public EventDTO update(Long id, CreateEventRequest req, Long userId, User.Role userRole) {
        Event event = eventRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        checkOwnershipOrAdmin(event, userId, userRole);

        if (req.getTitle() != null) event.setTitle(req.getTitle());
        if (req.getDescription() != null) event.setDescription(req.getDescription());
        if (req.getOrganizer() != null) event.setOrganizer(req.getOrganizer());
        if (req.getLocation() != null) event.setLocation(req.getLocation());
        if (req.getStartDate() != null) event.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) event.setEndDate(req.getEndDate());
        if (req.getRegistrationLink() != null) event.setRegistrationLink(req.getRegistrationLink());

        if (req.getType() != null && !req.getType().isBlank()) {
            try {
                event.setType(EventType.valueOf(req.getType().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }

        Event updated = eventRepository.save(event);
        return toDTO(updated, userId);
    }

    @Transactional
    public void delete(Long id, Long userId, User.Role userRole) {
        Event event = eventRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        checkOwnershipOrAdmin(event, userId, userRole);
        event.setIsDeleted(true);
        eventRepository.save(event);
    }

    @Transactional
    public EventStageDTO addStage(Long eventId, CreateStageRequest req, Long userId) {
        Event event = eventRepository.findByIdAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        checkOwnershipOrAdmin(event, userId, user.getRole());

        int nextStageNumber = event.getStages().size() + 1;
        EventStage stage = EventStage.builder()
                .event(event)
                .stageNumber(nextStageNumber)
                .title(req.getTitle())
                .description(req.getDescription())
                .startDt(req.getStartDt())
                .endDt(req.getEndDt())
                .build();

        EventStage savedStage = eventStageRepository.save(stage);
        return EventStageDTO.from(savedStage);
    }

    @Transactional
    public EventStageDTO editStage(Long eventId, Long stageId, CreateStageRequest req, Long userId) {
        Event event = eventRepository.findByIdAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        checkOwnershipOrAdmin(event, userId, user.getRole());

        EventStage stage = eventStageRepository.findById(stageId)
                .orElseThrow(() -> new EntityNotFoundException("Stage not found"));

        if (!stage.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Stage does not belong to specified event");
        }

        if (req.getTitle() != null) stage.setTitle(req.getTitle());
        if (req.getDescription() != null) stage.setDescription(req.getDescription());
        if (req.getStartDt() != null) stage.setStartDt(req.getStartDt());
        if (req.getEndDt() != null) stage.setEndDt(req.getEndDt());

        EventStage updated = eventStageRepository.save(stage);
        return EventStageDTO.from(updated);
    }

    @Transactional
    public void deleteStage(Long eventId, Long stageId, Long userId) {
        Event event = eventRepository.findByIdAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        checkOwnershipOrAdmin(event, userId, user.getRole());

        EventStage stage = eventStageRepository.findById(stageId)
                .orElseThrow(() -> new EntityNotFoundException("Stage not found"));

        if (!stage.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Stage does not belong to specified event");
        }

        eventStageRepository.delete(stage);

        // Renumber remaining stages
        List<EventStage> remaining = eventStageRepository.findByEventIdOrderByStageNumberAsc(eventId);
        int num = 1;
        for (EventStage s : remaining) {
            s.setStageNumber(num++);
            eventStageRepository.save(s);
        }
    }

    @Transactional(readOnly = true)
    public Page<EventDTO> getSavedEvents(Long userId, Pageable pageable) {
        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepository.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        if (targetUserId == null) return Page.empty();
        final Long finalUserId = targetUserId;
        return eventSaveRepository.findByIdUserIdOrderBySavedAtDesc(finalUserId, pageable)
                .map(es -> toDTO(es.getEvent(), finalUserId));
    }

    @Transactional
    public boolean toggleSave(Long eventId, Long userId) {
        Event event = eventRepository.findByIdAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found"));

        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepository.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        if (targetUserId == null) return false;

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Optional<EventSave> existing = eventSaveRepository.findByIdUserIdAndIdEventId(targetUserId, eventId);
        if (existing.isPresent()) {
            eventSaveRepository.delete(existing.get());
            if (event.getRegistrantCount() > 0) {
                event.setRegistrantCount(event.getRegistrantCount() - 1);
            }
            return false;
        } else {
            EventSave save = EventSave.builder()
                    .id(new EventSaveId(targetUserId, eventId))
                    .user(user)
                    .event(event)
                    .remind(true)
                    .build();
            eventSaveRepository.save(save);
            event.setRegistrantCount(event.getRegistrantCount() + 1);
            return true;
        }
    }

    private EventDTO toDTO(Event e, Long userId) {
        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepository.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }

        boolean saved = false;
        boolean remind = false;
        if (targetUserId != null) {
            Optional<EventSave> saveOpt = eventSaveRepository.findByIdUserIdAndIdEventId(targetUserId, e.getId());
            if (saveOpt.isPresent()) {
                saved = true;
                remind = Boolean.TRUE.equals(saveOpt.get().getRemind());
            }
        }
        UserDTO creatorDTO = UserDTO.from(e.getCreator());
        return EventDTO.from(e, creatorDTO, saved, remind);
    }

    private void checkOwnershipOrAdmin(Event event, Long userId, User.Role role) {
        boolean isOwner = event.getCreator().getId().equals(userId);
        boolean isAdminOrMod = role == User.Role.ADMIN || role == User.Role.MODERATOR;
        if (!isOwner && !isAdminOrMod) {
            throw new AccessDeniedException("Not authorized to modify this event");
        }
    }
}
