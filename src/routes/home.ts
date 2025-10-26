import { Hono } from "hono";
import type { AppEnv } from "../app.js";

type Metadata = {
  name: string;
  version: string;
};

export default ({ name, version }: Metadata) => {
  const router = new Hono<AppEnv>();

  router.get("/", (c) => {
    const publicUrl = c.var.publicUrl;
    return c.html(`
<html>
<head>
<title>${name} @ ${version}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:title" content="CIMD Service - OAuth Client ID Metadata Document Service">
<meta property="og:description" content="In development, send this service your Client ID Metadata Document, and it will return you a URL to a publicly available copy.">
<meta property="og:url" content="${publicUrl}">
<meta property="og:site_name" content="CIMD Service">
<meta property="og:locale" content="en_US">
<style type="text/css">
:root {
  color-scheme: light dark;
  --heading-color: #fff;
  --text-color: #e2e2e2;
  --emphasis-color: rgba(114, 175, 253, 1);
}
@media (prefers-color-scheme: light) {
  :root {
    --heading-color: #000;
    --text-color: rgb(75, 85, 99);
    --emphasis-color: rgb(29, 78, 216);
  }
}
#main {
  margin: clamp(1.5rem, 10vw, 3.5rem) clamp(1.5rem, 10vw, 5rem);
  font-family: ui-monospace,SFMono-Regular,Roboto Mono,Menlo,Monaco,Liberation Mono,DejaVu Sans Mono,Courier New,monospace;
  max-width: min(830px, 100dvw, 100vw);
  color: var(--text-color);
}
#main strong {
  color: var(--emphasis-color);
}
#main h1 {
  font-size: clamp(1.2rem, 2.5vw, 4rem);
  margin-bottom: 2.5rem;
  color: var(--heading-color);
}
#main p + p, #main ul + p {
  margin-block: 2.5rem;
}
#main p ~ ul, #main ul ~ p {
  margin-block: 2rem;
}
#main ul {
  white-space: collapse;
  margin-block: 0rem;
}
#main ul.routes {
  list-style-type: none;
}
#main ul li {
  margin-block-end: 0.5rem;
}
</style>
</head>
<body>
  <div id="main">
  <h1>${name} @ ${version}</h1>

  <p>In development, send this service your <strong>Client ID Metadata Document</strong>, and it will return
you a URL to a publicly available copy.<p>

  <p>What are Client ID Metadata Documents? See: <a href="https://cimd.dev/">https://cimd.dev</a></p>

  <p>Endpoints:</p>
  <ul class="routes">
    <li>GET  <a href="/_health">/_health</a></li>
    <li>GET  /clients/:id</li>
    <li>POST /clients</li>
  </ul>

  <p>To get a <strong>client_id</strong>, send a <strong>POST</strong> request to <strong>/clients</strong> with the request body as the contents
  of your Client ID Metadata Document (JSON).</p>

  <p>All clients created on this server will receive the:</p>
  <ul>
    <li><strong>client_id</strong> of: ${new URL("/clients/", publicUrl).href}<strong>:cid</strong></li>
    <li><strong>client_uri</strong> of: ${publicUrl}</li>
    <li><strong>client_name</strong> ending with <strong>(Development)</strong>
  </ul>
</pre>
</body>
`);
  });

  return router;
};
