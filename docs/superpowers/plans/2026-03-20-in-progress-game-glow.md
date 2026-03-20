# In-Progress Game Glow Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a soft static red glow to `GameCard` for any game that is currently live (status is not scheduled or final).

**Architecture:** Both bracket views (`BracketDesktop`, `BracketMobile`) already use `GameCard` — the change is entirely self-contained in `game-card.tsx`. A secondary comment-only update in `types.ts` documents the full set of ESPN status codes.

**Tech Stack:** Next.js, React, Tailwind CSS, TypeScript

---

## Files

- Modify: `frontend/components/bracket/game-card.tsx` — add `isInProgress` flag, make shadow conditional
- Modify: `frontend/components/bracket/types.ts` — update `status` field comment only

---

### Task 1: Update `game-card.tsx`

**Files:**
- Modify: `frontend/components/bracket/game-card.tsx`

- [ ] **Step 1: Open the file and locate the `GameCard` function**

  The function starts at line 83. The relevant variables are at lines 84–85:
  ```ts
  const showScore = game.status >= 2;
  const gameFinished = game.status === 3;
  ```
  The outer `<div>` is at line 88:
  ```tsx
  <div className={cn("rounded border border-border bg-card text-card-foreground shadow-sm", className ?? "w-52")}>
  ```

- [ ] **Step 2: Add the `isInProgress` variable**

  After line 85 (`const gameFinished = ...`), add:
  ```ts
  const isInProgress = game.status !== 1 && game.status !== 3;
  ```
  Do NOT change `showScore` or `gameFinished` — they serve different purposes.

- [ ] **Step 3: Make the shadow conditional on the outer div**

  Replace the outer `<div>` className from:
  ```tsx
  <div className={cn("rounded border border-border bg-card text-card-foreground shadow-sm", className ?? "w-52")}>
  ```
  To:
  ```tsx
  <div className={cn(
    "rounded border border-border bg-card text-card-foreground",
    isInProgress
      ? "shadow-[0_0_8px_rgba(239,68,68,0.5)]"
      : "shadow-sm",
    className ?? "w-52"
  )}>
  ```

- [ ] **Step 4: Type-check**

  Run from `frontend/`:
  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/components/bracket/game-card.tsx
  git commit -m "feat: red glow on in-progress game cards"
  ```

---

### Task 2: Update `types.ts` status comment

**Files:**
- Modify: `frontend/components/bracket/types.ts`

- [ ] **Step 1: Update the status field comment**

  In `types.ts` at line 17, change:
  ```ts
  status: number; // 1=scheduled, 2=in_progress, 3=final
  ```
  To:
  ```ts
  status: number; // 1=scheduled, 3=final; all other values indicate a live game (e.g. 2=in_progress, 23=halftime, various OT codes)
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/components/bracket/types.ts
  git commit -m "docs: document ESPN live-game status codes in GameData type"
  ```
