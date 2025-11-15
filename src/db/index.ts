import { DatabaseSync } from "node:sqlite";
import { migrate } from "./migrations.js";
import env from "../env.js";

let database: DatabaseSync;
export async function getDb(): Promise<DatabaseSync> {
  if (database) return database;

  const DATABASE_PATH = env.get("DB_PATH", "db.sqlite");
  if (DATABASE_PATH === ":memory:") {
    throw new Error("Please use a file based sqlite DB_PATH");
  }

  database = new DatabaseSync(DATABASE_PATH);

  await migrate({
    url: `sqlite:${DATABASE_PATH}`,
  });

  database.exec(`PRAGMA journal_mode = WAL`);

  return database;
}
