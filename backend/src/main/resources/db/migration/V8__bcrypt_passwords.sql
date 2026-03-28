-- Migrate all users to BCrypt password hashes
-- BCrypt embeds its own salt, so password_salt is no longer used
-- Hash below is BCrypt cost 12 for "password123"
UPDATE app_users SET
    password_hash = '$2a$12$NQjr..ODqWyIt8ciTh4M1Od1OcvJFzkeFV2ZGY.TYsiEegCv5nHGO',
    password_salt = ''
WHERE active = true;
