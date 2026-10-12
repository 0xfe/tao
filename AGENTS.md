# Tao Te Ching project guidance

This file captures the user's requirements and accepted direction for this repository. Follow later user instructions when they change these preferences. Keep this guidance coherent with deliberate changes to the product.

## Product and reading experience

- Build a contemplative, interactive web edition of the complete Tao Te Ching in traditional Chinese and English.
- Keep the whole book on one continuous scrollable page. Chapter navigation jumps to locations in that page; do not replace it with separate chapter pages or a paginated reader without a new request.
- Use large, readable text in both languages that fits the display. The current layout aligns Chinese and English side by side on desktop and places each Chinese line above its English translation on phones.
- Mobile is a primary target. Preserve comfortable touch targets, text wrapping, safe-area spacing, and a usable navigator at widths as narrow as 320px.
- Keep the chapter index hidden until opened. Preserve searching by chapter number and words in either language, previous/next buttons, chapter tracking, direct hash links, and browser Back/Forward.
- Preserve the current browser-local reading-position memory and resume link. Do not automatically move a returning reader away from the cover unless the URL specifies a chapter.
- All 81 chapters must remain readable in the built HTML without JavaScript.

## Visual direction and explicit preferences

- Aim for a clean, quiet East Asian spiritual aesthetic: warm ivory paper, dark serif text, restrained vermilion accents, and subtle warm ink linework. Avoid adding explanatory or decorative copy just to fill space.
- The user's color and typography reference is https://m.media-amazon.com/images/I/61pplqs-e4L._SL1200_.jpg. Use it as visual direction, not as an image to display or distribute.
- Keep “Original translation by Derek Lin” in the masthead, with Derek Lin linked to https://www.amazon.ca/dp/1594732043. It replaces the former masthead tagline; there is no separate attribution strip above the masthead. On narrow screens it may occupy a second masthead row.
- Label the chapter button and dialog “Chapters.” The existing bottom navigator already provides access from anywhere. The user explicitly withdrew the request for an additional floating Chapters button.
- The navigator contains previous, current-chapter/index, and next controls, plus the subtle progress indicator. Do not add a play/pause button or a “Contents” label.
- Do not reintroduce the removed orange/red artwork banner, “The stillness within the movement,” “A book of the way,” “Chinese & English · One continuous book,” “Begin reading,” or “Find your place.” The removed labels are intentional simplifications, not missing content.
- Use smooth, subtle transitions for controls and chapter changes. Nearby jumps can scroll smoothly; distant jumps should land accurately with a brief fade instead of flying through the entire book.
- The background consists of organic, flowing contours across the whole viewport. Keep them very faint behind text and more visible toward the edges. They respond gently to scrolling and have a subtle lifelike breathing motion at rest.
- Keep decorative art noninteractive and out of the accessibility tree. Honor `prefers-reduced-motion` and stop animation work while the document is hidden. Do not restore an on-page animation toggle.

## Yin-yang logo and retained assets

- `assets/art/yin-yang.png` is the corrected, image-generated ink logo, used in the masthead, favicon, and colophon. Preserve its transparency, spreading/blotting, and restrained brush texture.
- Its geometry matters: two balanced interlocking halves separated by an S curve, with a black dot in the light upper lobe and a transparent dot inside the filled black lower lobe. The earlier hollow lower ring with another black dot was incorrect; do not restore it.
- Use the image generator for requested raster-logo revisions and inspect the result before integrating it. Save the chosen asset in the repository and record the generation/edit prompt in `assets/art/README.md`.
- Keep fonts local. Current fonts are Cormorant Garamond and Noto Serif TC, with WOFF2 subsets and SIL Open Font Licenses under `assets/fonts/`. Retain provenance and ensure new Chinese UI characters are covered by the font or its fallback.

## Source text and data integrity

- `assets/Tao-Te-Ching.pdf` is the retained source from https://taoism.net/wp-content/uploads/2025/11/Tao-Te-Ching.pdf.
- `assets/tao-te-ching.json` is the canonical extracted document: 81 sequential chapters, 1,118 aligned bilingual rows, and references to all 50 source pages.
- Preserve chapter numbers, original headings, stable chapter/line IDs, line order, wording, internal spaces, punctuation, traditional characters, translator attribution, source checksum, and publisher notice. Do not silently modernize, retranslate, or correct source typos.
- Chapter IDs are `chapter-01` through `chapter-81`; line IDs are such as `chapter-01-line-01`. Source page indexes are one-based.
- `scripts/extract_tao.py` regenerates and validates the JSON; dependencies and commands are documented in `assets/README.md`. PDF extraction tooling is separate from the website build.
- Preserve source attribution and notices; do not describe the translation as public domain or the publisher notice as a redistribution license.

## Implementation and local workflow

- `src/index.html`: page template, masthead, navigator, and chapter dialog.
- `src/style.css`: fonts, responsive layout, colors, and transitions.
- `src/app.js`: navigation, search, reading position, and procedural background art.
- `scripts/build.mjs`: renders every chapter into HTML and fingerprints static assets.
- `scripts/serve.mjs`: local server and optional source watcher.
- `scripts/verify-build.mjs`: verifies the built book, references, and asset checksums.
- Edit source files and regenerate `dist/`; do not hand-edit built output. Preserve the lightweight, dependency-free Node.js toolchain unless a requested feature justifies a change.
- Node.js 22 or later is required. No npm dependencies need installing for normal use.

```sh
npm run serve          # Builds and serves http://127.0.0.1:5174/tao/
npm run dev            # Rebuilds after source changes; refresh the browser
npm run build          # Generates the self-contained static dist/ directory
npm run check          # JavaScript syntax and built-output verification
npm test               # Mocked deployment tests; build first
```

Reuse an existing local preview server if it is already serving this checkout. Reload the browser after a build; there is no automatic browser reload. For LAN phone testing, use `HOST=0.0.0.0 npm run serve`. Other commands and file details are in `README.md`.

## Static distribution and deployment

- The user intends to publish to a GCP bucket under `/tao/`. `upload.sh` is adapted from https://github.com/0xfe/jungle/blob/main/upload.sh.
- Production: `gs://muthanna.com/tao/` and https://muthanna.com/tao/. Development: `gs://muthanna.com/tao-dev/`.
- `./upload.sh --dry-run` builds and verifies without uploading. `./upload.sh` or `./upload.sh prod` publishes production; `./upload.sh dev` selects development.
- Every distributed asset has a deterministic SHA-256 content hash in its filename. Keep references relative so the same build works under either prefix or another static directory.
- Preserve frozen release staging, verification before upload, asset-first/index-last upload order, one-day immutable asset caching, and five-minute index caching with revalidation.
- Retain prior hashed assets by default. Optional `--clean` waits six minutes and checks that the remote index still matches before pruning only the selected prefix. Do not run concurrent uploads to the same environment.
- `.build-manifest.json` is a local verification receipt and is excluded from uploads. Bucket setup and public-access assumptions are documented in `README.md`.
- A request to implement or adjust the site does not itself request a live upload. Be explicit about whether a result was built, tested, or actually deployed, and follow any explicit deployment instruction in the current task.

## Validation and handoff

- Run `npm run build` and `npm run check` after source changes. For deployment changes, also run `bash -n upload.sh`, the dry run, and `npm test`; mocked cloud tests must not perform real uploads.
- For visual/interaction changes, inspect the actual browser on desktop and narrow mobile widths. Check readable text, no horizontal overflow, index opening/search/closing, and accurate chapter jumps as relevant to the change.
- Long-distance chapter jumps previously landed incorrectly when chapters used estimated deferred layout. Preserve accurate positions; do not reintroduce that optimization without verifying distant anchors and direct links after fonts load.
- Keep validation proportional. Copy/style-only edits do not need new tests that merely repeat the edited text. Build checks and a focused browser inspection are sufficient.
- Update user-facing documentation when commands or behavior change. Report the outcome concisely, including meaningful validation and any remaining limitation.
