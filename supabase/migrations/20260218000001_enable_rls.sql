-- Enable RLS on all tables with public read access.
-- Writes are restricted to the service role key (server-side only).

alter table team enable row level security;
create policy "Public read" on team for select using (true);

alter table tournament enable row level security;
create policy "Public read" on tournament for select using (true);

alter table tournament_team enable row level security;
create policy "Public read" on tournament_team for select using (true);
