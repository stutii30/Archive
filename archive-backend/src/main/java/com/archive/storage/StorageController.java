package com.archive.storage;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/storage/files")
public class StorageController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    @GetMapping("/{folder}/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String folder, @PathVariable String filename) {
        try {
            Path filePath = uploadDir.resolve(folder).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = null;
                String lowerName = filename.toLowerCase();
                if (lowerName.endsWith(".pdf")) contentType = "application/pdf";
                else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (lowerName.endsWith(".png")) contentType = "image/png";
                else if (lowerName.endsWith(".gif")) contentType = "image/gif";
                else if (lowerName.endsWith(".webp")) contentType = "image/webp";
                else if (lowerName.endsWith(".txt")) contentType = "text/plain";
                else contentType = "application/octet-stream";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
