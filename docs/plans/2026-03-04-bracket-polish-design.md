# Bracket & UI Polish Design

## Overview

Four targeted improvements to the season page: fix broken mobile bracket, add scroll indicator, update score table avatar fallback, and tone down the settings button.

## 1. Fix Mobile Bracket Layout

**Problem:** `w-screen` on `RoundColumn` doesn't account for page padding/scrollbar, causing horizontal overflow. Multiple rounds visible simultaneously instead of one-at-a-time snap.

**Fix:**
- Change `RoundColumn` from `w-screen` to `w-full min-w-full` so it sizes to the container
- Make `GameCard` full-width on mobile instead of fixed `w-44` — pass a `fullWidth` prop or use a wrapper `div` with `w-full` in the mobile layout
- Ensure snap container is properly constrained with `overflow-hidden` on parent if needed

## 2. Subtle Scroll Indicator

Small dot indicators below the round header showing which round the user is on. Implemented as a thin client component using `IntersectionObserver` to track the visible round.

- 6px dots, muted color, active dot highlighted
- Positioned at the top of the mobile bracket, fixed while scrolling
- Minimal: just dots, no text or arrows

## 3. Score Table — Initials Fallback

Update `ScoreTable` avatar fallback to show first initial in a circle (matching `GameCard` pattern) instead of an empty gray circle. No structural changes to the table.

## 4. Settings Button — More Subtle

Change from `variant="outline"` with text to `variant="ghost"` with a small gear icon (`Settings` from lucide-react) and `size="icon"`. Blends into the page without drawing attention.
