# League Player Settings Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a settings page at `/leagues/[leagueId]/settings` where any league member can update their display name and profile picture for that league.

**Architecture:** A settings icon button (gated on having a `league_player` record) is added to the existing league detail page. The settings page is a plain async server component that fetches the user's `league_player` row and passes it to a client-side form. The form uploads images to a fixed Supabase Storage path with upsert semantics, then updates `league_player.name` and `league_player.profile_pic`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Supabase (Auth + Storage + Postgres), Tailwind CSS, shadcn/ui, Sonner (toasts), lucide-react (icons)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/20260317000000_league_player_self_update_rls.sql` | RLS policies for `league_player` self-update + Storage INSERT/UPDATE |
| Modify | `frontend/app/(app)/leagues/[leagueId]/page.tsx` | Add settings button in header row inside `LeagueContent` |
| Create | `frontend/app/(app)/leagues/[leagueId]/settings/page.tsx` | Async server component: auth guard, data fetch, layout |
| Create | `frontend/app/(app)/leagues/[leagueId]/settings/league-player-settings-form.tsx` | `"use client"` form: name input, file input, validation, save logic |

---

## Task 1: Add RLS Migration

**Files:**
- Create: `supabase/migrations/20260317000000_league_player_self_update_rls.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration locally**

Prefer `supabase migration up` — it applies only the new migration without wiping local data. Use `supabase db reset` only if you intentionally want to wipe and reseed everything.

```bash
cd /Users/timroty/Documents/GitHub/TheDanceDraft
supabase migration up
```

Expected: migration applies without error.

> **Before running against production:** verify the `TheDanceDraft` bucket name is exactly correct (case-sensitive). Check in the Supabase dashboard → Storage.

> **Before running against production:** verify the `TheDanceDraft` bucket name is exactly correct (case-sensitive). Check in the Supabase dashboard → Storage.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260317000000_league_player_self_update_rls.sql
git commit -m "feat: add RLS policies for league_player self-update and storage upload"
```

---

## Task 2: Add Settings Button to League Detail Page

**Files:**
- Modify: `frontend/app/(app)/leagues/[leagueId]/page.tsx`

The `LeagueContent` async function (not `LeaguePage`) contains the `<h1>`. Edit it to replace the bare heading with a header row that includes a settings button. The `leaguePlayer` variable is already fetched at lines 63–70 — use it to gate the button.

- [ ] **Step 1: Add `Settings` to the lucide-react import and `Link` import (already present)**

In `page.tsx`, the existing imports are:
```tsx
import { ChevronRight } from "lucide-react";
```

Change to:
```tsx
import { ChevronRight, Settings } from "lucide-react";
```

- [ ] **Step 2: Replace the `<h1>` with a header row**

Find this block inside the `return` of `LeagueContent`:
```tsx
<div className="flex flex-col gap-6">
  <h1 className="text-2xl font-bold">{league?.name ?? "League"}</h1>
```

Replace with:
```tsx
<div className="flex flex-col gap-6">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">{league?.name ?? "League"}</h1>
    {leaguePlayer && (
      <Button asChild variant="ghost" size="icon">
        <Link href={`/leagues/${leagueId}/settings`}>
          <Settings className="size-4" />
        </Link>
      </Button>
    )}
  </div>
```

- [ ] **Step 3: Verify in the browser**

Run `cd frontend && npm run dev`. Navigate to a league page where your user is a league member — the gear icon should appear. Navigate to a league page where your user is NOT a league member — no gear icon.

> If you only have one league seeded locally, temporarily comment out the `leaguePlayer &&` gate to confirm the button renders, then restore it.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/\(app\)/leagues/\[leagueId\]/page.tsx
git commit -m "feat: add league player settings button to league detail page"
```

---

## Task 3: Create Settings Page (Server Component)

**Files:**
- Create: `frontend/app/(app)/leagues/[leagueId]/settings/page.tsx`

This is a plain `async` default export — no Suspense wrapper. Other pages in this codebase use a `ContentComponent`/`PageComponent` + Suspense split for streaming, but this page redirects immediately for unauthenticated users, so there's nothing meaningful to stream. **Do not add Suspense here.**

`export const dynamic = "force-dynamic"` is required because this is a bare async export without a Suspense boundary — without it, Next.js may attempt static rendering and fail on the `supabase.auth.getUser()` call.

- [ ] **Step 1: Create the file**

```tsx
import { LeaguePlayerSettingsForm } from "./league-player-settings-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaguePlayerSettingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/leagues/${leagueId}`);
  }

  const { data: leaguePlayer } = await supabase
    .from("league_player")
    .select("id, name, profile_pic")
    .eq("user_id", user.id)
    .eq("league_id", leagueId)
    .single();

  if (!leaguePlayer) {
    redirect(`/leagues/${leagueId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/leagues/${leagueId}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Player Settings</h1>
      </div>
      <LeaguePlayerSettingsForm leaguePlayer={leaguePlayer} />
    </div>
  );
}
```

- [ ] **Step 2: Verify the page loads**

With `npm run dev` running, navigate to `/leagues/{leagueId}/settings` as an authenticated user who is a league member. Should see the back button and heading. As a user who is NOT a league member (or unauthenticated), should redirect to the league page.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/\(app\)/leagues/\[leagueId\]/settings/page.tsx
git commit -m "feat: add league player settings page server component"
```

---

## Task 4: Create Settings Form (Client Component)

**Files:**
- Create: `frontend/app/(app)/leagues/[leagueId]/settings/league-player-settings-form.tsx`

This is the interactive form. It uses the Supabase browser client (from `@/lib/supabase/client`) for storage uploads and DB updates. Toasts use `sonner` — the `<Toaster />` is already mounted in `frontend/app/layout.tsx`.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

type LeaguePlayer = {
  id: string;
  name: string;
  profile_pic: string | null;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function LeaguePlayerSettingsForm({
  leaguePlayer,
}: {
  leaguePlayer: LeaguePlayer;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(leaguePlayer.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("File must be a JPEG, PNG, WebP, or GIF image.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError("File must be smaller than 50 MB.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  }

  function validate(): boolean {
    let valid = true;
    if (!name.trim()) {
      setNameError("Display name is required.");
      valid = false;
    } else if (name.trim().length > 100) {
      setNameError("Display name must be 100 characters or fewer.");
      valid = false;
    } else {
      setNameError(null);
    }
    return valid;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      let profilePicUrl: string | undefined;

      if (selectedFile) {
        const storagePath = `league-players/${leaguePlayer.id}/profile`;

        const { error: uploadError } = await supabase.storage
          .from("TheDanceDraft")
          .upload(storagePath, selectedFile, { upsert: true });

        if (uploadError) {
          toast.error("Failed to upload profile picture.");
          return;
        }

        const { data: urlData } = supabase.storage
          .from("TheDanceDraft")
          .getPublicUrl(storagePath);

        profilePicUrl = urlData.publicUrl;
      }

      const updatePayload: { name: string; profile_pic?: string } = {
        name: name.trim(),
      };
      if (profilePicUrl !== undefined) {
        updatePayload.profile_pic = profilePicUrl;
      }

      const { error: updateError } = await supabase
        .from("league_player")
        .update(updatePayload)
        .eq("id", leaguePlayer.id);

      if (updateError) {
        toast.error("Failed to save settings.");
        return;
      }

      toast.success("Settings saved.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-sm">
      <div className="flex flex-col gap-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={saving}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-pic">Profile picture</Label>
        <Input
          id="profile-pic"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          ref={fileInputRef}
          disabled={saving}
        />
        {fileError && (
          <p className="text-sm text-destructive">{fileError}</p>
        )}
      </div>

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Check `Label` is available**

`Label` is a shadcn/ui component. Verify it exists:

```bash
ls frontend/components/ui/label.tsx
```

If missing, add it:
```bash
cd frontend && npx shadcn@latest add label
```

- [ ] **Step 3: Verify the form end-to-end**

With `npm run dev`:
1. Navigate to `/leagues/{leagueId}/settings`
2. Change the display name and click Save — should toast "Settings saved." and the name input should still reflect the saved value after refresh
3. Select an image file and save — should upload to Supabase Storage and update `profile_pic` in the DB (verify in Supabase Studio)
4. Select a file > 50 MB — should show "File must be smaller than 50 MB." and block submit
5. Select a non-image file (e.g. `.pdf`) — should show the MIME type error and block submit
6. Clear the name field and click Save — should show "Display name is required."
7. Enter a name > 100 chars — the `maxLength` attribute prevents typing past 100, but also verify the validation message if somehow submitted with 101+ chars

- [ ] **Step 4: Commit**

```bash
git add frontend/app/\(app\)/leagues/\[leagueId\]/settings/league-player-settings-form.tsx
git commit -m "feat: add league player settings form with name and profile pic upload"
```
