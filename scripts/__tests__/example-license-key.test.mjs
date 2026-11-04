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
const RETIRED_KEY = /non-commercial-and-evaluation|NON_COMMERCIAL_LICENSE/;

// Files that may still name the retired key, each with the reason.
const ALLOWED = [
  [/^docs\/content\/guides\/upgrade-and-migration\//, 'migration guides and changelogs describe the history'],
  [
    /^docs\/content\/guides\/getting-started\/license-key\/license-key\.md$/,
    'quotes the missing-key message the core prints today',
  ],
  [/^docs\/scripts\/generate-sample-workbook\.mjs$/, 'a headless tool, not an example, that needs a working grid'],
  [/^docs\/scripts\/__tests__\//, 'tests for the docs scripts'],
];

const files = execFileSync('git', ['ls-files', '-z', '--', ...SCANNED], { cwd: ROOT, encoding: 'utf8' })
  .split('\0')
  .filter(file => file && !/\.(png|jpe?g|gif|webp|svg|ico|woff2?|xlsx|pdf)$/i.test(file));

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
