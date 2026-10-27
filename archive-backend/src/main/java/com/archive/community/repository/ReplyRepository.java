package com.archive.community.repository;

import com.archive.community.entity.Reply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, Long> {

    /** Top-level replies for a post (no parent), paginated. */
    @Query("""
            SELECT r FROM Reply r
            WHERE r.post.id = :postId
              AND r.parentReply IS NULL
              AND r.isDeleted = false
            ORDER BY r.createdAt ASC
            """)
    Page<Reply> findTopLevelByPostId(@Param("postId") Long postId, Pageable pageable);

    /** Nested replies under a given parent reply. */
    @Query("""
            SELECT r FROM Reply r
            WHERE r.parentReply.id = :parentId
              AND r.isDeleted = false
            ORDER BY r.createdAt ASC
            """)
    List<Reply> findNestedByParentId(@Param("parentId") Long parentId);

    int deleteByAuthorId(Long authorId);
}
