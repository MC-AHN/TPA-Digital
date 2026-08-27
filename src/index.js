import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";

import santriRoute from "./apis/santri.js";
import mutabaahRoute from "./apis/mutabaah.js";
import login from "./apis/login.js";
import halaqahRoute from "./apis/halaqah.js";
import adminRoute from "./apis/admin.js";
import rekapRoute from "./apis/rekap.js";

const app = new Hono();
app.use("/*", cors());

app.route("/api/santri", santriRoute);
app.route("/api/mutabaah", mutabaahRoute);
app.route("/api/login", login);
app.route("/api/halaqah", halaqahRoute);
app.route("/api/admin", adminRoute);
app.route("/api/rekap", rekapRoute)

// -- STATIC FILES --
if (process.env.NODE_ENV !== "production") {
  app.use("/*", serveStatic({ root: "./public" }));
}

// Start Server
const port = 8002;
console.log(`Server running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });

export default app;