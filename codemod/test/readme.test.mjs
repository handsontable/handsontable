import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadManifests } from '../src/manifest.mjs';
import { describeRules, resolvePlan } from '../src/runner.mjs';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const readme = await readFile(join(PACKAGE_ROOT, 'README.md'), 'utf8');
const cliSource = await readFile(join(PACKAGE_ROOT, 'src', 'cli.mjs'), 'utf8');
const manifests = (await loadManifests()).filter(manifest => manifest.status === 'released');
const { plan } = await resolvePlan({
  cwd: tmpdir(),
  from: manifests[0].from,
  to: manifests[manifests.length - 1].version,
});
const rows = describeRules(plan);

/**
 * The first cell of the "Supported migrations" row of a migration, as the README writes it: the line it starts from
 * and the line it reaches, for example `17.x to 18.0` or `18.0 to 18.1`.
 *
 * @param {{version: string, from: string}} manifest A loaded migration.
 * @returns {string} The label.
 */
function labelOf(manifest) {
  const [major, minor] = manifest.version.split('.');

  return `${manifest.from}${manifest.from.includes('.') ? '' : '.x'} to ${major}.${minor}`;
}

/**
 * Cells of the README table row that starts with a label, without the label.
 *
 * @param {string} label First cell of the row, for example `17.x to 18.0` or `` `detect` ``.
 * @returns {string[]|null} The other cells, or `null` when no row starts with the label.
 */
function rowOf(label) {
  const line = readme.split('\n').find(candidate => candidate.startsWith(`| ${label} |`));

  return line ? line.split('|').slice(2, -1).map(cell => cell.trim()) : null;
}

/**
 * Count the rules of a list by what they do.
 *
 * @param {Array<{mode: string}>} list Rows of `describeRules`.
 * @returns {number[]} The total, the rewrite count, and the report count.
 */
function counts(list) {
  const count = mode => list.filter(row => row.mode === mode).length;

  return [list.length, count('rewrite'), count('report')];
}

describe('README tables stay in step with the rules', () => {
  for (const manifest of manifests) {
    const label = labelOf(manifest);

    it(`has a Supported migrations row for ${manifest.version}, with the counts --list gives`, () => {
      const cells = rowOf(label);

      assert.ok(cells, `no row "${label}" in the README`);
      assert.deepEqual(cells.slice(0, 3).map(Number), counts(rows.filter(row => row.version === manifest.version)));
    });
  }

  it('lists no migration row that has no released migration', () => {
    const labels = new Set(manifests.map(labelOf));
    const listed = readme.split('\n')
      .map(line => /^\| (\d+(?:\.\d+|\.x) to \d+\.\d+) \| \d+ \| \d+ \| \d+ \|/.exec(line)?.[1]).filter(Boolean);

    assert.deepEqual(listed.filter(label => !labels.has(label)), []);
    assert.equal(listed.length, manifests.length);
  });

  it('lists every kind with its rewrite and report counts', () => {
    const kinds = [...new Set(rows.map(row => row.kind))];

    for (const kind of kinds) {
      const cells = rowOf(`\`${kind}\``);
      const [, rewrite, report] = counts(rows.filter(row => row.kind === kind));

      assert.ok(cells, `no row for ${kind} in the README`);
      assert.deepEqual(cells.slice(0, 2).map(Number), [rewrite, report], kind);
    }
  });

  it('names no kind that has no rule', () => {
    const kinds = new Set(rows.map(row => row.kind));
    const listed = readme.split('\n').map(line => /^\| `(\w+)` \| \d+ \| \d+ \|/.exec(line)?.[1]).filter(Boolean);

    assert.deepEqual(listed.filter(kind => !kinds.has(kind)), []);
  });
});

describe('README documents the command line', () => {
  it('mentions every flag of the CLI', () => {
    const flags = [...cliSource.matchAll(/^ {2}'?([a-z-]+)'?: \{ type: '(?:string|boolean)'/gm)].map(match => match[1]);

    assert.ok(flags.length >= 10);

    for (const flag of flags) {
      assert.ok(readme.includes(`--${flag}`), `--${flag} is not in the README`);
    }
  });

  it('keeps the install placeholders marked as unverified', () => {
    assert.match(readme, /^### Install from the repository$/m);
    assert.equal(readme.match(/^# UNVERIFIED/gm).length, 3);
  });

  it('keeps the product name, the sentence case headings, and no em dash', () => {
    assert.match(readme, /A migration CLI for Handsontable DataGrid\./);
    assert.doesNotMatch(readme, /—/);

    for (const [, heading] of readme.matchAll(/^#{2,3} (.+)$/gm)) {
      assert.doesNotMatch(heading.replace(/`[^`]*`/g, '').slice(1), /\b[A-Z][a-z]+ [A-Z][a-z]+/, heading);
    }
  });
});
