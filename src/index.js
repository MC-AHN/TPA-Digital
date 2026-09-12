import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { streamSSE } from "hono/streaming";
import EventEmitter from "events";

import santriRoute from "./apis/santri.js";
import mutabaahRoute from "./apis/mutabaah.js";
import login from "./apis/login.js";
import halaqahRoute from "./apis/halaqah.js";
import adminRoute from "./apis/admin.js";
import rekapRoute from "./apis/rekap.js";

const app = new Hono();
app.use("/*", cors());

export const realtimeEvents = new EventEmitter();

// Endpoint SSE Realtime yang Aman
app.get("/api/realtime", (c) => {
  return streamSSE(c, async (stream) => {
    const onMutabaahUpdate = async (data) => {
      try {
        await stream.writeSSE({
          data: JSON.stringify(data),
          event: "mutabaah-update",
          id: String(Date.now()),
        });
      } catch (e) {
        // Abaikan jika stream terputus
      }
    };

    realtimeEvents.on("update", onMutabaahUpdate);

    // Initial connection message
    await stream.writeSSE({
      data: "Connected",
      event: "connected",
    });

    // Cleanup saat koneksi mati
    stream.onAbort(() => {
      realtimeEvents.off("update", onMutabaahUpdate);
    });

    // Keep connection alive
    while (!stream.aborted) {
      await stream.sleep(20000);
      try {
        await stream.writeSSE({ data: "ping", event: "ping" });
      } catch (e) {
        break;
      }
    }
  });
});

app.route("/api/santri", santriRoute);
app.route("/api/mutabaah", mutabaahRoute);
app.route("/api/login", login);
app.route("/api/halaqah", halaqahRoute);
app.route("/api/admin", adminRoute);
app.route("/api/rekap", rekapRoute);

if (process.env.NODE_ENV !== "production") {
  app.use("/*", serveStatic({ root: "./public" }));
}

const port = 8002;
console.log(`Server running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });

export default app;