import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// "One Playwright version across the monorepo — the catalog version and the CI
// container tag bump together, never apart" (pnpm-workspace.yaml). The pnpm
// catalog is the single source of truth and nothing else re-declares the
// version, so a bump that moves the catalog but not the container tag — a
// Dependabot PR does exactly this — ships an engine whose browsers are missing
// from the image, and every Playwright leg dies with "Executable doesn't exist
// at /ms-playwright/...". This guard turns that drift, and the version-carrying
// docs going stale, red in the tooling gate instead.

const root = repoRoot();
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const catalogMatch = read('pnpm-workspace.yaml')
  .match(/'@playwright\/test':\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$/m);
const catalogVersion = catalogMatch?.[1] ?? '<missing>';

test('the pnpm catalog pins an exact @playwright/test version', () => {
  assert.ok(
    catalogMatch,
    "pnpm-workspace.yaml must pin '@playwright/test' to an exact x.y.z version in the catalog"
  );
});

test('the e2e container image tag matches the catalog version', () => {
  assert.ok(
    read('.github/workflows/e2e.yml').includes(`image: mcr.microsoft.com/playwright:v${catalogVersion}-`),
    `e2e.yml must run the mcr.microsoft.com/playwright:v${catalogVersion}-* image — ` +
      'the catalog version and the container tag bump together, never apart'
  );
});

test('version-carrying docs match the catalog version', () => {
  const readme = read('tests/README.md');

  assert.ok(
    readme.includes(`'@playwright/test': ${catalogVersion}`),
    `tests/README.md quotes a catalog version other than ${catalogVersion}`
  );
  assert.ok(
    readme.includes(`playwright:v${catalogVersion}-`),
    `tests/README.md names a container tag other than v${catalogVersion}`
  );
  assert.ok(
    read('.ai/STACK.md').includes(`Playwright ${catalogVersion}`),
    `.ai/STACK.md lists a Playwright version other than ${catalogVersion}`
  );
});
