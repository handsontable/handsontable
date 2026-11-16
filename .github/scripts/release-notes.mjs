import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAX_BODY_LENGTH = 120000;
export const REPOSITORY_URL = 'https://github.com/handsontable/handsontable';
export const DOCS_CHANGELOG_URL = 'https://handsontable.com/docs/changelog/';

const BREAKING_ENTRY_PATTERN = /^- \*\*Breaking change/;
const FULL = 0;
const BREAKING_ONLY = 1;
const COUNT_ONLY = 2;

/**
 * Builds the GitHub release body for a version. GitHub rejects a body over 125000 characters,
 * so while the changelog is above `MAX_BODY_LENGTH`, its longest section is replaced with the
 * entry count and links to the full text. The other sections stay in full. A shortened section
 * keeps its breaking changes, and loses them only when the body is still too long with them.
 *
 * Usage: `node release-notes.mjs <version> <ref> [changelog-path]`, where `ref` is the tag
 * that holds `CHANGELOG.md`.
 *
 * @param {string} version The released version.
 * @param {string} ref The tag that holds `CHANGELOG.md`.
 * @param {string} content The changelog section of the version.
 * @returns {string}
 */
export function buildRelease(version, ref, content) {
  if (content.length <= MAX_BODY_LENGTH) {
    return `${content}\n`;
  }

  const parts = content.split(/\n(?=### )/).map((text) => {
    const [heading, ...lines] = text.split('\n');
    const entries = lines.filter(line => line.startsWith('- '));

    return {
      text,
      heading,
      count: entries.length,
      breaking: entries.filter(line => BREAKING_ENTRY_PATTERN.test(line)),
      level: text.startsWith('### ') ? FULL : COUNT_ONLY,
    };
  });
  const links = `[CHANGELOG.md](${REPOSITORY_URL}/blob/${ref}/CHANGELOG.md) `
    + `or in the [documentation](${DOCS_CHANGELOG_URL})`;
  const join = () => parts.map(part => part.text).join('\n');

  while (join().length > MAX_BODY_LENGTH) {
    const longest = parts
      .filter(part => part.level < COUNT_ONLY)
      .sort((a, b) => b.text.length - a.text.length)[0];

    if (!longest) {
      break;
    }

    const { heading, count, breaking } = longest;
    const intro = `${count} entries, too many for a GitHub release.`;

    if (longest.level === FULL && breaking.length > 0 && breaking.length < count) {
      longest.text = `${heading}\n\n${intro} Only the ${breaking.length} breaking changes are listed here. `
        + `Read the rest in ${links}.\n\n${breaking.join('\n')}\n`;
      longest.level = BREAKING_ONLY;
    } else {
      const hidden = breaking.length > 0 ? ` ${breaking.length} of them are breaking changes.` : '';

      longest.text = `${heading}\n\n${intro}${hidden} Read them in ${links}.\n`;
      longest.level = COUNT_ONLY;
    }
  }

  return `${join().trimEnd()}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [version, ref, changelogPath] = process.argv.slice(2);

  if (!version || !ref) {
    process.stderr.write('Usage: node release-notes.mjs <version> <ref> [changelog-path]\n');
    process.exit(1);
  }

  const extract = path.join(path.dirname(fileURLToPath(import.meta.url)), 'extract-changelog.mjs');
  const content = execFileSync('node', [extract, version, ...(changelogPath ? [changelogPath] : [])], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();

  process.stdout.write(buildRelease(version, ref, content));
}
