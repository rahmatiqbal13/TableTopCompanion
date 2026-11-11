import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { FreshAfterSubmit } from "@/components/admin-fresh-form";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { panel } from "@/components/admin-ui";
import { PostEditor } from "@/components/post-editor";
import { canEdit } from "@/lib/auth";
import { getAllPostsForAdmin, getCatalog } from "@/lib/data";

export default function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
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
  const [posts, catalog] = await Promise.all([getAllPostsForAdmin(), getCatalog()]);
  const post = id === "new" ? null : posts.find((p) => p.id === Number(id));
  if (id !== "new" && !post) notFound();
  const games = catalog.games.map(({ id, name, year }) => ({ id, name, year })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <AdminHeader kicker="Editor" title={post ? "Edit konten" : "Tulis"} />
      {!catalog.live && <p className={`${panel} mb-6 p-4 text-sm`}>Hanya baca: hubungkan database (DATABASE_URL) untuk menyimpan konten.</p>}
      <FreshAfterSubmit><PostEditor key={post ? `${post.id}-${post.updatedAt}` : "new"} post={post ?? null} games={games} canUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} /></FreshAfterSubmit>
    </>
  );
}
