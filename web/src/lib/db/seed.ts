import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { Criterion, Game, Genre } from "../types";
import * as schema from "./schema";

export interface SeedData {
  genres: Genre[];
  criteria: Criterion[];
  games: Game[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema, any>;

/** Inserts seed data with its ids, then moves the serial sequences past them. */
export async function seed(db: AnyDb, data: SeedData) {
  await db.insert(schema.genres).values(data.genres).onConflictDoNothing();
  await db.insert(schema.criteria).values(data.criteria).onConflictDoNothing();
  for (let i = 0; i < data.games.length; i += 100) {
    await db.insert(schema.games).values(data.games.slice(i, i + 100)).onConflictDoNothing();
  }
  for (const table of ["genres", "criteria", "games"]) {
    await db.execute(
      sql.raw(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT MAX(id) FROM ${table}), 1))`),
    );
  }
}
