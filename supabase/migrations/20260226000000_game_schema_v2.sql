-- game_schema_v2: rename home/away columns, replace text status with integer status + detail.
-- No data backfill needed — no existing rows in game table.

-- Drop removed column
alter table game drop column time_remaining;

-- Rename team columns
alter table game rename column team_one_id    to home_team_id;
alter table game rename column team_two_id    to away_team_id;
alter table game rename column team_one_score to home_score;
alter table game rename column team_two_score to away_score;

-- Rename status text → detail
alter table game rename column status to detail;

-- Add integer status column
-- 1 = scheduled, 2 = in progress, 3 = final  (matches ESPN status.type.id)
alter table game add column status integer not null default 1;
