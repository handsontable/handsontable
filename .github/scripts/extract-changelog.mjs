import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// extract-changelog.mjs <version-or-prefix> [changelog-path]
//
// Extracts the changelog content for a specific version from CHANGELOG.md.
// The version argument is matched as a prefix against version headers (## [VERSION...]).
// Uses String.startsWith() for literal matching so dots, hyphens, etc. are handled safely.
//
// Examples:
//   node extract-changelog.mjs 16.3.0-rc1    → matches "## [16.3.0-rc1] - ..."
//   node extract-changelog.mjs 16.3.0-rc     → matches the first "## [16.3.0-rc*] - ..." entry
//   node extract-changelog.mjs 16.3.0        → matches "## [16.3.0] - ..."

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const version = args[0];
const changelogPath = args[1] ?? path.join(REPO_ROOT, 'CHANGELOG.md');

if (!version) {
  process.stderr.write(`Usage: node extract-changelog.mjs <version-or-prefix> [changelog-path]\n`);
  process.exit(1);
}

if (!fs.existsSync(changelogPath)) {
  process.stderr.write(`Error: CHANGELOG.md not found at: ${changelogPath}\n`);
  process.exit(1);
}

const lines = fs.readFileSync(changelogPath, 'utf8').split('\n');
const header = `## [${version}`;
let startIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith(header)) {
    startIndex = i + 1;
    break;
  }
}

if (startIndex === -1) {
  process.stderr.write(`Error: No changelog entry found for version: ${version}\n`);
  process.exit(1);
}

const sectionLines = [];

for (let i = startIndex; i < lines.length; i++) {
  if (lines[i].startsWith('## [')) {
    break;
  }
  sectionLines.push(lines[i]);
}

// Strip leading blank lines
let start = 0;

while (start < sectionLines.length && sectionLines[start].trim() === '') {
  start++;
}

// Strip trailing blank lines
let end = sectionLines.length - 1;

while (end >= start && sectionLines[end].trim() === '') {
  end--;
}

const result = sectionLines.slice(start, end + 1).join('\n');

if (!result) {
  process.stderr.write(`Error: No changelog content found for version: ${version}\n`);
  process.exit(1);
}

process.stdout.write(`${result}\n`);
