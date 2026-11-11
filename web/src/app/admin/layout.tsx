import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin-shell";
import { fontClasses } from "../fonts";
import "../globals.css";

export const metadata: Metadata = { title: "Admin · TableTop Companion", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="id" className={fontClasses}>
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <AdminSidebar />
          <main className="min-w-0 flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-10 lg:pt-9">{children}</main>
        </div>
      </body>
    </html>
  );
}
