"""Import one representative Vietnamese sense per English word.

Run from any directory: python scripts/import-skypedia.py [--dry-run]
Requires pymysql (pip install pymysql). DATABASE_URL is loaded with the backend's
dotenv package; credentials are never embedded in this script.
"""
import argparse
import collections
import json
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
from urllib.parse import unquote, urlsplit

BACKEND = Path(__file__).resolve().parents[1]
SOURCE = BACKEND.parent / '.firecrawl' / 'skypedia.db'
sys.path.insert(0, str(BACKEND.parent / '.firecrawl' / 'python-deps'))
POS_MAP = {'N': 'N', 'noun': 'N', 'n': 'N', 'V': 'V', 'verb': 'V',
           'A': 'ADJ', 'adj': 'ADJ', 'D': 'ADV', 'adv': 'ADV', 'idiom': 'IDIOM'}
PRIORITY = {'N': 0, 'V': 1, 'ADJ': 2, 'ADV': 3, 'IDIOM': 4}
# These IDs were verified against this source; verify their text before importing.
OVERRIDES = {'run': (206493, 'V', 'Chạy.'), 'set': (216128, 'V', 'Để, đặt.')}
JUNK = re.compile(r'wiktionary|^dạng viết|^dạng chia|^số nhiều của|^từ sai chính tả|cách dùng không được khuyên dùng', re.I)


def clean(value):
    return value.strip() if value and value.strip() else None


def collect(source=SOURCE):
    c = sqlite3.connect(source.resolve().as_uri() + '?mode=ro', uri=True)
    candidates = collections.defaultdict(list)
    stats = collections.Counter()
    stats['source_words'] = c.execute("SELECT COUNT(DISTINCT word) FROM words WHERE lang_code='en'").fetchone()[0]
    sounds = {}
    for word, ipa in c.execute("SELECT w.word,p.ipa FROM words w JOIN pronunciations p ON p.word_id=w.id WHERE w.lang_code='en' ORDER BY p.id"):
        if clean(ipa) and len(ipa.strip()) <= 191:
            sounds.setdefault(word, ipa.strip())
    for word, definition_id, pos, meaning, example, link_id in c.execute("""
        SELECT w.word,d.id,d.pos,d.definition,wd.example,wd.id
        FROM words w JOIN word_definitions wd ON wd.word_id=w.id
        JOIN definitions d ON d.id=wd.definition_id
        WHERE w.lang_code='en' AND d.definition_lang='vi'
        ORDER BY d.id,wd.id
    """):
        meaning = clean(meaning)
        if not clean(word) or len(word) > 191 or not meaning or JUNK.search(meaning):
            stats['filtered_senses'] += 1
            continue
        mapped = POS_MAP.get(pos)
        candidates[word].append((PRIORITY.get(mapped, 99), definition_id, link_id,
                                 mapped, meaning, clean(example)))
    c.close()
    chosen = []
    for word in sorted(candidates):
        choices = candidates[word]
        if word in OVERRIDES:
            definition_id, pos, meaning = OVERRIDES[word]
            matches = [row for row in choices if row[1] == definition_id and row[3:5] == (pos, meaning)]
            if not matches:
                raise ValueError(f'Source changed: override for {word} was not found')
            best = min(matches)
        else:
            best = min(choices)
        chosen.append((word, sounds.get(word), best[3], best[4], best[5]))
    stats['selected_words'] = len(chosen)
    stats['without_valid_sense'] = stats['source_words'] - len(chosen)
    stats['null_pos'] = sum(row[2] is None for row in chosen)
    return chosen, stats


def connect_mysql():
    import pymysql
    result = subprocess.run(
        ['node', '-e', "require('dotenv').config({quiet:true});process.stdout.write(process.env.DATABASE_URL||'')"],
        cwd=BACKEND, check=True, capture_output=True, text=True,
    )
    url = urlsplit(result.stdout.strip())
    if url.scheme != 'mysql' or not url.hostname or not url.path.strip('/'):
        raise ValueError('Expected a mysql DATABASE_URL in backend .env')
    return pymysql.connect(host=url.hostname, port=url.port or 3306,
                           user=unquote(url.username or ''), password=unquote(url.password or ''),
                           database=unquote(url.path.lstrip('/')), charset='utf8mb4', autocommit=False)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    chosen, stats = collect()
    print(json.dumps(stats, ensure_ascii=False))
    print(json.dumps([row for row in chosen if row[0] in ('run', 'set', 'hello', 'book')], ensure_ascii=False, indent=2))
    if args.dry_run:
        return
    c = connect_mysql()
    try:
        with c.cursor() as cursor:
            sql = """INSERT INTO dictionary_entries (term,phonetic,partOfSpeech,meaning,example)
                     VALUES (%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE
                     phonetic=VALUES(phonetic),partOfSpeech=VALUES(partOfSpeech),
                     meaning=VALUES(meaning),example=VALUES(example)"""
            for start in range(0, len(chosen), 1000):
                cursor.executemany(sql, chosen[start:start + 1000])
            cursor.execute('SELECT COUNT(*) FROM dictionary_entries')
            total = cursor.fetchone()[0]
        c.commit()
        print(f'Imported successfully; dictionary_entries={total}. MySQL collation can merge equivalent terms.')
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()


if __name__ == '__main__':
    main()
