import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildScaffold,
  generateHighlightsScaffold,
  parseMajorMinor,
} from '../../../scripts/generate-version-highlights.mjs';
import { validateHighlightFile } from '../../../scripts/validate-version-highlights.mjs';

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'vh-gen-'));

  try {
    await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('creates a minimal scaffold for a stable version', async () => {
  await withTempDir(async (dir) => {
    const result = await generateHighlightsScaffold('18.1.0', dir);

    assert.equal(result.status, 'created');
    assert.equal(
      readFileSync(join(dir, '18.1.json'), 'utf8'),
      '{\n  "version": "18.1",\n  "highlighted": []\n}\n',
    );
  });
});

test('strips the -rc suffix when deriving major.minor', async () => {
  await withTempDir(async (dir) => {
    const rc1 = await generateHighlightsScaffold('18.1.0-rc1', dir);

    assert.equal(rc1.status, 'created');
    assert.equal(JSON.parse(readFileSync(join(dir, '18.1.json'), 'utf8')).version, '18.1');
  });

  await withTempDir(async (dir) => {
    const rc12 = await generateHighlightsScaffold('18.1.0-rc12', dir);

    assert.equal(rc12.status, 'created');
    assert.equal(JSON.parse(readFileSync(join(dir, '18.1.json'), 'utf8')).version, '18.1');
  });
});

test('does not overwrite an existing file (idempotent across RCs)', async () => {
  await withTempDir(async (dir) => {
    const customContent = JSON.stringify({
      version: '18.1',
      highlighted: [{ prNumber: 1, tagline: 't', whyItMatters: 'y' }],
    });

    writeFileSync(join(dir, '18.1.json'), customContent, 'utf8');

    const result = await generateHighlightsScaffold('18.1.0-rc2', dir);

    assert.equal(result.status, 'exists');
    assert.equal(readFileSync(join(dir, '18.1.json'), 'utf8'), customContent);
  });
});

test('does not overwrite an existing file on a patch release', async () => {
  await withTempDir(async (dir) => {
    const customContent = JSON.stringify({ version: '18.0', highlighted: [] });

    writeFileSync(join(dir, '18.0.json'), customContent, 'utf8');

    const result = await generateHighlightsScaffold('18.0.2', dir);

    assert.equal(result.status, 'exists');
    assert.equal(readFileSync(join(dir, '18.0.json'), 'utf8'), customContent);
  });
});

test('rejects invalid version strings', async () => {
  await withTempDir(async (dir) => {
    for (const invalid of ['18.1', '18.1.0-beta1', 'x.y.z', '', undefined]) {
      await assert.rejects(() => generateHighlightsScaffold(invalid, dir));
    }
  });
});

test('parseMajorMinor returns null for invalid input', () => {
  assert.equal(parseMajorMinor('18.1'), null);
  assert.equal(parseMajorMinor('18.1.0-beta1'), null);
  assert.equal(parseMajorMinor(undefined), null);
});

test('the generated scaffold passes the highlights validator', () => {
  const scaffold = JSON.parse(buildScaffold('18.1'));
  const errors = validateHighlightFile('18.1.json', scaffold, new Set());

  assert.deepEqual(errors, []);
});
