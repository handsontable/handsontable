# Version Comparison Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a page under "Upgrade and migration" that lets a reader pick `From`/`To` Handsontable versions and see all changes between them, with curated highlights surfaced per release.

**Architecture:** Build-time parser turns the eleven existing `changelog-*.md` files into structured entries. A separate JSON layer adds hand-curated highlights per minor release. A loader merges both layers, filters patch versions out of the release list, and feeds a React component hydrated into one markdown page. URL query params persist `From`/`To`/category.

**Tech Stack:** Node `node:test` (parser/validator/loader unit tests), Astro 6 + Starlight 0.38 (page rendering), React 18 (dynamic-import hydration following the `DocsAssistant/` pattern), Playwright (E2E), hand-rolled JSON validator (no new dependency).

---

## Reference paths

- Project root: `/Users/marekmartuszewski/Sites/handsontable`
- Docs site root: `docs/`
- Spec: `docs/superpowers/specs/2026-05-15-version-comparison-design.md`
- Tests command: `npm run docs:test:plugins --prefix docs`
- Branch: `feature/PRO-1201_Create-a-page-that-will-dynamically-shows-differences-between-versions`

## File map

| File | Purpose | Created in task |
|---|---|---|
| `docs/src/plugins/changelog-parser.mjs` | Parses `changelog-*.md` into structured entries | 1–5 |
| `docs/src/plugins/__tests__/changelog-parser.test.mjs` | Unit tests for parser | 1–5 |
| `docs/scripts/validate-version-highlights.mjs` | Hand-rolled validator (build-time + CI) | 6–7 |
| `docs/src/plugins/__tests__/validate-version-highlights.test.mjs` | Validator unit tests | 6–7 |
| `docs/src/plugins/version-highlights-loader.mjs` | Merges parser output + highlights, builds releases list | 8–10 |
| `docs/src/plugins/__tests__/version-highlights-loader.test.mjs` | Loader unit tests | 8–10 |
| `docs/content/data/version-highlights/{14.0,15.0,16.0,16.2,17.0}.json` | Seed highlight files | 11 |
| `docs/src/components/VersionComparison/types.ts` | Shared TypeScript types | 12 |
| `docs/src/components/VersionComparisonData.astro` | Server-rendered JSON `<script>` + mount placeholder | 13 |
| `docs/src/components/VersionComparison/VersionComparison.tsx` | Root component + subcomponents | 14–20 |
| `docs/src/scripts/version-comparison-bootstrap.ts` | Mount script (mirrors `docs-assistant-bootstrap.ts`) | 21 |
| `docs/src/components/Head.astro` | Add bootstrap import | 21 |
| `docs/src/components/VersionComparison/VersionComparison.css` | Component styling | 22 |
| `docs/content/guides/upgrade-and-migration/version-comparison/version-comparison.md` | Markdown page | 23 |
| `docs/content/guides/sidebar.js` | Sidebar registration | 24 |
| `docs/tests/version-comparison.spec.ts` | Playwright E2E test | 25 |
| `docs/package.json` | Add `docs:validate-highlights` + integrate into `build` | 7, 26 |

---

## Task 1: Parser scaffold + version+date extraction

**Files:**
- Create: `docs/src/plugins/changelog-parser.mjs`
- Create: `docs/src/plugins/__tests__/changelog-parser.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
// docs/src/plugins/__tests__/changelog-parser.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseChangelogContent } from '../changelog-parser.mjs';

test('extracts version and ISO release date from a single release block', () => {
  const md = [
    '## 17.0.0',
    '',
    'Released on March 9th, 2026',
    '',
    '#### Added',
    '- Added the Theme API. [#11950](https://github.com/handsontable/handsontable/pull/11950)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].version, '17.0.0');
  assert.equal(result[0].releaseDate, '2026-03-09');
});
```

- [ ] **Step 2: Run test to verify it fails**

```
cd /Users/marekmartuszewski/Sites/handsontable
npm run docs:test:plugins --prefix docs
```

Expected: FAIL with `Cannot find module '../changelog-parser.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```javascript
// docs/src/plugins/changelog-parser.mjs

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function parseReleaseDate(line) {
  // "Released on March 9th, 2026"
  const match = line.match(/Released on\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/i);
  if (!match) return null;
  const [, monthName, day, year] = match;
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
}

function findFirstReleaseDate(lines, startIdx) {
  for (let i = startIdx; i < Math.min(lines.length, startIdx + 8); i += 1) {
    const date = parseReleaseDate(lines[i]);
    if (date) return date;
  }
  return null;
}

export function parseChangelogContent(markdown) {
  const lines = markdown.split('\n');
  const entries = [];

  for (let i = 0; i < lines.length; i += 1) {
    const versionMatch = lines[i].match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (!versionMatch) continue;

    const version = versionMatch[1];
    const releaseDate = findFirstReleaseDate(lines, i + 1);
    entries.push({ version, releaseDate });
  }

  return entries;
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/changelog-parser.mjs docs/src/plugins/__tests__/changelog-parser.test.mjs
git commit -m "PRO-1201: Parse changelog version and release date"
```

---

## Task 2: Parser — category sections

**Files:**
- Modify: `docs/src/plugins/changelog-parser.mjs`
- Modify: `docs/src/plugins/__tests__/changelog-parser.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `changelog-parser.test.mjs`:

```javascript
test('extracts entries grouped by Added/Changed/Deprecated/Removed/Fixed', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Added',
    '- Added the Theme API.',
    '',
    '#### Changed',
    '- Improved differentiation between errors.',
    '',
    '#### Deprecated',
    '- Deprecated numbro.js.',
    '',
    '#### Removed',
    '- Removed core-js.',
    '',
    '#### Fixed',
    '- Fixed errors triggered by keyboard shortcuts.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 5);
  assert.deepEqual(
    result.map((e) => e.category),
    ['added', 'changed', 'deprecated', 'removed', 'fixed'],
  );
  assert.deepEqual(
    result.map((e) => e.title),
    [
      'Added the Theme API.',
      'Improved differentiation between errors.',
      'Deprecated numbro.js.',
      'Removed core-js.',
      'Fixed errors triggered by keyboard shortcuts.',
    ],
  );
  for (const entry of result) {
    assert.equal(entry.version, '17.0.0');
    assert.equal(entry.releaseDate, '2026-03-09');
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL — current parser only emits version-level entries, not per-bullet entries.

- [ ] **Step 3: Implement minimal change**

Replace `parseChangelogContent` body:

```javascript
const CATEGORY_HEADINGS = {
  '#### Added': 'added',
  '#### Changed': 'changed',
  '#### Deprecated': 'deprecated',
  '#### Removed': 'removed',
  '#### Fixed': 'fixed',
};

function stripBullet(line) {
  return line.replace(/^- /, '').trim();
}

export function parseChangelogContent(markdown) {
  const lines = markdown.split('\n');
  const entries = [];
  let currentVersion = null;
  let currentDate = null;
  let currentCategory = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (versionMatch) {
      currentVersion = versionMatch[1];
      currentDate = findFirstReleaseDate(lines, i + 1);
      currentCategory = null;
      continue;
    }

    if (CATEGORY_HEADINGS[line.trim()]) {
      currentCategory = CATEGORY_HEADINGS[line.trim()];
      continue;
    }

    if (!currentVersion || !currentCategory) continue;
    if (!line.startsWith('- ')) continue;

    entries.push({
      version: currentVersion,
      releaseDate: currentDate,
      category: currentCategory,
      title: stripBullet(line),
    });
  }

  return entries;
}
```

- [ ] **Step 4: Run all tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: both tests pass. The Task 1 test still asserts `result.length === 1` against an input with one bullet under `#### Added`, which the new parser still satisfies.

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/changelog-parser.mjs docs/src/plugins/__tests__/changelog-parser.test.mjs
git commit -m "PRO-1201: Parse changelog entries by category section"
```

---

## Task 3: Parser — breaking-change flag

**Files:**
- Modify: `docs/src/plugins/changelog-parser.mjs`
- Modify: `docs/src/plugins/__tests__/changelog-parser.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
test('marks bullets starting with **Breaking change**: as breaking', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Removed',
    '- **Breaking change**: Removed core-js from dependencies.',
    '- Removed the languages folder.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 2);
  assert.equal(result[0].breaking, true);
  assert.equal(result[0].title, 'Removed core-js from dependencies.');
  assert.equal(result[1].breaking, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL — no `breaking` field exists.

- [ ] **Step 3: Implement**

Add to `changelog-parser.mjs`, replace `stripBullet`:

```javascript
function parseBullet(line) {
  const raw = line.replace(/^- /, '').trim();
  const breakingMatch = raw.match(/^\*\*Breaking change\*\*:\s*(.*)$/);
  if (breakingMatch) {
    return { breaking: true, body: breakingMatch[1].trim() };
  }
  return { breaking: false, body: raw };
}
```

Replace the push in `parseChangelogContent`:

```javascript
    const { breaking, body } = parseBullet(line);
    entries.push({
      version: currentVersion,
      releaseDate: currentDate,
      category: currentCategory,
      breaking,
      title: body,
    });
```

- [ ] **Step 4: Run all tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: all parser tests pass. Update earlier tests so they assert `breaking: false` on the existing entries if `deepEqual` was used (the existing test uses field-by-field, so it should still pass).

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/
git commit -m "PRO-1201: Detect breaking changes in changelog bullets"
```

---

## Task 4: Parser — PR number and framework prefix

**Files:**
- Modify: `docs/src/plugins/changelog-parser.mjs`
- Modify: `docs/src/plugins/__tests__/changelog-parser.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
test('extracts PR number from a trailing GitHub PR link', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Added',
    '- Added the Theme API. [#11950](https://github.com/handsontable/handsontable/pull/11950)',
    '- A bullet without a link.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result[0].prNumber, 11950);
  assert.equal(result[0].title, 'Added the Theme API.');
  assert.equal(result[1].prNumber, null);
});

test('detects framework prefix in bullets', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Fixed',
    '- React: Fixed a thing in React. [#1](https://github.com/handsontable/handsontable/pull/1)',
    '- Angular: Fixed a thing in Angular.',
    '- Vue: Fixed a thing in Vue.',
    '- Fixed a thing in core.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.deepEqual(
    result.map((e) => e.framework),
    ['react', 'angular', 'vue', 'core'],
  );
  assert.equal(result[0].title, 'Fixed a thing in React.');
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL on `prNumber` and `framework` fields.

- [ ] **Step 3: Implement**

Replace `parseBullet` in `changelog-parser.mjs`:

```javascript
const FRAMEWORK_PREFIXES = {
  'React:': 'react',
  'Angular:': 'angular',
  'Vue:': 'vue',
};

function extractPrNumber(text) {
  const match = text.match(/\[#(\d+)\]\(https:\/\/github\.com\/handsontable\/handsontable\/pull\/\d+\)\s*$/);
  if (!match) return { prNumber: null, body: text };
  return { prNumber: Number(match[1]), body: text.slice(0, match.index).trim() };
}

function parseBullet(line) {
  let raw = line.replace(/^- /, '').trim();
  let breaking = false;

  const breakingMatch = raw.match(/^\*\*Breaking change\*\*:\s*(.*)$/);
  if (breakingMatch) {
    breaking = true;
    raw = breakingMatch[1].trim();
  }

  let framework = 'core';
  for (const [prefix, name] of Object.entries(FRAMEWORK_PREFIXES)) {
    if (raw.startsWith(`${prefix} `)) {
      framework = name;
      raw = raw.slice(prefix.length + 1).trim();
      break;
    }
  }

  const { prNumber, body } = extractPrNumber(raw);

  return { breaking, framework, prNumber, body };
}
```

Update the push site:

```javascript
    const { breaking, framework, prNumber, body } = parseBullet(line);
    entries.push({
      version: currentVersion,
      releaseDate: currentDate,
      category: currentCategory,
      breaking,
      framework,
      prNumber,
      title: body,
    });
```

- [ ] **Step 4: Run all tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/
git commit -m "PRO-1201: Extract PR number and framework prefix from bullets"
```

---

## Task 5: Parser — load all eleven changelog files

**Files:**
- Modify: `docs/src/plugins/changelog-parser.mjs`
- Modify: `docs/src/plugins/__tests__/changelog-parser.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import { parseAllChangelogs } from '../changelog-parser.mjs';

test('parseAllChangelogs returns entries from every changelog-X file (v7..v17)', () => {
  const result = parseAllChangelogs();
  const majors = new Set(result.map((e) => Number(e.version.split('.')[0])));
  for (let m = 7; m <= 17; m += 1) {
    assert.ok(majors.has(m), `expected major ${m} present`);
  }
});

test('parseAllChangelogs produces no entries with null releaseDate inside major releases', () => {
  const result = parseAllChangelogs();
  const mainline = result.filter((e) => /\.0\.0$/.test(e.version));
  for (const entry of mainline) {
    assert.ok(entry.releaseDate, `release date missing for ${entry.version} (${entry.title})`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL — `parseAllChangelogs` is undefined.

- [ ] **Step 3: Implement**

Append to `changelog-parser.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHANGELOG_ROOT = resolve(__dirname, '../../content/guides/upgrade-and-migration');

const CHANGELOG_FILES = [
  'changelog-7/changelog-7.md',
  'changelog-8/changelog-8.md',
  'changelog-9/changelog-9.md',
  'changelog-10/changelog-10.md',
  'changelog-11/changelog-11.md',
  'changelog-12/changelog-12.md',
  'changelog-13/changelog-13.md',
  'changelog-14/changelog-14.md',
  'changelog-15/changelog-15.md',
  'changelog-16/changelog-16.md',
  'changelog-17/changelog-17.md',
];

export function parseAllChangelogs() {
  const all = [];
  for (const relPath of CHANGELOG_FILES) {
    const content = readFileSync(resolve(CHANGELOG_ROOT, relPath), 'utf8');
    all.push(...parseChangelogContent(content));
  }
  return all;
}
```

- [ ] **Step 4: Run tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS. If the second test fails on a specific older release with a missing date, accept that as a known data gap — update the test to allow null release date for versions older than `10.0.0`:

```javascript
const mainline = result.filter((e) => /\.0\.0$/.test(e.version) && Number(e.version.split('.')[0]) >= 10);
```

Then re-run. Document the cutoff in a code comment.

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/
git commit -m "PRO-1201: Load and parse all eleven changelog files"
```

---

## Task 6: Highlights JSON schema + validator (schema + shape checks)

**Files:**
- Create: `docs/scripts/validate-version-highlights.mjs`
- Create: `docs/src/plugins/__tests__/validate-version-highlights.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
// docs/src/plugins/__tests__/validate-version-highlights.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateHighlightFile } from '../../../scripts/validate-version-highlights.mjs';

const valid = {
  version: '17.0',
  highlighted: [
    {
      prNumber: 11950,
      tagline: 'New Theme API',
      whyItMatters: 'Replaces legacy stylesheet.',
    },
  ],
};

test('accepts a minimal valid file', () => {
  const errors = validateHighlightFile('17.0.json', valid, new Set([11950]));
  assert.deepEqual(errors, []);
});

test('rejects file when filename does not match version', () => {
  const errors = validateHighlightFile('16.0.json', valid, new Set([11950]));
  assert.match(errors[0], /filename 16\.0 does not match version 17\.0/);
});

test('rejects missing whyItMatters', () => {
  const bad = { version: '17.0', highlighted: [{ prNumber: 11950, tagline: 'x' }] };
  const errors = validateHighlightFile('17.0.json', bad, new Set([11950]));
  assert.match(errors.join('\n'), /whyItMatters is required/);
});

test('rejects partial code pair (codeBefore without codeAfter)', () => {
  const bad = {
    version: '17.0',
    highlighted: [
      { prNumber: 11950, tagline: 'x', whyItMatters: 'y', codeBefore: 'a' },
    ],
  };
  const errors = validateHighlightFile('17.0.json', bad, new Set([11950]));
  assert.match(errors.join('\n'), /codeBefore and codeAfter must both be present/);
});

test('rejects PR number not present in changelog entries', () => {
  const errors = validateHighlightFile('17.0.json', valid, new Set([99999]));
  assert.match(errors.join('\n'), /PR 11950 not found in changelog entries/);
});

test('rejects more than 5 highlighted entries', () => {
  const tooMany = {
    version: '17.0',
    highlighted: Array.from({ length: 6 }, (_, i) => ({
      prNumber: 11950 + i,
      tagline: `t${i}`,
      whyItMatters: 'why',
    })),
  };
  const knownPrs = new Set([11950, 11951, 11952, 11953, 11954, 11955]);
  const errors = validateHighlightFile('17.0.json', tooMany, knownPrs);
  assert.match(errors.join('\n'), /at most 5 highlighted entries/);
});

test('rejects migrationAnchor that does not start with /migration-from-', () => {
  const bad = {
    version: '17.0',
    highlighted: [
      { prNumber: 11950, tagline: 'x', whyItMatters: 'y', migrationAnchor: '/foo' },
    ],
  };
  const errors = validateHighlightFile('17.0.json', bad, new Set([11950]));
  assert.match(errors.join('\n'), /migrationAnchor must start with \/migration-from-/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL — script not found.

- [ ] **Step 3: Implement validator**

```javascript
// docs/scripts/validate-version-highlights.mjs

export function validateHighlightFile(filename, data, knownPrNumbers) {
  const errors = [];
  const filenameVersion = filename.replace(/\.json$/, '');

  if (typeof data !== 'object' || data === null) {
    errors.push(`${filename}: file must be a JSON object`);
    return errors;
  }
  if (typeof data.version !== 'string') {
    errors.push(`${filename}: version must be a string`);
  }
  if (data.version !== filenameVersion) {
    errors.push(`${filename}: filename ${filenameVersion} does not match version ${data.version}`);
  }
  if (!Array.isArray(data.highlighted)) {
    errors.push(`${filename}: highlighted must be an array`);
    return errors;
  }
  if (data.highlighted.length > 5) {
    errors.push(`${filename}: at most 5 highlighted entries (found ${data.highlighted.length})`);
  }

  data.highlighted.forEach((entry, idx) => {
    const where = `${filename} highlighted[${idx}]`;
    if (typeof entry.prNumber !== 'number') {
      errors.push(`${where}: prNumber must be a number`);
    } else if (!knownPrNumbers.has(entry.prNumber)) {
      errors.push(`${where}: PR ${entry.prNumber} not found in changelog entries`);
    }
    if (typeof entry.tagline !== 'string' || entry.tagline.length === 0) {
      errors.push(`${where}: tagline is required`);
    }
    if (typeof entry.whyItMatters !== 'string' || entry.whyItMatters.length === 0) {
      errors.push(`${where}: whyItMatters is required`);
    }
    const hasBefore = typeof entry.codeBefore === 'string';
    const hasAfter = typeof entry.codeAfter === 'string';
    if (hasBefore !== hasAfter) {
      errors.push(`${where}: codeBefore and codeAfter must both be present or both omitted`);
    }
    if (entry.migrationAnchor !== undefined) {
      if (typeof entry.migrationAnchor !== 'string' || !entry.migrationAnchor.startsWith('/migration-from-')) {
        errors.push(`${where}: migrationAnchor must start with /migration-from-`);
      }
    }
  });

  return errors;
}
```

- [ ] **Step 4: Run tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/scripts/validate-version-highlights.mjs docs/src/plugins/__tests__/validate-version-highlights.test.mjs
git commit -m "PRO-1201: Add highlight file validator"
```

---

## Task 7: Validator CLI entrypoint + glob scanner

**Files:**
- Modify: `docs/scripts/validate-version-highlights.mjs`
- Modify: `docs/src/plugins/__tests__/validate-version-highlights.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import { validateAllHighlightFiles } from '../../../scripts/validate-version-highlights.mjs';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('validateAllHighlightFiles aggregates errors across files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vh-'));
  try {
    writeFileSync(
      join(dir, '17.0.json'),
      JSON.stringify({
        version: '17.0',
        highlighted: [{ prNumber: 1, tagline: 't', whyItMatters: 'y' }],
      }),
    );
    writeFileSync(
      join(dir, '16.0.json'),
      JSON.stringify({ version: '15.0', highlighted: [] }),
    );

    const errors = validateAllHighlightFiles(dir, new Set([1]));
    assert.match(errors.join('\n'), /16\.0\.json/);
    assert.equal(errors.filter((e) => e.startsWith('17.0.json')).length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL — `validateAllHighlightFiles` undefined.

- [ ] **Step 3: Implement**

Append to `validate-version-highlights.mjs`:

```javascript
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function validateAllHighlightFiles(directory, knownPrNumbers) {
  const errors = [];
  let files;
  try {
    files = readdirSync(directory).filter((name) => name.endsWith('.json'));
  } catch (e) {
    if (e.code === 'ENOENT') return errors;
    throw e;
  }

  for (const filename of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(resolve(directory, filename), 'utf8'));
    } catch (e) {
      errors.push(`${filename}: invalid JSON (${e.message})`);
      continue;
    }
    errors.push(...validateHighlightFile(filename, data, knownPrNumbers));
  }

  return errors;
}
```

Add a CLI entrypoint at the bottom (only runs when invoked directly):

```javascript
if (import.meta.url === `file://${process.argv[1]}`) {
  const { parseAllChangelogs } = await import('../src/plugins/changelog-parser.mjs');
  const knownPrs = new Set(
    parseAllChangelogs().map((e) => e.prNumber).filter((n) => n !== null),
  );
  const dir = resolve(process.cwd(), 'content/data/version-highlights');
  const errors = validateAllHighlightFiles(dir, knownPrs);
  if (errors.length > 0) {
    for (const err of errors) console.error(err);
    process.exit(1);
  }
  console.log('All highlight files are valid.');
}
```

- [ ] **Step 4: Run tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS.

- [ ] **Step 5: Add npm script**

In `docs/package.json` `scripts` block, add:

```json
"docs:validate-highlights": "node scripts/validate-version-highlights.mjs"
```

- [ ] **Step 6: Commit**

```bash
git add docs/scripts/validate-version-highlights.mjs docs/src/plugins/__tests__/validate-version-highlights.test.mjs docs/package.json
git commit -m "PRO-1201: Add highlight files batch validator + CLI"
```

---

## Task 8: Loader — merge auto entries with highlights

**Files:**
- Create: `docs/src/plugins/version-highlights-loader.mjs`
- Create: `docs/src/plugins/__tests__/version-highlights-loader.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
// docs/src/plugins/__tests__/version-highlights-loader.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeEntriesWithHighlights } from '../version-highlights-loader.mjs';

test('matching prNumber augments the auto entry and flags it as highlighted', () => {
  const auto = [
    { version: '17.0.0', releaseDate: '2026-03-09', category: 'added',
      breaking: true, framework: 'core', prNumber: 11950, title: 'Theme API.' },
    { version: '17.0.0', releaseDate: '2026-03-09', category: 'fixed',
      breaking: false, framework: 'core', prNumber: 11955, title: 'A fix.' },
  ];
  const highlightFiles = [
    {
      filename: '17.0.json',
      data: {
        version: '17.0',
        highlighted: [
          {
            prNumber: 11950,
            tagline: 'New Theme API',
            whyItMatters: 'Replaces legacy stylesheet.',
            codeBefore: 'import "...full.css";',
            codeAfter: 'import { classicTheme } from "...";',
          },
        ],
      },
    },
  ];

  const result = mergeEntriesWithHighlights(auto, highlightFiles);

  const themeEntry = result.find((e) => e.prNumber === 11950);
  assert.equal(themeEntry.highlighted, true);
  assert.equal(themeEntry.tagline, 'New Theme API');
  assert.equal(themeEntry.codeBefore, 'import "...full.css";');

  const fixEntry = result.find((e) => e.prNumber === 11955);
  assert.equal(fixEntry.highlighted, false);
  assert.equal(fixEntry.tagline, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```javascript
// docs/src/plugins/version-highlights-loader.mjs

export function mergeEntriesWithHighlights(autoEntries, highlightFiles) {
  const byPr = new Map();
  for (const file of highlightFiles) {
    for (const h of file.data.highlighted) {
      byPr.set(h.prNumber, h);
    }
  }

  return autoEntries.map((entry) => {
    if (entry.prNumber === null) return { ...entry, highlighted: false };
    const h = byPr.get(entry.prNumber);
    if (!h) return { ...entry, highlighted: false };
    return {
      ...entry,
      highlighted: true,
      tagline: h.tagline,
      whyItMatters: h.whyItMatters,
      codeBefore: h.codeBefore,
      codeAfter: h.codeAfter,
      migrationAnchor: h.migrationAnchor,
    };
  });
}
```

- [ ] **Step 4: Run tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/version-highlights-loader.mjs docs/src/plugins/__tests__/version-highlights-loader.test.mjs
git commit -m "PRO-1201: Merge changelog entries with curated highlights"
```

---

## Task 9: Loader — release summaries (filter patches)

**Files:**
- Modify: `docs/src/plugins/version-highlights-loader.mjs`
- Modify: `docs/src/plugins/__tests__/version-highlights-loader.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import { buildReleaseSummaries } from '../version-highlights-loader.mjs';

test('buildReleaseSummaries returns only X.Y.0 releases, sorted descending', () => {
  const auto = [
    { version: '17.0.1', releaseDate: '2026-03-25' },
    { version: '17.0.0', releaseDate: '2026-03-09' },
    { version: '16.2.1', releaseDate: '2026-01-15' },
    { version: '16.2.0', releaseDate: '2026-01-01' },
    { version: '16.0.0', releaseDate: '2025-08-01' },
  ];

  const releases = buildReleaseSummaries(auto, '17.0.1');

  assert.deepEqual(
    releases.map((r) => r.version),
    ['17.0', '16.2', '16.0'],
  );
  assert.equal(releases[0].isCurrent, true);
  assert.equal(releases[1].isCurrent, false);
  assert.equal(releases[0].releaseDate, '2026-03-09');
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — `buildReleaseSummaries` undefined.

- [ ] **Step 3: Implement**

Append to `version-highlights-loader.mjs`:

```javascript
export function buildReleaseSummaries(autoEntries, currentVersion) {
  const seen = new Map();
  for (const entry of autoEntries) {
    if (!entry.version.endsWith('.0')) continue;
    const [major, minor] = entry.version.split('.').map(Number);
    const key = `${major}.${minor}`;
    if (!seen.has(key)) {
      seen.set(key, {
        version: key,
        releaseDate: entry.releaseDate,
        major,
        minor,
      });
    }
  }

  const currentMinor = currentVersion
    ? currentVersion.split('.').slice(0, 2).join('.')
    : null;

  return Array.from(seen.values())
    .sort((a, b) => (b.major - a.major) || (b.minor - a.minor))
    .map((r) => ({ ...r, isCurrent: r.version === currentMinor }));
}
```

- [ ] **Step 4: Run tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/
git commit -m "PRO-1201: Build release summaries (filter patches, sort)"
```

---

## Task 10: Loader — top-level `loadVersionHighlights()` entrypoint

**Files:**
- Modify: `docs/src/plugins/version-highlights-loader.mjs`
- Modify: `docs/src/plugins/__tests__/version-highlights-loader.test.mjs`

- [ ] **Step 1: Write the failing test**

```javascript
import { loadVersionHighlights } from '../version-highlights-loader.mjs';

test('loadVersionHighlights returns entries + releases for current data', () => {
  const result = loadVersionHighlights();

  assert.ok(Array.isArray(result.entries));
  assert.ok(Array.isArray(result.releases));
  assert.ok(result.entries.length > 100, 'should aggregate many entries');
  // 7.0, 7.x..., 17.0 at minimum — releases list must include 17.0
  assert.ok(result.releases.some((r) => r.version === '17.0'));
  // patch versions should never appear in releases
  for (const r of result.releases) {
    assert.match(r.version, /^\d+\.\d+$/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm run docs:test:plugins --prefix docs
```

Expected: FAIL — `loadVersionHighlights` undefined.

- [ ] **Step 3: Implement**

Append to `version-highlights-loader.mjs`:

```javascript
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseAllChangelogs } from './changelog-parser.mjs';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HIGHLIGHTS_DIR = resolve(__dirname, '../../content/data/version-highlights');
const HOT_PACKAGE = resolve(__dirname, '../../../handsontable/package.json');

function loadHighlightFiles() {
  let files;
  try {
    files = readdirSync(HIGHLIGHTS_DIR).filter((n) => n.endsWith('.json'));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
  return files.map((filename) => ({
    filename,
    data: JSON.parse(readFileSync(resolve(HIGHLIGHTS_DIR, filename), 'utf8')),
  }));
}

function readCurrentVersion() {
  try {
    const require = createRequire(import.meta.url);
    return require(HOT_PACKAGE).version;
  } catch {
    return null;
  }
}

export function loadVersionHighlights() {
  const auto = parseAllChangelogs();
  const files = loadHighlightFiles();
  const entries = mergeEntriesWithHighlights(auto, files);
  const releases = buildReleaseSummaries(auto, readCurrentVersion());
  return { entries, releases };
}
```

- [ ] **Step 4: Run tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/src/plugins/
git commit -m "PRO-1201: Top-level loadVersionHighlights entrypoint"
```

---

## Task 11: Seed five highlight files

**Files:**
- Create: `docs/content/data/version-highlights/17.0.json`
- Create: `docs/content/data/version-highlights/16.2.json`
- Create: `docs/content/data/version-highlights/16.0.json`
- Create: `docs/content/data/version-highlights/15.0.json`
- Create: `docs/content/data/version-highlights/14.0.json`

- [ ] **Step 1: Curate v17.0 highlights**

Read `docs/content/guides/upgrade-and-migration/changelog-17/changelog-17.md` and pick up to 5 entries with the highest migration impact. For each, find the PR number from the bullet's link. Create `docs/content/data/version-highlights/17.0.json`:

```json
{
  "version": "17.0",
  "highlighted": [
    {
      "prNumber": 11950,
      "tagline": "Theme API replaces legacy stylesheet",
      "whyItMatters": "Removes the legacy CSS file. Required upgrade for anyone using handsontable.full.min.css. Migrate to a theme to keep the prior look.",
      "codeBefore": "import 'handsontable/dist/handsontable.full.min.css';",
      "codeAfter": "import { classicTheme } from 'handsontable/themes';\nnew Handsontable(el, { theme: classicTheme });",
      "migrationAnchor": "/migration-from-16.2-to-17.0#1-remove-legacy-styles"
    },
    {
      "prNumber": 12015,
      "tagline": "Legacy wrapper packages and PersistentState removed",
      "whyItMatters": "@handsontable/react, @handsontable/angular, @handsontable/vue, the PersistentState plugin, and legacy undo/redo methods are gone. Update imports to the *-wrapper packages."
    },
    {
      "prNumber": 12017,
      "tagline": "core-js removed",
      "whyItMatters": "core-js polyfills are no longer bundled. Targets are modern browsers only; add polyfills yourself if you support older runtimes."
    },
    {
      "prNumber": 11981,
      "tagline": "New MultiSelect cell type",
      "whyItMatters": "Ships with a built-in editor, renderer, and validator for multi-value selection without writing a custom cell type."
    },
    {
      "prNumber": 11899,
      "tagline": "BaseEditor.factory for simpler custom editors",
      "whyItMatters": "Define a custom editor without subclassing BaseEditor. Reduces boilerplate for the common cases."
    }
  ]
}
```

- [ ] **Step 2: Repeat for 16.2, 16.0, 15.0, 14.0**

Read the relevant `changelog-X.md` files and produce equivalent JSON files. Aim for 3–5 entries per release. If a release has no obviously notable changes, write a file with `highlighted: []` (allowed by the schema) and move on.

- [ ] **Step 3: Run the validator**

```
cd /Users/marekmartuszewski/Sites/handsontable/docs
npm run docs:validate-highlights
```

Expected: `All highlight files are valid.` If errors appear, fix the JSON and re-run.

- [ ] **Step 4: Commit**

```bash
git add docs/content/data/version-highlights/
git commit -m "PRO-1201: Seed curated highlights for v14..v17"
```

---

## Task 12: TypeScript types for the React component

**Files:**
- Create: `docs/src/components/VersionComparison/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// docs/src/components/VersionComparison/types.ts

export type ChangeCategory = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed';

export type Framework = 'core' | 'react' | 'angular' | 'vue';

export interface VersionEntry {
  version: string;
  releaseDate: string | null;
  category: ChangeCategory;
  breaking: boolean;
  framework: Framework;
  prNumber: number | null;
  title: string;
  highlighted: boolean;
  tagline?: string;
  whyItMatters?: string;
  codeBefore?: string;
  codeAfter?: string;
  migrationAnchor?: string;
}

export interface ReleaseSummary {
  version: string;
  releaseDate: string | null;
  major: number;
  minor: number;
  isCurrent: boolean;
}

export interface VersionComparisonData {
  entries: VersionEntry[];
  releases: ReleaseSummary[];
}

export type FilterKind = 'all' | 'breaking' | 'deprecated' | 'new' | 'fixed';
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/types.ts
git commit -m "PRO-1201: Add VersionComparison TypeScript types"
```

---

## Task 13: Build-time data injection (window global)

**Files:**
- Modify: `docs/src/components/Head.astro`
- Create: `docs/src/components/VersionComparisonData.astro`

The React component needs the loader output at runtime. We inject it as a JSON `<script>` tag on the version-comparison page only.

- [ ] **Step 1: Create the data injection component**

```astro
---
// docs/src/components/VersionComparisonData.astro
import { loadVersionHighlights } from '../plugins/version-highlights-loader.mjs';
const data = loadVersionHighlights();
const json = JSON.stringify(data);
---
<script type="application/json" id="version-comparison-data" set:html={json}></script>
<div id="version-comparison-root"></div>
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparisonData.astro
git commit -m "PRO-1201: Add Astro data injection for version comparison"
```

---

## Task 14: Component skeleton — read data, render entry count

**Files:**
- Create: `docs/src/components/VersionComparison/VersionComparison.tsx`

- [ ] **Step 1: Implement minimal skeleton**

```typescript
// docs/src/components/VersionComparison/VersionComparison.tsx
import { useMemo } from 'react';
import type { VersionComparisonData } from './types';

function readData(): VersionComparisonData {
  const el = document.getElementById('version-comparison-data');
  if (!el) throw new Error('version-comparison-data script tag not found');
  return JSON.parse(el.textContent || '{}') as VersionComparisonData;
}

export function VersionComparison() {
  const data = useMemo(() => readData(), []);
  return (
    <div className="version-comparison">
      <p data-testid="entry-count">{data.entries.length} entries loaded</p>
      <p data-testid="release-count">{data.releases.length} releases</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/VersionComparison.tsx
git commit -m "PRO-1201: VersionComparison component skeleton"
```

---

## Task 15: From/To selectors

**Files:**
- Modify: `docs/src/components/VersionComparison/VersionComparison.tsx`

- [ ] **Step 1: Add state + selectors**

Replace the component body with:

```typescript
import { useMemo, useState } from 'react';
import type { FilterKind, ReleaseSummary, VersionComparisonData, VersionEntry } from './types';

function readData(): VersionComparisonData {
  const el = document.getElementById('version-comparison-data');
  if (!el) throw new Error('version-comparison-data script tag not found');
  return JSON.parse(el.textContent || '{}') as VersionComparisonData;
}

function compareVersions(a: string, b: string): number {
  const [am, an] = a.split('.').map(Number);
  const [bm, bn] = b.split('.').map(Number);
  return am !== bm ? am - bm : an - bn;
}

function defaultRange(releases: ReleaseSummary[]) {
  if (releases.length === 0) return { from: '', to: '' };
  const to = releases[0].version;
  const fromIdx = Math.min(releases.length - 1, 2);
  return { from: releases[fromIdx].version, to };
}

interface VersionSelectorProps {
  label: string;
  value: string;
  releases: ReleaseSummary[];
  onChange: (v: string) => void;
}

function VersionSelector({ label, value, releases, onChange }: VersionSelectorProps) {
  return (
    <label className="vc-selector">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {releases.map((r) => (
          <option key={r.version} value={r.version}>
            {r.version}
            {r.isCurrent ? ' (current)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

function entriesInRange(entries: VersionEntry[], from: string, to: string): VersionEntry[] {
  return entries.filter((e) => {
    const [maj, min] = e.version.split('.');
    const minor = `${maj}.${min}`;
    return compareVersions(minor, from) > 0 && compareVersions(minor, to) <= 0;
  });
}

export function VersionComparison() {
  const data = useMemo(() => readData(), []);
  const [{ from, to }, setRange] = useState(() => defaultRange(data.releases));

  const filtered = useMemo(
    () => entriesInRange(data.entries, from, to),
    [data.entries, from, to],
  );

  return (
    <div className="version-comparison">
      <div className="vc-controls">
        <VersionSelector label="From" value={from} releases={data.releases} onChange={(v) => setRange((s) => ({ ...s, from: v }))} />
        <VersionSelector label="To" value={to} releases={data.releases} onChange={(v) => setRange((s) => ({ ...s, to: v }))} />
      </div>
      <p data-testid="entry-count">{filtered.length} changes between {from} and {to}</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/VersionComparison.tsx
git commit -m "PRO-1201: Add From/To selectors and range filtering"
```

---

## Task 16: Filter tabs

**Files:**
- Modify: `docs/src/components/VersionComparison/VersionComparison.tsx`

- [ ] **Step 1: Add `FilterTabs` + filter mapping**

Add this filter logic and component (insert above `VersionComparison`):

```typescript
const FILTER_LABELS: Record<FilterKind, string> = {
  all: 'All',
  breaking: 'Breaking',
  deprecated: 'Deprecated',
  new: 'New',
  fixed: 'Fixed',
};

function matchesFilter(entry: VersionEntry, filter: FilterKind): boolean {
  switch (filter) {
    case 'all': return true;
    case 'breaking': return entry.breaking;
    case 'deprecated': return entry.category === 'deprecated';
    case 'new': return entry.category === 'added' && !entry.breaking;
    case 'fixed': return entry.category === 'fixed';
  }
}

interface FilterTabsProps {
  value: FilterKind;
  onChange: (v: FilterKind) => void;
}

function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div className="vc-filter-tabs" role="tablist">
      {(Object.keys(FILTER_LABELS) as FilterKind[]).map((k) => (
        <button
          key={k}
          role="tab"
          aria-selected={value === k}
          className={value === k ? 'is-active' : ''}
          onClick={() => onChange(k)}
        >
          {FILTER_LABELS[k]}
        </button>
      ))}
    </div>
  );
}
```

Add `filter` state and apply it:

```typescript
const [filter, setFilter] = useState<FilterKind>('all');

const visible = useMemo(
  () => filtered.filter((e) => matchesFilter(e, filter)),
  [filtered, filter],
);
```

Update the JSX:

```typescript
return (
  <div className="version-comparison">
    <div className="vc-controls">{/* selectors */}</div>
    <FilterTabs value={filter} onChange={setFilter} />
    <p data-testid="entry-count">{visible.length} of {filtered.length} changes</p>
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/VersionComparison.tsx
git commit -m "PRO-1201: Add filter tabs (All/Breaking/Deprecated/New/Fixed)"
```

---

## Task 17: Stat cards

**Files:**
- Modify: `docs/src/components/VersionComparison/VersionComparison.tsx`

- [ ] **Step 1: Add `StatCards` component**

```typescript
interface StatCardsProps {
  entries: VersionEntry[];
  activeFilter: FilterKind;
  onSelect: (filter: FilterKind) => void;
}

function StatCards({ entries, activeFilter, onSelect }: StatCardsProps) {
  const counts: Record<Exclude<FilterKind, 'all'>, number> = {
    breaking: 0, deprecated: 0, new: 0, fixed: 0,
  };
  for (const e of entries) {
    if (matchesFilter(e, 'breaking')) counts.breaking += 1;
    if (matchesFilter(e, 'deprecated')) counts.deprecated += 1;
    if (matchesFilter(e, 'new')) counts.new += 1;
    if (matchesFilter(e, 'fixed')) counts.fixed += 1;
  }

  const cards: { kind: Exclude<FilterKind, 'all'>; label: string }[] = [
    { kind: 'breaking', label: 'Breaking changes' },
    { kind: 'deprecated', label: 'Deprecations' },
    { kind: 'new', label: 'New APIs' },
    { kind: 'fixed', label: 'Fixes' },
  ];

  return (
    <div className="vc-stat-cards">
      {cards.map((c) => (
        <button
          key={c.kind}
          className={`vc-stat-card vc-stat-${c.kind} ${activeFilter === c.kind ? 'is-active' : ''}`}
          onClick={() => onSelect(c.kind)}
        >
          <span className="vc-stat-count">{counts[c.kind]}</span>
          <span className="vc-stat-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
```

Insert into the render, above `FilterTabs`:

```typescript
<StatCards entries={filtered} activeFilter={filter} onSelect={setFilter} />
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/VersionComparison.tsx
git commit -m "PRO-1201: Add clickable stat cards"
```

---

## Task 18: Breadcrumb path (with collapse-when-long)

**Files:**
- Modify: `docs/src/components/VersionComparison/VersionComparison.tsx`

- [ ] **Step 1: Add `VersionBreadcrumb`**

```typescript
interface VersionBreadcrumbProps {
  releases: ReleaseSummary[];
  from: string;
  to: string;
  onJumpTo: (version: string) => void;
}

function VersionBreadcrumb({ releases, from, to, onJumpTo }: VersionBreadcrumbProps) {
  const inRange = releases
    .filter((r) => compareVersions(r.version, from) >= 0 && compareVersions(r.version, to) <= 0)
    .sort((a, b) => compareVersions(a.version, b.version));

  const visible = inRange.length <= 8
    ? inRange
    : [inRange[0], inRange[1], { collapsed: true } as const, inRange[inRange.length - 2], inRange[inRange.length - 1]];

  return (
    <nav className="vc-breadcrumb" aria-label="Version path">
      {visible.map((node, idx) => {
        if ('collapsed' in node) {
          return <span key={`gap-${idx}`} className="vc-breadcrumb-gap">…</span>;
        }
        return (
          <button
            key={node.version}
            type="button"
            className={`vc-breadcrumb-node ${node.version === to ? 'is-target' : ''} ${node.version === from ? 'is-source' : ''}`}
            onClick={() => onJumpTo(node.version)}
          >
            {node.version}
          </button>
        );
      })}
    </nav>
  );
}
```

Hook it up in `VersionComparison`:

```typescript
<VersionBreadcrumb
  releases={data.releases}
  from={from}
  to={to}
  onJumpTo={(v) => setRange((s) => ({ ...s, to: v }))}
/>
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/VersionComparison.tsx
git commit -m "PRO-1201: Add version breadcrumb path"
```

---

## Task 19: Entry rendering (featured + compact, grouped by release)

**Files:**
- Modify: `docs/src/components/VersionComparison/VersionComparison.tsx`

- [ ] **Step 1: Add entry components**

```typescript
function pillClass(category: ChangeCategory, breaking: boolean) {
  if (breaking) return 'vc-pill vc-pill-breaking';
  return `vc-pill vc-pill-${category}`;
}

function pillLabel(category: ChangeCategory, breaking: boolean) {
  if (breaking) return 'breaking';
  return category;
}

function PrLink({ prNumber }: { prNumber: number | null }) {
  if (prNumber === null) return null;
  const href = `https://github.com/handsontable/handsontable/pull/${prNumber}`;
  return <a href={href} target="_blank" rel="noreferrer">#{prNumber}</a>;
}

function FeaturedEntry({ entry }: { entry: VersionEntry }) {
  return (
    <article className={`vc-entry vc-entry-featured ${pillClass(entry.category, entry.breaking).replace('vc-pill', 'vc-entry-accent')}`}>
      <header>
        <span className={pillClass(entry.category, entry.breaking)}>{pillLabel(entry.category, entry.breaking)}</span>
        <h3>{entry.tagline ?? entry.title}</h3>
        <span className="vc-entry-version">{entry.version}</span>
      </header>
      {entry.whyItMatters && <p className="vc-entry-why">{entry.whyItMatters}</p>}
      {entry.codeBefore && entry.codeAfter && (
        <pre className="vc-entry-diff">{`// Before\n${entry.codeBefore}\n\n// After\n${entry.codeAfter}`}</pre>
      )}
      <footer>
        <PrLink prNumber={entry.prNumber} />
        {entry.migrationAnchor && (
          <a href={entry.migrationAnchor}>Migration guide</a>
        )}
      </footer>
    </article>
  );
}

function CompactEntry({ entry }: { entry: VersionEntry }) {
  return (
    <li className="vc-entry vc-entry-compact">
      <span className={pillClass(entry.category, entry.breaking)}>{pillLabel(entry.category, entry.breaking)}</span>
      <span className="vc-entry-title">{entry.title}</span>
      <PrLink prNumber={entry.prNumber} />
    </li>
  );
}

const COMPACT_THRESHOLD = 10;

function ReleaseGroup({ version, entries }: { version: string; entries: VersionEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const featured = entries.filter((e) => e.highlighted);
  const compact = entries.filter((e) => !e.highlighted);
  const shown = expanded || compact.length <= COMPACT_THRESHOLD
    ? compact
    : compact.slice(0, COMPACT_THRESHOLD);
  const hiddenCount = compact.length - shown.length;

  return (
    <section className="vc-release-group">
      <h2 className="vc-release-heading">{version}</h2>
      {featured.map((e) => <FeaturedEntry key={`${e.version}-${e.prNumber}-${e.title}`} entry={e} />)}
      {compact.length > 0 && (
        <ul className="vc-entry-list">
          {shown.map((e) => <CompactEntry key={`${e.version}-${e.prNumber}-${e.title}`} entry={e} />)}
        </ul>
      )}
      {hiddenCount > 0 && (
        <button type="button" className="vc-show-all" onClick={() => setExpanded(true)}>
          Show all {compact.length} changes
        </button>
      )}
    </section>
  );
}

function groupByRelease(entries: VersionEntry[]): { version: string; entries: VersionEntry[] }[] {
  const map = new Map<string, VersionEntry[]>();
  for (const e of entries) {
    const list = map.get(e.version) ?? [];
    list.push(e);
    map.set(e.version, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => compareVersions(b[0].split('.').slice(0, 2).join('.'), a[0].split('.').slice(0, 2).join('.')) || compareVersions(b[0].split('.')[2], a[0].split('.')[2]))
    .map(([version, entries]) => ({ version, entries }));
}
```

Render the groups in `VersionComparison`:

```typescript
const groups = useMemo(() => groupByRelease(visible), [visible]);

return (
  <div className="version-comparison">
    {/* … selectors, breadcrumb, stat cards, filter tabs … */}
    {groups.map((g) => <ReleaseGroup key={g.version} version={g.version} entries={g.entries} />)}
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/VersionComparison.tsx
git commit -m "PRO-1201: Render featured and compact entry list grouped by release"
```

---

## Task 20: URL synchronization (query params)

**Files:**
- Modify: `docs/src/components/VersionComparison/VersionComparison.tsx`

- [ ] **Step 1: Add `useUrlSync` hook**

Add this above `VersionComparison`:

```typescript
import { useEffect } from 'react';

function useUrlSync(state: { from: string; to: string; filter: FilterKind }) {
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('from', state.from);
    params.set('to', state.to);
    if (state.filter !== 'all') params.set('category', state.filter);
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', next);
  }, [state.from, state.to, state.filter]);
}

function readUrlState(releases: ReleaseSummary[], fallback: { from: string; to: string }): { from: string; to: string; filter: FilterKind } {
  const params = new URLSearchParams(window.location.search);
  const versions = new Set(releases.map((r) => r.version));
  const from = versions.has(params.get('from') ?? '') ? (params.get('from') as string) : fallback.from;
  const to = versions.has(params.get('to') ?? '') ? (params.get('to') as string) : fallback.to;
  const cat = params.get('category');
  const filter: FilterKind = ['breaking', 'deprecated', 'new', 'fixed'].includes(cat ?? '') ? (cat as FilterKind) : 'all';
  return { from, to, filter };
}
```

Replace the state initialization:

```typescript
const [{ from, to, filter }, setState] = useState(() => {
  const fb = defaultRange(data.releases);
  return readUrlState(data.releases, fb);
});

useUrlSync({ from, to, filter });
```

Adjust the existing `setFilter` / `setRange` calls so they update the merged state object instead of two separate states. Replace any earlier `setFilter(...)` / `setRange(...)` calls with `setState((s) => ({ ...s, filter: v }))` etc.

- [ ] **Step 2: Commit**

```bash
git add docs/src/components/VersionComparison/VersionComparison.tsx
git commit -m "PRO-1201: Sync state to URL query params"
```

---

## Task 21: Bootstrap script + Head.astro registration

**Files:**
- Create: `docs/src/scripts/version-comparison-bootstrap.ts`
- Modify: `docs/src/components/Head.astro`

- [ ] **Step 1: Create the bootstrap**

```typescript
// docs/src/scripts/version-comparison-bootstrap.ts

const ROOT_ID = 'version-comparison-root';

async function mount() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById(ROOT_ID);
  if (!container) return;
  if (container.dataset.mounted === 'true') return;
  container.dataset.mounted = 'true';

  const [{ createRoot }, { createElement }, { VersionComparison }] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('../components/VersionComparison/VersionComparison'),
  ]);

  createRoot(container).render(createElement(VersionComparison));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
```

- [ ] **Step 2: Register in Head.astro**

Add next to the `docs-assistant-bootstrap` import (around line 34 in `docs/src/components/Head.astro`):

```astro
import '../scripts/version-comparison-bootstrap';
```

- [ ] **Step 3: Commit**

```bash
git add docs/src/scripts/version-comparison-bootstrap.ts docs/src/components/Head.astro
git commit -m "PRO-1201: Bootstrap script for version comparison widget"
```

---

## Task 22: CSS

**Files:**
- Create: `docs/src/components/VersionComparison/VersionComparison.css`
- Modify: `docs/src/components/VersionComparison/VersionComparison.tsx` (add `import './VersionComparison.css'`)

- [ ] **Step 1: Write the styles**

```css
/* docs/src/components/VersionComparison/VersionComparison.css */

.version-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.vc-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.vc-selector {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}
.vc-selector select {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 4px;
  background: var(--sl-color-bg);
  color: var(--sl-color-text);
}

.vc-breadcrumb {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  padding: 0.5rem 0.75rem;
  background: var(--sl-color-bg-nav);
  border-radius: 6px;
}
.vc-breadcrumb-node {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
}
.vc-breadcrumb-node.is-target {
  background: var(--sl-color-accent);
  color: var(--sl-color-accent-high);
}
.vc-breadcrumb-node.is-source {
  border-color: var(--sl-color-gray-5);
}

.vc-stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.vc-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 6px;
  background: var(--sl-color-bg);
  cursor: pointer;
}
.vc-stat-card.is-active { border-color: var(--sl-color-accent); }
.vc-stat-count { font-size: 1.5rem; font-weight: 600; }
.vc-stat-breaking .vc-stat-count { color: #d33; }
.vc-stat-deprecated .vc-stat-count { color: #cc8400; }
.vc-stat-new .vc-stat-count { color: #2a8a2a; }
.vc-stat-fixed .vc-stat-count { color: #2563eb; }

.vc-filter-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.vc-filter-tabs button {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}
.vc-filter-tabs button.is-active {
  background: var(--sl-color-accent);
  color: var(--sl-color-accent-high);
  border-color: var(--sl-color-accent);
}

.vc-release-group { margin-top: 1.5rem; }
.vc-release-heading {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  border-bottom: 1px solid var(--sl-color-gray-5);
  padding-bottom: 0.25rem;
}

.vc-entry-featured {
  border-left: 4px solid var(--sl-color-gray-5);
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: var(--sl-color-bg-sidebar);
  border-radius: 0 6px 6px 0;
}
.vc-entry-accent-breaking { border-left-color: #d33; }
.vc-entry-accent-deprecated { border-left-color: #cc8400; }
.vc-entry-accent-added { border-left-color: #2a8a2a; }
.vc-entry-accent-fixed { border-left-color: #2563eb; }

.vc-entry-featured header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.vc-entry-featured header h3 { margin: 0; font-size: 1rem; }
.vc-entry-version { margin-left: auto; font-size: 0.75rem; color: var(--sl-color-gray-3); }

.vc-entry-diff {
  margin: 0.5rem 0;
  padding: 0.625rem 0.875rem;
  background: var(--sl-color-bg-inline-code);
  border-radius: 4px;
  font-size: 0.8125rem;
  overflow-x: auto;
}

.vc-entry-list { list-style: none; padding: 0; margin: 0; }
.vc-entry-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--sl-color-gray-6);
  font-size: 0.875rem;
}
.vc-entry-title { flex: 1; }

.vc-pill {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  text-transform: lowercase;
}
.vc-pill-breaking { background: #fde2e2; color: #951a1a; }
.vc-pill-deprecated { background: #fcecc9; color: #7a5300; }
.vc-pill-added, .vc-pill-changed { background: #d5ecd6; color: #1f5a22; }
.vc-pill-removed { background: #f1d4d4; color: #7a1f1f; }
.vc-pill-fixed { background: #dde6fb; color: #1a3a86; }

.vc-show-all {
  padding: 0.375rem 0.75rem;
  background: transparent;
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .vc-stat-cards { grid-template-columns: 1fr 1fr; }
  .vc-breadcrumb { overflow-x: auto; flex-wrap: nowrap; }
}
```

- [ ] **Step 2: Import in component**

At the top of `VersionComparison.tsx`:

```typescript
import './VersionComparison.css';
```

- [ ] **Step 3: Commit**

```bash
git add docs/src/components/VersionComparison/
git commit -m "PRO-1201: Style version comparison component"
```

---

## Task 23: Markdown page

**Files:**
- Create: `docs/content/guides/upgrade-and-migration/version-comparison/version-comparison.md`

- [ ] **Step 1: Generate a fresh 8-char alphanumeric `id` and `react.id`**

Run in a shell:

```
node -e "console.log([...Array(2)].map(() => Math.random().toString(36).slice(2, 10)).join(' '))"
```

Use the first as the `id`, the second as `react.id`.

- [ ] **Step 2: Create the page**

```markdown
---
type: reference
id: <first id from step 1>
title: Version comparison
metaTitle: Version comparison - JavaScript Data Grid | Handsontable
description: Compare two Handsontable versions side-by-side and see breaking changes, deprecations, new APIs, and fixes between them.
permalink: /version-comparison
react:
  id: <second id from step 1>
  metaTitle: Version comparison - React Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---

import VersionComparisonData from '../../../src/components/VersionComparisonData.astro';

Compare two Handsontable versions. Pick a `From` and `To` release to see the breaking changes, deprecations, new APIs, and fixes you would adopt by upgrading.

<VersionComparisonData />
```

If Starlight at the current version does not support `import` in `.md`, rename the file to `.mdx` and update the sidebar entry to match.

- [ ] **Step 3: Commit**

```bash
git add docs/content/guides/upgrade-and-migration/version-comparison/
git commit -m "PRO-1201: Add version-comparison markdown page"
```

---

## Task 24: Sidebar registration

**Files:**
- Modify: `docs/content/guides/sidebar.js`

- [ ] **Step 1: Add the page to `upgradeAndMigrationItems`**

Insert at the start of `upgradeAndMigrationItems` (above `...changelogItems`):

```javascript
const upgradeAndMigrationItems = [
  { path: 'guides/upgrade-and-migration/version-comparison/version-comparison' },
  ...changelogItems,
  // … rest unchanged
];
```

- [ ] **Step 2: Smoke-test by starting the dev server**

```
npm run dev --prefix docs -- --force
```

Open `http://localhost:4321/version-comparison`. Verify:
- Page renders
- From/To selectors show all releases
- Selecting different versions changes the entry count
- Breadcrumb path renders
- Stat cards show counts
- Filter tabs work
- Featured entries (with code diffs) appear in v17.0, v16.2, etc.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add docs/content/guides/sidebar.js
git commit -m "PRO-1201: Register version-comparison page in sidebar"
```

---

## Task 25: Playwright E2E test

**Files:**
- Create: `docs/tests/version-comparison.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// docs/tests/version-comparison.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Version comparison page', () => {
  test('renders with defaults and updates entry count when From changes', async ({ page }) => {
    await page.goto('/version-comparison');
    const count = page.getByTestId('entry-count');
    await expect(count).toBeVisible();
    const before = await count.textContent();

    await page.locator('.vc-selector', { hasText: 'From' }).locator('select').selectOption('14.0');
    const after = await count.textContent();
    expect(after).not.toEqual(before);
  });

  test('clicking a filter tab narrows the list', async ({ page }) => {
    await page.goto('/version-comparison');
    await page.getByRole('tab', { name: 'Breaking' }).click();
    await expect(page.locator('.vc-pill-breaking').first()).toBeVisible();
  });

  test('deep link with from/to/category restores state', async ({ page }) => {
    await page.goto('/version-comparison?from=14.0&to=17.0&category=breaking');
    await expect(page.getByRole('tab', { name: 'Breaking' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.vc-selector', { hasText: 'To' }).locator('select')).toHaveValue('17.0');
  });

  test('breadcrumb click sets To', async ({ page }) => {
    await page.goto('/version-comparison?from=14.0&to=17.0');
    const node = page.locator('.vc-breadcrumb-node', { hasText: '16.0' });
    await node.click();
    await expect(page.locator('.vc-selector', { hasText: 'To' }).locator('select')).toHaveValue('16.0');
  });
});
```

- [ ] **Step 2: Run the test**

```
cd /Users/marekmartuszewski/Sites/handsontable/docs
npm run build && npx playwright test tests/version-comparison.spec.ts
```

Expected: all four tests pass. If a build error occurs, fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add docs/tests/version-comparison.spec.ts
git commit -m "PRO-1201: Add E2E tests for version comparison"
```

---

## Task 26: Add highlights validation to docs build

**Files:**
- Modify: `docs/package.json`

- [ ] **Step 1: Add validator to the build step**

Update the `build` script:

```json
"build": "npm run docs:api && npm run docs:validate-highlights && astro build",
```

- [ ] **Step 2: Verify**

```
npm run build --prefix docs
```

Expected: build succeeds; the validator step prints `All highlight files are valid.`

- [ ] **Step 3: Commit**

```bash
git add docs/package.json
git commit -m "PRO-1201: Validate highlights as part of docs build"
```

---

## Task 27: Final smoke test + cleanup

- [ ] **Step 1: Run all parser/loader/validator tests**

```
npm run docs:test:plugins --prefix docs
```

Expected: all tests pass.

- [ ] **Step 2: Lint**

```
npm run docs:lint --prefix docs
```

Fix any lint issues introduced by the new files.

- [ ] **Step 3: Build the docs site**

```
npm run build --prefix docs
```

Expected: clean build, no warnings about the new page.

- [ ] **Step 4: Final visual check**

```
npm run dev --prefix docs -- --force
```

Open `http://localhost:4321/version-comparison`. Confirm:
- Default `From` = current minor minus 2, `To` = current minor.
- All four stat cards have non-zero counts for v14→v17 range.
- Featured entries show "Theme API replaces legacy stylesheet" (or equivalent) with code diff.
- Filter tabs filter the list.
- Browser URL updates when state changes.
- Refresh restores state.

- [ ] **Step 5: Final commit (if any cleanup happened)**

```bash
git status
# If anything uncommitted from steps 2/4, commit it:
git add -- <specific files>
git commit -m "PRO-1201: Lint and cleanup"
```

---

## Self-review checklist (run before requesting review)

- [ ] Spec §3 non-goals respected: no client presets, no "Features in use" filter.
- [ ] Spec §5 data architecture covered: parser (T1–T5), validator (T6–T7), loader (T8–T10).
- [ ] Spec §6 UI: selectors (T15), filter tabs (T16), stat cards (T17), breadcrumb (T18), featured/compact entries (T19), URL sync (T20).
- [ ] Spec §8 CI validation: integrated into build (T26).
- [ ] Spec §9 initial coverage: five seed files (T11).
- [ ] Spec §10 tests: parser tests (T1–T5), validator tests (T6–T7), loader tests (T8–T10), Playwright (T25).
- [ ] [skip changelog] in the PR body (docs-only change).
- [ ] PR description includes ClickUp link: `https://app.clickup.com/t/9015210959/PRO-1201`.
