# Tao Te Ching

A quiet, continuous bilingual edition of all 81 chapters. Traditional Chinese and Derek Lin’s English translation sit side by side on larger screens and alternate line by line on phones. The vermilion, ivory, and gold palette draws from the supplied book-cover reference.

## Run locally

Requires Node.js 22 or later. There are no npm dependencies to install.

```sh
npm run serve
```

Open **http://127.0.0.1:5174/tao/**. The server builds first. Use `npm run dev` to rebuild after edits, then refresh the browser. To preview on a phone on the same network, run `HOST=0.0.0.0 npm run serve` and open your computer's LAN address on port 5174. `PORT=8080 npm run serve` or `npm run serve -- --port 8080` changes the port.

## Build and check

```sh
npm run build
npm run check
npm test
```

`dist/` is the complete static site. No server runtime, API key, remote font service, or framework is needed. All 81 chapters are rendered into HTML; JavaScript adds the searchable chapter dialog, chapter navigation, reading progress, remembered chapter, and animated art. Organic contour lines fill the background, fading beneath the text and becoming more visible at the edges. They respond gently to scrolling and breathe at rest; device reduced-motion preferences disable animation and smooth scrolling. No analytics or remote requests are made while reading.

The index searches chapter numbers and the full English/Chinese text. Chapter links use `#chapter-01` through `#chapter-81`. The book's stable line IDs are retained in the HTML. Browser Back/Forward follows chapter jumps. Reading position is stored only in this browser's local storage.

The build names every asset using its SHA-256 content hash, including CSS, JavaScript, both fonts, the logo, font licenses, and downloadable JSON. Asset references are relative so the same build works at `/tao/`, `/tao-dev/`, or another directory. `dist/.build-manifest.json` records full checksums for deployment verification and is not uploaded.

## Deploy to Google Cloud Storage

Adapted from [Jungle's upload.sh](https://github.com/0xfe/jungle/blob/main/upload.sh). Requires an authenticated `gcloud` CLI with access to `gs://muthanna.com` and the existing public static-site serving configuration.

```sh
./upload.sh --dry-run      # Build, verify, and show the production destination
./upload.sh                # Publish to gs://muthanna.com/tao/
./upload.sh prod           # Same production destination
./upload.sh dev            # Publish to gs://muthanna.com/tao-dev/
./upload.sh prod --clean   # Publish, wait six minutes, then prune old assets
```

The public URLs are `https://muthanna.com/tao/` and `https://muthanna.com/tao-dev/`. Files are uploaded from a frozen staging copy, with hashed assets uploaded before `index.html`. Hashed assets have one-day immutable caching; the index has a five-minute cache with revalidation. Prior hashed assets remain available unless `--clean` is used. Cleanup checks that the remote index still matches this release before deleting files, and is restricted to the selected prefix. Serialize uploads to the same environment.

The script preserves Jungle's `--predefined-acl=publicRead` convention. For a bucket using uniform bucket-level access, configure public serving through bucket IAM and remove those object-ACL flags. The script does not create buckets or change their IAM/website configuration.

## Files and assets

- `src/index.html`, `src/style.css`, `src/app.js`: page, responsive styling, navigation, and procedural canvas art.
- `assets/tao-te-ching.json`: canonical book data; see [data documentation](assets/README.md).
- `assets/art/yin-yang.png`: generated transparent ink logo; [generation prompt](assets/art/README.md).
- `assets/fonts/`: locally hosted WOFF2 subsets and their SIL Open Font Licenses; [font provenance](assets/fonts/README.md).
- `scripts/build.mjs`, `scripts/serve.mjs`, `scripts/verify-build.mjs`: dependency-free static toolchain.
- `tests/deployment.test.mjs`: mocked cloud tests for upload order, cache policies, paths, failure safety, dry runs, and cleanup concurrency checks.

The source PDF and translation notice are retained. The cover reference is used for visual direction only and is not distributed. No translation or source-text corrections were made for this interface.
