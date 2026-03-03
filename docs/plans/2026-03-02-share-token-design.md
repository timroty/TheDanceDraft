# Share Token Design for League Season

**Date**: 2026-03-02

## Problem

Not all users will be authenticated, but commissioners need a way to share bracket and leaderboard views with others. The share link must not be easily guessable.

## Design

Add a nullable `share_token` UUID column to the `league_season` table.

### Schema Change

```sql
ALTER TABLE league_season ADD COLUMN share_token uuid UNIQUE;
```

- **Nullable**: No token until commissioner explicitly generates one
- **Unique constraint**: Ensures fast lookups and prevents collisions
- **No default**: Commissioners generate on-demand via `UPDATE league_season SET share_token = gen_random_uuid() WHERE id = ?`

### Token Lifecycle

1. **Generate**: Commissioner updates the row to set `share_token = gen_random_uuid()`
2. **Share**: Commissioner copies the link (e.g., `/share/[token]`) and sends it
3. **Revoke**: Commissioner sets `share_token = NULL` to invalidate the link
4. **Regenerate**: Commissioner sets a new `gen_random_uuid()` to create a new link (old one stops working)

### RLS

No new policies needed:
- **Read**: Existing `Public read` policy on `league_season` allows `SELECT ... WHERE share_token = ?` for unauthenticated users
- **Write**: Existing `Commissioner update` policy restricts `UPDATE` to the league's commissioner

### Frontend Routing (future)

A single public route (e.g., `/share/[token]`) will:
1. Query `league_season` by `share_token`
2. Display both bracket and leaderboard on one page
3. Show "not found" if token is NULL or doesn't match

### What This Doesn't Include

- Expiration dates on share links (YAGNI)
- Separate tokens for bracket vs leaderboard (single link shows both)
- Access logging or analytics
- Multiple share links per season
