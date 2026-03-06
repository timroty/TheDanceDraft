import { createClient } from "@/lib/supabase/server";
import { NavMenu } from "./nav-menu";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return <NavMenu isAuthenticated={!!user} />;
}
