"use client";

import { useActionState } from "react";
import {
  deleteGenre, login, saveCriterion, saveGame, saveGenre, type FormState,
} from "@/app/admin/actions";
import type { Criterion, Game, Genre } from "@/lib/types";

const input = "w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-sm";
const button = "rounded-lg bg-felt px-3.5 py-1.5 text-sm font-medium text-on-felt disabled:opacity-60";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="text-sm text-meeple">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm text-felt">{state.ok}</p>;
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mx-auto mt-10 max-w-sm space-y-3 rounded-2xl border border-line bg-card p-6">
      <h1 className="font-display text-xl font-semibold">Admin sign in</h1>
      <label className="block text-sm">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={`${input} mt-1`} />
      </label>
      <Status state={state} />
      <button className={button} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

function Labeled({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function GameForm({ game, genres, criteria }: { game: Game | null; genres: Genre[]; criteria: Criterion[] }) {
  const [state, action, pending] = useActionState(saveGame, {});
  const g = game;
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={g?.id ?? ""} />
      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2">
        <legend className="px-1 font-display font-semibold">Basics</legend>
        <Labeled label="Name"><input name="name" required defaultValue={g?.name} className={input} /></Labeled>
        <Labeled label="Year"><input name="year" type="number" required defaultValue={g?.year} className={input} /></Labeled>
        <Labeled label="Genre">
          <select name="genreId" defaultValue={g?.genreId} className={input}>
            {genres.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="BGG id" hint="optional"><input name="bggId" type="number" defaultValue={g?.bggId ?? ""} className={input} /></Labeled>
        <Labeled label="Image URL" hint="optional"><input name="imageUrl" type="url" defaultValue={g?.imageUrl ?? ""} className={input} /></Labeled>
        <Labeled label="Link URL" hint="defaults to BGG"><input name="linkUrl" type="url" defaultValue={g?.linkUrl ?? ""} className={input} /></Labeled>
      </fieldset>
      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-3">
        <legend className="px-1 font-display font-semibold">Criteria values (used by TOPSIS)</legend>
        {criteria.map((c) => (
          <Labeled key={c.key} label={c.name} hint={c.unit}>
            <input name={`value.${c.key}`} type="number" step="any" required defaultValue={g?.values[c.key] ?? ""} className={input} />
          </Labeled>
        ))}
      </fieldset>
      <fieldset className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2">
        <legend className="px-1 font-display font-semibold">Enrichment (filled by the BGG importer)</legend>
        <Labeled label="Max players"><input name="maxPlayers" type="number" defaultValue={g?.maxPlayers ?? ""} className={input} /></Labeled>
        <Labeled label="Rating votes"><input name="votes" type="number" defaultValue={g?.votes ?? ""} className={input} /></Labeled>
        <Labeled label="Best with" hint="comma-separated counts"><input name="bestPlayers" defaultValue={g?.bestPlayers.join(", ")} className={input} /></Labeled>
        <Labeled label="Recommended with"><input name="recPlayers" defaultValue={g?.recPlayers.join(", ")} className={input} /></Labeled>
        <Labeled label="Mechanics" hint="comma-separated"><input name="mechanics" defaultValue={g?.mechanics.join(", ")} className={input} /></Labeled>
        <Labeled label="Categories"><input name="categories" defaultValue={g?.categories.join(", ")} className={input} /></Labeled>
        <div className="sm:col-span-2">
          <Labeled label="Description"><textarea name="description" rows={4} defaultValue={g?.description ?? ""} className={input} /></Labeled>
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <button className={button} disabled={pending}>{pending ? "Saving…" : g ? "Save changes" : "Add game"}</button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function CriterionForm({ c }: { c: Criterion | null }) {
  const [state, action, pending] = useActionState(saveCriterion, {});
  return (
    <form action={action} className="grid items-end gap-2 py-3 sm:grid-cols-[1fr_1fr_5rem_6rem_7rem_4rem_auto]">
      <input type="hidden" name="id" value={c?.id ?? 0} />
      <Labeled label="Name"><input name="name" required defaultValue={c?.name} className={input} /></Labeled>
      <Labeled label="Key" hint={c ? "fixed" : "e.g. teachTime"}>
        <input name="key" required defaultValue={c?.key} readOnly={Boolean(c)} className={`${input} ${c ? "text-muted" : ""}`} />
      </Labeled>
      <Labeled label="Unit"><input name="unit" defaultValue={c?.unit} className={input} /></Labeled>
      <Labeled label="Weight" hint="0–1"><input name="defaultWeight" type="number" step="0.01" min="0" max="1" required defaultValue={c?.defaultWeight ?? 0.1} className={input} /></Labeled>
      <Labeled label="Default">
        <select name="type" defaultValue={c?.type ?? "benefit"} className={input}>
          <option value="benefit">More is better</option>
          <option value="cost">Less is better</option>
        </select>
      </Labeled>
      <Labeled label="Order"><input name="sort" type="number" defaultValue={c?.sort ?? 10} className={input} /></Labeled>
      <input type="hidden" name="hint" value={c?.hint ?? ""} />
      {!c && <input type="hidden" name="fill" value="0" />}
      <div className="flex items-center gap-2">
        <button className={button} disabled={pending}>{c ? "Save" : "Add"}</button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function GenreRow({ genre, count }: { genre: Genre | null; count?: number }) {
  const [saveState, save, saving] = useActionState(saveGenre, {});
  const [delState, del, deleting] = useActionState(deleteGenre, {});
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <form action={save} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="id" value={genre?.id ?? ""} />
        <input name="name" required defaultValue={genre?.name} placeholder="New genre" aria-label="Genre name" className={`${input} max-w-xs`} />
        <button className={button} disabled={saving}>{genre ? "Rename" : "Add"}</button>
        {genre && <span className="text-xs text-muted">{count} games</span>}
      </form>
      {genre && (
        <form action={del}>
          <input type="hidden" name="id" value={genre.id} />
          <button className="text-sm text-meeple underline disabled:opacity-60" disabled={deleting || count! > 0}
            title={count ? "Move its games to another genre first" : undefined}>Delete</button>
        </form>
      )}
      <Status state={saveState.error || saveState.ok ? saveState : delState} />
    </div>
  );
}

export function DeleteButton({ action, id, name }: { action: (f: FormData) => Promise<void>; id: number; name: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(`Delete “${name}”? This cannot be undone.`)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="text-sm text-meeple hover:underline">Delete</button>
    </form>
  );
}
