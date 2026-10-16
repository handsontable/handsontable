import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// GitHub moves `ubuntu-latest` to a new Ubuntu release on its own schedule, over
// weeks, so a job on the floating label lands on either image during the
// rollout. The visual goldens are rendered on the runner itself, and a baseline
// seeded on one image and compared on the other fails at random. The image is
// therefore pinned, and bumping it is a deliberate change: the develop push
// re-seeds the core and docs goldens (see `.ai/CI.md`).
//
// Browser caches are keyed on `runner.os`, which is `Linux` on every Ubuntu
// image. Playwright downloads Firefox and WebKit per distro release, so a cache
// saved on one image must not restore onto the next: each such key also carries
// the image name, read from `$ImageOS` through a step output (the `env` context
// does not see runner variables). The key detector is line-based: it covers
// `key:` and `restore-keys:` lines and their `runner.os` continuation lines.

const root = repoRoot();
const DIRECTORIES = ['.github/workflows', '.github/actions'];

const listYaml = directory => readdirSync(directory, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && /\.ya?ml$/.test(entry.name))
  .map(entry => path.join(entry.parentPath, entry.name));

const files = DIRECTORIES.flatMap(directory => listYaml(path.join(root, directory)));

test('finds the workflow and action files to check', () => {
  assert.ok(files.length > 20, `expected the workflow and action files, found ${files.length}`);
});

test('no workflow or action uses the floating ubuntu-latest label', () => {
  const offenders = files
    .filter(file => /\bubuntu-latest\b/.test(readFileSync(file, 'utf8')))
    .map(file => path.relative(root, file));

  assert.deepEqual(offenders, [], 'pin the runner image, e.g. `ubuntu-26.04`; see .ai/CI.md');
});

test('every cache key on runner.os also carries the runner image name', () => {
  const offenders = [];

  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
      if (line.includes('runner.os') && /\b(key|restore-keys):|^\s+\S+-\$\{\{ runner\.os \}\}-/.test(line) &&
          !line.includes('steps.runner-image.outputs.name')) {
        offenders.push(`${path.relative(root, file)}:${index + 1}`);
      }
    });
  }

  assert.deepEqual(offenders, [], 'add ${{ steps.runner-image.outputs.name }} after runner.os');
});

test('every use of the runner image output has its step declared earlier in the same job', () => {
  for (const file of files) {
    // Jobs sit at two spaces of indent under `jobs:`; a composite action is one chunk.
    for (const chunk of readFileSync(file, 'utf8').split(/^(?=  [A-Za-z0-9_-]+:\s*$)/m)) {
      const used = chunk.indexOf('steps.runner-image.outputs.name');

      if (used === -1) continue;

      const declared = chunk.indexOf('id: runner-image');

      assert.ok(declared !== -1 && declared < used,
        `${path.relative(root, file)}: a job uses the runner-image output without declaring the step first`);
    }
  }
});
