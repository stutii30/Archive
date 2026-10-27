package com.archive.resource.repository;

import com.archive.resource.entity.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    /** Paginated list with optional filters — only APPROVED and non-deleted. Uses Pageable sort. */
    @Query("""
            SELECT r FROM Resource r
            WHERE r.isDeleted = false
              AND r.status = com.archive.resource.entity.Resource.Status.APPROVED
              AND (:type     IS NULL OR r.type = :type)
              AND (:subject  IS NULL OR LOWER(r.subject) LIKE LOWER(CONCAT('%', :subject, '%')))
              AND (:degree   IS NULL OR LOWER(r.degree) = LOWER(:degree))
              AND (
                    :dept IS NULL
                    OR (:isCse = true AND (
                         LOWER(r.department) LIKE '%cse%'
                         OR LOWER(r.department) LIKE '%computer%'
                         OR LOWER(r.department) LIKE '%software%'
                       ))
                    OR (:isCse = false AND LOWER(r.department) LIKE LOWER(CONCAT('%', :dept, '%')))
                  )
              AND (:minSem IS NULL OR r.semester >= :minSem)
              AND (:maxSem IS NULL OR r.semester <= :maxSem)
              AND (:chapter  IS NULL OR LOWER(r.chapter) LIKE LOWER(CONCAT('%', :chapter, '%')))
            """)
    Page<Resource> findAllWithFilters(
            @Param("type")     Resource.ResourceType type,
            @Param("subject")  String subject,
            @Param("degree")   String degree,
            @Param("dept")     String dept,
            @Param("isCse")    boolean isCse,
            @Param("minSem")   Byte minSem,
            @Param("maxSem")   Byte maxSem,
            @Param("chapter")  String chapter,
            Pageable pageable);

    Page<Resource> findByUploaderIdAndIsDeletedFalse(Long uploaderId, Pageable pageable);

    long countByUploaderIdAndIsDeletedFalse(Long uploaderId);

    Page<Resource> findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(Resource.Status status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.downloadCount), 0) FROM Resource r WHERE r.uploader.id = :uploaderId AND r.isDeleted = false")
    long sumDownloadsByUploaderId(@Param("uploaderId") Long uploaderId);

    @Query("""
            SELECT r FROM Resource r
            WHERE r.isDeleted = false
              AND r.status = com.archive.resource.entity.Resource.Status.APPROVED
              AND (:degree   IS NULL OR LOWER(r.degree) = LOWER(:degree))
              AND (
                    :dept IS NULL
                    OR (:isCse = true AND (
                         LOWER(r.department) LIKE '%cse%'
                         OR LOWER(r.department) LIKE '%computer%'
                         OR LOWER(r.department) LIKE '%software%'
                       ))
                    OR (:isCse = false AND LOWER(r.department) LIKE LOWER(CONCAT('%', :dept, '%')))
                  )
              AND (:minSem IS NULL OR r.semester >= :minSem)
              AND (:maxSem IS NULL OR r.semester <= :maxSem)
            ORDER BY r.trendingScore DESC, r.createdAt DESC
            """)
    List<Resource> findRecommended(
            @Param("degree") String degree,
            @Param("dept")   String dept,
            @Param("isCse")  boolean isCse,
            @Param("minSem") Byte minSem,
            @Param("maxSem") Byte maxSem,
            Pageable pageable);

    @Query("""
            SELECT r FROM Resource r
            WHERE r.isDeleted = false
              AND r.status = com.archive.resource.entity.Resource.Status.APPROVED
              AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.subject) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.chapter) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.description) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Resource> searchByKeyword(@Param("q") String q, Pageable pageable);

    @Query("""
            SELECT r FROM Resource r
            WHERE r.isDeleted = false
              AND r.status = com.archive.resource.entity.Resource.Status.APPROVED
              AND (:degree   IS NULL OR LOWER(r.degree) = LOWER(:degree))
              AND (
                    :dept IS NULL
                    OR (:isCse = true AND (
                         LOWER(r.department) LIKE '%cse%'
                         OR LOWER(r.department) LIKE '%computer%'
                         OR LOWER(r.department) LIKE '%software%'
                       ))
                    OR (:isCse = false AND LOWER(r.department) LIKE LOWER(CONCAT('%', :dept, '%')))
                  )
              AND (:minSem IS NULL OR r.semester >= :minSem)
              AND (:maxSem IS NULL OR r.semester <= :maxSem)
              AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.subject) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.chapter) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(r.description) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<Resource> searchByKeywordScoped(
            @Param("q")      String q,
            @Param("degree") String degree,
            @Param("dept")   String dept,
            @Param("isCse")  boolean isCse,
            @Param("minSem") Byte minSem,
            @Param("maxSem") Byte maxSem,
            Pageable pageable);

    /** Increment download_count atomically. */
    @Modifying
    @Query("UPDATE Resource r SET r.downloadCount = r.downloadCount + 1 WHERE r.id = :id")
    void incrementDownloadCount(@Param("id") Long id);

    /** Increment or decrement bookmark_count atomically without dropping below 0. */
    @Modifying
    @Query("UPDATE Resource r SET r.bookmarkCount = GREATEST(0, r.bookmarkCount + :delta) WHERE r.id = :id")
    void adjustBookmarkCount(@Param("id") Long id, @Param("delta") int delta);

    /** Fetch list of distinct active subject names. */
    @Query("""
            SELECT DISTINCT r.subject FROM Resource r
            WHERE r.isDeleted = false
              AND r.subject IS NOT NULL AND TRIM(r.subject) <> ''
            ORDER BY r.subject ASC
            """)
    List<String> findDistinctSubjects();

    /** Fetch list of distinct active subject names scoped by department. */
    @Query("""
            SELECT DISTINCT r.subject FROM Resource r
            WHERE r.isDeleted = false
              AND r.subject IS NOT NULL AND TRIM(r.subject) <> ''
              AND (:dept IS NULL OR LOWER(r.department) = LOWER(:dept))
            ORDER BY r.subject ASC
            """)
    List<String> findDistinctSubjectsByDepartment(@Param("dept") String dept);

    /** Soft delete all active resources under a subject name. */
    @Modifying
    @Query("UPDATE Resource r SET r.isDeleted = true WHERE LOWER(r.subject) = LOWER(:subjectName)")
    int softDeleteBySubjectName(@Param("subjectName") String subjectName);

    int deleteByUploaderId(Long uploaderId);
}
