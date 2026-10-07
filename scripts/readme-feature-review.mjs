/**
 * @file The one README check that cannot be automated: whether a feature we shipped this cycle
 * belongs in the READMEs' "Key Features" list.
 *
 * Notifications, Export to Excel, date/time editing and Shadow DOM support all shipped while the
 * READMEs went on not mentioning them, because nobody re-reads the changelog against a marketing
 * list at release time. Deciding whether a given entry is headline-worthy is a judgment call, so
 * this does not gate anything — it turns "remember to check the README" into "review these five
 * lines", which is the part a script can actually do.
 *
 * Reads the pending `.changelogs/*.json` entries, so it reports the features of the release being
 * prepared, not the one already written into CHANGELOG.md.
 *
 * Usage:
 *   node scripts/readme-feature-review.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFeatures, READMES } from './readme-check.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The pending changelog entries that announce something new, newest first. `added` is the only type
 * that can introduce a headline feature; `fixed`, `changed` and `removed` cannot.
 *
 * @param {object[]} entries Parsed `.changelogs/*.json` contents.
 * @returns {object[]} The entries worth reviewing, highest issue number first.
 */
export function featureEntries(entries) {
  return entries
    .filter(entry => entry?.type === 'added')
    // Number(), not `?? 0`: a non-numeric issueOrPR would make every comparison NaN and quietly
    // leave the list in directory order.
    .sort((a, b) => (Number(b.issueOrPR) || 0) - (Number(a.issueOrPR) || 0));
}

/**
 * Read every pending changelog entry. A malformed file is skipped rather than thrown on: this is a
 * reminder, and it must not be the thing that stops a release.
 *
 * @param {string} dir Directory holding the `.json` entries.
 * @returns {object[]} Parsed entries.
 */
export function readEntries(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter(name => name.endsWith('.json'))
    .map((name) => {
      try {
        return JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(entry => entry !== null);
}

/**
 * The review block, ready to print.
 *
 * @param {object[]} entries Feature entries from `featureEntries`.
 * @param {string[]} features The root README's current Key Features labels.
 * @returns {string} The text to show the releaser.
 */
export function formatReview(entries, features) {
  if (entries.length === 0) {
    return 'No `added` changelog entries are pending — the README\'s Key Features list needs no review.';
  }

  const lines = [
    `${entries.length} feature(s) are shipping in this release. Does any of them belong in the`,
    'READMEs\' "Key Features" list?',
    '',
    ...entries.map((entry) => {
      const where = entry.framework && entry.framework !== 'none' ? ` [${entry.framework}]` : '';

      return `  #${entry.issueOrPR}${where}  ${entry.title}`;
    }),
    '',
    `The list today (${features.length} bullets, root README):`,
    `  ${features.join(' · ')}`,
    '',
    'Adding one means editing all five READMEs — scripts/readme-check.mjs fails if they disagree.',
  ];

  return lines.join('\n');
}

/**
 * Print the review block.
 *
 * @returns {string} The same text, for a caller that wants to show it inside a prompt.
 */
export function buildReview() {
  const entries = featureEntries(readEntries(path.join(ROOT, '.changelogs')));
  const rootReadme = READMES.find(r => r.label === 'root');
  const features = extractFeatures(readFileSync(path.join(ROOT, rootReadme.file), 'utf8'));

  return formatReview(entries, features);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(buildReview());
}
