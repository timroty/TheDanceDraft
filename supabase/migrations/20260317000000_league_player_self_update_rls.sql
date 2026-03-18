-- Allow authenticated users to update their own league_player row.
create policy "Self update"
on league_player for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Allow authenticated users to INSERT objects in their own league-player folder.
-- Path format: league-players/{leaguePlayerId}/profile
create policy "league_player_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'TheDanceDraft'
  and (storage.foldername(name))[1] = 'league-players'
  and (storage.foldername(name))[2] in (
    select (league_player.id)::text as id
    from league_player
    where league_player.user_id = auth.uid()
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
    select (league_player.id)::text as id
    from league_player
    where league_player.user_id = auth.uid()
  )
);
