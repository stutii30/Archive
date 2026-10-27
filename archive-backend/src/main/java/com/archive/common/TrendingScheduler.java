package com.archive.common;

import com.archive.community.entity.Post;
import com.archive.community.repository.PostRepository;
import com.archive.resource.entity.Resource;
import com.archive.resource.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class TrendingScheduler {

    private final ResourceRepository resourceRepository;
    private final PostRepository postRepository;

    @Scheduled(cron = "0 0 * * * *") // Every hour
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void calculateTrendingScores() {
        log.info("Calculating trending scores for resources and posts...");
        Instant now = Instant.now();

        // 1. Calculate for resources
        List<Resource> resources = resourceRepository.findAll();
        for (Resource res : resources) {
            if (Boolean.TRUE.equals(res.getIsDeleted())) continue;
            long hoursOld = Math.max(0, Duration.between(res.getCreatedAt() != null ? res.getCreatedAt() : now, now).toHours());
            double recencyFactor = 1.0 / Math.pow((hoursOld / 24.0) + 1.0, 1.2);
            double baseScore = (res.getDownloadCount() * 2.0) + (res.getBookmarkCount() * 3.0) + 1.0;
            res.setTrendingScore(baseScore * recencyFactor);
        }
        resourceRepository.saveAll(resources);

        // 2. Calculate for posts
        List<Post> posts = postRepository.findAll();
        for (Post post : posts) {
            if (Boolean.TRUE.equals(post.getIsDeleted())) continue;
            long hoursOld = Math.max(0, Duration.between(post.getCreatedAt() != null ? post.getCreatedAt() : now, now).toHours());
            double recencyFactor = 1.0 / Math.pow((hoursOld / 24.0) + 1.0, 1.2);
            double baseScore = (post.getUpvoteCount() * 2.0) + (post.getReplyCount() * 1.5) + 1.0;
            post.setTrendingScore(baseScore * recencyFactor);
        }
        postRepository.saveAll(posts);

        log.info("Trending score calculation completed for {} resources and {} posts", resources.size(), posts.size());
    }
}
