import { cidForCbor } from "@atproto/common";
import { CID } from "multiformats";
import { DateTime } from "luxon";

import {
  type ClientMetadata,
  clientMetadataSchema,
} from "../schemas/oauthClientMetadata.js";
import { getDb } from "../db/index.js";
import { DatabaseError, InvalidRowError, NotFoundError } from "../errors.js";
import env from "../env.js";
import { stringToJSONSchema } from "../utils.js";

const CLIENT_TOUCH_INTERVAL = env.get("CLIENT_TOUCH_INTERVAL", 30);

const db = await getDb();
const readClientByCid = db.prepare(`SELECT * FROM clients WHERE cid = ?`);
type ClientRow = ReturnType<typeof readClientByCid.get>;

const insertClient = db.prepare(`
  INSERT INTO clients (cid, metadata, createdAt) VALUES (?, ?, ?)
  ON CONFLICT(cid) DO NOTHING
  RETURNING createdAt AS createdAt, lastUsedAt as lastUsedAt
`);
const touchClientByCid = db.prepare(
  `UPDATE clients SET lastUsedAt = $lastUsedAt WHERE cid = $cid;`
);

const beginTransaction = db.prepare(`BEGIN TRANSACTION;`);
const commitTransaction = db.prepare(`COMMIT;`);
const rollbackTransaction = db.prepare(`ROLLBACK;`);

async function withTransaction<T>(callback: () => T | Promise<T>): Promise<T> {
  let transactionBegun = false;
  try {
    await beginTransaction.run();
    transactionBegun = true;
    const result = await callback();
    await commitTransaction.run();

    return result;
  } catch (err) {
    if (transactionBegun) {
      await rollbackTransaction.run();
    }

    throw err;
  }
}

export type DateISO = `${string}T${string}Z`;
export interface Client {
  cid: CID;
  metadata: ClientMetadata;
  createdAt: DateTime;
  lastUsedAt: DateTime | null;
}

export type ClientWithLastUsedAt = Client & {
  lastUsedAt: DateTime;
};

function rowToClient(row: NonNullable<ClientRow>): Client {
  if (!row["cid"] || !row["metadata"] || !row["createdAt"]) {
    throw new InvalidRowError();
  }

  const metadata = stringToJSONSchema
    .pipe(clientMetadataSchema.omit({ client_id: true }))
    .safeParse(row["metadata"].toString());

  if (!metadata.success) {
    throw new InvalidRowError(metadata.error.message);
  }

  return {
    cid: CID.parse(row["cid"].toString()),
    metadata: metadata.data,
    createdAt: DateTime.fromISO(row["createdAt"].toString()),
    lastUsedAt: row["lastUsedAt"]
      ? DateTime.fromISO(row["lastUsedAt"].toString())
      : null,
  };
}

export async function getClient(cid: string | CID): Promise<Client> {
  const row = await readClientByCid.get(cid.toString());
  if (!row) {
    throw new NotFoundError();
  }

  return rowToClient(row);
}

export async function touchClient(
  client: Client
): Promise<ClientWithLastUsedAt> {
  const cid = client.cid.toString();
  const now = DateTime.now();

  let touch = false;
  if (client.lastUsedAt === null || !client.lastUsedAt.isValid) {
    touch = true;
  }

  if (client.lastUsedAt !== null) {
    const minLastUsedAt = now.minus({ seconds: CLIENT_TOUCH_INTERVAL });
    const lastUsedAt = client.lastUsedAt;

    // If the token was last used over a day ago, or the token was last used
    // somehow in the future, touch the lastUsedAt timestamp
    touch = lastUsedAt < minLastUsedAt || lastUsedAt > now;
  }

  let touched = false;
  if (touch) {
    console.log("Touching lastUsedAt for client:", cid);
    try {
      await touchClientByCid.run({
        cid: client.cid.toString(),
        lastUsedAt: now.toISO(),
      });
      touched = true;
    } catch (err) {
      console.warn("Failed to touch client lastUsedAt:", cid, err);
    }
  }

  return {
    ...client,
    lastUsedAt: touched ? now : (client.lastUsedAt as DateTime),
  };
}

export async function createClient({
  client_id,
  ...clientMetadata
}: ClientMetadata): Promise<Client> {
  const createdAt = DateTime.now();
  const cid = await cidForCbor(clientMetadata);
  const serializedMetadata = JSON.stringify(clientMetadata);

  const [changes, row] = await withTransaction<["new" | "existing", ClientRow]>(
    async () => {
      const insert = await insertClient.run(
        cid.toString(),
        serializedMetadata,
        createdAt.toISO()
      );

      const client = await readClientByCid.get(cid.toString());

      return [insert.changes == 1 ? "new" : "existing", client];
    }
  );

  if (!row) {
    throw new DatabaseError("Failed to retrieve client after creation");
  }

  const client = rowToClient(row);
  if (changes == "existing") {
    return await touchClient(client);
  }

  return client;
}
