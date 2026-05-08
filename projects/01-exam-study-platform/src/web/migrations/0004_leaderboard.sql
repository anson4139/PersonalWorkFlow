-- P4: Leaderboard table
-- One record per (email, subject_key, date).
-- When a user submits again on the same day for the same subject,
-- we keep only the highest score via INSERT OR REPLACE with the MAX logic
-- handled in the API layer.

CREATE TABLE IF NOT EXISTS leaderboard (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT    NOT NULL,
  display_name      TEXT,
  subject_key       TEXT    NOT NULL,
  score             INTEGER NOT NULL,
  monsters_defeated INTEGER NOT NULL DEFAULT 0,
  submitted_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Prevent duplicate entries for the same person + subject + calendar day.
-- The API upserts by deleting the old row first (replace-on-better pattern).
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_email_subject_day
  ON leaderboard(email, subject_key, date(submitted_at));
