import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Usage: node prepend-docs-changelog.mjs <version> [docs-path]
//
// Changelog content is read from the CHANGELOG_CONTENT environment variable.
//
// If CHANGELOG_CONTENT is set:
//   - Same base version at top → replace the entire section
//   - Different base version   → prepend a new section after [[toc]]
// If CHANGELOG_CONTENT is unset (stable promotion of an RC entry):
//   - Updates the version header and release date in place

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_DOCS = path.join(REPO_ROOT, 'docs/content/guides/upgrade-and-migration/changelog/changelog.md');

const [version, docsPath = DEFAULT_DOCS] = process.argv.slice(2);

if (!version) {
  process.stderr.write('Usage: node prepend-docs-changelog.mjs <version> [docs-path]\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------

function parseVersion(ver) {
  const m = ver.match(/^(\d+)\.(\d+)\.\d+(-rc\d+)?$/);

  if (!m) {
    process.stderr.write(`Error: invalid version "${ver}" — expected X.Y.Z or X.Y.Z-rcN\n`);
    process.exit(1);
  }

  return { base: `${m[1]}.${m[2]}.${ver.split('.')[2].replace(/-rc\d+$/, '')}`, majorMinor: `${m[1]}.${m[2]}` };
}

function formatDate() {
  const d = new Date();
  const day = d.getDate();
  const suffix = { one: 'st', two: 'nd', few: 'rd', other: 'th' }[new Intl.PluralRules('en-US', { type: 'ordinal' }).select(day)];

  return `${d.toLocaleString('en-US', { month: 'long' })} ${day}${suffix}, ${d.getFullYear()}`;
}

function buildEntry(ver, content, majorMinor) {
  return [
    `## ${ver}`,
    '',
    `Released on ${formatDate()}`,
    '',
    'For more information about this release, see:',
    `- [Documentation (${majorMinor})](https://handsontable.com/docs/${majorMinor})`,
    '',
    content.trim().replace(/^### /gm, '#### '),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------

const { base, majorMinor } = parseVersion(version);
const trimmedContent = process.env.CHANGELOG_CONTENT?.trim();
const lines = fs.readFileSync(docsPath, 'utf8').split('\n');

// Find the topmost ## section header
const topIdx = lines.findIndex(l => /^## /.test(l));

// Does it belong to the same base version? (e.g. 16.0.0, 16.0.0-rc1, 16.0.0-rc2 all share base 16.0.0)
const escapedBase = base.replace(/\./g, '\\.');
const sameBase = topIdx !== -1 && new RegExp(`^## ${escapedBase}(-rc\\d+)?\\s*$`).test(lines[topIdx]);

if (sameBase && !trimmedContent) {
  // Stable promotion: just fix the header and date, leave content untouched
  lines[topIdx] = `## ${version}`;

  for (let i = topIdx + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    if (lines[i].startsWith('Released on ')) {
      lines[i] = `Released on ${formatDate()}`;
      break;
    }
  }

  fs.writeFileSync(docsPath, lines.join('\n'), 'utf8');
  process.stdout.write(`Promoted to stable ${version}.\n`);

} else if (sameBase && trimmedContent) {
  // Replace the existing section entirely
  let end = lines.length;

  for (let i = topIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break; }
  }

  const updated = [...lines.slice(0, topIdx), ...buildEntry(version, trimmedContent, majorMinor).split('\n'), ...lines.slice(end)];

  fs.writeFileSync(docsPath, updated.join('\n'), 'utf8');
  process.stdout.write(`Replaced docs changelog entry for ${version}.\n`);

} else {
  // New base version: prepend after [[toc]]
  if (!trimmedContent) {
    process.stderr.write(`Error: no changelog content provided for new version ${version}.\n`);
    process.exit(1);
  }

  const tocIdx = lines.findIndex(l => l.trim() === '[[toc]]');

  if (tocIdx === -1) {
    process.stderr.write('Error: [[toc]] marker not found in docs changelog.\n');
    process.exit(1);
  }

  let insertAt = tocIdx + 1;

  while (insertAt < lines.length && lines[insertAt].trim() === '') insertAt++;

  const updated = [...lines.slice(0, insertAt), ...buildEntry(version, trimmedContent, majorMinor).split('\n'), ...lines.slice(insertAt)];

  fs.writeFileSync(docsPath, updated.join('\n'), 'utf8');
  process.stdout.write(`Prepended docs changelog entry for ${version}.\n`);
}