import { Hono } from "hono";
import http from "node:http";
import { once } from "node:events";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";

import { getDb } from "./db/index.js";
import { fromRequest, sendResponse } from "./http-translator.js";
import type { DatabaseSync } from "node:sqlite";
import type { AppEnv } from "./app.js";
import type { Environment } from "./env.js";
import { createMiddleware } from "hono/factory";

export class Server {
  app?: Hono<AppEnv>;
  public server?: http.Server;
  public serverUrl?: string;
  public publicUrl?: string;
  private env?: Environment;
  private db?: DatabaseSync;
  private terminator?: HttpTerminator;

  constructor() {}

  static create() {
    return new Server();
  }

  async createApp(): Promise<Hono<AppEnv>> {
    if (this.app) return this.app;

    const { router } = await import("./app.js");

    const app = new Hono<AppEnv>();

    const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
      this.db && c.set("db", this.db);
      this.env && c.set("env", this.env);
      this.publicUrl && c.set("publicUrl", this.publicUrl);
      return await next();
    });

    app.use("*", dbMiddleware);
    app.route("/", router);

    this.app = app;
    return this.app;
  }

  async start() {
    const { default: env } = await import("./env.js");
    const db = await getDb();
    const app = await this.createApp();

    const port = env.get("PORT", 3000);
    const bind = env.get("HOST");
    const publicUrl = env.get("PUBLIC_URL");

    this.env = env;
    this.db = db;
    this.server = http
      .createServer(async (req, res) => {
        const url = publicUrl ?? `http://localhost:3000/`;
        const request = fromRequest(req, url);

        const response = await app.fetch(request);
        sendResponse(response, res);
      })
      .listen(port, bind);

    this.terminator = createHttpTerminator({
      server: this.server,
      gracefulTerminationTimeout: 5000,
    });

    await once(this.server, "listening");
    const info = this.server.address();
    if (!info || typeof info === "string") {
      return;
    }

    this.serverUrl = `http://${info.address == "::" ? "localhost" : info.address}:${info.port}/`;
    this.publicUrl = publicUrl ?? this.serverUrl;
  }

  async stop() {
    await this.terminator?.terminate();
    await this.db?.close();
  }
}
