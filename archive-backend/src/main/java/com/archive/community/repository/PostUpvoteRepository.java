package com.archive.community.repository;

import com.archive.community.entity.PostUpvote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostUpvoteRepository extends JpaRepository<PostUpvote, PostUpvote.PostUpvoteId> {
    boolean existsByIdUserIdAndIdPostId(Long userId, Long postId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM PostUpvote pu WHERE pu.id.userId = :userId")
    int deleteByUserId(Long userId);
}
