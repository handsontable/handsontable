import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT } from '../src/manifest.mjs';
import { IN_MONOREPO } from './helpers/guide-source.mjs';

const WORKFLOWS = join(PACKAGE_ROOT, '..', '.github', 'workflows');
const CHECKS = join(WORKFLOWS, 'checks.yml');
const LINT = join(WORKFLOWS, 'lint.yml');
const TEST = join(WORKFLOWS, 'test.yml');
const DEVELOP = join(WORKFLOWS, 'develop.yml');
const NVMRC = join(PACKAGE_ROOT, '..', '.nvmrc');

/**
 * The matrix legs of a job as `<os family>|<node major>`, for example `windows|22`.
 *
 * @param {string} job The text of a job.
 * @returns {Set<string>} One entry per `- os:` and `node:` pair.
 */
function legsOf(job) {
  const legs = new Set();

  for (const [, os, node] of job.matchAll(/- os: (\S+)\s+node: (\d+)/g)) {
    legs.add(`${os.startsWith('windows') ? 'windows' : 'ubuntu'}|${node}`);
  }

  return legs;
}

/**
 * The lines of a YAML file from a line that matches a pattern to the next line that is indented no deeper than it.
 *
 * @param {string} text The file text.
 * @param {RegExp} start Matches the first line.
 * @returns {string} The block, or an empty string when no line matches.
 */
function blockFrom(text, start) {
  const lines = text.split('\n');
  const first = lines.findIndex(line => start.test(line));

  if (first === -1) {
    return '';
  }

  const indent = lines[first].match(/^ */)[0].length;
  const rest = lines.slice(first + 1);
  const length = rest.findIndex(line => line.trim() !== '' && line.match(/^ */)[0].length <= indent);

  return [lines[first], ...(length === -1 ? rest : rest.slice(0, length))].join('\n');
}

describe('the workflows that run the codemod suite', { skip: !IN_MONOREPO && !existsSync(CHECKS) }, () => {
  it('runs the Windows and Node matrix when the lockfile changes, not only when the package does', async() => {
    const filter = blockFrom(await readFile(CHECKS, 'utf8'), /^\s+test-codemod:\s*$/);

    assert.match(filter, /'\.\/codemod\/\*\*'/);
    assert.match(filter, /'\.\/pnpm-lock\.yaml'/);
  });

  it('runs it when a migration guide changes, because every released rule anchors to a heading of one', async() => {
    const filter = blockFrom(await readFile(CHECKS, 'utf8'), /^\s+test-codemod:\s*$/);
    const entry = filter.match(/'\.\/(docs\/content\/guides\/upgrade-and-migration\/)\*\*'/);

    assert.ok(entry, 'the test-codemod filter names no migration guide directory');

    const versions = join(PACKAGE_ROOT, 'versions');
    const sources = [];

    for (const name of await readdir(versions)) {
      const file = join(versions, name, 'manifest.json');

      const guide = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')).guide : null;

      // A draft with no guide page yet has no file for the filter to cover.
      if (guide) {
        sources.push([name, guide.source]);
      }
    }

    assert.ok(sources.length > 0);

    for (const [name, source] of sources) {
      assert.ok(source.startsWith(entry[1]), `the guide of ${name} (${source}) is outside the filter`);
    }
  });

  it('exports the flag from the scope job and forwards it from test.yml as run-codemod', async() => {
    const checks = await readFile(CHECKS, 'utf8');
    const test = await readFile(TEST, 'utf8');
    const lintJob = blockFrom(test, /^ {2}lint:\s*$/);

    assert.match(checks, /test-codemod: \{ value: '\$\{\{ jobs\.scope\.outputs\.test-codemod \}\}' \}/);
    assert.match(checks, /test-codemod: \$\{\{ steps\.path-filter\.outputs\.test-codemod \}\}/);
    assert.match(lintJob, /uses: \.\/\.github\/workflows\/lint\.yml/);
    assert.match(
      lintJob,
      new RegExp('run-codemod: \\$\\{\\{ needs\\.checks\\.outputs\\.run-all == \'true\' \\|\\| '
        + 'needs\\.checks\\.outputs\\.test-codemod == \'true\' \\}\\}'),
    );
  });

  it('runs the suite of the core job only when the codemod scope changed', async() => {
    const lint = await readFile(LINT, 'utf8');
    const step = blockFrom(lint, /^\s+- name: Codemod tests\s*$/);

    assert.match(step, /if: inputs\.run-codemod/, 'the step of the core job must be gated');
    assert.match(step, /npm run test --prefix codemod/);
  });

  it('keeps the matrix job on the same gate, with the Node versions the package supports', async() => {
    const lint = await readFile(LINT, 'utf8');
    const job = blockFrom(lint, /^ {2}codemod:\s*$/);
    const engines = JSON.parse(await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8')).engines.node;

    assert.match(job, /if: inputs\.run-codemod/);
    assert.match(job, /os: windows-/);
    assert.equal(engines, '>=20');
    assert.match(job, /node: 20\b/);
    assert.match(job, /node: 24\b/);
  });
});

describe('the develop pipeline', { skip: !IN_MONOREPO && !existsSync(DEVELOP) }, () => {
  it('runs the codemod suite after a merge, on the scope flag or a manual dispatch, and not on every run-all', async() => {
    const job = blockFrom(await readFile(DEVELOP, 'utf8'), /^ {2}codemod:\s*$/);

    assert.notEqual(job, '', 'develop.yml has no `codemod` job');
    assert.match(job, /needs: \[ checks \]/);
    assert.match(job, /needs\.checks\.outputs\.test-codemod == 'true'/);
    assert.match(job, /github\.event_name == 'workflow_dispatch'/,
      'a dispatch skips the path filter and leaves every flag empty');
    assert.doesNotMatch(job, /run-all/,
      'run-all is true on every develop push, which would run four runners each time');
    assert.match(job, /pnpm install --filter @handsontable\/codemod --ignore-scripts --frozen-lockfile/);
    assert.match(job, /npm run test --prefix codemod/);
  });

  it('is advisory: a red suite cannot fail the Develop run or hold the experimental publish', async() => {
    const develop = await readFile(DEVELOP, 'utf8');
    const job = blockFrom(develop, /^ {2}codemod:\s*$/);

    assert.match(job, /^ {4}continue-on-error: true$/m, 'the job must be continue-on-error at job level');
    assert.match(job, /name: Say that the codemod suite is red[\s\S]*if: \$\{\{ failure\(\) \}\}[\s\S]*::warning/,
      'a red suite must stay visible as an annotation');
    assert.doesNotMatch(develop.replace(job, ''), /needs:.*\bcodemod\b/,
      'no other job may wait for the codemod job');
  });

  it('runs the legs of the pull request path plus the Linux leg of .nvmrc, Windows included', async() => {
    const develop = blockFrom(await readFile(DEVELOP, 'utf8'), /^ {2}codemod:\s*$/);
    const lint = blockFrom(await readFile(LINT, 'utf8'), /^ {2}codemod:\s*$/);
    const nvmrc = (await readFile(NVMRC, 'utf8')).trim();
    const expected = new Set([...legsOf(lint), `ubuntu|${nvmrc}`]);

    assert.deepEqual([...legsOf(develop)].sort(), [...expected].sort());
    assert.ok([...legsOf(develop)].some(leg => leg.startsWith('windows|')), 'no Windows leg');
  });
});
