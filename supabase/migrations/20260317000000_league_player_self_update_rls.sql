-- Allow authenticated users to update their own league_player row.
-- The application only sends `name` and `profile_pic` in its update payload.
-- Postgres RLS does not restrict by column; the app enforces column scope.
-- This policy is additive to the existing "Commissioner update" policy —
-- Postgres ORs multiple permissive policies, so both apply independently.
create policy "Self update"
on league_player for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Allow authenticated users to INSERT objects in their own league-player folder.
-- Path format: league-players/{leaguePlayerId}/profile
-- storage.foldername() is a Supabase built-in available in local and hosted environments.
create policy "league_player_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'TheDanceDraft'
  and (storage.foldername(name))[1] = 'league-players'
  and (storage.foldername(name))[2] in (
    select id::text from league_player where user_id = auth.uid()
  )
);

-- Allow authenticated users to UPDATE (upsert) objects in their own league-player folder.
create policy "league_player_storage_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'TheDanceDraft'
  and (storage.foldername(name))[1] = 'league-players'
  and (storage.foldername(name))[2] in (
    select id::text from league_player where user_id = auth.uid()
  )
);
