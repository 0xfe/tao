# Tao Te Ching

81 chapters translated by Derek Lin hosted at [mo.town/tao](https://mo.town/tao).

## Run locally

Requires Node.js 22 or later. There are no npm dependencies to install.

```sh
npm run serve
```

## Build and check

```sh
npm run build
npm run check
npm test
```

`dist/` is the complete static site. 

The index searches chapter numbers and the full English/Chinese text. Chapter links use `#chapter-01` through `#chapter-81`. The book's stable line IDs are retained in the HTML. Browser Back/Forward follows chapter jumps. Reading position is stored only in this browser's local storage.

The build names every asset using its SHA-256 content hash, including CSS, JavaScript, both fonts, the logo, font licenses, and downloadable JSON. Asset references are relative so the same build works at `/tao/`, `/tao-dev/`, or another directory. `dist/.build-manifest.json` records full checksums for deployment verification and is not uploaded.

## Deploy to Google Cloud Storage

```sh
./upload.sh --dry-run      # Build, verify, and show the production destination
./upload.sh                # Publish to gs://muthanna.com/tao/
./upload.sh prod           # Same production destination
./upload.sh dev            # Publish to gs://muthanna.com/tao-dev/
./upload.sh prod --clean   # Publish, wait six minutes, then prune old assets
```

## Files and assets

- `src/index.html`, `src/style.css`, `src/app.js`: page, responsive styling, navigation, and procedural canvas art.
- `assets/tao-te-ching.json`: canonical book data; see [data documentation](assets/README.md).
- `assets/art/yin-yang.png`: generated transparent ink logo; [generation prompt](assets/art/README.md).
- `assets/fonts/`: locally hosted WOFF2 subsets and their SIL Open Font Licenses; [font provenance](assets/fonts/README.md).
- `scripts/build.mjs`, `scripts/serve.mjs`, `scripts/verify-build.mjs`: dependency-free static toolchain.
- `tests/deployment.test.mjs`: mocked cloud tests for upload order, cache policies, paths, failure safety, dry runs, and cleanup concurrency checks.

The source PDF and translation notice are retained. The cover reference is used for visual direction only and is not distributed. No translation or source-text corrections were made for this interface.
