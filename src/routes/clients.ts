import { Hono } from "hono";
import { isValidCid } from "@atproto/common";
import type { CID } from "multiformats";

import type { AppEnv } from "../app.js";
import { clientMetadataSchema } from "../schemas/oauthClientMetadata.js";
import { createClient, getClient, touchClient } from "../models/clients.js";
import { InternalServerError, NotFoundError } from "../errors.js";

import env from "../env.js";
import { stringToJSONSchema } from "../utils.js";

const CLIENT_EXPIRY_MS = env.get("CLIENT_EXPIRY_MS", 24 * 60 * 60);

const router = new Hono<AppEnv>();

const getClientId = (cid: CID, publicUrl: string) => {
  return new URL(`/clients/${cid.toString()}`, publicUrl).href;
};

router.onError((err, c) => {
  if (err instanceof NotFoundError) {
    return c.json(
      {
        error: "invalid_client",
      },
      404
    );
  }

  throw err;
});

router.get("/", (c) => {
  return c.redirect("/");
});

router.get("/:id", async (c) => {
  const cid = c.req.param("id");
  const validCid = await isValidCid(cid);
  if (!validCid) {
    throw new NotFoundError();
  }

  const client = await touchClient(await getClient(cid));
  const expiresAt = client.lastUsedAt.plus(CLIENT_EXPIRY_MS).toHTTP();

  if (expiresAt) {
    c.header("Expires", expiresAt);
  }

  return c.json({
    ...client.metadata,
    client_id: getClientId(client.cid, c.var.publicUrl),
    client_uri: c.var.publicUrl,
  });
});

router.post("/", async (c) => {
  const input = await c.req.text();
  const result = stringToJSONSchema.pipe(clientMetadataSchema).safeParse(input);

  if (!result.success) {
    c.status(400);
    return c.json({
      error: "invalid_client_metadata",
      validation_errors: result.error.flatten(),
    });
  }

  const { cid, createdAt, lastUsedAt } = await createClient(result.data);

  const expiresAt = (lastUsedAt ?? createdAt).plus(CLIENT_EXPIRY_MS).toHTTP();
  if (!expiresAt) {
    throw new InternalServerError();
  }

  c.header("Expires", expiresAt);
  return c.json({
    client_id: getClientId(cid, c.var.publicUrl),
    expiresAfter: expiresAt,
  });
});

export default router;
