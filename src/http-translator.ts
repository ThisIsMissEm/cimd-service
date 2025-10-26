import { type ServerResponse, type IncomingMessage } from "node:http";
import { Readable } from "node:stream";

export function fromRequest(req: IncomingMessage, publicUrl: string): Request {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", publicUrl);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else if (typeof value === "string") {
      headers.append(key, value);
    }
  }

  const body =
    method === "GET" || method === "HEAD" ? null : Readable.toWeb(req);

  return new Request(url, {
    method,
    headers,
    duplex: "half",
    body,
  });
}

export function sendResponse(response: Response, res: ServerResponse) {
  const headers = Object.fromEntries(response.headers.entries());
  res.writeHead(response.status, headers);

  if (response.body !== null) {
    Readable.fromWeb(response.body).pipe(res);
  } else {
    res.end();
  }
}
