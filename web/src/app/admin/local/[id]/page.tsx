import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminSignIn } from "@/components/admin-signin";
import { LocalEditor } from "@/components/local-editor";
import { canEdit } from "@/lib/auth";
import { getAllListingsForAdmin, getCatalog } from "@/lib/data";

export default function EditListingPage({ params }: PageProps<"/admin/local/[id]">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/local" className="text-sm text-muted underline">← Near you</Link>
      <Suspense fallback={<p className="mt-4 text-muted">Loading…</p>}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // always decide at request time, never at build time
  if (!(await canEdit())) return <AdminSignIn />;
  const { id } = await params;
  const [listings, catalog] = await Promise.all([getAllListingsForAdmin(), getCatalog()]);
  const listing = id === "new" ? null : listings.find((l) => l.id === Number(id));
  if (id !== "new" && !listing) notFound();
  const games = catalog.games.map(({ id, name }) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <h1 className="mb-6 mt-2 font-display text-3xl font-semibold tracking-tight">{listing ? "Edit listing" : "New listing"}</h1>
      {!catalog.live && (
        <p className="mb-6 rounded-xl border border-gold/40 bg-card p-4 text-sm">Read-only: connect a database (DATABASE_URL) to save listings.</p>
      )}
      <LocalEditor listing={listing ?? null} games={games} canUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
    </>
  );
}
