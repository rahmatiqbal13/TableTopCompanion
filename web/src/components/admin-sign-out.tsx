"use client";

import { logout } from "@/app/admin/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** Ends both ways of being signed in: the account session and the shared-password cookie. */
export function AdminSignOut() {
  return (
    <button type="button" className="text-sm text-muted underline"
      onClick={async () => {
        await supabaseBrowser()?.auth.signOut();
        await logout();
      }}>
      Sign out
    </button>
  );
}
