#!/usr/bin/env python3
"""Extract the bilingual taoism.net edition without rewriting its text."""
import argparse
import hashlib
import json
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PDF_URL = 'https://taoism.net/wp-content/uploads/2025/11/Tao-Te-Ching.pdf'
VIEWER_URL = ('https://taoism.net/wp-content/plugins/wonderplugin-pdf-embed/'
              'pdfjslight/web/viewer.html?v=2&file=' + PDF_URL)
ZH_HEADING = re.compile(r'第([一二三四五六七八九十]+)章')
EN_HEADING = re.compile(r'Chapter (\d+)')
DIGITS = dict(zip('一二三四五六七八九', range(1, 10)))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def chinese_number(value):
    if '十' not in value:
        return DIGITS[value]
    tens, units = value.split('十')
    return (DIGITS[tens] if tens else 1) * 10 + (DIGITS[units] if units else 0)


def extract(path):
    sections, notice = [], []
    current = None
    with pymupdf.open(path) as pdf:
        page_count = len(pdf)
        for page_number, page in enumerate(pdf, 1):
            for block in page.get_text('dict')['blocks']:
                if block['type'] != 0:
                    continue
                for line in block['lines']:
                    text = ''.join(span['text'] for span in line['spans']).strip()
                    if not text:
                        continue
                    require(not any(ord(c) < 32 or c == '\ufffd' for c in text),
                            f'Invalid text on page {page_number}')
                    zh, en = ZH_HEADING.fullmatch(text), EN_HEADING.fullmatch(text)
                    if zh or en:
                        current = {
                            'language': 'chinese' if zh else 'english',
                            'number': chinese_number(zh[1]) if zh else int(en[1]),
                            'title': text, 'page': page_number, 'lines': [],
                        }
                        sections.append(current)
                    elif current is None:
                        notice.append(text)
                    else:
                        current['lines'].append({
                            'text': text, 'page': page_number,
                            'x': line['spans'][0]['origin'][0],
                            'y': line['spans'][0]['origin'][1],
                        })
    require(len(sections) == 162, 'Expected 81 bilingual chapters')
    require(len(notice) == 2, 'Unexpected introductory notice')
    chapters = []
    for number in range(1, 82):
        zh, en = sections[(number - 1) * 2:number * 2]
        require((zh['language'], en['language']) == ('chinese', 'english'),
                f'Unexpected language order in chapter {number}')
        require(zh['number'] == en['number'] == number,
                f'Missing, duplicate, or misordered chapter {number}')
        require(len(zh['lines']) == len(en['lines']) > 0,
                f'Unmatched lines in chapter {number}')
        chapter_id = f'chapter-{number:02d}'
        lines = []
        for line_number, (left, right) in enumerate(zip(zh['lines'], en['lines']), 1):
            require(left['page'] == right['page'] and
                    abs(left['y'] - right['y']) < 10 and left['x'] < right['x'],
                    f'Unaligned bilingual row: chapter {number}, line {line_number}')
            require(re.search(r'[\u3400-\u9fff]', left['text']) is not None and
                    re.search(r'[\u3400-\u9fff]', right['text']) is None,
                    f'Unexpected language content: chapter {number}, line {line_number}')
            lines.append({
                'id': f'{chapter_id}-line-{line_number:02d}',
                'number': line_number,
                'chinese': left['text'],
                'english': right['text'],
                'source_page': left['page'],
            })
        chapters.append({
            'id': chapter_id, 'number': number,
            'title': {'chinese': zh['title'], 'english': en['title']},
            'source_pages': sorted({zh['page'], en['page']} |
                                   {line['source_page'] for line in lines}),
            'lines': lines,
        })
    return {
        'schema_version': 1,
        'title': {'english': 'Tao Te Ching', 'chinese': '道德經'},
        'translator': {'name': 'Derek Lin', 'language': 'en'},
        'languages': {'english': 'en', 'chinese': 'zh-Hant'},
        'source': {
            'pdf_url': PDF_URL, 'viewer_url': VIEWER_URL,
            'file': path.name,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'page_count': page_count,
            'notice': notice,
        },
        'extraction': {
            'tool': 'PyMuPDF', 'tool_version': pymupdf.VersionBind,
            'normalization': 'Trim leading/trailing whitespace; omit blank layout lines. '
                             'Preserve internal spaces, wording, punctuation, and source line breaks.',
            'alignment': 'Pair Chinese and English rows by chapter and source order; '
                         'verify matching PDF page and vertical baseline within 10 points (the columns use slightly different line spacing).',
            'page_numbering': 'One-based PDF page index.',
            'title_note': 'Chinese document title transcribed from the calligraphic image on page 1.',
        },
        'chapter_count': len(chapters),
        'line_count': sum(len(chapter['lines']) for chapter in chapters),
        'chapters': chapters,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf', type=Path, default=ROOT / 'assets/Tao-Te-Ching.pdf')
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/tao-te-ching.json')
    parser.add_argument('--check', action='store_true', help='Verify existing JSON without writing')
    args = parser.parse_args()
    data = extract(args.pdf)
    if args.check:
        require(json.loads(args.output.read_text(encoding='utf-8')) == data,
                'Existing JSON differs from the PDF extraction; regenerate it')
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{"Verified" if args.check else "Wrote"} {args.output}: '
          f'{data["chapter_count"]} chapters, {data["line_count"]} bilingual lines, '
          f'{data["source"]["page_count"]} source pages')


if __name__ == '__main__':
    main()
