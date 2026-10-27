package com.archive.resource;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.common.response.ApiResponse;
import com.archive.resource.dto.ResourceDTO;
import com.archive.resource.dto.ResourceMetadataRequest;
import com.archive.resource.entity.Resource;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import com.archive.resource.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;
    private final SubjectService subjectService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ── GET /api/resources ────────────────────────────────────────────────────

    @GetMapping
    public ApiResponse<Page<ResourceDTO>> list(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String degree,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Byte semester,
            @RequestParam(required = false) Byte year,
            @RequestParam(required = false) String chapter,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String targetDegree = (degree != null && !degree.isBlank()) ? degree : null;
        String targetDept = (department != null && !department.isBlank()) ? department : null;
        Byte targetSem = semester;
        Byte targetYear = year;

        Resource.ResourceType resourceType = null;
        if (type != null && !type.isBlank()) {
            try { resourceType = Resource.ResourceType.valueOf(type.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        String sortField = "trending".equalsIgnoreCase(sort) ? "trendingScore" : "createdAt";
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50),
                Sort.by(Sort.Direction.DESC, sortField));

        return ApiResponse.ok(resourceService.list(
                resourceType, subject, targetDegree, targetDept, targetSem, targetYear, chapter, userId, pageable));
    }

    // ── GET & POST /api/resources/subjects ────────────────────────────────────

    @GetMapping("/subjects")
    public ApiResponse<java.util.List<com.archive.resource.dto.SubjectDTO>> getSubjects(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Byte semester) {
        String targetDept = department;
        Byte targetSem = semester;

        if ((targetDept == null || targetDept.isBlank()) && userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                targetDept = user.getDepartment();
                if (targetSem == null && user.getYear() != null) {
                    targetSem = (byte) (user.getYear() * 2);
                }
            }
        }
        return ApiResponse.ok(subjectService.getSubjects(targetDept, targetSem));
    }

    @PostMapping("/subjects")
    public ApiResponse<com.archive.resource.dto.SubjectDTO> createSubject(
            @AuthenticationPrincipal Long userId,
            @jakarta.validation.Valid @RequestBody com.archive.resource.dto.CreateSubjectRequest req) {
        return ApiResponse.ok(subjectService.createSubject(req, userId));
    }

    // ── GET /api/resources/recommended ───────────────────────────────────────

    @GetMapping("/recommended")
    public ApiResponse<java.util.List<ResourceDTO>> getRecommended(
            @AuthenticationPrincipal Long userId) {

        return ApiResponse.ok(resourceService.getRecommended(userId));
    }

    // ── GET /api/resources/search ─────────────────────────────────────────────

    @GetMapping("/search")
    public ApiResponse<Page<ResourceDTO>> search(
            @AuthenticationPrincipal Long userId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ApiResponse.ok(resourceService.search(q, userId, PageRequest.of(page, Math.min(size, 50))));
    }

    // ── GET /api/resources/:id ────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ApiResponse<ResourceDTO> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {

        return ApiResponse.ok(resourceService.getById(id, userId));
    }

    // ── POST /api/resources (multipart/form-data) ─────────────────────────────

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ResourceDTO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "metadata", required = false) String metadataJson,
            @AuthenticationPrincipal Long userId) {

        ResourceMetadataRequest meta = null;
        if (metadataJson != null && !metadataJson.isBlank()) {
            try {
                meta = objectMapper.readValue(metadataJson, ResourceMetadataRequest.class);
            } catch (Exception ignored) {
                meta = new ResourceMetadataRequest();
            }
        } else {
            meta = new ResourceMetadataRequest();
        }

        return ApiResponse.ok(resourceService.upload(file, meta, userId));
    }

    // ── PUT /api/resources/:id ────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ApiResponse<ResourceDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody ResourceMetadataRequest request,
            @AuthenticationPrincipal Long userId) {

        return ApiResponse.ok(resourceService.updateMetadata(id, request, userId));
    }

    // ── DELETE /api/resources/:id ─────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {

        User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;
        User.Role role = (user != null) ? user.getRole() : User.Role.STUDENT;
        resourceService.softDelete(id, userId, role);
    }

    // ── POST /api/resources/:id/bookmark ─────────────────────────────────────

    @PostMapping("/{id}/bookmark")
    public ApiResponse<Map<String, Object>> toggleBookmark(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {

        boolean bookmarked = resourceService.toggleBookmark(id, userId);
        return ApiResponse.ok(Map.of("bookmarked", bookmarked));
    }

    // ── POST & GET /api/resources/:id/download ───────────────────────────────

    @PostMapping("/{id}/download")
    public ApiResponse<Map<String, String>> download(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {

        String url = resourceService.getDownloadUrl(id);
        return ApiResponse.ok(Map.of("downloadUrl", url));
    }

    @GetMapping("/{id}/download")
    public ApiResponse<Map<String, String>> getDownloadUrlReadOnly(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {

        String url = resourceService.getPreviewUrl(id);
        return ApiResponse.ok(Map.of("downloadUrl", url));
    }

    // ── GET /api/resources/:id/file (direct media stream/preview) ─────────────

    @GetMapping("/{id}/file")
    public org.springframework.http.ResponseEntity<Void> getFileContent(@PathVariable Long id) {
        String url = resourceService.getPreviewUrl(id);
        return org.springframework.http.ResponseEntity.status(HttpStatus.FOUND)
                .location(java.net.URI.create(url))
                .build();
    }
}
