package com.archive.events;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.events.dto.CreateEventRequest;
import com.archive.events.dto.CreateStageRequest;
import com.archive.events.dto.EventDTO;
import com.archive.events.dto.EventStageDTO;
import com.archive.events.entity.Event;
import com.archive.events.entity.Event.EventType;
import com.archive.events.entity.EventSave;
import com.archive.events.entity.EventStage;
import com.archive.events.repository.EventRepository;
import com.archive.events.repository.EventSaveRepository;
import com.archive.events.repository.EventStageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventStageRepository eventStageRepository;

    @Mock
    private EventSaveRepository eventSaveRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EventService eventService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("student@college.edu")
                .name("Alex Student")
                .role(User.Role.STUDENT)
                .build();
    }

    @Test
    @DisplayName("Create Event should persist event with stages and compute correct daysUntil")
    void createEvent_Success() {
        // Arrange
        LocalDate futureDate = LocalDate.now().plusDays(5);
        CreateEventRequest req = new CreateEventRequest();
        req.setTitle("Campus Hackathon 2026");
        req.setType("HACKATHON");
        req.setOrganizer("ACM");
        req.setStartDate(futureDate);

        CreateStageRequest stageReq1 = new CreateStageRequest();
        stageReq1.setTitle("Phase 1: Registration");
        req.setStages(List.of(stageReq1));

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event saved = invocation.getArgument(0);
            saved.setId(100L);
            return saved;
        });

        // Act
        EventDTO result = eventService.create(req, 1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getTitle()).isEqualTo("Campus Hackathon 2026");
        assertThat(result.getType()).isEqualTo("HACKATHON");
        assertThat(result.getDaysUntil()).isEqualTo(5L);
        assertThat(result.getStages()).hasSize(1);
        assertThat(result.getStages().get(0).getTitle()).isEqualTo("Phase 1: Registration");
    }

    @Test
    @DisplayName("Toggle Save should create EventSave and increment registrant count when not previously saved")
    void toggleSave_SaveNew() {
        // Arrange
        Event event = Event.builder()
                .id(10L)
                .title("Tech Fest")
                .creator(testUser)
                .registrantCount(2)
                .build();

        when(eventRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(event));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventSaveRepository.findByIdUserIdAndIdEventId(1L, 10L)).thenReturn(Optional.empty());

        // Act
        boolean saved = eventService.toggleSave(10L, 1L);

        // Assert
        assertThat(saved).isTrue();
        assertThat(event.getRegistrantCount()).isEqualTo(3);
        verify(eventSaveRepository).save(any(EventSave.class));
    }

    @Test
    @DisplayName("Toggle Save should delete EventSave and decrement registrant count when already saved")
    void toggleSave_UnsaveExisting() {
        // Arrange
        Event event = Event.builder()
                .id(10L)
                .title("Tech Fest")
                .creator(testUser)
                .registrantCount(3)
                .build();

        EventSave existingSave = EventSave.builder()
                .user(testUser)
                .event(event)
                .build();

        when(eventRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(event));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventSaveRepository.findByIdUserIdAndIdEventId(1L, 10L)).thenReturn(Optional.of(existingSave));

        // Act
        boolean saved = eventService.toggleSave(10L, 1L);

        // Assert
        assertThat(saved).isFalse();
        assertThat(event.getRegistrantCount()).isEqualTo(2);
        verify(eventSaveRepository).delete(existingSave);
    }
}
