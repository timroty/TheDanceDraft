# Nav Menu Redesign

**Date:** 2026-03-05

## Overview

Replace the top-right nav content and footer theme switcher with a hamburger menu dropdown using shadcn components.

## Requirements

- Hamburger menu icon in the top-right corner of the nav bar
- Clicking it opens a shadcn `DropdownMenu` containing:
  - **Logged in:** Logout button + theme cycle icon button
  - **Logged out:** Sign in link + theme cycle icon button
- Theme cycle icon button cycles `light → dark → system` (Sun → Moon → Laptop icons), replacing the current footer ThemeSwitcher
- Footer `ThemeSwitcher` is replaced with "Made with ♥️ in Chicago"

## Architecture

### Approach

Server shell + client NavMenu (Option A). `AuthButton` remains a server component that checks auth server-side and passes `isAuthenticated: boolean` to a new client `NavMenu` component. This preserves the existing server-side auth pattern and avoids any flash of wrong auth state.

### Files Changed

1. **`frontend/components/nav-menu.tsx`** (new, client component)
   - `"use client"` directive
   - Props: `isAuthenticated: boolean`
   - Renders a shadcn `DropdownMenu` triggered by a `Menu` (hamburger) icon button
   - Uses `useTheme` from `next-themes` for the theme cycle toggle
   - Theme cycle: Sun (light) → Moon (dark) → Laptop (system), cycling on each click
   - Logout logic: calls `supabase.auth.signOut()` + `router.push("/auth/login")`
   - Dropdown items:
     - If authenticated: Logout item + theme cycle icon
     - If not authenticated: Sign in link item + theme cycle icon

2. **`frontend/components/auth-button.tsx`** (update)
   - Replace current JSX with `<NavMenu isAuthenticated={!!user} />` for both auth states
   - Remove `LogoutButton` import

3. **`frontend/app/(app)/layout.tsx`** (update)
   - Replace `<ThemeSwitcher />` in the footer with `Made with ♥️ in Chicago` text
   - Remove `ThemeSwitcher` import

## Out of Scope

- Changes to sign-up flow or other auth pages
- Mobile-specific nav behavior beyond the hamburger menu
