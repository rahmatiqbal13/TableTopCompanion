import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminSignIn } from "@/components/admin-signin";
import { AdminSignOut } from "@/components/admin-sign-out";
import { CriterionForm, DeleteButton, GenreRow } from "@/components/admin-forms";
import { isAdmin } from "@/lib/auth";
import { getCatalog } from "@/lib/data";
import { deleteCriterion, deleteGame, refreshSiteData } from "../actions";

export const metadata: Metadata = { title: "Catalog · Admin", robots: { index: false } };

export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  await connection(); // always decide at request time, never at build time
  if (!(await isAdmin())) return <AdminSignIn next="/admin/catalog" />;
  return <Dashboard />;
}


async function Dashboard() {
  const catalog = await getCatalog();
  const genres = new Map(catalog.genres.map((g) => [g.id, g.name]));
  const perGenre = new Map<number, number>();
  for (const g of catalog.games) perGenre.set(g.genreId, (perGenre.get(g.genreId) ?? 0) + 1);
  const games = [...catalog.games].sort((a, b) => a.name.localeCompare(b.name));
  const section = "rounded-2xl border border-line bg-card p-5";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Catalog</h1>
        <div className="flex items-center gap-4">
          <form action={refreshSiteData}>
            <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-sunken"
              title="Use after editing tables directly in Supabase">↻ Refresh site data</button>
          </form>
          <AdminSignOut />
        </div>
      </div>
      {!catalog.live && (
        <p role="status" className="rounded-xl border border-gold/40 bg-card p-4 text-sm">
          <strong>Read-only:</strong> no database is connected, so the bundled seed data is shown and changes cannot be saved.
          Put your Supabase connection string in DATABASE_URL, then run <code className="font-mono">npm run db:setup</code>.
        </p>
      )}

      <section className={section}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Games <span className="text-sm font-normal text-muted">({games.length})</span></h2>
          <Link href="/admin/games/new" className="rounded-lg bg-felt px-3.5 py-1.5 text-sm font-medium text-on-felt">Add game</Link>
        </div>
        <div className="max-h-[32rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs text-muted">
              <tr><th className="py-2">Name</th><th>Genre</th><th>Year</th><th>BGG</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {games.map((g) => (
                <tr key={g.id}>
                  <td className="py-2 pr-2 font-medium">{g.name}</td>
                  <td className="pr-2 text-muted">{genres.get(g.genreId)}</td>
                  <td className="pr-2 tabular">{g.year}</td>
                  <td className="pr-2 text-xs text-muted">{g.bggId ? "✓ linked" : "–"}</td>
                  <td>
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/games/${g.id}`} className="text-sm underline">Edit</Link>
                      <DeleteButton action={deleteGame} id={g.id} name={g.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={section}>
        <h2 className="font-display text-lg font-semibold">Criteria</h2>
        <p className="text-sm text-muted">Default weights and directions for the “Balanced” preset. Visitors can override them for their own session.</p>
        <div className="divide-y divide-line">
          {catalog.criteria.map((c) => (
            <div key={c.id} className="flex items-end gap-3">
              <div className="flex-1"><CriterionForm c={c} /></div>
              <div className="pb-4"><DeleteButton action={deleteCriterion} id={c.id} name={c.name} /></div>
            </div>
          ))}
          <div><p className="pt-3 text-sm font-medium">New criterion <span className="font-normal text-muted">(every game starts at 0; edit games to set real values)</span></p><CriterionForm c={null} /></div>
        </div>
      </section>

      <section className={section}>
        <h2 className="font-display text-lg font-semibold">Genres</h2>
        <div className="divide-y divide-line">
          {catalog.genres.map((g) => <GenreRow key={g.id} genre={g} count={perGenre.get(g.id) ?? 0} />)}
          <GenreRow genre={null} />
        </div>
      </section>
    </div>
  );
}
