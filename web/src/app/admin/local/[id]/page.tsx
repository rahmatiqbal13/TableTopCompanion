import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { FreshAfterSubmit } from "@/components/admin-fresh-form";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { panel } from "@/components/admin-ui";
import { LocalEditor } from "@/components/local-editor";
import { canEdit } from "@/lib/auth";
import { getAllListingsForAdmin, getCatalog } from "@/lib/data";

export default function EditListingPage({ params }: PageProps<"/admin/local/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Editor params={params} />
    </Suspense>
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
      <AdminHeader kicker="Listing lokal" title={listing ? listing.name : "Listing baru"} />
      {!catalog.live && <p className={`${panel} mb-6 p-4 text-sm`}>Hanya baca: hubungkan database (DATABASE_URL) untuk menyimpan listing.</p>}
      <FreshAfterSubmit><LocalEditor listing={listing ?? null} games={games} canUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} /></FreshAfterSubmit>
    </>
  );
}
