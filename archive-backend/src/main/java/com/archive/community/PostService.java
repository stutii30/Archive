package com.archive.community;

import com.archive.auth.dto.UserDTO;
import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.community.dto.CreatePostRequest;
import com.archive.community.dto.CreateReplyRequest;
import com.archive.community.dto.PostDTO;
import com.archive.community.entity.*;
import com.archive.community.repository.*;
import com.archive.resource.entity.Resource;
import com.archive.resource.repository.ResourceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.archive.notification.service.NotificationService;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository     postRepo;
    private final ReplyRepository    replyRepo;
    private final PostUpvoteRepository    upvoteRepo;
    private final PostBookmarkRepository  bookmarkRepo;
    private final UserRepository     userRepo;
    private final ResourceRepository resourceRepo;
    private final NotificationService notificationService;

    // ── List ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PostDTO> list(Post.PostType type, String tag, Long resourceId,
                              Pageable pageable, Long viewerId) {
        return postRepo.findAllWithFilters(type, tag, resourceId, pageable)
                .map(p -> toDto(p, viewerId));
    }

    @Transactional(readOnly = true)
    public Page<PostDTO> getBookmarkedPosts(Long userId, Pageable pageable) {
        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        if (targetUserId == null) return Page.empty();
        final Long finalUserId = targetUserId;
        return bookmarkRepo.findByIdUserIdOrderBySavedAtDesc(finalUserId, pageable)
                .map(bm -> toDto(bm.getPost(), finalUserId));
    }

    @Transactional(readOnly = true)
    public Page<PostDTO> getUserPosts(Long authorId, Pageable pageable, Long viewerId) {
        return postRepo.findByAuthorIdAndIsDeletedFalse(authorId, pageable)
                .map(p -> toDto(p, viewerId));
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PostDTO getById(Long id, Long viewerId) {
        return toDto(findActiveOrThrow(id), viewerId);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public PostDTO create(CreatePostRequest req, Long authorId) {
        Long targetAuthorId = authorId;
        if (targetAuthorId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetAuthorId = defaultUser.getId();
        }
        if (targetAuthorId == null) throw new EntityNotFoundException("User not found");

        User author = userRepo.findById(targetAuthorId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Resource linked = null;
        if (req.getLinkedResourceId() != null) {
            linked = resourceRepo.findById(req.getLinkedResourceId()).orElse(null);
        }

        Post post = Post.builder()
                .author(author).type(req.getType() != null ? req.getType() : Post.PostType.DOUBT)
                .title(req.getTitle()).body(req.getBody())
                .tags(req.getTags() != null ? req.getTags() : new java.util.HashSet<>())
                .linkedResource(linked)
                .build();

        return toDto(postRepo.save(post), targetAuthorId);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public PostDTO update(Long id, CreatePostRequest req, Long userId) {
        Post post = findActiveOrThrow(id);
        requireAuthor(post, userId);
        post.setTitle(req.getTitle());
        post.setBody(req.getBody());
        if (req.getTags() != null) post.setTags(req.getTags());
        return toDto(postRepo.save(post), userId);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id, Long userId, User.Role role) {
        Post post = findActiveOrThrow(id);
        boolean isAuthor = post.getAuthor().getId().equals(userId);
        boolean isMod    = role == User.Role.MODERATOR || role == User.Role.ADMIN;
        if (!isAuthor && !isMod) throw new AccessDeniedException("Not authorized.");
        post.setIsDeleted(true);
        postRepo.save(post);
    }

    // ── Reply ─────────────────────────────────────────────────────────────────

    @Transactional
    public PostDTO.ReplyDTO addReply(Long postId, CreateReplyRequest req, Long authorId) {
        Post post = findActiveOrThrow(postId);

        Long targetAuthorId = authorId;
        if (targetAuthorId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetAuthorId = defaultUser.getId();
        }
        if (targetAuthorId == null) throw new EntityNotFoundException("User not found");

        User author = userRepo.findById(targetAuthorId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Reply parent = null;
        if (req.getParentReplyId() != null) {
            parent = replyRepo.findById(req.getParentReplyId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent reply not found"));
        }

        Reply reply = Reply.builder()
                .post(post).author(author).parentReply(parent).body(req.getBody()).build();

        reply = replyRepo.save(reply);
        postRepo.adjustReplyCount(postId, +1);

        if (!post.getAuthor().getId().equals(targetAuthorId)) {
            notificationService.notify(
                    post.getAuthor().getId(),
                    "POST_REPLY",
                    "New reply on your post",
                    author.getName() + " replied to: " + post.getTitle(),
                    "/posts/" + postId
            );
        }

        return PostDTO.ReplyDTO.from(reply, UserDTO.from(author));
    }

    // ── Replies (paginated top-level + nested) ────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PostDTO.ReplyDTO> getReplies(Long postId, Pageable pageable) {
        return replyRepo.findTopLevelByPostId(postId, pageable).map(r -> {
            PostDTO.ReplyDTO dto = PostDTO.ReplyDTO.from(r, UserDTO.from(r.getAuthor()));
            List<PostDTO.ReplyDTO> nested = replyRepo.findNestedByParentId(r.getId())
                    .stream().map(n -> PostDTO.ReplyDTO.from(n, UserDTO.from(n.getAuthor()))).toList();
            dto.setNested(nested);
            return dto;
        });
    }

    @Transactional
    public void deleteReply(Long postId, Long replyId, Long userId, User.Role role) {
        Reply reply = replyRepo.findById(replyId)
                .orElseThrow(() -> new EntityNotFoundException("Reply not found: " + replyId));

        if (Boolean.TRUE.equals(reply.getIsDeleted())) {
            throw new EntityNotFoundException("Reply not found: " + replyId);
        }

        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }

        boolean isReplyAuthor = targetUserId != null && reply.getAuthor().getId().equals(targetUserId);
        boolean isPostAuthor  = targetUserId != null && reply.getPost().getAuthor().getId().equals(targetUserId);
        boolean isMod         = role == User.Role.MODERATOR || role == User.Role.ADMIN;

        if (!isReplyAuthor && !isPostAuthor && !isMod) {
            throw new AccessDeniedException("Not authorized to delete this reply.");
        }

        reply.setIsDeleted(true);
        replyRepo.save(reply);

        int totalDeletedCount = 1;

        // Cascade soft-delete all active sub-replies under this parent reply
        List<Reply> nested = replyRepo.findNestedByParentId(replyId);
        for (Reply subReply : nested) {
            if (!Boolean.TRUE.equals(subReply.getIsDeleted())) {
                subReply.setIsDeleted(true);
                replyRepo.save(subReply);
                totalDeletedCount++;
            }
        }

        postRepo.adjustReplyCount(postId, -totalDeletedCount);
    }

    // ── Toggle upvote ─────────────────────────────────────────────────────────

    @Transactional
    public boolean toggleUpvote(Long postId, Long userId) {
        Post post = findActiveOrThrow(postId);

        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        if (targetUserId == null) return false;

        var id = new PostUpvote.PostUpvoteId(targetUserId, postId);
        if (upvoteRepo.existsById(id)) {
            upvoteRepo.deleteById(id);
            postRepo.adjustUpvoteCount(postId, -1);
            return false;
        }
        PostUpvote uv = new PostUpvote(id, userRepo.getReferenceById(targetUserId),
                postRepo.getReferenceById(postId), Instant.now());
        upvoteRepo.save(uv);
        postRepo.adjustUpvoteCount(postId, +1);

        int newCount = post.getUpvoteCount() + 1;
        if ((newCount == 10 || newCount == 50 || newCount == 100) && !post.getAuthor().getId().equals(targetUserId)) {
            notificationService.notify(
                    post.getAuthor().getId(),
                    "UPVOTE_MILESTONE",
                    "Upvote Milestone!",
                    "Your post '" + post.getTitle() + "' reached " + newCount + " upvotes!",
                    "/posts/" + postId
            );
        }

        return true;
    }

    // ── Toggle bookmark ───────────────────────────────────────────────────────

    @Transactional
    public boolean toggleBookmark(Long postId, Long userId) {
        findActiveOrThrow(postId);
        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        if (targetUserId == null) return false;

        var id = new PostBookmark.PostBookmarkId(targetUserId, postId);
        if (bookmarkRepo.existsById(id)) {
            bookmarkRepo.deleteById(id);
            postRepo.adjustBookmarkCount(postId, -1);
            return false;
        }
        PostBookmark bm = new PostBookmark(id, userRepo.getReferenceById(targetUserId),
                postRepo.getReferenceById(postId), Instant.now());
        bookmarkRepo.save(bm);
        postRepo.adjustBookmarkCount(postId, +1);
        return true;
    }

    // ── Trending tags ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> trendingTags() {
        java.time.Instant sevenDaysAgo = java.time.Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS);
        return postRepo.findTrendingTagsSince(sevenDaysAgo, org.springframework.data.domain.PageRequest.of(0, 10)).stream()
                .map(row -> Map.<String, Object>of("tag", row[0], "count", row[1]))
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Post findActiveOrThrow(Long id) {
        Post p = postRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Post not found: " + id));
        if (p.getIsDeleted()) throw new EntityNotFoundException("Post not found: " + id);
        return p;
    }

    private void requireAuthor(Post p, Long userId) {
        if (!p.getAuthor().getId().equals(userId))
            throw new AccessDeniedException("Only the author can edit this post.");
    }

    private PostDTO toDto(Post p, Long viewerId) {
        Long targetViewerId = viewerId;
        if (targetViewerId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetViewerId = defaultUser.getId();
        }
        boolean upvoted    = targetViewerId != null && upvoteRepo.existsByIdUserIdAndIdPostId(targetViewerId, p.getId());
        boolean bookmarked = targetViewerId != null && bookmarkRepo.existsByIdUserIdAndIdPostId(targetViewerId, p.getId());

        PostDTO.LinkedResourceDTO lr = null;
        if (p.getLinkedResource() != null) {
            Resource r = p.getLinkedResource();
            lr = PostDTO.LinkedResourceDTO.builder()
                    .id(r.getId()).title(r.getTitle())
                    .type(r.getType().name()).fileType(r.getFileType()).build();
        }
        return PostDTO.from(p, UserDTO.from(p.getAuthor()), lr, upvoted, bookmarked);
    }
}
