# League Player Settings — Design Spec

**Date:** 2026-03-17
**Status:** Approved

## Overview

Add a settings page per league that allows any league member to update their display name and profile picture for that league. A settings button on the league detail page navigates to this page.

## Routing & Navigation

- New route: `/leagues/[leagueId]/settings`
- The league detail page (`frontend/app/(app)/leagues/[leagueId]/page.tsx`) has a `LeagueContent` inner async function and a `LeaguePage` outer default export that wraps it in `<Suspense>`. The `<h1>` is inside `LeagueContent`, inside a `flex flex-col gap-6` div. **Edit `LeagueContent`** — not `LeaguePage`.
- Replace the `<h1>` with a `flex items-center justify-between` header row containing the league name and a settings icon button:
  ```tsx
  <Button asChild variant="ghost" size="icon">
    <Link href={`/leagues/${leagueId}/settings`}>
      <Settings className="size-4" />
    </Link>
  </Button>
  ```
- The settings button is shown only when `leaguePlayer !== null`. The `leaguePlayer` record is already fetched in `LeagueContent` (lines 63–70 of `page.tsx`), so no additional data fetching is needed. This differs from the seasons page, where the settings button is rendered unconditionally — the league player settings page requires a `league_player` row, so it must be guarded.

## Settings Page

**File:** `frontend/app/(app)/leagues/[leagueId]/settings/page.tsx`

A plain `async` default export — no Suspense wrapper needed. The page redirects immediately for unauthenticated users and has no incremental loading to stream.

Add `export const dynamic = 'force-dynamic'` to prevent stale data after `router.refresh()`.

The page:
1. Fetches the current user via `supabase.auth.getUser()`
2. If no authenticated user, redirects to `/leagues/[leagueId]`
3. Fetches the user's `league_player` record matching `user_id = auth.uid()` and `league_id`
4. If no matching `league_player` row, redirects to `/leagues/[leagueId]`
5. Passes the full `league_player` record (including `id`, `name`, `profile_pic`) to `<LeaguePlayerSettingsForm />`

The page includes a back arrow (`<ArrowLeft className="size-5" />`) linking to `/leagues/[leagueId]`, consistent with the existing season settings page pattern.

**Client Component:** `LeaguePlayerSettingsForm`

Props: full `league_player` record.

A single form (no tabs) with:
- **Display name** — text input pre-populated with `league_player.name`
  - Required; empty/whitespace-only value blocks submission with an inline error
  - Max length: 100 characters (client-side)
- **Profile picture** — file input; accepts `image/jpeg`, `image/png`, `image/webp`, `image/gif` only
  - Client-side validation: reject files not matching accepted MIME types (check `file.type`)
  - Client-side validation: reject files where `file.size > 50 * 1024 * 1024` (50 MB)
  - Both validations show inline errors and block submission

> **Security note:** All validation is intentionally client-side only. Server-side enforcement is out of scope for this feature; the Supabase Storage `file_size_limit = "50MiB"` config provides a backstop for file size.

On save:
1. If a new image was selected:
   - Upload to `TheDanceDraft` bucket at the **fixed path** `league-players/{leaguePlayerId}/profile` using `upsert: true`. This overwrites any existing file at that path — no deletion step needed, no orphaned files.
   - The public URL is stable and does not change between uploads, so `profile_pic` only needs to be written to the DB on the first upload (when it is `null`). On subsequent uploads, the file is replaced in-place and the stored URL remains valid. For simplicity, always include the public URL in the update payload regardless.
2. If no file selected and `profile_pic` is `null`: omit `profile_pic` from the update payload entirely.
3. Update `league_player` row: set `name` (trimmed) and (if a new image was uploaded) `profile_pic` to the public URL.
4. Call `router.refresh()` to re-fetch updated server data.
5. Show success toast via Sonner on completion (`<Toaster />` is already in the root layout).
6. Show error toast if the update fails; do not navigate away on error.

> **RLS semantics note (for migration author):** Postgres evaluates multiple permissive policies with OR logic — both the existing commissioner UPDATE policy and the new `league_player_self_update` policy are additive. There is no conflict; each grants access to its respective set of rows.

## Supabase Storage

- **Bucket:** `TheDanceDraft` (already exists and is public — verify exact casing before running migrations)
- **Upload path:** `league-players/{leaguePlayerId}/profile` (fixed, constant per player; uploaded with `upsert: true`)
- **Stored value:** Full public URL (stable across re-uploads; works on unauthenticated share pages)
- **Storage RLS policies** (added via migration on `storage.objects`):

  > `storage.foldername()` is a Supabase built-in available in both local (Supabase CLI) and hosted environments.

  ```sql
  -- INSERT (first upload)
  CREATE POLICY "league_player_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'TheDanceDraft'
    AND (storage.foldername(name))[1] = 'league-players'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM league_player WHERE user_id = auth.uid()
    )
  );

  -- UPDATE (upsert overwrites existing file at fixed path)
  CREATE POLICY "league_player_storage_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'TheDanceDraft'
    AND (storage.foldername(name))[1] = 'league-players'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM league_player WHERE user_id = auth.uid()
    )
  );
  ```

## Database

### `league_player` RLS

Add a new RLS `UPDATE` policy:

```sql
CREATE POLICY "league_player_self_update"
ON league_player FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

Postgres RLS does not support column-level restrictions in policy expressions. The application only sends `name` and `profile_pic` in its update payload, so no other columns are at risk from the UI.

This policy is additive to the existing commissioner UPDATE policy. Postgres evaluates multiple permissive policies with OR — both apply independently.

### Existing schema (no changes needed)

```sql
league_player
├── id (UUID, PK)
├── league_id (FK to league)
├── user_id (FK to auth.users - nullable)
├── name (text)           ← updated by this feature
├── profile_pic (text)    ← updated by this feature (stores public URL)
├── active (boolean)
└── created_at
```

## File Validation Summary

| Check | Location | Failure behavior |
|-------|----------|-----------------|
| MIME type is image/jpeg, png, webp, or gif | Client-side | Inline error, block submit |
| File size < 50 MB | Client-side | Inline error, block submit |
| Name not empty/whitespace | Client-side | Inline error, block submit |
| Name max 100 chars | Client-side | Inline error, block submit |

## Files to Create / Modify

| Action | File |
|--------|------|
| Modify | `frontend/app/(app)/leagues/[leagueId]/page.tsx` — edit `LeagueContent` to add header row with settings button gated on `leaguePlayer !== null` |
| Create | `frontend/app/(app)/leagues/[leagueId]/settings/page.tsx` — `force-dynamic`, plain async default export, auth/player guard, back button |
| Create | `frontend/app/(app)/leagues/[leagueId]/settings/league-player-settings-form.tsx` — client form component |
| Create | `supabase/migrations/{timestamp}_league_player_self_update_rls.sql` — `league_player` UPDATE policy + Storage INSERT/UPDATE policies |
