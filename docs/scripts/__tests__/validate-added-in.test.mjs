import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectAddedInEntries, validateAddedInEntries } from '../validate-added-in.mjs';
import { allowedVersions } from '../../src/lib/added-in.mjs';

function makeContentDir(pages) {
  const dir = mkdtempSync(join(tmpdir(), 'added-in-'));

  for (const [file, frontmatter] of Object.entries(pages)) {
    mkdirSync(join(dir, file, '..'), { recursive: true });
    writeFileSync(join(dir, file), `---\ntitle: Page\n${frontmatter}\n---\n\nBody.\n`, 'utf8');
  }

  return dir;
}

test('collectAddedInEntries finds only pages that declare the field, at any depth', () => {
  const dir = makeContentDir({
    'guides/a/a.md': 'addedIn: "17.0.0"',
    'guides/b/b.md': 'menuTag: new',
    'recipes/c/c.md': 'addedIn: 17.0',
    'guides/d/notes.txt': 'addedIn: "1.0.0"',
  });

  try {
    const entries = collectAddedInEntries(dir).sort((a, b) => a.file.localeCompare(b.file));

    assert.deepEqual(entries, [
      { file: 'guides/a/a.md', value: '17.0.0' },
      { file: 'recipes/c/c.md', value: 17 },
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('validateAddedInEntries passes released and next versions', () => {
  const allowed = allowedVersions(['17.0.0', '18.1.1']);
  const errors = validateAddedInEntries([
    { file: 'a.md', value: '17.0.0' },
    { file: 'b.md', value: '19.0.0' },
  ], allowed);

  assert.deepEqual(errors, []);
});

test('validateAddedInEntries names the file for a YAML float and for a never-released version', () => {
  const allowed = allowedVersions(['18.1.1']);
  const errors = validateAddedInEntries([
    { file: 'guides/x/x.md', value: 17 },
    { file: 'guides/y/y.md', value: '18.3.0' },
    { file: 'guides/z/z.md', value: '18.1.1' },
  ], allowed);

  assert.equal(errors.length, 2);
  assert.match(errors[0], /^guides\/x\/x\.md: addedIn must be a quoted/);
  assert.match(errors[1], /^guides\/y\/y\.md: addedIn 18\.3\.0 is not a released/);
});
