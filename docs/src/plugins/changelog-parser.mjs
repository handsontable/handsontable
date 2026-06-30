import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHANGELOG_ROOT = resolve(__dirname, '../../content/guides/upgrade-and-migration');

// Auto-detect changelog files at module load: scan upgrade-and-migration/ for
// changelog-N directories, sort ascending by major version, and emit the
// matching changelog-N.md path inside each. Adding a new major release no
// longer requires editing this list.
const CHANGELOG_FILES = readdirSync(CHANGELOG_ROOT, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^changelog-\d+$/.test(entry.name))
  .map(entry => `${entry.name}/${entry.name}.md`)
  .filter(rel => existsSync(resolve(CHANGELOG_ROOT, rel)))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function parseReleaseDate(line) {
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

// "#### Major changes" is intentionally absent: in older changelogs it
// introduces prose paragraphs, not bullet lists, so it produces no entries
// in the current loop. "#### Security" maps to `fixed` because the UI exposes
// only five filter categories (Added/Changed/Deprecated/Removed/Fixed); the
// raw section is rare enough (2 occurrences) that a dedicated bucket is not
// worth the type-system churn.
const CATEGORY_HEADINGS = {
  '#### Added': { category: 'added', forceBreaking: false },
  '#### Changed': { category: 'changed', forceBreaking: false },
  '#### Deprecated': { category: 'deprecated', forceBreaking: false },
  '#### Removed': { category: 'removed', forceBreaking: false },
  '#### Fixed': { category: 'fixed', forceBreaking: false },
  '#### New features': { category: 'added', forceBreaking: false },
  '#### Changes': { category: 'changed', forceBreaking: false },
  '#### Changelog': { category: 'changed', forceBreaking: false },
  '#### Deprecations': { category: 'deprecated', forceBreaking: false },
  '#### Security': { category: 'fixed', forceBreaking: false },
  '#### Breaking changes': { category: 'changed', forceBreaking: true },
};

const FRAMEWORK_PREFIXES = {
  'React:': 'react',
  'Angular:': 'angular',
  'Vue:': 'vue',
};

function extractPrNumber(text) {
  // Captures both the citation number (#NNNN) and the URL kind (`issues` or
  // `pull`) so consumers can rebuild the correct GitHub destination instead
  // of assuming every reference is a PR. Roughly 55% of changelog bullets
  // historically cite `/issues/...` rather than `/pull/...`.
  //
  // The citation may be wrapped in parentheses, and the older v8/v12 changelogs
  // trail it with a sentence period/colon and/or a `[migration guide](...)`
  // link. The end anchor allows that tail so a well-formed, end-of-bullet
  // citation is still captured -- without matching an ambiguous mid-sentence
  // reference (anything other than punctuation/whitespace/a migration-guide
  // link after the citation fails the match).
  const match = text.match(
    /\(?\[#(\d+)\]\(https:\/\/github\.com\/handsontable\/handsontable\/(issues|pull)\/\d+\)\)?(?:[.:\s]*\[\[?[^\]]*?migration guide[^\]]*?\]\]?\([^)]*\))?[.:\s]*$/i
  );
  if (!match) return { prNumber: null, prKind: null, body: text };
  return { prNumber: Number(match[1]), prKind: match[2], body: text.slice(0, match.index).trim() };
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

  const { prNumber, prKind, body } = extractPrNumber(raw);

  return { breaking, framework, prNumber, prKind, body };
}

export function parseChangelogContent(markdown) {
  const lines = markdown.split('\n');
  const entries = [];
  let currentVersion = null;
  let currentDate = null;
  let currentCategory = null;
  let currentForceBreaking = false;
  let insideBoxesList = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // Track `<div class="boxes-list">` ... `</div>` blocks. Their bullets are
    // navigation (Blog post, Documentation links), not changelog entries, so
    // they must not surface on the version-comparison page.
    if (/<div class="boxes-list/.test(line)) {
      insideBoxesList = true;
      continue;
    }
    if (insideBoxesList && /<\/div>/.test(line)) {
      insideBoxesList = false;
      continue;
    }

    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (versionMatch) {
      currentVersion = versionMatch[1];
      currentDate = findFirstReleaseDate(lines, i + 1);
      currentCategory = null;
      currentForceBreaking = false;
      continue;
    }

    // A non-version level-2 heading (e.g. "## Related") ends the release
    // context. Without this, trailing nav bullets are wrongly attributed to
    // the previous release's last category.
    if (/^## /.test(line)) {
      currentVersion = null;
      currentCategory = null;
      currentForceBreaking = false;
      continue;
    }

    const heading = CATEGORY_HEADINGS[line.trim()];
    if (heading) {
      currentCategory = heading.category;
      currentForceBreaking = heading.forceBreaking;
      continue;
    }

    if (!currentVersion || !currentCategory) continue;
    if (insideBoxesList) continue;
    if (!line.startsWith('- ')) continue;

    // Reassemble a hard-wrapped bullet. Older changelogs (v8-v12) wrap a single
    // bullet across indented continuation lines, which would otherwise hide the
    // trailing `[#NNNN](...)` citation and truncate the entry text. Stop at a
    // blank line, a heading, the next top-level bullet, or a nested sub-bullet
    // (`  - `), which stays ignored exactly as before.
    let bulletText = line;
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j];
      if (next.trim() === '') break;
      if (/^#/.test(next)) break;
      if (/^- /.test(next)) break;
      if (/^\s+- /.test(next)) break;
      if (!/^\s+\S/.test(next)) break;
      bulletText += ` ${next.trim()}`;
      j += 1;
    }
    i = j - 1;

    const { breaking, framework, prNumber, prKind, body } = parseBullet(bulletText);

    // Skip pure-link bullets such as "- [Migrating from 8.4 to 9.0](@/...)":
    // a whole-bullet markdown link with no citation is navigation, not a change.
    if (prNumber === null && /^\[[^\]]*\]\([^)]*\)$/.test(body)) continue;

    entries.push({
      version: currentVersion,
      releaseDate: currentDate,
      category: currentCategory,
      breaking: breaking || currentForceBreaking,
      framework,
      prNumber,
      prKind,
      title: body,
    });
  }

  return entries;
}

export function parseAllChangelogs() {
  const all = [];
  for (const relPath of CHANGELOG_FILES) {
    const content = readFileSync(resolve(CHANGELOG_ROOT, relPath), 'utf8');
    all.push(...parseChangelogContent(content));
  }
  return all;
}
