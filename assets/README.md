# Tao Te Ching source data

- `Tao-Te-Ching.pdf`: the original 50-page PDF downloaded from the document URL inside the supplied viewer on 2026-10-12.
- `tao-te-ching.json`: all 81 chapters and 1,118 aligned Chinese/English line pairs. Traditional Chinese (`zh-Hant`); English translation by Derek Lin (`en`).

The JSON records the source PDF URL, viewer URL, SHA-256 checksum, page count, translator, and the source's publisher notice. The notice is source attribution, not a redistribution license.

## Data structure

`schema_version` is 1. `chapters` is ordered by chapter number. Each chapter contains:

- `id`: stable identifier such as `chapter-01`.
- `number`: integer chapter number, 1 through 81.
- `title`: original `chinese` and `english` chapter headings.
- `source_pages`: one-based PDF page indexes.
- `lines`: ordered bilingual rows, each with a stable `id` such as `chapter-01-line-01`, a one-based `number` within the chapter, `chinese`, `english`, and `source_page`.

Use the aligned rows for bilingual reading, highlighting, and annotations. To obtain a chapter's complete English text:

```js
const text = chapter.lines.map(line => line.english).join('\n');
```

Extraction trims line-edge whitespace and omits blank layout lines. Internal spaces, wording, punctuation, and line breaks are retained, including any source typos or character variants. No translation, modernization, or editorial corrections have been applied. The Chinese document title is transcribed from the calligraphic image on page 1; chapter headings and body text come from the PDF text layer.

## Regenerate and verify

From the repository root, using Python 3.10 or later:

```sh
uv venv /tmp/tao-pdf-venv
uv pip install --python /tmp/tao-pdf-venv/bin/python -r scripts/requirements.txt
/tmp/tao-pdf-venv/bin/python scripts/extract_tao.py
/tmp/tao-pdf-venv/bin/python scripts/extract_tao.py --check
```

The parser requires all 81 sequential chapters in both languages, matching nonempty line counts, valid text, and corresponding source pages and row positions. The source uses slightly different line spacing in its two columns; their baselines must remain within 10 PDF points (less than half a row). It stops on an unexpected layout instead of silently emitting incomplete data. `--check` compares the complete regenerated document against the saved JSON without writing files.

Initial verification also compared every non-whitespace character on all 50 pages using an independent extractor (pdfplumber), with no differences, and visually inspected pages 1, 25, and 50.
