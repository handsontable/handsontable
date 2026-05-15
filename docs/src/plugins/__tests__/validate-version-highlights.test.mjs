import assert from 'node:assert/strict';
import test from 'node:test';
import { validateHighlightFile } from '../../../scripts/validate-version-highlights.mjs';
import { validateAllHighlightFiles } from '../../../scripts/validate-version-highlights.mjs';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const valid = {
  version: '17.0',
  highlighted: [
    {
      prNumber: 11950,
      tagline: 'New Theme API',
      whyItMatters: 'Replaces legacy stylesheet.',
    },
  ],
};

test('accepts a minimal valid file', () => {
  const errors = validateHighlightFile('17.0.json', valid, new Set([11950]));
  assert.deepEqual(errors, []);
});

test('rejects file when filename does not match version', () => {
  const errors = validateHighlightFile('16.0.json', valid, new Set([11950]));
  assert.match(errors[0], /filename 16\.0 does not match version 17\.0/);
});

test('rejects missing whyItMatters', () => {
  const bad = { version: '17.0', highlighted: [{ prNumber: 11950, tagline: 'x' }] };
  const errors = validateHighlightFile('17.0.json', bad, new Set([11950]));
  assert.match(errors.join('\n'), /whyItMatters is required/);
});

test('rejects partial code pair (codeBefore without codeAfter)', () => {
  const bad = {
    version: '17.0',
    highlighted: [
      { prNumber: 11950, tagline: 'x', whyItMatters: 'y', codeBefore: 'a' },
    ],
  };
  const errors = validateHighlightFile('17.0.json', bad, new Set([11950]));
  assert.match(errors.join('\n'), /codeBefore and codeAfter must both be present/);
});

test('rejects PR number not present in changelog entries', () => {
  const errors = validateHighlightFile('17.0.json', valid, new Set([99999]));
  assert.match(errors.join('\n'), /PR 11950 not found in changelog entries/);
});

test('rejects more than 5 highlighted entries', () => {
  const tooMany = {
    version: '17.0',
    highlighted: Array.from({ length: 6 }, (_, i) => ({
      prNumber: 11950 + i,
      tagline: `t${i}`,
      whyItMatters: 'why',
    })),
  };
  const knownPrs = new Set([11950, 11951, 11952, 11953, 11954, 11955]);
  const errors = validateHighlightFile('17.0.json', tooMany, knownPrs);
  assert.match(errors.join('\n'), /at most 5 highlighted entries/);
});

test('rejects migrationAnchor that does not start with /migration-from-', () => {
  const bad = {
    version: '17.0',
    highlighted: [
      { prNumber: 11950, tagline: 'x', whyItMatters: 'y', migrationAnchor: '/foo' },
    ],
  };
  const errors = validateHighlightFile('17.0.json', bad, new Set([11950]));
  assert.match(errors.join('\n'), /migrationAnchor must start with \/migration-from-/);
});

test('validateAllHighlightFiles aggregates errors across files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vh-'));
  try {
    writeFileSync(
      join(dir, '17.0.json'),
      JSON.stringify({
        version: '17.0',
        highlighted: [{ prNumber: 1, tagline: 't', whyItMatters: 'y' }],
      }),
    );
    writeFileSync(
      join(dir, '16.0.json'),
      JSON.stringify({ version: '15.0', highlighted: [] }),
    );

    const errors = validateAllHighlightFiles(dir, new Set([1]));
    assert.match(errors.join('\n'), /16\.0\.json/);
    assert.equal(errors.filter((e) => e.startsWith('17.0.json')).length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
