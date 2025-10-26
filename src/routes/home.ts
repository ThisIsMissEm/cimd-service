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
<meta property="og:title" content="CIMD Service - OAuth Client ID Metadata Document Service">
<meta property="og:description" content="Send it your Client ID Metadata Document in development, and it will return you a URL to a publicly available copy.">
<meta property="og:url" content="${publicUrl}">
<meta property="og:site_name" content="CIMD Service">
<meta property="og:locale" content="en_US">
<style type="text/css">
:root {
  color-scheme: light dark;
}
#main {
  margin: 3rem;
}
</style>
</head>
<body>
  <pre id="main">
  ${name} @ ${version}


  This is a Client ID Metadata Documents Service, send it your Client ID Metadata Document,
  and it will return you a URL to a publicly available copy.


  What are Client ID Metadata Documents? See: <a href="https://cimd.dev/">https://cimd.dev</a>

  
  Endpoints:

    GET  <a href="/_health">/_health</a>
    GET  /clients/:id
    POST /clients with your Client ID Metadata Document as the JSON body
</pre>
</body>
`);
  });

  return router;
};
