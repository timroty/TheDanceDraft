-- League management layer: leagues, players, seasons, scoring, and draft picks
-- on top of the existing tournament/game infrastructure.

create table league (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  commissioner_id uuid        not null references auth.users(id),
  created_at      timestamptz not null default now()
);

create table league_player (
  id          uuid        primary key default gen_random_uuid(),
  league_id   uuid        not null references league(id) on delete cascade,
  user_id     uuid        references auth.users(id),
  name        text        not null,
  profile_pic text,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

create table league_season (
  id            uuid        primary key default gen_random_uuid(),
  league_id     uuid        not null references league(id) on delete cascade,
  tournament_id uuid        not null references tournament(id),
  created_at    timestamptz not null default now(),
  unique (league_id, tournament_id)
);

create table league_season_scoring (
  id               uuid    primary key default gen_random_uuid(),
  league_season_id uuid    not null references league_season(id) on delete cascade,
  seed             integer not null check (seed >= 1 and seed <= 16),
  points           integer not null check (points >= 0),
  unique (league_season_id, seed)
);

create table league_season_player (
  id                 uuid primary key default gen_random_uuid(),
  league_season_id   uuid not null references league_season(id) on delete cascade,
  league_player_id   uuid not null references league_player(id) on delete cascade,
  tournament_team_id uuid not null references tournament_team(id),
  unique (league_season_id, tournament_team_id)
);

-- RLS: public read on all tables
alter table league enable row level security;
create policy "Public read" on league for select using (true);

alter table league_player enable row level security;
create policy "Public read" on league_player for select using (true);

alter table league_season enable row level security;
create policy "Public read" on league_season for select using (true);

alter table league_season_scoring enable row level security;
create policy "Public read" on league_season_scoring for select using (true);

alter table league_season_player enable row level security;
create policy "Public read" on league_season_player for select using (true);

-- RLS: commissioner writes on league
create policy "Commissioner insert" on league for insert with check (auth.uid() = commissioner_id);
create policy "Commissioner update" on league for update using (auth.uid() = commissioner_id);
create policy "Commissioner delete" on league for delete using (auth.uid() = commissioner_id);

-- RLS: commissioner writes on child tables (join back to league for auth check)
create policy "Commissioner insert" on league_player for insert with check (
  auth.uid() = (select commissioner_id from league where id = league_id)
);
create policy "Commissioner update" on league_player for update using (
  auth.uid() = (select commissioner_id from league where id = league_id)
);
create policy "Commissioner delete" on league_player for delete using (
  auth.uid() = (select commissioner_id from league where id = league_id)
);

create policy "Commissioner insert" on league_season for insert with check (
  auth.uid() = (select commissioner_id from league where id = league_id)
);
create policy "Commissioner update" on league_season for update using (
  auth.uid() = (select commissioner_id from league where id = league_id)
);
create policy "Commissioner delete" on league_season for delete using (
  auth.uid() = (select commissioner_id from league where id = league_id)
);

create policy "Commissioner insert" on league_season_scoring for insert with check (
  auth.uid() = (select l.commissioner_id from league_season ls join league l on l.id = ls.league_id where ls.id = league_season_id)
);
create policy "Commissioner update" on league_season_scoring for update using (
  auth.uid() = (select l.commissioner_id from league_season ls join league l on l.id = ls.league_id where ls.id = league_season_id)
);
create policy "Commissioner delete" on league_season_scoring for delete using (
  auth.uid() = (select l.commissioner_id from league_season ls join league l on l.id = ls.league_id where ls.id = league_season_id)
);

create policy "Commissioner insert" on league_season_player for insert with check (
  auth.uid() = (select l.commissioner_id from league_season ls join league l on l.id = ls.league_id where ls.id = league_season_id)
);
create policy "Commissioner update" on league_season_player for update using (
  auth.uid() = (select l.commissioner_id from league_season ls join league l on l.id = ls.league_id where ls.id = league_season_id)
);
create policy "Commissioner delete" on league_season_player for delete using (
  auth.uid() = (select l.commissioner_id from league_season ls join league l on l.id = ls.league_id where ls.id = league_season_id)
);
