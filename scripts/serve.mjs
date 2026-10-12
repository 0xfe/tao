import http from "node:http";
import { readFile, stat, watch } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./build.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
await build();
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const port = Number(
  portIndex < 0 ? process.env.PORT || 5174 : args[portIndex + 1],
);
const host = process.env.HOST || "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (pathname === "/tao") {
      res.writeHead(308, { Location: "/tao/" });
      res.end();
      return;
    }
    if (pathname.startsWith("/tao/")) pathname = pathname.slice(4);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.resolve(dist, `.${pathname}`);
    if (
      !file.startsWith(dist + path.sep) ||
      path.basename(file).startsWith(".")
    )
      throw Error("Not found");
    if (!(await stat(file)).isFile()) throw Error("Not found");
    const bytes = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});
server.listen(port, host, () =>
  console.log(`Tao Te Ching → http://${host}:${port}/tao/`),
);
if (args.includes("--watch")) {
  let building = false,
    pending = false;
  async function rebuild() {
    if (building) {
      pending = true;
      return;
    }
    building = true;
    try {
      await build();
      console.log("Updated. Refresh the browser.");
    } catch (error) {
      console.error(error);
    } finally {
      building = false;
      if (pending) {
        pending = false;
        rebuild();
      }
    }
  }
  for (const folder of ["src", "assets"])
    (async () => {
      for await (const event of watch(path.join(root, folder), {
        recursive: true,
      }))
        if (event.filename) rebuild();
    })();
}
