-- 004_pending_totp.sql
-- Add pending_totp_secret column to admin_users to avoid prematurely disabling active 2FA during setup
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS pending_totp_secret TEXT;
