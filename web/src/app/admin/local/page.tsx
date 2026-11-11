import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin-forms";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { StatusPill, eyebrow, panel, pillAccent, pillFelt, pillGhost } from "@/components/admin-ui";
import { canEdit } from "@/lib/auth";
import { getAllListingsForAdmin } from "@/lib/data";
import { listingHref, listingText } from "@/lib/i18n-paths";
import type { LocalKind } from "@/lib/types";
import { deleteListing, setListingStatus } from "../actions";

export const metadata: Metadata = { title: "Main di sekitarmu · Admin", robots: { index: false } };

const KIND: Record<LocalKind, { label: string; color: string }> = {
  cafes: { label: "Kafe", color: "bg-table" },
  communities: { label: "Komunitas", color: "bg-meeple" },
  games: { label: "Game lokal", color: "bg-gold" },
};

export default function LocalAdminPage() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Listings />
    </Suspense>
  );
}

async function Listings() {
  await connection();
  if (!(await canEdit())) return <AdminSignIn />;
  const listings = await getAllListingsForAdmin();
  return (
    <>
      <AdminHeader kicker="Listing lokal" title="Main di sekitarmu" />
      <div className="grid gap-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-muted">Kafe, komunitas, dan game buatan Indonesia. Periksa alamat dan jadwal sebelum menerbitkan.</p>
          <Link href="/admin/local/new" className={pillAccent}>+ Listing baru</Link>
        </div>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {listings.map((l) => {
            const kind = KIND[l.kind];
            const draft = l.status === "draft";
            return (
              <article key={l.id} className={`${panel} grid content-start gap-3 p-[18px]`}>
                <div className="flex items-start gap-3">
                  <span aria-hidden className={`size-10 shrink-0 rounded-xl ${kind.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`${eyebrow} text-[11px] text-felt`}>{kind.label} · <span className="text-muted">{l.city || "Tanpa kota"}</span></p>
                    <h2 className="mt-1 font-display text-[19px] font-semibold tracking-[-0.015em]">{l.name}</h2>
                  </div>
                  <StatusPill status={l.status} />
                </div>
                <p className="text-sm leading-normal text-muted">{listingText(l, "id").text.summary || "Belum ada ringkasan."}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={setListingStatus}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value={draft ? "published" : "draft"} />
                    <button className={draft ? pillFelt : `${pillGhost} min-h-10!`}>{draft ? "Terbitkan" : "Jadikan draf"}</button>
                  </form>
                  <Link href={`/admin/local/${l.id}`} className={`${pillGhost} min-h-10!`}>Edit</Link>
                  {!draft && <Link href={listingHref("id", l)} target="_blank" className="text-sm underline underline-offset-[3px]">Lihat</Link>}
                  <span className="ml-auto flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">{l.updatedAt.slice(0, 10)}</span>
                    <DeleteButton action={deleteListing} id={l.id} name={l.name} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
        {!listings.length && <p className={`${panel} p-6 text-center text-muted`}>Belum ada listing.</p>}
      </div>
    </>
  );
}
