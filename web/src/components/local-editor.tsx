"use client";

import { useActionState, useState } from "react";
import { saveListing, type FormState } from "@/app/admin/actions";
import { slugify } from "@/lib/format";
import type { LocalKind, LocalListing } from "@/lib/types";
import { ImageUpload } from "./post-editor";

const input = "w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-sm";
const panel = "grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2";
const KINDS: { value: LocalKind; label: string }[] = [
  { value: "cafes", label: "Board game café" }, { value: "communities", label: "Community" }, { value: "games", label: "Made in Indonesia (game)" },
];
const LANGS = [{ code: "id", label: "Bahasa Indonesia" }, { code: "en", label: "English" }] as const;

export function LocalEditor({ listing, games, canUpload }: { listing: LocalListing | null; games: { id: number; name: string }[]; canUpload: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveListing, {});
  const [kind, setKind] = useState<LocalKind>(listing?.kind ?? "cafes");
  const [name, setName] = useState(listing?.name ?? "");
  const [image, setImage] = useState(listing?.imageUrl ?? "");

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={listing?.id ?? ""} />

      <div className={panel}>
        <label className="text-sm font-medium">Section
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as LocalKind)} className={`${input} mt-1`}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Status
          <select name="status" defaultValue={listing?.status ?? "draft"} className={`${input} mt-1`}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="text-sm font-medium">Name
          <input name="name" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Slug <span className="font-normal text-muted">(URL)</span>
          <input name="slug" defaultValue={listing?.slug ?? ""} placeholder={slugify(name) || "auto from name"} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">City
          <input name="city" maxLength={80} defaultValue={listing?.city ?? ""} placeholder="Jakarta" className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Contact <span className="font-normal text-muted">(shown publicly)</span>
          <input name="contact" maxLength={120} defaultValue={listing?.contact ?? ""} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Address
          <input name="address" maxLength={300} defaultValue={listing?.address ?? ""} className={`${input} mt-1`} />
        </label>
        {kind === "games" && (
          <>
            <label className="text-sm font-medium">Designer / publisher
              <input name="designer" maxLength={120} defaultValue={listing?.designer ?? ""} className={`${input} mt-1`} />
            </label>
            <label className="text-sm font-medium">Game in the catalog <span className="font-normal text-muted">(optional)</span>
              <select name="gameId" defaultValue={listing?.gameId ?? ""} className={`${input} mt-1`}>
                <option value="">None</option>
                {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
          </>
        )}
      </div>

      <div className={panel}>
        <label className="text-sm font-medium">Google Maps link
          <input name="mapUrl" type="url" defaultValue={listing?.mapUrl ?? ""} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Website
          <input name="websiteUrl" type="url" defaultValue={listing?.websiteUrl ?? ""} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Instagram
          <input name="instagramUrl" type="url" defaultValue={listing?.instagramUrl ?? ""} className={`${input} mt-1`} />
        </label>
        <div>
          <label className="text-sm font-medium">Image URL
            <input name="imageUrl" type="url" value={image} onChange={(e) => setImage(e.target.value)} className={`${input} mt-1`} />
          </label>
          <ImageUpload enabled={canUpload} onUploaded={(url) => setImage((c) => c || url)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {LANGS.map((l) => {
          const text = listing?.text[l.code];
          return (
            <fieldset key={l.code} className="space-y-4 rounded-2xl border border-line bg-card p-5">
              <legend className="px-1 text-sm font-medium">{l.label}</legend>
              <label className="block text-sm font-medium">Summary
                <textarea name={`summary_${l.code}`} rows={2} maxLength={300} defaultValue={text?.summary ?? ""} className={`${input} mt-1`} />
              </label>
              <label className="block text-sm font-medium">Schedule / hours
                <input name={`schedule_${l.code}`} maxLength={200} defaultValue={text?.schedule ?? ""} className={`${input} mt-1`} />
              </label>
              <label className="block text-sm font-medium">Description <span className="font-normal text-muted">(Markdown)</span>
                <textarea name={`body_${l.code}`} rows={8} defaultValue={text?.body ?? ""} className={`${input} mt-1 font-mono`} />
              </label>
            </fieldset>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-lg bg-felt px-4 py-2 text-sm font-medium text-on-felt disabled:opacity-60" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        {state.error && <p role="alert" className="text-sm text-meeple">{state.error}</p>}
      </div>
    </form>
  );
}
