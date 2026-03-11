import { createClient } from "@/lib/supabase/server";
import { NavMenu } from "./nav-menu";

export async function AuthButton() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <NavMenu isAuthenticated={!!user} />;
}
