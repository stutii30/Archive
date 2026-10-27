package com.archive.resource.repository;

import com.archive.resource.entity.ResourceBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceBookmarkRepository
        extends JpaRepository<ResourceBookmark, ResourceBookmark.ResourceBookmarkId> {

    boolean existsByIdUserIdAndIdResourceId(Long userId, Long resourceId);

    Page<ResourceBookmark> findByIdUserIdOrderBySavedAtDesc(Long userId, Pageable pageable);

    long countByIdUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT rb.id.resourceId FROM ResourceBookmark rb WHERE rb.id.userId = :userId")
    java.util.List<Long> findResourceIdsByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ResourceBookmark rb WHERE rb.id.userId = :userId")
    int deleteByUserId(Long userId);
}
