package com.archive.events.repository;

import com.archive.events.entity.EventSave;
import com.archive.events.entity.EventSave.EventSaveId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventSaveRepository extends JpaRepository<EventSave, EventSaveId> {

    boolean existsByIdUserIdAndIdEventId(Long userId, Long eventId);

    Optional<EventSave> findByIdUserIdAndIdEventId(Long userId, Long eventId);

    Page<EventSave> findByIdUserIdOrderBySavedAtDesc(Long userId, Pageable pageable);

    java.util.List<EventSave> findByRemindTrueAndEventStartDateBetween(java.time.LocalDate start, java.time.LocalDate end);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM EventSave es WHERE es.id.userId = :userId")
    int deleteByUserId(Long userId);
}
