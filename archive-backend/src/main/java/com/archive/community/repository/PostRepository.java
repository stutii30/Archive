package com.archive.community.repository;

import com.archive.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("""
            SELECT DISTINCT p FROM Post p
            WHERE p.isDeleted = false
              AND (:type IS NULL OR p.type = :type)
              AND (:tag  IS NULL OR :tag MEMBER OF p.tags)
              AND (:resourceId IS NULL OR p.linkedResource.id = :resourceId)
            """)
    Page<Post> findAllWithFilters(
            @Param("type")       Post.PostType type,
            @Param("tag")        String tag,
            @Param("resourceId") Long resourceId,
            Pageable pageable);

    Page<Post> findByAuthorIdAndIsDeletedFalse(Long authorId, Pageable pageable);

    long countByAuthorIdAndIsDeletedFalse(Long authorId);

    @Query("""
            SELECT p FROM Post p
            WHERE p.isDeleted = false
              AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(p.body) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Post> searchByKeyword(@Param("q") String q, Pageable pageable);

    @Modifying
    @Query("UPDATE Post p SET p.upvoteCount   = p.upvoteCount   + :d WHERE p.id = :id")
    void adjustUpvoteCount(@Param("id") Long id, @Param("d") int delta);

    @Modifying
    @Query("UPDATE Post p SET p.replyCount    = GREATEST(0, p.replyCount + :d) WHERE p.id = :id")
    void adjustReplyCount(@Param("id") Long id, @Param("d") int delta);

    @Modifying
    @Query("UPDATE Post p SET p.bookmarkCount = GREATEST(0, p.bookmarkCount + :d) WHERE p.id = :id")
    void adjustBookmarkCount(@Param("id") Long id, @Param("d") int delta);

    /** Trending tags — top 10 by post count in last 7 days. */
    @Query("""
            SELECT t, COUNT(p) AS cnt
            FROM Post p JOIN p.tags t
            WHERE p.isDeleted = false
              AND p.createdAt >= :since
            GROUP BY t
            ORDER BY cnt DESC
            """)
    List<Object[]> findTrendingTagsSince(@Param("since") java.time.Instant since, Pageable pageable);

    int deleteByAuthorId(Long authorId);
}
