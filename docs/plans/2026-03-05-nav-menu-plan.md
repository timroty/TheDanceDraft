# Nav Menu Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the top-right nav content and footer ThemeSwitcher with a hamburger dropdown menu containing logout and theme-cycle controls.

**Architecture:** `AuthButton` stays a server component and passes `isAuthenticated: boolean` to a new `NavMenu` client component. `NavMenu` renders a shadcn `DropdownMenu` triggered by a hamburger icon, with auth-conditional items and a theme cycle icon button.

**Tech Stack:** Next.js 14 App Router, shadcn/ui (`DropdownMenu`, `Button`), `next-themes`, `lucide-react`, Supabase browser client

---

### Task 1: Create `NavMenu` client component

**Files:**
- Create: `frontend/components/nav-menu.tsx`

**Step 1: Create the file**

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NavMenuProps {
  isAuthenticated: boolean;
}

export function NavMenu({ isAuthenticated }: NavMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Laptop;

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Menu size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <button
            onClick={cycleTheme}
            className="flex w-full items-center gap-2 cursor-pointer"
          >
            <ThemeIcon size={16} className="text-muted-foreground" />
            <span>
              {theme === "light"
                ? "Light"
                : theme === "dark"
                  ? "Dark"
                  : "System"}
            </span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAuthenticated ? (
          <DropdownMenuItem asChild>
            <button
              onClick={logout}
              className="flex w-full items-center cursor-pointer"
            >
              Logout
            </button>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/auth/login" className="flex w-full items-center">
              Sign in
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Verify the file saved correctly** — visually inspect for typos or missing imports.

**Step 3: Commit**

```bash
git add frontend/components/nav-menu.tsx
git commit -m "feat: add NavMenu client component with hamburger dropdown"
```

---

### Task 2: Update `AuthButton` to use `NavMenu`

**Files:**
- Modify: `frontend/components/auth-button.tsx`

**Current file contents** (for reference):
```tsx
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
```

**Step 1: Replace the file contents**

```tsx
import { createClient } from "@/lib/supabase/server";
import { NavMenu } from "./nav-menu";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return <NavMenu isAuthenticated={!!user} />;
}
```

**Step 2: Verify** — `LogoutButton` and `Button`/`Link` imports are gone, only `NavMenu` is rendered.

**Step 3: Commit**

```bash
git add frontend/components/auth-button.tsx
git commit -m "feat: update AuthButton to render NavMenu with isAuthenticated prop"
```

---

### Task 3: Update layout to replace ThemeSwitcher in footer

**Files:**
- Modify: `frontend/app/(app)/layout.tsx`

**Current file contents** (for reference):
```tsx
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>TheDanceDraft</Link>
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-20 max-w-7xl mx-auto p-5 w-full">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
```

**Step 1: Replace the file contents**

```tsx
import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>TheDanceDraft</Link>
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-20 max-w-7xl mx-auto p-5 w-full">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Made with ♥️ in Chicago</p>
        </footer>
      </div>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/app/(app)/layout.tsx
git commit -m "feat: replace footer ThemeSwitcher with Made with love in Chicago"
```

---

### Task 4: Manual verification

**Step 1: Start the dev server**

```bash
cd frontend && npm run dev
```

**Step 2: Check logged-out state**
- Visit `http://localhost:3000`
- Top-right should show a hamburger (`≡`) icon button
- Clicking it opens a dropdown with: theme cycle icon + label, separator, "Sign in" link
- Clicking the theme icon cycles the app through light → dark → system
- Footer shows "Made with ♥️ in Chicago" (no ThemeSwitcher)

**Step 3: Check logged-in state**
- Log in via `/auth/login`
- Top-right hamburger dropdown should show: theme cycle, separator, "Logout" button
- Clicking "Logout" signs out and redirects to `/auth/login`

**Step 4: Check TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.
