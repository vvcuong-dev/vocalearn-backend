# Skypedia dictionary import

From `vocalearn-backend`:

```powershell
python -m pip install pymysql
python scripts/import-skypedia.py --dry-run
python scripts/import-skypedia.py
node -e "require('ts-node').register({transpileOnly:true,experimentalResolver:true});require('./scripts/check-dictionary.ts')"
```

The importer reads `DATABASE_URL` through the backend's dotenv loader and reads
`../.firecrawl/skypedia.db` in read-only mode. It also supports the workspace-local
pymysql installation in `../.firecrawl/python-deps`. Writes run in one transaction;
reruns upsert by unique term without deleting existing entries.

Selection: English headwords with Vietnamese definitions; nonempty meanings;
exclude Wiktionary metadata, spelling/form references covered by the script's
`JUNK` filter. POS mapping: N/noun/n → N, V/verb → V, A/adj → ADJ,
D/adv → ADV, idiom → IDIOM. Prefer N > V > ADJ > ADV > IDIOM, then
the smallest definition ID and word-definition link ID. Unsupported POS fall
back to null only when no supported candidate remains. Spaces do not imply PHRASE.
Use the first nonempty IPA by pronunciation ID. `example` comes from the selected
word-definition link, and remains null if absent.

Verified overrides: run → definition 206493 / V / Chạy.; set → definition
216128 / V / Để, đặt. The importer fails if these source definitions change.
Other words follow the ranking, so book currently selects “Kinh thánh.” rather
than “Sách.”; source IDs do not represent frequency.

On 2026-10-02: 104,829 source words; 103,046 selected words; 102,918 database
entries after MySQL's case/accent-insensitive unique collation merged equivalent
terms. Candidates are processed in sorted term order; the last equivalent term
updates the meaning/IPA/example of the existing row. 737 selected terms have
unsupported POS and therefore null partOfSpeech before collation merging.

## Local migration state

The local database already contained application tables but no `_prisma_migrations`
history and no dictionary tables. The existing initial migration does not describe
the full current schema. `migrate dev` was blocked by automatic approval review
because resetting this database could delete application data.

Only `20261002080000_reset_dictionary_with_example/migration.sql` was applied,
using Prisma `db execute --file`; it contains only CREATE TABLE dictionary_entries.
Prisma Client was regenerated. This execution does **not** register migration
history. Existing migrations still need a separate baseline/reconciliation before
using `migrate dev` or `migrate deploy` on this database; do not accept a reset.

The smoke check starts an isolated Nest HTTP server against the configured MySQL,
checks suggestions, query validation, literal percent-prefix matching, Swagger's
example field, representative words, and the junk filter, then closes the server.
It does not start the complete application or exercise its authentication/middleware.
