"use client";

import { useState } from "react";
import { setUserBanned, setUserRole } from "@/app/admin/actions";
import type { AdminUser } from "@/lib/data";
import { chip, field, hueOf, panel } from "./admin-ui";

const FILTERS = [
  { id: "all", label: "Semua", test: () => true },
  { id: "admin", label: "Admin", test: (u: AdminUser) => u.role === "admin" },
  { id: "editor", label: "Editor", test: (u: AdminUser) => u.role === "editor" },
  { id: "user", label: "Pengguna", test: (u: AdminUser) => u.role === "user" },
  { id: "banned", label: "Diblokir", test: (u: AdminUser) => u.banned },
];
const th = "p-3.5 font-medium";

export function UsersBoard({ users, selfId }: { users: AdminUser[]; selfId: string | null }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const test = FILTERS.find((f) => f.id === filter)!.test;
  const shown = users.filter((u) => test(u) && (!needle || `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(needle)));

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={chip(filter === f.id)}>
            {f.label} {users.filter(f.test).length}
          </button>
        ))}
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email…" aria-label="Cari pengguna"
          className={`${field} ml-auto min-h-10! flex-[0_1_260px] rounded-full! bg-card px-4 text-sm!`} />
      </div>
      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              <th className={`${th} pl-[18px]`}>Pengguna</th><th className={th}>Bergabung</th><th className={`${th} text-right`}>Rating</th><th className={`${th} text-right`}>Di rak</th><th className={`${th} pl-6`}>Peran</th><th />
            </tr>
          </thead>
          <tbody>{shown.map((u) => <Row key={u.id} u={u} self={u.id === selfId} />)}</tbody>
        </table>
        {!shown.length && <p className="p-6 text-center text-muted">{users.length ? "Tidak ada yang cocok." : "Belum ada akun."}</p>}
      </div>
      <p className="text-[13px] text-muted">{users.filter((u) => u.banned).length} diblokir · email di ADMIN_EMAILS otomatis jadi Admin saat masuk</p>
    </>
  );
}

function Row({ u, self }: { u: AdminUser; self: boolean }) {
  const [role, setRole] = useState(u.role);
  const label = u.name ?? u.email ?? "?";
  const hue = hueOf(u.email ?? u.id);
  return (
    <tr className={`border-t border-line transition-opacity ${u.banned ? "opacity-55" : ""}`}>
      <td className="py-2.5 pl-[18px] pr-3.5">
        <span className="flex items-center gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ background: u.banned ? "#8a8072" : `linear-gradient(135deg, oklch(0.58 0.1 ${hue}), oklch(0.36 0.08 ${(hue + 40) % 360}))` }}>{label[0].toUpperCase()}</span>
          <span className="grid min-w-0 gap-0.5">
            <span><span className="font-semibold">{u.name ?? "—"}</span>{self && <span className="ml-1.5 text-xs text-muted">(kamu)</span>}</span>
            <span className="font-mono text-xs text-muted">{u.email}</span>
          </span>
        </span>
      </td>
      <td className="whitespace-nowrap p-2.5 font-mono text-xs text-muted">{u.createdAt.slice(0, 10)}</td>
      <td className="p-2.5 text-right font-mono text-[13px]">{u.ratings}</td>
      <td className="p-2.5 text-right font-mono text-[13px]">{u.shelf}</td>
      <td className="py-2.5 pl-6 pr-2.5">
        <form action={setUserRole} className="flex items-center gap-2">
          <input type="hidden" name="id" value={u.id} />
          <select name="role" value={role} onChange={(e) => setRole(e.target.value as AdminUser["role"])} disabled={self} aria-label={`Peran untuk ${u.email ?? u.name}`}
            className="min-h-9 rounded-[10px] border border-line bg-paper px-2.5 text-sm disabled:opacity-60">
            <option value="user">Pengguna</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          {!self && role !== u.role && <button className="min-h-8 rounded-full bg-ink px-3 text-[13px] text-paper active:scale-[0.97]">Simpan</button>}
        </form>
      </td>
      <td className="py-2.5 pl-2.5 pr-[18px] text-right">
        {!self && (
          <form action={setUserBanned}>
            <input type="hidden" name="id" value={u.id} />
            <input type="hidden" name="banned" value={String(!u.banned)} />
            <button className={`min-h-9 rounded-full border border-current/30 px-3.5 text-[13px] hover:bg-sunken ${u.banned ? "text-felt" : "text-meeple"}`}>{u.banned ? "Buka blokir" : "Blokir"}</button>
          </form>
        )}
      </td>
    </tr>
  );
}
