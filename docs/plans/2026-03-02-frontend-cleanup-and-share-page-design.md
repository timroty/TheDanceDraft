# Frontend Cleanup & Share Page Design

**Date:** 2026-03-02

## Overview

Clean up the Supabase starter template boilerplate and add an unauthenticated `/share/[token]` page that looks up a league season by share token.

## Approach

Clean-then-Build: remove template clutter first, then add the share page on a clean slate.

## Phase 1: Cleanup

### Files to Delete

- `components/tutorial/` (entire folder)
- `components/hero.tsx`
- `components/deploy-button.tsx`
- `components/env-var-warning.tsx`
- `components/next-logo.tsx`
- `components/supabase-logo.tsx`

### Files to Modify

- **`app/page.tsx`** — Replace tutorial/hero content with centered "TheDanceDraft" heading + "Sign in" link to `/auth/login`
- **`app/layout.tsx`** — Remove imports of deleted components if referenced
- **`app/protected/page.tsx`** — Remove tutorial references, keep basic authenticated placeholder

### Files to Keep As-Is

- All auth pages (`auth/login`, `auth/sign-up`, etc.)
- All `components/ui/` primitives
- `components/auth-button.tsx`, `components/logout-button.tsx`, `components/theme-switcher.tsx`
- All `lib/supabase/` files
- All config files

## Phase 2: Share Page

### New File: `app/share/[token]/page.tsx`

- **Server component** (no `"use client"`)
- Uses existing `lib/supabase/server.ts` client to query directly from the page — the standard Next.js + Supabase pattern for read-only server-rendered pages
- Queries `league_season` where `share_token` matches the URL param
- **Found:** Renders the league_season UUID (placeholder for future bracket/leaderboard)
- **Not found:** Renders "Invalid or expired share link" message
- **Layout:** Inherits root layout (theme, fonts). No nav bar, no auth UI. Centered content.

### No New Dependencies

No new components, lib files, or API routes. One page file.

## Design Decisions

- **Server component for share page:** Simple DB lookup with no interactivity. Fits Next.js RSC patterns. Querying Supabase directly from server components is the recommended pattern — no API route middleman needed.
- **No dedicated layout for /share:** Root layout provides theme/fonts. No nav needed for public share links.
- **Minimal home page:** Just app title + sign-in link. Real landing page designed later.
- **Auth pages untouched:** Functional as-is from the template. Will be restyled in a future pass.
