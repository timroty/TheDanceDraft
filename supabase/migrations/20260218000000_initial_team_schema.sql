create table team (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo_url   text,
  espn_id    text
);

create table tournament (
  id   uuid    primary key default gen_random_uuid(),
  year integer not null unique
);

create table tournament_team (
  id            uuid    primary key default gen_random_uuid(),
  tournament_id uuid    not null references tournament(id),
  team_id       uuid    not null references team(id),
  seed          integer not null,
  unique (tournament_id, team_id)
);
