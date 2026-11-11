import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CriterionForm, DeleteButton } from "@/components/admin-forms";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { h2, panel } from "@/components/admin-ui";
import { WeightTuner } from "@/components/admin-weights";
import { getDict } from "@/i18n";
import { isAdmin } from "@/lib/auth";
import { getCatalog } from "@/lib/data";
import { deleteCriterion } from "../actions";

export const metadata: Metadata = { title: "Rekomendasi · Admin", robots: { index: false } };

export default function RecommendAdminPage() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Tuner />
    </Suspense>
  );
}

async function Tuner() {
  await connection();
  if (!(await isAdmin())) return <AdminSignIn next="/admin/recommend" />;
  const catalog = await getCatalog();
  const t = getDict("id");
  return (
    <>
      <AdminHeader kicker="TOPSIS hibrida" title="Atur rekomendasi" />
      <div className="grid gap-[22px]">
        <WeightTuner catalog={catalog} presets={t.presets} names={t.criteria} />
        <section className={`${panel} p-[22px]`}>
          <h2 className={h2}>Kriteria &amp; bobot Seimbang</h2>
          <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-muted">Dipakai suasana “Seimbang” dan sebagai titik awal suasana lain. Pengunjung tetap bisa mengubahnya untuk sesi mereka sendiri.</p>
          <div className="mt-2 divide-y divide-line">
            {catalog.criteria.map((c) => (
              <div key={c.id} className="flex items-end gap-3">
                <div className="min-w-0 flex-1"><CriterionForm c={c} /></div>
                <div className="pb-5"><DeleteButton action={deleteCriterion} id={c.id} name={c.name} /></div>
              </div>
            ))}
            <div>
              <p className="pt-3 text-sm font-medium">Kriteria baru <span className="font-normal text-muted">(semua game mulai dari 0; isi nilainya di halaman game)</span></p>
              <CriterionForm c={null} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
