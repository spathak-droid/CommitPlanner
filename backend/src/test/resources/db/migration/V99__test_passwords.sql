-- Test-only migration: no-op since V8 already sets BCrypt hashes for all active users
-- BCrypt hash for "password123" with cost 12 is set by V8__bcrypt_passwords.sql
-- This file is retained as a placeholder to avoid Flyway checksum errors
SELECT 1;
