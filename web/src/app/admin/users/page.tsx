import { connection } from "next/server";
import { Suspense } from "react";
import { AdminSignIn } from "@/components/admin-signin";
import { currentAccount } from "@/lib/account";
import { isAdmin } from "@/lib/auth";
import { getUsersForAdmin } from "@/lib/data";
import { authConfigured } from "@/lib/supabase/config";
import { setUserBanned, setUserRole } from "../actions";

export default function UsersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Users />
      </Suspense>
    </div>
  );
}

async function Users() {
  await connection();
  if (!(await isAdmin())) return <AdminSignIn next="/admin/users" />;
  const [users, me] = await Promise.all([getUsersForAdmin(), currentAccount()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Everyone who has signed in. <strong>Editor</strong> can write posts; <strong>admin</strong> can do everything.
          Blocking stops someone from rating and removes their ratings from the community averages.
          Emails listed in ADMIN_EMAILS become admin automatically when they sign in.
        </p>
      </div>
      {!authConfigured && (
        <p className="rounded-xl border border-gold/40 bg-card p-4 text-sm">
          Accounts are off: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to let people sign in.
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr><th className="px-4 py-2">User</th><th>Joined</th><th className="text-right">Ratings</th><th className="text-right">On shelf</th><th className="pl-6">Role</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              const self = me?.profile.id === u.id;
              return (
                <tr key={u.id} className={u.banned ? "opacity-60" : ""}>
                  <td className="px-4 py-2">
                    <div className="font-medium">{u.name ?? "—"}{self && <span className="ml-2 text-xs text-muted">(you)</span>}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td className="whitespace-nowrap text-xs text-muted tabular">{u.createdAt.slice(0, 10)}</td>
                  <td className="text-right tabular">{u.ratings}</td>
                  <td className="text-right tabular">{u.shelf}</td>
                  <td className="pl-6">
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} disabled={self} aria-label={`Role for ${u.email ?? u.name}`}
                        className="rounded-lg border border-line bg-paper px-2 py-1 text-sm">
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      {!self && <button className="text-xs underline">Save</button>}
                    </form>
                  </td>
                  <td className="px-4 text-right">
                    {!self && (
                      <form action={setUserBanned}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="banned" value={String(!u.banned)} />
                        <button className={`text-sm ${u.banned ? "text-felt" : "text-meeple"} hover:underline`}>{u.banned ? "Unblock" : "Block"}</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!users.length && <p className="p-6 text-center text-muted">No accounts yet.</p>}
      </div>
    </div>
  );
}
