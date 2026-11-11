import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CatalogBoard, type CatalogFilter, type CatalogRow } from "@/components/admin-catalog";
import { GenreChip } from "@/components/admin-forms";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { h2, panel } from "@/components/admin-ui";
import { isAdmin } from "@/lib/auth";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "Katalog · Admin", robots: { index: false } };

export default function CatalogPage({ searchParams }: PageProps<"/admin/catalog">) {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Gate searchParams={searchParams} />
    </Suspense>
  );
}

const FILTERS: CatalogFilter[] = ["notext", "noimage", "nobgg"];

async function Gate({ searchParams }: Pick<PageProps<"/admin/catalog">, "searchParams">) {
  await connection(); // always decide at request time, never at build time
  if (!(await isAdmin())) return <AdminSignIn next="/admin/catalog" />;
  const { filter } = await searchParams;
  return <Dashboard filter={FILTERS.find((f) => f === filter) ?? null} />;
}

async function Dashboard({ filter }: { filter: CatalogFilter | null }) {
  const catalog = await getCatalog();
  const genres = new Map(catalog.genres.map((g) => [g.id, g.name]));
  const perGenre = new Map<number, number>();
  for (const g of catalog.games) perGenre.set(g.genreId, (perGenre.get(g.genreId) ?? 0) + 1);
  const rows: CatalogRow[] = [...catalog.games].sort((a, b) => a.name.localeCompare(b.name)).map((g) => ({
    id: g.id, name: g.name, imageUrl: g.imageUrl, genre: genres.get(g.genreId) ?? "–", linked: g.bggId !== null,
    players: g.maxPlayers === null ? `${g.values.minPlayers}+` : g.maxPlayers === g.values.minPlayers ? `${g.maxPlayers}` : `${g.values.minPlayers}–${g.maxPlayers}`,
    time: g.values.playTime, weight: g.values.complexity, age: g.values.minAge, rating: g.values.rating,
    hasText: Boolean(g.description?.trim()), recommended: g.recommended !== false,
  }));

  return (
    <>
      <AdminHeader kicker="Katalog" title="Katalog game" />
      <div className="grid gap-[18px]">
        {!catalog.live && <p className={`${panel} p-4 text-sm`}>Hanya baca: hubungkan database (DATABASE_URL) untuk menyimpan perubahan.</p>}
        <CatalogBoard rows={rows} initialFilter={filter} live={catalog.live} />
        <section className={`${panel} grid gap-3 p-[22px]`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className={h2}>Genre</h2>
            <span className="font-mono text-xs text-muted">Kriteria &amp; bobot ada di Rekomendasi</span>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {catalog.genres.map((g) => <GenreChip key={g.id} genre={g} count={perGenre.get(g.id) ?? 0} />)}
            <GenreChip genre={null} />
          </div>
        </section>
      </div>
    </>
  );
}
