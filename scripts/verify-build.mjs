import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve(process.argv[2] || "dist");
const manifest = JSON.parse(
  await readFile(path.join(root, ".build-manifest.json"), "utf8"),
);
for (const [file, expected] of Object.entries(manifest)) {
  if (file.includes("..") || path.isAbsolute(file))
    throw Error(`Unsafe manifest path ${file}`);
  const actual = createHash("sha256")
    .update(await readFile(path.join(root, file)))
    .digest("hex");
  if (actual !== expected) throw Error(`Build hash mismatch: ${file}`);
  if (file !== "index.html" && !file.includes(`.${actual.slice(0, 16)}.`))
    throw Error(`Asset is not fingerprinted: ${file}`);
}
const html = await readFile(path.join(root, "index.html"), "utf8");
if ((html.match(/class="chapter"/g) || []).length !== 81)
  throw Error("Missing chapters");
if ((html.match(/class="verse"/g) || []).length !== 1118)
  throw Error("Missing bilingual rows");
for (const match of html.matchAll(/(?:src|href)="\.\/(assets\/[^"#]+)"/g))
  if (!manifest[match[1]]) throw Error(`Missing referenced asset ${match[1]}`);
const files = await readdir(path.join(root, "assets"));
if (files.some((file) => !manifest[`assets/${file}`]))
  throw Error("Untracked build asset");
if (/\{\{\w+\}\}/.test(html)) throw Error("Unresolved template token");
console.log(
  `Verified 81 chapters, 1,118 rows, and ${Object.keys(manifest).length - 1} fingerprinted assets.`,
);
