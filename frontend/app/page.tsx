import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">TheDanceDraft</h1>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
