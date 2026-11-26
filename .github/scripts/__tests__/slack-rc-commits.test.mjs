import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCommitsSection, escapeMrkdwn, listCommits, MAX_SECTION_TEXT } from '../slack-rc-commits.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRIPT = path.join(ROOT, '.github/scripts/slack-rc-commits.mjs');
const REPO_URL = 'https://github.com/handsontable/handsontable';
const COMPARE_URL = `${REPO_URL}/compare/19.0.0-rc11...abc`;

const commit = i => ({
  sha: `${i}`.padStart(40, '0'),
  subject: `DEV-${1000 + i}: Fix a thing in the grid that needed a fix (#${14000 + i})`,
});

const section = commits => buildCommitsSection({
  prevTag: '19.0.0-rc11',
  commits,
  repoUrl: REPO_URL,
  compareUrl: COMPARE_URL,
});

test('lists every commit when the section fits', () => {
  const text = section([commit(1), commit(2)]);

  assert.equal(text, [
    '*Commits since `19.0.0-rc11`*',
    `• <${REPO_URL}/commit/${commit(1).sha}|${commit(1).subject}>`,
    `• <${REPO_URL}/commit/${commit(2).sha}|${commit(2).subject}>`,
  ].join('\n'));
});

test('caps the 57 commits of the 19.0.0-rc12 run under the Slack limit', () => {
  const commits = Array.from({ length: 57 }, (_, i) => commit(i));
  const full = `*Commits since \`19.0.0-rc11\`*\n${commits.map(({ sha, subject }) => `• <${REPO_URL}/commit/${sha}|${subject}>`).join('\n')}`;
  const text = section(commits);
  const shown = text.split('\n').filter(line => line.startsWith('• ')).length;

  assert.ok(full.length > MAX_SECTION_TEXT);
  assert.ok(text.length <= MAX_SECTION_TEXT, `section is ${text.length} characters`);
  assert.ok(shown > 0);
  assert.ok(text.endsWith(`\n…and ${57 - shown} more: <${COMPARE_URL}|see all changes>`));
  assert.ok(text.includes(commits[0].sha), 'keeps the newest commit');
});

test('shows as many commits as fit with the "more" line', () => {
  const commits = Array.from({ length: 57 }, (_, i) => commit(i));
  const text = section(commits);
  const shown = text.split('\n').filter(line => line.startsWith('• ')).length;
  const oneMore = `${text.split('\n…and')[0]}\n• <${REPO_URL}/commit/${commits[shown].sha}|${commits[shown].subject}>`
    + `\n…and ${57 - shown - 1} more: <${COMPARE_URL}|see all changes>`;

  assert.ok(oneMore.length > MAX_SECTION_TEXT);
});

test('counts the escaped subject against the limit', () => {
  const commits = Array.from({ length: 40 }, (_, i) => ({ sha: commit(i).sha, subject: '<&>'.repeat(20) }));
  const text = section(commits);

  assert.ok(text.length <= MAX_SECTION_TEXT, `section is ${text.length} characters`);
  assert.match(text, /\|&lt;&amp;&gt;/);
});

test('escapes the characters Slack mrkdwn reserves', () => {
  assert.equal(escapeMrkdwn('a <b> & c'), 'a &lt;b&gt; &amp; c');
});

test('says so when there are no commits or no previous tag', () => {
  assert.equal(section([]), '*Commits since `19.0.0-rc11`*\nNo commits found since `19.0.0-rc11`.');
  assert.equal(section(null), '*Commits since `19.0.0-rc11`*\nNo commits found since `19.0.0-rc11`.');
});

/**
 * Creates a repository whose release branch merges a branch with three commits after the
 * `rc1` tag, like the master merge into release/19.0.0 after 19.0.0-rc11.
 *
 * @returns {string} The repository path.
 */
function repoWithMerge() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slack-rc-commits-'));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'Test',
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
  };
  const git = (...args) => execFileSync('git', args, { cwd: dir, env, encoding: 'utf8' });

  git('init', '-q', '-b', 'release');
  git('commit', '-q', '--allow-empty', '-m', 'base');
  git('branch', 'master');
  git('commit', '-q', '--allow-empty', '-m', 'rc1');
  git('tag', 'rc1');
  git('checkout', '-q', 'master');
  ['old release 1', 'old release 2', 'old release 3'].forEach(message => git('commit', '-q', '--allow-empty', '-m', message));
  git('checkout', '-q', 'release');
  git('commit', '-q', '--allow-empty', '-m', 'fix on release');
  git('merge', '-q', '--no-ff', '-m', 'Merge master into release', 'master');
  git('commit', '-q', '--allow-empty', '-m', 'rc2');

  return dir;
}

test('lists a merged branch as its merge commit only', () => {
  const dir = repoWithMerge();
  const cwd = process.cwd();

  try {
    process.chdir(dir);

    assert.deepEqual(listCommits('rc1', 'HEAD').map(({ subject }) => subject), [
      'rc2',
      'Merge master into release',
      'fix on release',
    ]);
  } finally {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('prints the section from the command line', () => {
  const dir = repoWithMerge();

  try {
    const out = execFileSync('node', [SCRIPT, 'rc1', 'HEAD', REPO_URL], { cwd: dir, encoding: 'utf8' });
    const missing = execFileSync('node', [SCRIPT, 'rc0', 'HEAD', REPO_URL], { cwd: dir, encoding: 'utf8' });

    assert.match(out, /^\*Commits since `rc1`\*\n• <.+\|rc2>\n• <.+\|Merge master into release>\n• <.+\|fix on release>$/);
    assert.ok(!out.includes('old release'));
    assert.equal(missing, '*Commits since `rc0`*\nNo commits found since `rc0`.');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('every Slack step in publish.yml fails the job when Slack rejects the message', () => {
  const lines = fs.readFileSync(path.join(ROOT, '.github/workflows/publish.yml'), 'utf8').split('\n');
  const steps = lines.flatMap((line, i) => (line.includes('uses: slackapi/slack-github-action@') ? [i] : []));

  assert.equal(steps.length, 3, 'first RC, RC, and stable');
  steps.forEach((start) => {
    const step = lines.slice(start + 1, start + 8);
    const end = step.findIndex(line => /^\s{0,6}\S/.test(line));
    const inputs = end === -1 ? step : step.slice(0, end);

    assert.ok(inputs.some(line => line.trim() === 'errors: true'), `line ${start + 1}: no \`errors: true\``);
  });
});

test('the RC Slack message builds its commit list with slack-rc-commits.mjs', () => {
  const source = fs.readFileSync(path.join(ROOT, '.github/workflows/publish.yml'), 'utf8');

  assert.ok(source.includes('node .github/scripts/slack-rc-commits.mjs "$PREV_TAG" HEAD "$REPO_URL"'));
  assert.ok(!source.includes('--no-merges'), 'a hand-built commit list skips the Slack length cap');
});
