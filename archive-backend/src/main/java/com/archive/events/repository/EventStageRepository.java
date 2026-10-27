package com.archive.events.repository;

import com.archive.events.entity.EventStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventStageRepository extends JpaRepository<EventStage, Long> {

    List<EventStage> findByEventIdOrderByStageNumberAsc(Long eventId);

    void deleteByEventId(Long eventId);
}
