import Link from "next/link";
import { en } from "@/i18n/en";
import { id } from "@/i18n/id";

// not-found cannot read route params, so show both languages.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-6xl font-semibold text-felt">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">{id.notFound.title}</h1>
      <p className="text-muted">{en.notFound.title}</p>
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/id" className="underline">{id.notFound.home}</Link>
        <Link href="/en" className="underline">{en.notFound.home}</Link>
      </div>
    </div>
  );
}
