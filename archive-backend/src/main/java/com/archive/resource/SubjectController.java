package com.archive.resource;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.common.response.ApiResponse;
import com.archive.resource.dto.CreateSubjectRequest;
import com.archive.resource.dto.SubjectDTO;
import com.archive.resource.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;
    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<List<SubjectDTO>> getSubjects(
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

    @PostMapping
    public ApiResponse<SubjectDTO> createSubject(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody CreateSubjectRequest req) {
        return ApiResponse.ok(subjectService.createSubject(req, userId));
    }

    @DeleteMapping("/{id}")
    @org.springframework.web.bind.annotation.ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteSubject(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        subjectService.deleteSubject(id, userId);
    }
}
