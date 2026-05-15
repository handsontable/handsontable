import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseAllChangelogs } from './changelog-parser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HIGHLIGHTS_DIR = resolve(__dirname, '../../content/data/version-highlights');
const HOT_PACKAGE = resolve(__dirname, '../../../handsontable/package.json');

export function mergeEntriesWithHighlights(autoEntries, highlightFiles) {
  const byPr = new Map();
  const sources = new Map();
  for (const file of highlightFiles) {
    for (const h of file.data.highlighted) {
      if (sources.has(h.prNumber)) {
        throw new Error(
          `Duplicate highlight for PR #${h.prNumber} in ${sources.get(h.prNumber)} and ${file.filename}`,
        );
      }
      sources.set(h.prNumber, file.filename);
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

export function buildReleaseSummaries(autoEntries, currentVersion) {
  // Group by major.minor, prefer the X.Y.0 patch, otherwise the lowest patch
  // present in the changelog. This keeps the date accurate to when the minor
  // was first released, and lets minors with no .0 entry (like v6.2 where
  // only 6.2.2 is tracked) still appear in the version list.
  const byMinor = new Map();
  for (const entry of autoEntries) {
    const parts = entry.version.split('.').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) continue;
    const [major, minor, patch] = parts;
    const key = `${major}.${minor}`;
    const existing = byMinor.get(key);
    if (!existing || patch < existing.patch) {
      byMinor.set(key, {
        version: key,
        releaseDate: entry.releaseDate,
        major,
        minor,
        patch,
      });
    }
  }

  const currentMinor = currentVersion
    ? currentVersion.split('.').slice(0, 2).join('.')
    : null;

  return Array.from(byMinor.values())
    .sort((a, b) => (b.major - a.major) || (b.minor - a.minor))
    .map(({ patch, ...rest }) => ({ ...rest, isCurrent: rest.version === currentMinor }));
}

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
    return JSON.parse(readFileSync(HOT_PACKAGE, 'utf8')).version;
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
