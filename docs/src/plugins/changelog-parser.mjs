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
  const match = text.match(/\s*\(?\[#(\d+)\]\(https:\/\/github\.com\/handsontable\/handsontable\/(?:issues|pull)\/\d+\)\s*\)?\s*$/);
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

export function parseChangelogContent(markdown) {
  const lines = markdown.split('\n');
  const entries = [];
  let currentVersion = null;
  let currentDate = null;
  let currentCategory = null;
  let currentForceBreaking = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (versionMatch) {
      currentVersion = versionMatch[1];
      currentDate = findFirstReleaseDate(lines, i + 1);
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
    if (!line.startsWith('- ')) continue;

    const { breaking, framework, prNumber, body } = parseBullet(line);
    entries.push({
      version: currentVersion,
      releaseDate: currentDate,
      category: currentCategory,
      breaking: breaking || currentForceBreaking,
      framework,
      prNumber,
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
