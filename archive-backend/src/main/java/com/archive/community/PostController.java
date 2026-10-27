package com.archive.community;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.common.response.ApiResponse;
import com.archive.community.dto.CreatePostRequest;
import com.archive.community.dto.CreateReplyRequest;
import com.archive.community.dto.PostDTO;
import com.archive.community.entity.Post;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserRepository userRepository;

    // GET /api/posts
    @GetMapping
    public ApiResponse<Page<PostDTO>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Long userId) {

        Post.PostType postType = null;
        if (type != null && !type.isBlank()) {
            try { postType = Post.PostType.valueOf(type.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        String sortField = "trending".equalsIgnoreCase(sort) ? "trendingScore" : "createdAt";
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50),
                Sort.by(Sort.Direction.DESC, sortField));
        return ApiResponse.ok(postService.list(postType, tag, resourceId, pageable, userId));
    }

    // GET /api/posts/:id
    @GetMapping("/{id}")
    public ApiResponse<PostDTO> getById(@PathVariable Long id,
                                        @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(postService.getById(id, userId));
    }

    // POST /api/posts
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PostDTO> create(@Valid @RequestBody CreatePostRequest req,
                                       @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(postService.create(req, userId));
    }

    // PUT /api/posts/:id
    @PutMapping("/{id}")
    public ApiResponse<PostDTO> update(@PathVariable Long id,
                                       @Valid @RequestBody CreatePostRequest req,
                                       @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(postService.update(id, req, userId));
    }

    // DELETE /api/posts/:id
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
        postService.delete(id, userId, user.getRole());
    }

    // POST /api/posts/:id/replies
    @PostMapping("/{id}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PostDTO.ReplyDTO> addReply(@PathVariable Long id,
                                                  @Valid @RequestBody CreateReplyRequest req,
                                                  @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(postService.addReply(id, req, userId));
    }

    // GET /api/posts/:id/replies
    @GetMapping("/{id}/replies")
    public ApiResponse<Page<PostDTO.ReplyDTO>> getReplies(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50),
                Sort.by(Sort.Direction.ASC, "createdAt"));
        return ApiResponse.ok(postService.getReplies(id, pageable));
    }

    // DELETE /api/posts/:postId/replies/:replyId
    @DeleteMapping("/{postId}/replies/{replyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReply(@PathVariable Long postId,
                            @PathVariable Long replyId,
                            @AuthenticationPrincipal Long userId) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }
        postService.deleteReply(postId, replyId, userId, user != null ? user.getRole() : User.Role.STUDENT);
    }

    // POST /api/posts/:id/upvote
    @PostMapping("/{id}/upvote")
    public ApiResponse<Map<String, Object>> toggleUpvote(@PathVariable Long id,
                                                         @AuthenticationPrincipal Long userId) {
        boolean upvoted = postService.toggleUpvote(id, userId);
        return ApiResponse.ok(Map.of("upvoted", upvoted));
    }

    // POST /api/posts/:id/bookmark
    @PostMapping("/{id}/bookmark")
    public ApiResponse<Map<String, Object>> toggleBookmark(@PathVariable Long id,
                                                           @AuthenticationPrincipal Long userId) {
        boolean bookmarked = postService.toggleBookmark(id, userId);
        return ApiResponse.ok(Map.of("bookmarked", bookmarked));
    }

    // GET /api/posts/trending-tags
    @GetMapping("/trending-tags")
    public ApiResponse<List<Map<String, Object>>> trendingTags() {
        return ApiResponse.ok(postService.trendingTags());
    }
}
