import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { FreshAfterSubmit } from "@/components/admin-fresh-form";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { GameForm } from "@/components/admin-forms";
import { isAdmin } from "@/lib/auth";
import { getCatalog } from "@/lib/data";

export default function EditGamePage({ params }: PageProps<"/admin/games/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // always decide at request time, never at build time
  if (!(await isAdmin())) return <AdminSignIn />;
  const { id } = await params;
  const catalog = await getCatalog();
  const game = id === "new" ? null : catalog.games.find((g) => g.id === Number(id));
  if (id !== "new" && !game) notFound();
  return (
    <>
      <AdminHeader kicker="Katalog" title={game ? game.name : "Tambah game"} />
      <FreshAfterSubmit><GameForm game={game ?? null} genres={catalog.genres} criteria={catalog.criteria} /></FreshAfterSubmit>
    </>
  );
}
