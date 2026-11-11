import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { panel } from "@/components/admin-ui";
import { UsersBoard } from "@/components/admin-users";
import { currentAccount } from "@/lib/account";
import { isAdmin } from "@/lib/auth";
import { getUsersForAdmin } from "@/lib/data";
import { authConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Pengguna · Admin", robots: { index: false } };

export default function UsersPage() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Users />
    </Suspense>
  );
}

async function Users() {
  await connection();
  if (!(await isAdmin())) return <AdminSignIn next="/admin/users" />;
  const [users, me] = await Promise.all([getUsersForAdmin(), currentAccount()]);
  return (
    <>
      <AdminHeader kicker="Akun & peran" title="Pengguna" />
      <div className="grid gap-[18px]">
        <p className="max-w-[68ch] text-[15px] leading-relaxed text-muted">
          Semua yang pernah masuk. <strong className="text-ink">Editor</strong> bisa menulis konten; <strong className="text-ink">Admin</strong> bisa semuanya.
          Memblokir menghentikan seseorang memberi rating dan menghapus ratingnya dari rata-rata komunitas.
        </p>
        {!authConfigured && <p className={`${panel} p-4 text-sm`}>Akun belum aktif: isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY agar orang bisa masuk.</p>}
        <UsersBoard users={users} selfId={me?.profile.id ?? null} />
      </div>
    </>
  );
}
