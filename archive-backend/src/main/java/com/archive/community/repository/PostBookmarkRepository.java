package com.archive.community.repository;

import com.archive.community.entity.PostBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostBookmarkRepository extends JpaRepository<PostBookmark, PostBookmark.PostBookmarkId> {
    boolean existsByIdUserIdAndIdPostId(Long userId, Long postId);

    Page<PostBookmark> findByIdUserIdOrderBySavedAtDesc(Long userId, Pageable pageable);

    long countByIdUserId(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM PostBookmark pb WHERE pb.id.userId = :userId")
    int deleteByUserId(Long userId);
}
