import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { parseAllChangelogs } from './changelog-parser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HIGHLIGHTS_DIR = resolve(__dirname, '../../content/data/version-highlights');
const HOT_PACKAGE = resolve(__dirname, '../../../handsontable/package.json');

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
