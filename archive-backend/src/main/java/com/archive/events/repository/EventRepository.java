package com.archive.events.repository;

import com.archive.events.entity.Event;
import com.archive.events.entity.Event.EventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findByIsDeletedFalse(Pageable pageable);

    Page<Event> findByTypeAndIsDeletedFalse(EventType type, Pageable pageable);

    Optional<Event> findByIdAndIsDeletedFalse(Long id);

    @Query("""
            SELECT e FROM Event e
            WHERE e.isDeleted = false
              AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(e.description) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(e.organizer) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Event> searchByKeyword(@Param("q") String q, Pageable pageable);

    int deleteByCreatorId(Long creatorId);
}
