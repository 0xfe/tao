import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const read = (file) => readFile(path.join(root, file));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function build() {
  const data = JSON.parse(await read("assets/tao-te-ching.json"));
  if (
    data.chapters.length !== 81 ||
    data.chapters.some((c, i) => c.number !== i + 1 || !c.lines.length)
  )
    throw Error("Incomplete book");
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, "assets"), { recursive: true });
  const manifest = {};
  async function asset(name, bytes) {
    const extension = path.extname(name);
    const filename = `assets/${path.basename(name, extension)}.${hash(bytes).slice(0, 16)}${extension}`;
    await writeFile(path.join(output, filename), bytes);
    manifest[filename] = hash(bytes);
    return `./${filename}`;
  }
  const tokens = {
    FONT_EN: await asset(
      "cormorant.woff2",
      await read("assets/fonts/cormorant-latin.woff2"),
    ),
    FONT_ZH: await asset(
      "noto-serif-tc.woff2",
      await read("assets/fonts/noto-serif-tc-book.woff2"),
    ),
    LOGO: await asset("yin-yang.png", await read("assets/art/yin-yang.png")),
    DATA: await asset("tao-te-ching.json", JSON.stringify(data)),
  };
  for (const name of ["CormorantGaramond-OFL.txt", "NotoSerifTC-OFL.txt"])
    await asset(name, await read(`assets/fonts/${name}`));
  const css = (await read("src/style.css"))
    .toString()
    .replace(/\{\{(FONT_\w+)\}\}/g, (_, key) =>
      tokens[key].replace("./assets/", "./"),
    );
  tokens.CSS = await asset("style.css", css);
  tokens.JS = await asset("app.js", await read("src/app.js"));
  tokens.NOTICE = data.source.notice.map(escape).join("<br>");
  tokens.CHAPTERS = data.chapters
    .map(
      (
        chapter,
      ) => `<section class="chapter" id="${chapter.id}" data-number="${chapter.number}" aria-labelledby="heading-${chapter.number}">
    <div class="chapter-heading"><span class="chinese-heading" lang="zh-Hant">${escape(chapter.title.chinese)}</span><h2 id="heading-${chapter.number}" tabindex="-1"><a href="#${chapter.id}">${escape(chapter.title.english)}</a></h2><span class="chapter-number">${String(chapter.number).padStart(2, "0")} / 81</span></div>
    ${chapter.lines.map((line) => `<p class="verse" id="${line.id}"><span class="chinese" lang="zh-Hant">${escape(line.chinese)}</span><span class="english">${escape(line.english)}</span></p>`).join("\n")}
    <div class="chapter-end" aria-hidden="true"><span></span></div></section>`,
    )
    .join("\n");
  tokens.INDEX = data.chapters
    .map(
      (chapter) =>
        `<a class="index-link" href="#${chapter.id}" data-number="${chapter.number}" aria-label="Chapter ${chapter.number}: ${escape(chapter.lines[0].english)}"><span class="index-number">${String(chapter.number).padStart(2, "0")}</span><span class="index-excerpt">${escape(chapter.lines[0].english)}</span><span class="index-chinese" lang="zh-Hant">${escape(chapter.title.chinese)}</span></a>`,
    )
    .join("\n");
  const html = (await read("src/index.html"))
    .toString()
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in tokens)) throw Error(`Unknown token ${key}`);
      return tokens[key];
    });
  await writeFile(path.join(output, "index.html"), html);
  manifest["index.html"] = hash(html);
  await writeFile(
    path.join(output, ".build-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `Built ${data.chapters.length} chapters / ${data.line_count} bilingual lines → dist/`,
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
