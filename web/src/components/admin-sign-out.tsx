"use client";

import { logout } from "@/app/admin/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** Ends both ways of being signed in: the account session and the shared-password cookie. */
export function AdminSignOut() {
  return (
    <button type="button" className="underline underline-offset-2 hover:text-ink"
      onClick={async () => {
        await supabaseBrowser()?.auth.signOut();
        await logout();
      }}>
      Keluar
    </button>
  );
}
