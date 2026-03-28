ALTER TABLE app_users ADD COLUMN email VARCHAR(255);
ALTER TABLE app_users ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;
