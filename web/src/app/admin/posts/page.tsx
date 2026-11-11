import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { PostsBoard } from "@/components/admin-posts";
import { canEdit } from "@/lib/auth";
import { getAllPostsForAdmin, getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "Konten · Admin", robots: { index: false } };

export default function PostsAdminPage() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <PostList />
    </Suspense>
  );
}

async function PostList() {
  await connection();
  if (!(await canEdit())) return <AdminSignIn />;
  const [posts, catalog] = await Promise.all([getAllPostsForAdmin(), getCatalog()]);
  const names = Object.fromEntries(catalog.games.map((g) => [g.id, g.name]));
  return (
    <>
      <AdminHeader kicker="Ulasan, video, berita, panduan" title="Konten" />
      <PostsBoard posts={posts} gameNames={names} />
    </>
  );
}
