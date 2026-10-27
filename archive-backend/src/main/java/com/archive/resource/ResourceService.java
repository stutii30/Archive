package com.archive.resource;

import com.archive.auth.dto.UserDTO;
import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.resource.dto.ResourceDTO;
import com.archive.resource.dto.ResourceMetadataRequest;
import com.archive.resource.entity.Resource;
import com.archive.resource.entity.ResourceBookmark;
import com.archive.resource.repository.ResourceBookmarkRepository;
import com.archive.resource.repository.ResourceRepository;
import com.archive.storage.StorageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepo;
    private final ResourceBookmarkRepository bookmarkRepo;
    private final UserRepository userRepo;
    private final StorageService storageService;
    private final com.archive.resource.repository.ResourceReviewRepository reviewRepo;
    private final com.archive.common.service.AiModerationService aiModerationService;

    // ── List (paginated + filtered) ───────────────────────────────────────────

    public boolean isCseDepartment(String dept) {
        if (dept == null || dept.isBlank()) return false;
        String d = dept.toLowerCase().trim();
        return d.contains("cse") || d.contains("computer") || d.contains("software")
                || d.contains("information technology") || d.equals("it");
    }

    @Transactional(readOnly = true)
    public Page<ResourceDTO> list(
            Resource.ResourceType type, String subject, String degree, String dept,
            Byte semester, Byte year, String chapter, Long requestingUserId, Pageable pageable) {

        User currentUser = null;
        if (requestingUserId != null) {
            currentUser = userRepo.findById(requestingUserId).orElse(null);
        }

        String targetDegree = degree;
        String targetDept = dept;
        Byte targetYear = year;
        Byte targetSem = semester;

        // If user is a student: STRICT DEGREE, DEPARTMENT AND YEAR SCOPING
        if (currentUser != null && currentUser.getRole() == User.Role.STUDENT) {
            // 1. Force degree to student's degree if present
            if (currentUser.getDegree() != null && !currentUser.getDegree().isBlank()) {
                targetDegree = currentUser.getDegree();
            }
            // 2. Force department to student's department (e.g. CSE students ONLY see CSE)
            if (currentUser.getDepartment() != null && !currentUser.getDepartment().isBlank()) {
                targetDept = currentUser.getDepartment();
            }
            // 3. Default to student's enrolled year if no year or semester was explicitly specified
            if (targetYear == null && targetSem == null && currentUser.getYear() != null && currentUser.getYear() > 0) {
                targetYear = currentUser.getYear();
            }
        }

        // Calculate semester bounds (minSem & maxSem) based on year / semester
        Byte minSem = null;
        Byte maxSem = null;
        if (targetSem != null && targetSem > 0) {
            minSem = targetSem;
            maxSem = targetSem;
        } else if (targetYear != null && targetYear > 0) {
            minSem = (byte) ((targetYear * 2) - 1);
            maxSem = (byte) (targetYear * 2);
        }

        boolean isCse = isCseDepartment(targetDept);

        Set<Long> bookmarkedIds = Set.of();
        if (currentUser != null) {
            bookmarkedIds = new java.util.HashSet<>(bookmarkRepo.findResourceIdsByUserId(currentUser.getId()));
        }
        final Set<Long> finalBookmarkedIds = bookmarkedIds;

        return resourceRepo.findAllWithFilters(type, subject, targetDegree, targetDept, isCse, minSem, maxSem, chapter, pageable)
                .map(r -> toDto(r, finalBookmarkedIds.contains(r.getId())));
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctSubjects() {
        return resourceRepo.findDistinctSubjects();
    }

    @Transactional(readOnly = true)
    public Page<ResourceDTO> getBookmarkedResources(Long userId, Pageable pageable) {
        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        if (targetUserId == null) return Page.empty();
        return bookmarkRepo.findByIdUserIdOrderBySavedAtDesc(targetUserId, pageable)
                .map(bm -> toDto(bm.getResource(), true));
    }

    @Transactional(readOnly = true)
    public Page<ResourceDTO> getUserResources(Long uploaderId, Pageable pageable) {
        return resourceRepo.findByUploaderIdAndIsDeletedFalse(uploaderId, pageable)
                .map(r -> toDto(r, false));
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ResourceDTO getById(Long id, Long requestingUserId) {
        Resource r = findActiveOrThrow(id);
        Long targetUserId = requestingUserId;
        if (targetUserId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        boolean bookmarked = targetUserId != null &&
                bookmarkRepo.existsByIdUserIdAndIdResourceId(targetUserId, id);
        ResourceDTO dto = toDto(r, bookmarked);
        return dto;
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    @Transactional
    public ResourceDTO upload(MultipartFile file, ResourceMetadataRequest meta, Long uploaderId) {
        validateMimeType(file);

        if (meta == null || meta.getSubject() == null || meta.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required when uploading a resource.");
        }
        if (meta.getSemester() == null) {
            throw new IllegalArgumentException("Semester is required when uploading a resource.");
        }

        User uploader = null;
        if (uploaderId != null) {
            uploader = userRepo.findById(uploaderId).orElse(null);
        }
        if (uploader == null) {
            uploader = userRepo.findAll().stream().findFirst().orElseGet(() -> {
                User defaultUser = User.builder()
                        .name("Archive Student")
                        .email("student@archive.edu")
                        .passwordHash("hashed_pwd_stub")
                        .role(User.Role.STUDENT)
                        .build();
                return userRepo.save(defaultUser);
            });
        }

        String objectKey = storageService.uploadFile(file, "resources");
        String ext = extractExtension(file.getOriginalFilename());

        String title = (meta != null && meta.getTitle() != null && !meta.getTitle().isBlank())
                ? meta.getTitle().trim()
                : (file.getOriginalFilename() != null ? file.getOriginalFilename() : "Untitled Resource");

        String degree = (uploader != null && uploader.getRole() == User.Role.STUDENT && uploader.getDegree() != null && !uploader.getDegree().isBlank())
                ? uploader.getDegree()
                : ((meta != null && meta.getDegree() != null && !meta.getDegree().isBlank())
                        ? meta.getDegree()
                        : (uploader != null && uploader.getDegree() != null ? uploader.getDegree() : "B.Tech"));

        String dept = (uploader != null && uploader.getRole() == User.Role.STUDENT && uploader.getDepartment() != null && !uploader.getDepartment().isBlank())
                ? uploader.getDepartment()
                : ((meta != null && meta.getDepartment() != null && !meta.getDepartment().isBlank())
                        ? meta.getDepartment()
                        : (uploader != null && uploader.getDepartment() != null ? uploader.getDepartment() : ""));

        String desc = meta != null && meta.getDescription() != null ? meta.getDescription() : "";
        String subj = meta != null && meta.getSubject() != null ? meta.getSubject() : "";

        com.archive.common.service.AiModerationService.ModerationResult modResult =
                aiModerationService.evaluate(file, title, desc, subj, ext);

        Resource resource = Resource.builder()
                .uploader(uploader)
                .title(title)
                .description(desc)
                .type(meta != null && meta.getType() != null ? meta.getType() : Resource.ResourceType.OTHER)
                .subject(subj)
                .degree(degree)
                .department(dept)
                .semester(meta != null ? meta.getSemester() : null)
                .chapter(meta != null ? meta.getChapter() : "")
                .fileKey(objectKey)
                .fileType(ext)
                .fileSizeKb((int) Math.max(1, file.getSize() / 1024))
                .downloadCount(0)
                .bookmarkCount(0)
                .status(modResult.getStatus())
                .moderationFlag(modResult.getModerationFlag())
                .aiNotice(modResult.getAiNotice())
                .build();

        resource = resourceRepo.save(resource);
        log.info("Resource uploaded: id={} status={} flag={} by userId={}",
                resource.getId(), resource.getStatus(), resource.getModerationFlag(), uploader.getId());
        return toDto(resource, false);
    }

    // ── Admin Moderation ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ResourceDTO> getPendingModerationResources(Pageable pageable) {
        return resourceRepo.findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                Resource.Status.PENDING_REVIEW, pageable
        ).map(r -> toDto(r, false));
    }

    @Transactional
    public ResourceDTO approveResource(Long id) {
        Resource r = findActiveOrThrow(id);
        r.setStatus(Resource.Status.APPROVED);
        r.setModerationFlag(null);
        r.setAiNotice(null);
        return toDto(resourceRepo.save(r), false);
    }

    @Transactional
    public void rejectResource(Long id) {
        Resource r = findActiveOrThrow(id);
        r.setStatus(Resource.Status.REJECTED);
        r.setIsDeleted(true);
        resourceRepo.save(r);
    }

    // ── Update metadata ───────────────────────────────────────────────────────

    @Transactional
    public ResourceDTO updateMetadata(Long id, ResourceMetadataRequest meta, Long userId) {
        Resource r = findActiveOrThrow(id);
        requireAuthor(r, userId);

        r.setTitle(meta.getTitle());
        r.setDescription(meta.getDescription());
        if (meta.getType() != null) r.setType(meta.getType());
        r.setSubject(meta.getSubject());
        r.setDepartment(meta.getDepartment());
        r.setSemester(meta.getSemester());
        r.setChapter(meta.getChapter());

        return toDto(resourceRepo.save(r), false);
    }

    // ── Soft delete ───────────────────────────────────────────────────────────

    @Transactional
    public void softDelete(Long id, Long userId, User.Role role) {
        Resource r = findActiveOrThrow(id);
        r.setIsDeleted(true);
        resourceRepo.save(r);
        log.info("Resource soft-deleted: id={} by userId={}", id, userId);
    }

    // ── Fulltext search ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ResourceDTO> search(String query, Long requestingUserId, Pageable pageable) {
        User user = (requestingUserId != null) ? userRepo.findById(requestingUserId).orElse(null) : null;
        if (user == null) {
            user = userRepo.findAll().stream().findFirst().orElse(null);
        }

        String degree = (user != null && user.getRole() == User.Role.STUDENT) ? user.getDegree() : null;
        String dept = (user != null && user.getRole() == User.Role.STUDENT) ? user.getDepartment() : null;
        boolean isCse = isCseDepartment(dept);
        Byte minSem = null;
        Byte maxSem = null;
        if (user != null && user.getRole() == User.Role.STUDENT && user.getYear() != null && user.getYear() > 0) {
            minSem = (byte) ((user.getYear() * 2) - 1);
            maxSem = (byte) (user.getYear() * 2);
        }

        Set<Long> bookmarkedIds = Set.of();
        if (user != null) {
            bookmarkedIds = new java.util.HashSet<>(bookmarkRepo.findResourceIdsByUserId(user.getId()));
        }
        final Set<Long> finalBookmarkedIds = bookmarkedIds;

        return resourceRepo.searchByKeywordScoped(query, degree, dept, isCse, minSem, maxSem, pageable)
                .map(r -> toDto(r, finalBookmarkedIds.contains(r.getId())));
    }

    // ── Toggle bookmark ───────────────────────────────────────────────────────

    @Transactional
    public boolean toggleBookmark(Long resourceId, Long userId) {
        findActiveOrThrow(resourceId);
        Long targetUserId = userId;
        if (targetUserId == null) {
            User defaultUser = userRepo.findAll().stream().findFirst().orElse(null);
            if (defaultUser != null) targetUserId = defaultUser.getId();
        }
        if (targetUserId == null) return false;

        var bookmarkId = new ResourceBookmark.ResourceBookmarkId(targetUserId, resourceId);

        if (bookmarkRepo.existsById(bookmarkId)) {
            bookmarkRepo.deleteById(bookmarkId);
            resourceRepo.adjustBookmarkCount(resourceId, -1);
            return false; // now un-bookmarked
        } else {
            User user = userRepo.getReferenceById(targetUserId);
            Resource resource = resourceRepo.getReferenceById(resourceId);
            ResourceBookmark bm = new ResourceBookmark(bookmarkId, user, resource, java.time.Instant.now());
            bookmarkRepo.save(bm);
            resourceRepo.adjustBookmarkCount(resourceId, +1);
            return true; // now bookmarked
        }
    }

    // ── Preview (presigned URL without counter increment) ──────────────────────

    @Transactional(readOnly = true)
    public String getPreviewUrl(Long id) {
        Resource r = findActiveOrThrow(id);
        return storageService.presignedDownloadUrl(r.getFileKey());
    }

    // ── Download (increment counter + presigned URL) ──────────────────────────

    @Transactional
    public String getDownloadUrl(Long id) {
        Resource r = findActiveOrThrow(id);
        resourceRepo.incrementDownloadCount(id);
        return storageService.presignedDownloadUrl(r.getFileKey());
    }

    // ── Recommended Resources ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ResourceDTO> getRecommended(Long userId) {
        User user = userId != null ? userRepo.findById(userId).orElse(null) : null;
        String degree = (user != null && user.getRole() == User.Role.STUDENT) ? user.getDegree() : null;
        String dept = (user != null && user.getRole() == User.Role.STUDENT) ? user.getDepartment() : null;
        boolean isCse = isCseDepartment(dept);
        Byte minSem = null;
        Byte maxSem = null;
        if (user != null && user.getYear() != null && user.getYear() > 0) {
            minSem = (byte) ((user.getYear() * 2) - 1);
            maxSem = (byte) (user.getYear() * 2);
        }

        List<Resource> list = resourceRepo.findRecommended(degree, dept, isCse, minSem, maxSem, PageRequest.of(0, 10));
        return list.stream().map(r -> toDto(r, false)).toList();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Resource findActiveOrThrow(Long id) {
        Resource r = resourceRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Resource not found: " + id));
        if (r.getIsDeleted()) throw new EntityNotFoundException("Resource not found: " + id);
        return r;
    }

    private void requireAuthor(Resource r, Long userId) {
        if (!r.getUploader().getId().equals(userId)) {
            throw new AccessDeniedException("Only the uploader can modify this resource.");
        }
    }

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream",
            "application/x-pdf",
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "text/plain", "text/markdown", "text/csv", "text/html"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
            "jpg", "jpeg", "png", "gif", "webp", "svg", "txt", "md", "csv", "zip", "rar"
    );

    private void validateMimeType(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty.");
        }
        String contentType = file.getContentType();
        String ext = extractExtension(file.getOriginalFilename());

        boolean validMime = contentType != null && ALLOWED_MIME_TYPES.contains(contentType.toLowerCase());
        boolean validExt = ext != null && ALLOWED_EXTENSIONS.contains(ext.toLowerCase());

        if (!validMime && !validExt) {
            throw new IllegalArgumentException(
                    "Unsupported file format (" + (ext.isEmpty() ? contentType : "." + ext) +
                    "). Allowed formats: PDF, Word, PowerPoint, Excel, Images, Text.");
        }
    }

    private ResourceDTO toDto(Resource r, boolean bookmarked) {
        ResourceDTO dto = ResourceDTO.from(r, UserDTO.from(r.getUploader()));
        dto.setBookmarked(bookmarked);
        Double avg = reviewRepo.getAverageRating(r.getId());
        dto.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : null);
        dto.setReviewCount((int) reviewRepo.countByResourceId(r.getId()));
        return dto;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
