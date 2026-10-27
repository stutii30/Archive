package com.archive.auth.repository;

import com.archive.auth.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    @Query("""
            SELECT v FROM VerificationCode v
            WHERE LOWER(v.email) = LOWER(:email)
              AND v.purpose = :purpose
              AND v.code = :code
              AND v.used = false
            ORDER BY v.createdAt DESC
            LIMIT 1
            """)
    Optional<VerificationCode> findLatestValidCode(
            @Param("email") String email,
            @Param("purpose") VerificationCode.Purpose purpose,
            @Param("code") String code);

    void deleteByEmail(String email);
}
