package com.archive.storage;

import io.minio.*;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * StorageService — handles file uploads to MinIO with an automated local disk fallback
 * if MinIO is offline or unavailable.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;

    @Value("${storage.bucket}")
    private String bucket;

    private final Path localUploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    /** Ensure the bucket exists or create local fallback upload folder. */
    @PostConstruct
    public void ensureBucket() {
        try {
            Files.createDirectories(localUploadDir);
        } catch (Exception e) {
            log.warn("Could not create local upload dir: {}", e.getMessage());
        }

        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.warn("Could not verify/create MinIO bucket '{}' (will use local fallback): {}", bucket, e.getMessage());
        }
    }

    /**
     * Upload a file to local disk (primary) and MinIO (optional secondary backup).
     */
    public String uploadFile(MultipartFile file, String folder) {
        String ext = extractExtension(file.getOriginalFilename());
        String objectKey = folder + "/" + UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Could not read uploaded file bytes: " + e.getMessage(), e);
        }

        saveToLocalDiskBytes(fileBytes, objectKey);

        // Attempt MinIO upload as secondary backup if configured and online
        try (InputStream is = new java.io.ByteArrayInputStream(fileBytes)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .stream(is, fileBytes.length, -1)
                            .contentType(file.getContentType())
                            .build());
            log.debug("Uploaded file to MinIO: {}", objectKey);
        } catch (Exception e) {
            log.warn("MinIO upload skipped ({}), using local storage", e.getMessage());
        }

        return objectKey;
    }

    /**
     * Generate a download URL — returns MinIO presigned URL or local fallback URL.
     */
    public String presignedDownloadUrl(String objectKey) {
        // If file exists on local disk, return local endpoint
        Path localPath = localUploadDir.resolve(objectKey).normalize();
        if (Files.exists(localPath)) {
            return "/api/storage/files/" + objectKey;
        }

        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(objectKey)
                            .expiry(1, TimeUnit.HOURS)
                            .build());
        } catch (Exception e) {
            log.warn("Could not generate MinIO presigned URL ({}), using local fallback URL", e.getMessage());
            return "/api/storage/files/" + objectKey;
        }
    }

    /**
     * Delete an object from MinIO and local disk.
     */
    public void deleteFile(String objectKey) {
        try {
            Path localPath = localUploadDir.resolve(objectKey).normalize();
            Files.deleteIfExists(localPath);
        } catch (Exception ignored) {}

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder().bucket(bucket).object(objectKey).build());
            log.debug("Deleted MinIO object: {}", objectKey);
        } catch (Exception e) {
            log.warn("Could not delete MinIO object '{}': {}", objectKey, e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String saveToLocalDiskBytes(byte[] bytes, String objectKey) {
        try {
            Path targetPath = localUploadDir.resolve(objectKey).normalize();
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, bytes);
            log.info("Saved file locally to: {}", targetPath);
            return objectKey;
        } catch (Exception ex) {
            throw new RuntimeException("File storage failed on local disk: " + ex.getMessage(), ex);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
