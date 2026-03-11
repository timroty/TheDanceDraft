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
import { useEffect, useState } from "react";

interface NavMenuProps {
  isAuthenticated: boolean;
}

export function NavMenu({ isAuthenticated }: NavMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const ThemeIcon = !mounted ? Laptop : theme === "light" ? Sun : theme === "dark" ? Moon : Laptop;

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Open navigation menu">
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
              {!mounted
                ? "System"
                : theme === "light"
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
