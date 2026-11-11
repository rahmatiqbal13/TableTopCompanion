"use client";

import { useActionState, useState } from "react";
import {
  deleteGenre, login, saveCriterion, saveGame, saveGenre, type FormState,
} from "@/app/admin/actions";
import type { Criterion, Game, Genre } from "@/lib/types";
import { field, panel, pillPrimary } from "./admin-ui";

const input = field;
const button = pillPrimary;
const fieldset = `${panel} grid gap-4 p-[22px]`;
const legend = "px-1 font-display text-lg font-semibold tracking-[-0.02em]";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm text-meeple">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm text-felt">{state.ok}</p>;
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className={`${panel} mx-auto mt-10 max-w-sm space-y-3 p-6`}>
      <h1 className="font-display text-xl font-semibold">Masuk admin</h1>
      <label className="block text-sm">
        Kata sandi
        <input name="password" type="password" required autoComplete="current-password" className={`${input} mt-1`} />
      </label>
      <Status state={state} />
      <button className={button} disabled={pending}>{pending ? "Masuk…" : "Masuk"}</button>
    </form>
  );
}

function Labeled({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-[13px] text-muted">
      <span>{label}</span>
      {hint && <span className="ml-2 text-xs">{hint}</span>}
      <div className="mt-1.5 text-ink">{children}</div>
    </label>
  );
}

export function GameForm({ game, genres, criteria }: { game: Game | null; genres: Genre[]; criteria: Criterion[] }) {
  const [state, action, pending] = useActionState(saveGame, {});
  const g = game;
  return (
    <form action={action} className="max-w-4xl space-y-6">
      <input type="hidden" name="id" value={g?.id ?? ""} />
      <fieldset className={`${fieldset} sm:grid-cols-2`}>
        <legend className={legend}>Dasar</legend>
        <Labeled label="Nama"><input name="name" required defaultValue={g?.name} className={input} /></Labeled>
        <Labeled label="Tahun"><input name="year" type="number" required defaultValue={g?.year} className={input} /></Labeled>
        <Labeled label="Genre">
          <select name="genreId" defaultValue={g?.genreId} className={input}>
            {genres.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="BGG id" hint="opsional"><input name="bggId" type="number" defaultValue={g?.bggId ?? ""} className={input} /></Labeled>
        <Labeled label="URL gambar" hint="opsional"><input name="imageUrl" type="url" defaultValue={g?.imageUrl ?? ""} className={input} /></Labeled>
        <Labeled label="URL tautan" hint="bawaan: BGG"><input name="linkUrl" type="url" defaultValue={g?.linkUrl ?? ""} className={input} /></Labeled>
      </fieldset>
      <fieldset className={`${fieldset} sm:grid-cols-3`}>
        <legend className={legend}>Nilai kriteria (dipakai TOPSIS)</legend>
        {criteria.map((c) => (
          <Labeled key={c.key} label={c.name} hint={c.unit}>
            <input name={`value.${c.key}`} type="number" step="any" required defaultValue={g?.values[c.key] ?? ""} className={input} />
          </Labeled>
        ))}
      </fieldset>
      <fieldset className={`${fieldset} sm:grid-cols-2`}>
        <legend className={legend}>Pengayaan (diisi impor BGG)</legend>
        <Labeled label="Pemain maksimum"><input name="maxPlayers" type="number" defaultValue={g?.maxPlayers ?? ""} className={input} /></Labeled>
        <Labeled label="Jumlah suara rating"><input name="votes" type="number" defaultValue={g?.votes ?? ""} className={input} /></Labeled>
        <Labeled label="Terbaik dengan" hint="pisahkan dengan koma"><input name="bestPlayers" defaultValue={g?.bestPlayers.join(", ")} className={input} /></Labeled>
        <Labeled label="Disarankan dengan"><input name="recPlayers" defaultValue={g?.recPlayers.join(", ")} className={input} /></Labeled>
        <Labeled label="Mekanik" hint="pisahkan dengan koma"><input name="mechanics" defaultValue={g?.mechanics.join(", ")} className={input} /></Labeled>
        <Labeled label="Kategori"><input name="categories" defaultValue={g?.categories.join(", ")} className={input} /></Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Deskripsi"><textarea name="description" rows={4} defaultValue={g?.description ?? ""} className={`${input} py-2`} /></Labeled>
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <button className={button} disabled={pending}>{pending ? "Menyimpan…" : g ? "Simpan perubahan" : "Tambah game"}</button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function CriterionForm({ c }: { c: Criterion | null }) {
  const [state, action, pending] = useActionState(saveCriterion, {});
  return (
    <form action={action} className="grid items-end gap-2 py-3 sm:grid-cols-[1fr_1fr_5rem_6rem_9rem_4.5rem_auto]">
      <input type="hidden" name="id" value={c?.id ?? 0} />
      <Labeled label="Nama"><input name="name" required defaultValue={c?.name} className={input} /></Labeled>
      <Labeled label="Kunci" hint={c ? "tetap" : "mis. teachTime"}>
        <input name="key" required defaultValue={c?.key} readOnly={Boolean(c)} className={`${input} ${c ? "text-muted" : ""}`} />
      </Labeled>
      <Labeled label="Satuan"><input name="unit" defaultValue={c?.unit} className={input} /></Labeled>
      <Labeled label="Bobot" hint="0–1"><input name="defaultWeight" type="number" step="0.01" min="0" max="1" required defaultValue={c?.defaultWeight ?? 0.1} className={input} /></Labeled>
      <Labeled label="Arah">
        <select name="type" defaultValue={c?.type ?? "benefit"} className={input}>
          <option value="benefit">Lebih tinggi</option>
          <option value="cost">Lebih rendah</option>
        </select>
      </Labeled>
      <Labeled label="Urutan"><input name="sort" type="number" defaultValue={c?.sort ?? 10} className={input} /></Labeled>
      <input type="hidden" name="hint" value={c?.hint ?? ""} />
      {!c && <input type="hidden" name="fill" value="0" />}
      <div className="flex items-center gap-2">
        <button className={button} disabled={pending}>{c ? "Simpan" : "Tambah"}</button>
        <Status state={state} />
      </div>
    </form>
  );
}

/** A genre as a chip; click to rename or delete it. `genre: null` is the "new genre" chip. */
export function GenreChip({ genre, count }: { genre: Genre | null; count?: number }) {
  const [open, setOpen] = useState(false);
  const [saveState, save, saving] = useActionState(saveGenre, {});
  const [delState, del, deleting] = useActionState(deleteGenre, {});
  if (!open) {
    return genre ? (
      <button type="button" onClick={() => setOpen(true)} title="Ubah nama atau hapus"
        className="flex min-h-10 items-center gap-2 rounded-full border border-line bg-paper py-0 pl-3.5 pr-1.5 text-sm hover:bg-sunken">
        {genre.name}
        <span className="min-w-[26px] rounded-full bg-sunken px-2 py-0.5 text-center font-mono text-xs">{count}</span>
      </button>
    ) : (
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-10 items-center rounded-full border border-dashed border-muted/60 px-3.5 text-sm text-muted hover:text-ink">+ Genre baru</button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-paper p-2">
      <form action={save} className="flex items-center gap-2">
        <input type="hidden" name="id" value={genre?.id ?? ""} />
        <input name="name" required autoFocus defaultValue={genre?.name} placeholder="Nama genre" aria-label="Nama genre" className={`${input} w-44`} />
        <button className={`${button} min-h-10! px-4!`} disabled={saving}>{genre ? "Simpan" : "Tambah"}</button>
      </form>
      {genre && (
        <form action={del}>
          <input type="hidden" name="id" value={genre.id} />
          <button className="px-1 text-sm text-meeple underline disabled:opacity-50" disabled={deleting || count! > 0}
            title={count ? "Pindahkan dulu game-nya ke genre lain" : undefined}>Hapus</button>
        </form>
      )}
      <button type="button" onClick={() => setOpen(false)} className="px-1 text-sm text-muted underline">Batal</button>
      <Status state={saveState.error || saveState.ok ? saveState : delState} />
    </div>
  );
}

export function DeleteButton({ action, id, name }: { action: (f: FormData) => Promise<void>; id: number; name: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(`Hapus “${name}”? Tindakan ini tidak bisa dibatalkan.`)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="text-sm text-meeple hover:underline">Hapus</button>
    </form>
  );
}
