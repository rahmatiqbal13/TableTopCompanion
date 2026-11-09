import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminSignIn } from "@/components/admin-signin";
import { DeleteButton } from "@/components/admin-forms";
import { canEdit } from "@/lib/auth";
import { getAllPostsForAdmin } from "@/lib/data";
import { postHref, postText } from "@/lib/i18n-paths";
import { deletePost } from "../actions";

export default function PostsAdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <PostList />
      </Suspense>
    </div>
  );
}

async function PostList() {
  await connection();
  if (!(await canEdit())) return <AdminSignIn />;
  const posts = await getAllPostsForAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Posts</h1>
        <Link href="/admin/posts/new" className="rounded-lg bg-felt px-3.5 py-1.5 text-sm font-medium text-on-felt">New post</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr><th className="px-4 py-2">Title</th><th>Type</th><th>Languages</th><th>Status</th><th>Date</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="max-w-md px-4 py-2 font-medium">{postText(p, "id").text.title}</td>
                <td className="pr-3 capitalize text-muted">{p.type}</td>
                <td className="pr-3 text-xs uppercase text-muted">{(["id", "en"] as const).filter((l) => p.text[l]).join(" · ")}</td>
                <td className="pr-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs ${p.status === "published" ? "bg-felt-soft" : "bg-sunken text-muted"}`}>{p.status}</span>
                </td>
                <td className="pr-3 text-xs tabular text-muted">{p.publishedAt?.slice(0, 10) ?? "–"}</td>
                <td className="px-4">
                  <div className="flex justify-end gap-3">
                    {p.status === "published" && <Link href={postHref("id", p)} className="text-sm underline" target="_blank">View</Link>}
                    <Link href={`/admin/posts/${p.id}`} className="text-sm underline">Edit</Link>
                    <DeleteButton action={deletePost} id={p.id} name={postText(p, "id").text.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts.length && <p className="p-6 text-center text-muted">No posts yet.</p>}
      </div>
    </div>
  );
}
