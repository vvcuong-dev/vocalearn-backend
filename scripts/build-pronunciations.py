"""Build an audio/IPA supplement from the local Kaikki English extract.

Sources and paths: src/configs/dictionary-sources.config.json
Audio files remain on Wikimedia Commons; each record links to its file page
for author/license attribution. No synthesized or guessed audio URLs are added.
"""
import gzip
import json
from pathlib import Path
from urllib.parse import quote, urlsplit

backend = Path(__file__).resolve().parents[1]
config = json.loads((backend / 'src/configs/dictionary-sources.config.json').read_text(encoding='utf-8'))
source = backend / config['extractPath']
entries = {}
with gzip.open(source, 'rt', encoding='utf-8') as stream:
    for line in stream:
        entry = json.loads(line)
        if entry.get('lang_code') != 'en':
            continue
        term = entry['word']
        sounds = entry.get('sounds', [])
        ipa = next((s['ipa'] for s in sounds if s.get('ipa')), None)
        for sound in sounds:
            url = sound.get('ogg_url')
            if not url or not sound.get('audio'):
                continue
            parsed = urlsplit(url)
            if parsed.scheme != 'https' or parsed.hostname not in config['audioHosts'] or len(url) > config['maxAudioUrlLength']:
                continue
            entries.setdefault(term, {
                'phonetic': ipa,
                'audioUrl': url,
                'audioSourceUrl': config['audioSourceBaseUrl'] + quote(sound['audio'].replace(' ', '_')),
            })
            break
destination = backend / config['pronunciationsPath']
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(entries, ensure_ascii=False, sort_keys=True, separators=(',', ':')), encoding='utf-8')
print(f'{len(entries)} pronunciation records; {destination.stat().st_size} bytes')
