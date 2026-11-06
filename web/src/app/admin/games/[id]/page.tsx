import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameForm, LoginForm } from "@/components/admin-forms";
import { isAdmin } from "@/lib/auth";
import { getCatalog } from "@/lib/data";

export default function EditGamePage({ params }: PageProps<"/admin/games/[id]">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin" className="text-sm text-muted underline">← Admin</Link>
      <Suspense fallback={<p className="mt-4 text-muted">Loading…</p>}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return <LoginForm />;
  const { id } = await params;
  const catalog = await getCatalog();
  const game = id === "new" ? null : catalog.games.find((g) => g.id === Number(id));
  if (id !== "new" && !game) notFound();
  return (
    <>
      <h1 className="mb-6 mt-2 font-display text-3xl font-semibold tracking-tight">{game ? `Edit ${game.name}` : "Add a game"}</h1>
      <GameForm game={game ?? null} genres={catalog.genres} criteria={catalog.criteria} />
    </>
  );
}
