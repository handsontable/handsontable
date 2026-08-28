import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// A release cut must ship the exact dependency set develop tested. `pnpm-lock.yaml`
// records `workspace:^` for every in-repo dependency and never a package's own
// version, so bumping the version can never legitimately change it. Any lockfile
// change during a cut therefore means the `^` ranges re-resolved -- and the release
// then builds against dependencies no CI run ever saw.
//
// That is DEV-2667: the 18.1.0-rc1 cut deleted the lockfile and reinstalled with
// `pnpm install --force`, floating 509 packages (core-js 3.37/3.49 -> 3.50,
// browserslist 4.28.2 -> 4.28.8, hyperformula 3.3.0 -> 3.4.0). Every leg that
// consumes a production bundle went red and stayed red for six release candidates.
//
// Nothing downstream catches this on its own: a floated lockfile is internally
// consistent, so `pnpm install --frozen-lockfile` installs it happily. Only the
// explicit guard does. This asserts the SHAPE of that arrangement, the way
// `fork-guards.test.mjs` does for the fork/Dependabot token guards -- the failure
// mode is a future edit reintroducing a clean-and-reinstall, or adding a cut path
// without the guard, and nobody noticing until a release is unpublishable.

const root = repoRoot();
const workflowsDir = path.join(root, '.github/workflows');
const read = rel => readFileSync(path.join(root, rel), 'utf8');

const BUMP_STEP = '- name: Update lockfile for version change';
const GUARD_STEP = '- name: Verify the lockfile did not float';

// The three jobs in publish.yml that bump the version and commit the result.
const EXPECTED_BUMP_SITES = 3;

// One guard per bump site, plus a second pass in `first-rc-build` right before its
// commit -- that job builds every package and installs the examples in between.
const EXPECTED_GUARDS = 4;

test('no workflow reinstalls with --force, which recreates the lockfile', () => {
  for (const file of readdirSync(workflowsDir).filter(f => f.endsWith('.yml'))) {
    const source = read(`.github/workflows/${file}`);

    assert.equal(
      /pnpm install\b[^\n]*\s--force\b/.test(source),
      false,
      `${file}: \`pnpm install --force\` recreates pnpm-lock.yaml from the registry, `
      + 'floating every `^` range away from the develop-tested set (DEV-2667). '
      + 'Install with the committed lockfile instead.'
    );
  }
});

test('no workflow deletes the lockfile via cleanNodeModules()', () => {
  for (const file of readdirSync(workflowsDir).filter(f => f.endsWith('.yml'))) {
    const source = read(`.github/workflows/${file}`);

    assert.equal(
      source.includes('cleanNodeModules'),
      false,
      `${file}: cleanNodeModules() removes pnpm-lock.yaml, so the next install `
      + 're-resolves every dependency (DEV-2667). It is a local developer script '
      + '(`scripts/clean-node-modules.mjs`), not a CI step.'
    );
  }
});

test('the guard is not quietly dropped from a site', () => {
  const source = read('.github/workflows/publish.yml');
  const found = source.split(GUARD_STEP).length - 1;

  assert.equal(
    found,
    EXPECTED_GUARDS,
    `publish.yml: expected ${EXPECTED_GUARDS} "${GUARD_STEP.slice(8)}" steps, found ${found}. `
    + 'Removing one lets a floated lockfile reach a release commit unnoticed (DEV-2667).'
  );
});

test('every version-bump site is followed by the lockfile-float guard', () => {
  const lines = read('.github/workflows/publish.yml').split('\n');
  const bumpSites = [];

  lines.forEach((line, index) => {
    if (line.includes(BUMP_STEP)) {
      bumpSites.push(index);
    }
  });

  assert.equal(
    bumpSites.length,
    EXPECTED_BUMP_SITES,
    `publish.yml: expected ${EXPECTED_BUMP_SITES} "${BUMP_STEP.slice(8)}" steps, found `
    + `${bumpSites.length}. A cut path was added or removed -- update EXPECTED_BUMP_SITES `
    + 'once the new site carries the guard too.'
  );

  for (const at of bumpSites) {
    // The guard is the very next named step, so stop at the one after it: reading
    // further would let a guard on a later site pass for this one.
    const next = lines
      .slice(at + 1)
      .findIndex(line => /^\s*-\s+name:/.test(line));

    assert.notEqual(next, -1, `publish.yml:${at + 1}: no step follows the version bump`);
    assert.equal(
      lines[at + 1 + next].includes(GUARD_STEP),
      true,
      `publish.yml:${at + 1}: the version bump must be followed immediately by `
      + `"${GUARD_STEP.slice(8)}". Without it a floated lockfile ships silently, because `
      + 'a floated lockfile is internally consistent and passes `--frozen-lockfile` (DEV-2667).'
    );
  }
});
