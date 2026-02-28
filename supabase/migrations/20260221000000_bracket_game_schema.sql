-- game: tracks each of the 63 NCAA tournament games per tournament year.
-- bracket_advancement: static 62-row table encoding the binary tree structure
--   (from_slot → to_slot) used by the sync service to advance winners.

create table game (
  id              uuid    primary key default gen_random_uuid(),
  tournament_id   uuid    not null references tournament(id),
  slot            integer not null,
  round           integer not null, -- 1=R64, 2=R32, 3=S16, 4=E8, 5=F4, 6=Championship
  region          text,             -- 'South'/'East'/'West'/'Midwest', null for slots 1-3
  team_one_id     uuid    references tournament_team(id),
  team_two_id     uuid    references tournament_team(id),
  team_one_score  integer,
  team_two_score  integer,
  status          text    not null default 'scheduled', -- 'scheduled'/'in_progress'/'final'
  time_remaining  text,
  espn_game_id    text,
  processed       boolean not null default false,
  unique (tournament_id, slot)
);

create table bracket_advancement (
  from_slot integer primary key,
  to_slot   integer not null
);

-- Seed all 62 advancement rows (slots 2–63 → floor(slot/2)).
insert into bracket_advancement (from_slot, to_slot) values
  (2,  1), (3,  1),
  (4,  2), (5,  2), (6,  3), (7,  3),
  (8,  4), (9,  4), (10, 5), (11, 5), (12, 6), (13, 6), (14, 7), (15, 7),
  (16,  8), (17,  8), (18,  9), (19,  9), (20, 10), (21, 10),
  (22, 11), (23, 11), (24, 12), (25, 12), (26, 13), (27, 13),
  (28, 14), (29, 14), (30, 15), (31, 15),
  (32, 16), (33, 16), (34, 17), (35, 17), (36, 18), (37, 18), (38, 19), (39, 19),
  (40, 20), (41, 20), (42, 21), (43, 21), (44, 22), (45, 22), (46, 23), (47, 23),
  (48, 24), (49, 24), (50, 25), (51, 25), (52, 26), (53, 26), (54, 27), (55, 27),
  (56, 28), (57, 28), (58, 29), (59, 29), (60, 30), (61, 30), (62, 31), (63, 31);

-- RLS: public read, writes restricted to service role.
alter table game enable row level security;
create policy "Public read" on game for select using (true);

alter table bracket_advancement enable row level security;
create policy "Public read" on bracket_advancement for select using (true);
