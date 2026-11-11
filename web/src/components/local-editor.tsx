"use client";

import { useActionState, useState } from "react";
import { saveListing, type FormState } from "@/app/admin/actions";
import { slugify } from "@/lib/format";
import type { LocalKind, LocalListing } from "@/lib/types";
import { field as input, panel as card, pillPrimary } from "./admin-ui";
import { ImageUpload } from "./post-editor";

const panel = `${card} grid gap-4 p-[22px] sm:grid-cols-2`;
const KINDS: { value: LocalKind; label: string }[] = [
  { value: "cafes", label: "Kafe board game" }, { value: "communities", label: "Komunitas" }, { value: "games", label: "Game buatan Indonesia" },
];
const LANGS = [{ code: "id", label: "Bahasa Indonesia" }, { code: "en", label: "English" }] as const;

export function LocalEditor({ listing, games, canUpload }: { listing: LocalListing | null; games: { id: number; name: string }[]; canUpload: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveListing, {});
  const [kind, setKind] = useState<LocalKind>(listing?.kind ?? "cafes");
  const [name, setName] = useState(listing?.name ?? "");
  const [image, setImage] = useState(listing?.imageUrl ?? "");

  return (
    <form action={action} className="max-w-5xl space-y-6">
      <input type="hidden" name="id" value={listing?.id ?? ""} />

      <div className={panel}>
        <label className="text-sm font-medium">Bagian
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as LocalKind)} className={`${input} mt-1`}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Status
          <select name="status" defaultValue={listing?.status ?? "draft"} className={`${input} mt-1`}>
            <option value="draft">Draf (tersembunyi)</option>
            <option value="published">Terbit</option>
          </select>
        </label>
        <label className="text-sm font-medium">Nama
          <input name="name" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Tautan <span className="font-normal text-muted">(URL)</span>
          <input name="slug" defaultValue={listing?.slug ?? ""} placeholder={slugify(name) || "otomatis dari nama"} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Kota
          <input name="city" maxLength={80} defaultValue={listing?.city ?? ""} placeholder="Jakarta" className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Kontak <span className="font-normal text-muted">(tampil publik)</span>
          <input name="contact" maxLength={120} defaultValue={listing?.contact ?? ""} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Alamat
          <input name="address" maxLength={300} defaultValue={listing?.address ?? ""} className={`${input} mt-1`} />
        </label>
        {kind === "games" && (
          <>
            <label className="text-sm font-medium">Desainer / penerbit
              <input name="designer" maxLength={120} defaultValue={listing?.designer ?? ""} className={`${input} mt-1`} />
            </label>
            <label className="text-sm font-medium">Game di katalog <span className="font-normal text-muted">(opsional)</span>
              <select name="gameId" defaultValue={listing?.gameId ?? ""} className={`${input} mt-1`}>
                <option value="">Tidak ada</option>
                {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
          </>
        )}
      </div>

      <div className={panel}>
        <label className="text-sm font-medium">Tautan Google Maps
          <input name="mapUrl" type="url" defaultValue={listing?.mapUrl ?? ""} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Website
          <input name="websiteUrl" type="url" defaultValue={listing?.websiteUrl ?? ""} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Instagram
          <input name="instagramUrl" type="url" defaultValue={listing?.instagramUrl ?? ""} className={`${input} mt-1`} />
        </label>
        <div>
          <label className="text-sm font-medium">URL gambar
            <input name="imageUrl" type="url" value={image} onChange={(e) => setImage(e.target.value)} className={`${input} mt-1`} />
          </label>
          <ImageUpload enabled={canUpload} onUploaded={(url) => setImage((c) => c || url)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {LANGS.map((l) => {
          const text = listing?.text[l.code];
          return (
            <fieldset key={l.code} className={`${card} space-y-4 p-[22px]`}>
              <legend className="px-1 text-sm font-medium">{l.label}</legend>
              <label className="block text-sm font-medium">Ringkasan
                <textarea name={`summary_${l.code}`} rows={2} maxLength={300} defaultValue={text?.summary ?? ""} className={`${input} mt-1 py-2`} />
              </label>
              <label className="block text-sm font-medium">Jadwal / jam buka
                <input name={`schedule_${l.code}`} maxLength={200} defaultValue={text?.schedule ?? ""} className={`${input} mt-1`} />
              </label>
              <label className="block text-sm font-medium">Deskripsi <span className="font-normal text-muted">(Markdown)</span>
                <textarea name={`body_${l.code}`} rows={8} defaultValue={text?.body ?? ""} className={`${input} mt-1 py-2 font-mono`} />
              </label>
            </fieldset>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button className={pillPrimary} disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        {state.error && <p role="alert" className="text-sm text-meeple">{state.error}</p>}
      </div>
    </form>
  );
}
