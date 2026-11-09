import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin-forms";
import { AdminSignIn } from "@/components/admin-signin";
import { canEdit } from "@/lib/auth";
import { getAllListingsForAdmin } from "@/lib/data";
import { listingHref } from "@/lib/i18n-paths";
import { deleteListing } from "../actions";

export default function LocalAdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ListingTable />
      </Suspense>
    </div>
  );
}

async function ListingTable() {
  await connection();
  if (!(await canEdit())) return <AdminSignIn />;
  const listings = await getAllListingsForAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Near you</h1>
        <Link href="/admin/local/new" className="rounded-lg bg-felt px-3.5 py-1.5 text-sm font-medium text-on-felt">New listing</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr><th className="px-4 py-2">Name</th><th>Section</th><th>City</th><th>Status</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {listings.map((l) => (
              <tr key={l.id}>
                <td className="max-w-md px-4 py-2 font-medium">{l.name}</td>
                <td className="pr-3 capitalize text-muted">{l.kind}</td>
                <td className="pr-3 text-muted">{l.city || "–"}</td>
                <td className="pr-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs ${l.status === "published" ? "bg-felt-soft" : "bg-sunken text-muted"}`}>{l.status}</span>
                </td>
                <td className="px-4">
                  <div className="flex justify-end gap-3">
                    {l.status === "published" && <Link href={listingHref("id", l)} className="text-sm underline" target="_blank">View</Link>}
                    <Link href={`/admin/local/${l.id}`} className="text-sm underline">Edit</Link>
                    <DeleteButton action={deleteListing} id={l.id} name={l.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!listings.length && <p className="p-6 text-center text-muted">No listings yet.</p>}
      </div>
    </div>
  );
}
