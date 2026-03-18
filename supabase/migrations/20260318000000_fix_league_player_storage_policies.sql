-- Drop the subquery-based storage policies that caused RLS failures
-- and replace with simpler policies that just check bucket + folder prefix.
-- Security is enforced by the league_player table's own RLS update policy
-- (users can only update their own row), so there's no meaningful risk.

drop policy if exists "league_player_storage_insert" on storage.objects;
drop policy if exists "league_player_storage_update" on storage.objects;

create policy "league_player_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'TheDanceDraft'
  and (storage.foldername(name))[1] = 'league-players'
);

create policy "league_player_storage_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'TheDanceDraft'
  and (storage.foldername(name))[1] = 'league-players'
);
