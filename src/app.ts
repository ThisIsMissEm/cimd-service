import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import fs from "node:fs/promises";
import path from "node:path";

import type { DatabaseSync } from "node:sqlite";
import type { Environment } from "./env.js";

import clients from "./routes/clients.js";

let name: string = "cimd-service";
let version: string = "unknown";

// In docker, the package.json is located at /app/package.json,
// In development it's ../package.json:
const root = import.meta.dirname === "/app" ? "./" : "../";
const packageJson = JSON.parse(
  await fs.readFile(path.join(import.meta.dirname, root, "package.json"), {
    encoding: "utf-8",
  })
);

version = packageJson.version;
name = packageJson.name.split("/", 2)[1];

export type AppEnv = {
  Variables: {
    db: DatabaseSync;
    env: Environment;
    publicUrl: string;
  };
};

export const router = new Hono<AppEnv>();

router.onError((err, c) => {
  console.log(err);
  return c.json({
    error: "internal_server_error",
  });
});

router.use("*", requestId());
router.use("*", logger());
router.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST"],
  })
);

router.get("/", (c) => {
  return c.text(`
  ${name} @ ${version}


  This is a Client ID Metadata Documents Service, send it your Client ID Metadata Document,
  and it will return you a URL to a publicly available copy.

  What are Client ID Metadata Documents? See: https://cimd.dev

  Endpoints:

    GET  /_health
    GET  /clients/:id
    POST /clients with your Client ID Metadata Document as the JSON body

`);
});

router.get("/_health", async function (c) {
  try {
    await c.var.db.exec(`select 1`);
  } catch (err) {
    console.error(err, "failed health check");
    return c.json(
      {
        name,
        version,
        error: "service_unavailable",
      },
      503
    );
  }

  return c.json({ name, version });
});

router.route("/clients", clients);
