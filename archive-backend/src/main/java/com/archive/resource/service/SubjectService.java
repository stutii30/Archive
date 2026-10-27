package com.archive.resource.service;

import com.archive.auth.entity.User;
import com.archive.auth.repository.UserRepository;
import com.archive.resource.dto.CreateSubjectRequest;
import com.archive.resource.dto.SubjectDTO;
import com.archive.resource.entity.Subject;
import com.archive.resource.repository.ResourceRepository;
import com.archive.resource.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepo;
    private final ResourceRepository resourceRepo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public List<SubjectDTO> getSubjects(String department, Byte semester) {
        Map<String, SubjectDTO> subjectMap = new LinkedHashMap<>();

        // 1. Fetch created subjects from Subject table
        try {
            List<Subject> subjects = subjectRepo.findScopedSubjects(department, semester);
            if (subjects != null) {
                for (Subject s : subjects) {
                    SubjectDTO dto = toDto(s);
                    subjectMap.put(dto.getName().trim().toLowerCase(), dto);
                }
            }
        } catch (Exception e) {
            log.warn("Could not query subjects table: {}", e.getMessage());
        }

        // 2. Fetch distinct subjects from resources table and merge
        try {
            List<String> distinct = resourceRepo.findDistinctSubjectsByDepartment(department);
            long idCounter = 10000;
            for (String str : distinct) {
                if (str != null && !str.isBlank()) {
                    String key = str.trim().toLowerCase();
                    if (!subjectMap.containsKey(key)) {
                        subjectMap.put(key, SubjectDTO.builder()
                                .id(idCounter++)
                                .name(str.trim())
                                .code(str.trim().toUpperCase().replaceAll("[^A-Z0-9]", ""))
                                .department(department)
                                .semester(semester)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Distinct resource subject query failed: {}", ex.getMessage());
        }

        return new ArrayList<>(subjectMap.values());
    }

    @Transactional
    public SubjectDTO createSubject(CreateSubjectRequest req, Long userId) {
        String cleanCode = req.getCode().trim().toUpperCase();
        String cleanName = req.getName().trim();

        String dept = req.getDepartment();
        Byte sem = req.getSemester();

        if (userId != null && (dept == null || dept.isBlank())) {
            User user = userRepo.findById(userId).orElse(null);
            if (user != null) {
                dept = user.getDepartment();
                if (sem == null && user.getYear() != null) {
                    sem = (byte) (user.getYear() * 2);
                }
            }
        }

        // Check for duplicate: same code within the same department (or globally if no dept)
        boolean exists = (dept != null && !dept.isBlank())
                ? subjectRepo.existsByCodeIgnoreCaseAndDepartmentIgnoreCase(cleanCode, dept)
                : subjectRepo.existsByCodeIgnoreCase(cleanCode);

        if (exists) {
            String scope = (dept != null && !dept.isBlank()) ? " in department " + dept : " (global)";
            throw new IllegalArgumentException("Subject code '" + cleanCode + "' already exists" + scope + ".");
        }

        User creator = (userId != null) ? userRepo.findById(userId).orElse(null) : null;

        Subject subject = Subject.builder()
                .creator(creator)
                .name(cleanName)
                .code(cleanCode)
                .department((dept != null && !dept.isBlank()) ? dept : null)
                .semester(sem)
                .build();

        try {
            Subject saved = subjectRepo.save(subject);
            log.info("Created subject: code={}, dept={}, sem={}, creatorId={}", cleanCode, dept, sem, userId);
            return toDto(saved);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Race condition — another request created the same subject between our check and save
            throw new IllegalArgumentException("Subject code '" + cleanCode + "' already exists (concurrent creation).");
        }
    }

    @Transactional
    public void deleteSubject(Long id, Long userId) {
        Subject subject = subjectRepo.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Subject not found with id: " + id));

        User user = (userId != null) ? userRepo.findById(userId).orElse(null) : null;
        boolean isCreator = subject.getCreator() == null || (userId != null && subject.getCreator().getId().equals(userId));
        boolean isAdminOrMod = user != null && (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.MODERATOR);

        if (!isCreator && !isAdminOrMod) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this subject");
        }

        // Soft delete all resources associated with this subject
        if (subject.getName() != null && !subject.getName().isBlank()) {
            int count = resourceRepo.softDeleteBySubjectName(subject.getName().trim());
            log.info("Soft deleted {} resources associated with subject '{}'", count, subject.getName());
        }

        subjectRepo.delete(subject);
        log.info("Deleted subject: id={}, name={}, by userId={}", id, subject.getName(), userId);
    }

    private SubjectDTO toDto(Subject s) {
        return SubjectDTO.builder()
                .id(s.getId())
                .creatorId(s.getCreator() != null ? s.getCreator().getId() : null)
                .name(s.getName())
                .code(s.getCode())
                .department(s.getDepartment())
                .semester(s.getSemester())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
