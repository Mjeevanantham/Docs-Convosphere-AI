-- ============================================================
-- Convosphere DB Schema Sync Fix
-- Applied: 2026-04-18
-- Root cause: password_set column existed in Prisma schema and
-- application code, but was never run against the Supabase DB.
-- No _prisma_migrations table exists, so migrations were never
-- tracked/run via Prisma CLI against this database.
-- ============================================================

-- FIX 1 (ALREADY APPLIED): Add missing password_set column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false;

-- Backfill: credentials users have explicitly set a password
UPDATE users SET password_set = true WHERE provider = 'credentials';

-- Backfill: OAuth users have NOT set a password yet
UPDATE users SET password_set = false WHERE provider IN ('google', 'facebook', 'github');

-- ============================================================
-- STATUS REPORT (run these SELECTs to verify)
-- ============================================================

-- Verify password_set was added and backfilled correctly:
-- SELECT provider, password_set, COUNT(*) FROM users GROUP BY provider, password_set;
-- Expected:
--   credentials | true  | N
--   google      | false | 1

-- ============================================================
-- KNOWN SCHEMA GAPS (DB has these, Prisma schema was missing them)
-- These columns ALREADY EXIST in the DB — no action needed.
-- Prisma schema.prisma has been updated to reflect them.
-- ============================================================

-- users table extras (already in DB):
--   user_type, primary_email, secondary_email,
--   organization_id, organization_name, campus_name,
--   user_type_selected_at

-- audit_logs table extras (already in DB):
--   session_id, success, error_message, request_id

-- tickets table extras (already in DB):
--   agent_id, conversation_context, tags,
--   due_date, closed_at, closed_by, resolution_notes

-- ============================================================
-- TABLES IN DB NOT IN PRISMA (exist in Supabase, Prisma not tracking)
-- These are safe - just not managed by Prisma schema.
-- ============================================================
--   config_templates
--   credit_config
--   global_instruction_history
--   global_instructions
--   service_api_keys
--   service_configs
--   system_alerts
--   ticket_attachments
--   ticket_comments
--   user_notifications
