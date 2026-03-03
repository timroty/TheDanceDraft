import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">TheDanceDraft</h1>
        <Suspense>
          <AuthButton />
        </Suspense>
        <ThemeSwitcher />
      </div>
    </main>
  );
}
