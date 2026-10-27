package com.archive.resource.repository;

import com.archive.resource.entity.ResourceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceReviewRepository extends JpaRepository<ResourceReview, Long> {

    Page<ResourceReview> findByResourceIdOrderByCreatedAtDesc(Long resourceId, Pageable pageable);

    Optional<ResourceReview> findByResourceIdAndUserId(Long resourceId, Long userId);

    @Query("SELECT AVG(r.rating) FROM ResourceReview r WHERE r.resource.id = :resourceId")
    Double getAverageRating(@Param("resourceId") Long resourceId);

    long countByResourceId(Long resourceId);

    int deleteByUserId(Long userId);
}
