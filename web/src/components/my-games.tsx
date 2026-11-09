"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyGames, type MyGameRow } from "@/app/account-actions";
import { fmt, type Dict, type Locale } from "@/i18n";
import { gameHref, href } from "@/lib/i18n-paths";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Game } from "@/lib/types";
import { Cover } from "./cover";
import { Chip } from "./ui";

type Tab = "rated" | "own" | "played" | "wishlist";
type LiteGame = Pick<Game, "id" | "name" | "year" | "imageUrl">;

export function MyGames({ games, t, lang }: { games: LiteGame[]; t: Dict; lang: Locale }) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState<MyGameRow[] | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("rated");
  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(async ({ data }) => setRows(data.session ? await getMyGames() : null));
  }, [sb]);

  if (!sb) return <p className="text-muted">{t.auth.unavailable}</p>;
  if (rows === undefined) return <div className="h-64 animate-pulse rounded-2xl bg-sunken" aria-hidden />;
  if (rows === null) {
    return (
      <Link href={`${href(lang, "/login")}?next=${encodeURIComponent(href(lang, "/me"))}`}
        className="inline-block rounded-xl bg-felt px-5 py-3 font-medium text-on-felt">{t.auth.signIn}</Link>
    );
  }
  const byId = new Map(games.map((g) => [g.id, g]));
  const count = (k: Tab) => rows.filter((r) => (k === "rated" ? r.rating !== null : r[k])).length;
  const shown = rows
    .filter((r) => (tab === "rated" ? r.rating !== null : r[tab]) && byId.has(r.gameId))
    .sort((a, b) => (tab === "rated" ? (b.rating ?? 0) - (a.rating ?? 0) : 0));
  const favourites = rows.filter((r) => (r.rating ?? 0) >= 8).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 10);

  return (
    <div className="space-y-6">
      {favourites.length > 0 && (
        <Link href={`${href(lang, "/recommend")}?fav=${favourites.map((r) => r.gameId).join(",")}`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-felt/40 bg-felt-soft p-5 hover:opacity-90">
          <span>
            <span className="block font-display text-lg font-semibold">{t.me.fromFavourites}</span>
            <span className="text-sm text-muted">{fmt(t.me.fromFavouritesHint, { n: favourites.length })}</span>
          </span>
          <span aria-hidden className="text-2xl text-felt">→</span>
        </Link>
      )}
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {(["rated", "own", "played", "wishlist"] as Tab[]).map((k) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{t.me.tabs[k]} ({count(k)})</Chip>
        ))}
      </div>
      {!shown.length ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          {t.me.empty} <Link href={href(lang, "/games")} className="underline">{t.home.ctaBrowse}</Link>
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((r) => {
            const g = byId.get(r.gameId)!;
            return (
              <li key={r.gameId}>
                <Link href={gameHref(lang, g)} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 hover:bg-sunken">
                  <Cover name={g.name} src={g.imageUrl} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{g.name}</span>
                    <span className="text-xs text-muted">
                      {g.year}
                      {r.own && ` · ${t.me.own}`}{r.played && ` · ${t.me.played}`}{r.wishlist && ` · ${t.me.wishlist}`}
                    </span>
                  </span>
                  {r.rating !== null && <span className="rounded-lg bg-felt px-2 py-1 font-display font-semibold tabular text-on-felt">{r.rating}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
