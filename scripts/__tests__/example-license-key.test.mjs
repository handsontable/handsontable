import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * The example sources, docs scripts, and READMEs carry no license key. A commented-out placeholder
 * marks where the key goes. The retired `non-commercial-and-evaluation` key, and the Angular wrapper
 * constant that holds it, must not come back.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCANNED = [
  'docs/content',
  'docs/scripts',
  'docs/src',
  'examples',
  'README.md',
  'wrappers/react-wrapper/README.md',
  'wrappers/vue3/README.md',
  'wrappers/angular-wrapper/README.md',
];
// Handsontable 18.x lowercases the key and also accepts the alias, so every spelling of both unlocks a
// grid there. 19.0 reads them as invalid, so a copied snippet would lock the grid.
const RETIRED_KEY = /non-commercial-and-evaluation|ht68e-1f2b7-47158-70b05-0842f|NON_COMMERCIAL_LICENSE/i;

// Files that may still name the retired key, each with the reason.
const ALLOWED = [
  [/^docs\/content\/guides\/upgrade-and-migration\//, 'migration guides and changelogs describe the history'],
  [
    /^docs\/content\/guides\/getting-started\/license-key\/license-key\.md$/,
    'says the retired key reads as invalid since 19.0',
  ],
];

const files = execFileSync('git', ['ls-files', '-z', '--', ...SCANNED], { cwd: ROOT, encoding: 'utf8' })
  .split('\0')
  .filter(file => file && !/\.(png|jpe?g|gif|webp|svg|ico|woff2?|xlsx|pdf)$/i.test(file));

test('the scan reads files under every scanned root and spots the retired key', () => {
  // Without this control a scan that read nothing, for example after a root is renamed, would pass the tests below.
  SCANNED.forEach((root) => {
    assert.ok(files.some(file => file === root || file.startsWith(`${root}/`)),
      `The scan found no file under ${root}; check SCANNED.`);
  });
  assert.ok(files.some(file => file.startsWith('examples/next/visual-tests/')),
    'The scan found no visual-test demo.');
  assert.ok(RETIRED_KEY.test('licenseKey: \'non-commercial-and-evaluation\''));
  assert.ok(RETIRED_KEY.test('useValue: { license: NON_COMMERCIAL_LICENSE }'));
  assert.ok(RETIRED_KEY.test('licenseKey: \'Non-Commercial-And-Evaluation\''));
  assert.ok(RETIRED_KEY.test('licenseKey: \'HT68E-1F2B7-47158-70B05-0842F\''));
});

test('every file the guard allows still names the retired key', () => {
  // A stale entry would let the key come back into that path unnoticed.
  const holdsKey = file => RETIRED_KEY.test(readFileSync(join(ROOT, file), 'utf8'));
  const stale = ALLOWED
    .filter(([pattern]) => !files.some(file => pattern.test(file) && holdsKey(file)))
    .map(([pattern]) => String(pattern));

  assert.deepEqual(stale, [], 'ALLOWED names paths that no longer hold the retired key. Remove them.');
});

test('no example or README names the retired non-commercial key', () => {
  const offenders = files
    .filter(file => !ALLOWED.some(([pattern]) => pattern.test(file)))
    .filter(file => RETIRED_KEY.test(readFileSync(join(ROOT, file), 'utf8')));

  assert.deepEqual(
    offenders,
    [],
    'Replace the key with the commented-out `licenseKey` placeholder (docs/AGENTS.md, 2.5).',
  );
});

test('a Vue template never holds the placeholder as a `//` comment inside a tag', () => {
  const offenders = files
    .filter(file => file.endsWith('.vue'))
    .filter(file => /^\s*\/\/ licenseKey=/m.test(readFileSync(join(ROOT, file), 'utf8')));

  assert.deepEqual(
    offenders,
    [],
    'A template tag cannot hold a comment. Put `<!-- license-key="..." -->` above the tag.',
  );
});
