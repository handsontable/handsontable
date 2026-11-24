import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRelease, MAX_BODY_LENGTH, DOCS_CHANGELOG_URL } from '../release-notes.mjs';

const SCRIPTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const section = (fixed, added = 0) => [
  '### Added',
  '',
  ...Array.from({ length: added }, (_, i) => `- Added thing ${i}`),
  '',
  '### Fixed',
  '',
  ...Array.from({ length: fixed }, (_, i) => `- Fixed thing ${i} ${'x'.repeat(40)}`),
].join('\n');

test('returns a changelog under the limit unchanged', () => {
  const content = section(3, 2);

  assert.equal(buildRelease('19.0.0-rc1', 'release/19.0.0', content), `${content}\n`);
});

test('keeps a changelog of exactly the limit', () => {
  const content = 'x'.repeat(MAX_BODY_LENGTH);

  assert.equal(buildRelease('19.0.0-rc1', 'release/19.0.0', content), `${content}\n`);
});

test('shortens only the longest section of a changelog over the limit', () => {
  const content = section(3000, 7);
  const body = buildRelease('19.0.0-rc1', '19.0.0-rc1', content);

  assert.ok(content.length > MAX_BODY_LENGTH);
  assert.ok(body.length < 1000);
  assert.match(body, /- Added thing 6\n/);
  assert.match(body, /### Fixed\n\n3000 entries/);
  assert.doesNotMatch(body, /- Fixed thing/);
  assert.ok(body.includes('/blob/19.0.0-rc1/CHANGELOG.md'));
  assert.ok(body.includes(DOCS_CHANGELOG_URL));
});

test('shortens more sections until the body fits', () => {
  const content = section(2500, 9000);
  const body = buildRelease('19.0.0', '19.0.0', content);

  assert.ok(body.length <= MAX_BODY_LENGTH);
  assert.match(body, /### Added\n\n9000 entries/);
  assert.match(body, /### Fixed\n\n2500 entries/);
});

test('keeps the second section when shortening the first one is enough', () => {
  const content = section(1500, 9000);
  const body = buildRelease('19.0.0', '19.0.0', content);

  assert.match(body, /### Added\n\n9000 entries/);
  assert.match(body, /- Fixed thing 1499 /);
});

const withBreaking = (fixed, breaking) => [
  '### Added',
  '',
  '- Added thing',
  '',
  '### Fixed',
  '',
  ...Array.from({ length: fixed }, (_, i) => (i < breaking
    ? `- **Breaking change**: Fixed thing ${i} ${'x'.repeat(40)}`
    : `- Fixed thing ${i} ${'x'.repeat(40)}`)),
].join('\n');

test('a shortened section keeps its breaking changes', () => {
  const body = buildRelease('19.0.0', '19.0.0', withBreaking(3000, 16));

  assert.match(body, /### Fixed\n\n3000 entries, too many for a GitHub release\. Only the 16 breaking changes are listed here\./);
  assert.equal(body.match(/^- \*\*Breaking change\*\*: Fixed thing/gm).length, 16);
  assert.doesNotMatch(body, /^- Fixed thing/m);
  assert.match(body, /- Added thing\n/);
  assert.ok(body.includes('/blob/19.0.0/CHANGELOG.md'));
});

test('a shortened section drops its breaking changes when they do not fit, and says how many', () => {
  const body = buildRelease('19.0.0', '19.0.0', withBreaking(3000, 2500));

  assert.ok(body.length <= MAX_BODY_LENGTH);
  assert.match(body, /### Fixed\n\n3000 entries, too many for a GitHub release\. 2500 of them are breaking changes\./);
  assert.doesNotMatch(body, /^- \*\*Breaking change/m);
});

test('the CLI prints the section of the requested version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-'));
  const file = path.join(dir, 'CHANGELOG.md');

  fs.writeFileSync(file, `## [19.0.0-rc1] - 2026-11-16\n\n${section(2, 1)}\n\n## [18.1.2] - 2026-10-07\n\n### Fixed\n\n- Old\n`);

  const out = execFileSync('node', [path.join(SCRIPTS, 'release-notes.mjs'), '19.0.0-rc1', 'release/19.0.0', file], { encoding: 'utf8' });

  assert.match(out, /^### Added/);
  assert.match(out, /Fixed thing 1/);
  assert.doesNotMatch(out, /Old/);
});

test('update-docs-changelog reads CHANGELOG_FILE', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-changelog-'));
  const docs = path.join(dir, 'changelog.md');
  const content = path.join(dir, 'content.md');

  fs.writeFileSync(docs, '# Changelog\n\n[[toc]]\n\n## 18.1.2\n\nOld\n');
  fs.writeFileSync(content, '### Fixed\n\n- From the file\n');
  execFileSync('node', [path.join(SCRIPTS, 'update-docs-changelog.mjs'), '19.0.0-rc1', docs], {
    env: { ...process.env, CHANGELOG_FILE: content, CHANGELOG_CONTENT: '' },
  });

  const result = fs.readFileSync(docs, 'utf8');

  assert.match(result, /## 19\.0\.0-rc1/);
  assert.match(result, /^### Fixed$/m);
  assert.doesNotMatch(result, /^#### /m);
  assert.match(result, /- From the file/);
  assert.ok(result.indexOf('19.0.0-rc1') < result.indexOf('## 18.1.2'));
});
