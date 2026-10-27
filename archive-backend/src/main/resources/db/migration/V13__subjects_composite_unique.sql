-- V13: Add composite unique constraint on subjects (code, department)
--      This allows the same subject code in different departments but prevents
--      exact duplicates within the same department.
--      NULL department is treated as a global subject (one per code allowed when dept IS NULL).

ALTER TABLE subjects
    ADD CONSTRAINT uk_subjects_code_dept UNIQUE (code, department);
