import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

const root = repoRoot();
const read = relPath => readFileSync(path.join(root, relPath), 'utf8');

const workflow = read('.github/workflows/docs-production.yml');
const deployScripts = [
  'docs/deploy/build_current_version.sh',
  'docs/deploy/build_previous_versions.sh',
];
const IMAGE = 'ghcr.io/handsontable/handsontable/handsontable-documentation';

test('the docs image is tagged and pushed to ghcr.io', () => {
  assert.match(workflow, /^ {2}GHA_DOCKER_TAG: ghcr\.io\/\$\{\{ github\.repository \}\}\/handsontable-documentation$/m);
});

test('the workflow logs in to the registry it pushes to', () => {
  const logins = [...workflow.matchAll(/docker login\b.*$/gm)].map(([line]) => line);

  assert.equal(logins.length, 1);
  assert.match(logins[0], /\bghcr\.io\s*$/);
});

test('the deploy scripts pull the image the workflow pushes', () => {
  for (const relPath of deployScripts) {
    const images = [...read(relPath).matchAll(/docker create "([^:"]+):/g)].map(([, image]) => image);

    assert.ok(images.length > 0, `${relPath} creates no docs image container`);
    images.forEach(image => assert.equal(image, IMAGE, relPath));
  }
});

test('nothing uses the legacy docker.pkg.github.com registry', () => {
  [path.join('.github/workflows', 'docs-production.yml'), ...deployScripts].forEach((relPath) => {
    assert.doesNotMatch(read(relPath), /docker\.pkg\.github\.com/, relPath);
  });
});
