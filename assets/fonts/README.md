# Local fonts

Both fonts were downloaded from the official Google Fonts repository on 2026-10-12 and subset into WOFF2 with fontTools 4.66.1 and Brotli 1.2.0. They retain their variable weight axes and embedded naming/license metadata. No font requests are made to a third party at runtime.

- `cormorant-latin.woff2`: [Cormorant Garamond variable source](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf), characters U+0020–U+017E plus typographic quotation marks, dashes, middle dot, and navigation arrows. License: `CormorantGaramond-OFL.txt`.
- `noto-serif-tc-book.woff2`: [Noto Serif TC variable source](https://github.com/google/fonts/blob/main/ofl/notoseriftc/NotoSerifTC%5Bwght%5D.ttf), characters used in `assets/tao-te-ching.json` and `src/index.html`. License: `NotoSerifTC-OFL.txt`.

If new Chinese interface text is added outside the book's existing character set, extend the subset or let the configured system serif fallback supply those characters. The checked-in WOFF2 files and licenses are sufficient for ordinary offline builds.
