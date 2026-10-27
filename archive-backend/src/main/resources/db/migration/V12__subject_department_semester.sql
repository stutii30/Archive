-- V12: Add department and semester columns to subjects table
ALTER TABLE subjects ADD COLUMN department VARCHAR(100) NULL AFTER code;
ALTER TABLE subjects ADD COLUMN semester TINYINT NULL AFTER department;
ALTER TABLE subjects DROP INDEX uk_subjects_code;
ALTER TABLE subjects ADD INDEX idx_subjects_dept_sem (department, semester);
