package com.archive.auth;

import com.archive.auth.dto.UpdateProfileRequest;
import com.archive.auth.dto.UserProfileResponse;
import com.archive.auth.service.UserService;
import com.archive.common.response.ApiResponse;
import com.archive.community.PostService;
import com.archive.community.dto.PostDTO;
import com.archive.events.EventService;
import com.archive.events.dto.EventDTO;
import com.archive.resource.ResourceService;
import com.archive.resource.dto.ResourceDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ResourceService resourceService;
    private final PostService postService;
    private final EventService eventService;

    // ── Current User Profile ──────────────────────────────────────────────────

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getCurrentProfile(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(userService.getUserProfile(userId));
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(userService.updateProfile(userId, request));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadAvatar(
            @AuthenticationPrincipal Long userId,
            @RequestPart("file") MultipartFile file) {
        String avatarUrl = userService.uploadAvatar(userId, file);
        return ApiResponse.ok(Map.of("avatarUrl", avatarUrl));
    }

    @DeleteMapping("/me")
    public ApiResponse<Map<String, String>> deleteAccount(@AuthenticationPrincipal Long userId) {
        userService.deleteAccount(userId);
        return ApiResponse.ok(Map.of("message", "Account deleted successfully"));
    }

    // ── Public User Profile ───────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ApiResponse<UserProfileResponse> getUserProfile(@PathVariable Long id) {
        return ApiResponse.ok(userService.getUserProfile(id));
    }

    @GetMapping("/{id}/uploads")
    public ApiResponse<Page<ResourceDTO>> getUserUploads(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.ok(resourceService.getUserResources(id, pageable));
    }

    @GetMapping("/{id}/posts")
    public ApiResponse<Page<PostDTO>> getUserPosts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Long viewerId) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.ok(postService.getUserPosts(id, pageable, viewerId));
    }

    // ── Bookmarks ─────────────────────────────────────────────────────────────

    @GetMapping("/me/bookmarks/resources")
    public ApiResponse<Page<ResourceDTO>> getBookmarkedResources(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        return ApiResponse.ok(resourceService.getBookmarkedResources(userId, pageable));
    }

    @GetMapping("/me/bookmarks/posts")
    public ApiResponse<Page<PostDTO>> getBookmarkedPosts(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        return ApiResponse.ok(postService.getBookmarkedPosts(userId, pageable));
    }

    @GetMapping("/me/bookmarks/events")
    public ApiResponse<Page<EventDTO>> getSavedEvents(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));
        return ApiResponse.ok(eventService.getSavedEvents(userId, pageable));
    }
}
