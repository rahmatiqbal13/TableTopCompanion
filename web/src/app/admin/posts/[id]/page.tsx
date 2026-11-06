import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin-forms";
import { PostEditor } from "@/components/post-editor";
import { isAdmin } from "@/lib/auth";
import { getAllPostsForAdmin, getCatalog } from "@/lib/data";

export default function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/posts" className="text-sm text-muted underline">← Posts</Link>
      <Suspense fallback={<p className="mt-4 text-muted">Loading…</p>}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return <LoginForm />;
  const { id } = await params;
  const [posts, catalog] = await Promise.all([getAllPostsForAdmin(), getCatalog()]);
  const post = id === "new" ? null : posts.find((p) => p.id === Number(id));
  if (id !== "new" && !post) notFound();
  const games = catalog.games.map(({ id, name, year }) => ({ id, name, year })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <h1 className="mb-6 mt-2 font-display text-3xl font-semibold tracking-tight">{post ? "Edit post" : "New post"}</h1>
      {!catalog.live && (
        <p className="mb-6 rounded-xl border border-gold/40 bg-card p-4 text-sm">
          Read-only: connect a database (DATABASE_URL) to save posts.
        </p>
      )}
      <PostEditor post={post ?? null} games={games} canUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />
    </>
  );
}
