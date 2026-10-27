package com.archive.resource.repository;

import com.archive.resource.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndDepartmentIgnoreCase(String code, String department);

    Optional<Subject> findByCodeIgnoreCase(String code);

    List<Subject> findAllByOrderByNameAsc();

    @Query("""
            SELECT s FROM Subject s
            WHERE (:dept IS NULL OR LOWER(s.department) = LOWER(:dept) OR s.department IS NULL OR TRIM(s.department) = '')
              AND (:sem IS NULL OR s.semester = :sem OR s.semester IS NULL)
            ORDER BY s.name ASC
            """)
    List<Subject> findScopedSubjects(@Param("dept") String department, @Param("sem") Byte semester);
}
