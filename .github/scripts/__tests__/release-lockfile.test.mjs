import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// A release must ship the exact dependency set CI already tested. `pnpm-lock.yaml`
// records `specifier: workspace:^` for every in-repo dependency and never a package's
// own version, so bumping the version can never legitimately change it. Any difference
// during a cut means the specifiers re-resolved -- and 15 of them are `latest`, which
// re-resolves to whatever the registry serves that day.
//
// That is DEV-2667: the 18.1.0-rc1 cut deleted the lockfile and reinstalled, floating
// 509 packages (core-js 3.37/3.49 -> 3.50, browserslist 4.28.2 -> 4.28.8, hyperformula
// 3.3.0 -> 3.4.0). Every leg consuming a production bundle went red and stayed red for
// six release candidates.
//
// Nothing downstream catches this on its own: a floated lockfile is internally
// consistent, so `pnpm install --frozen-lockfile` installs it happily. Only
// `lockfile-float-gate.mjs` does. This asserts the SHAPE of that arrangement, the way
// `fork-guards.test.mjs` does for the fork/Dependabot token guards -- the failure mode
// is a future edit deleting the lockfile again, or adding a cut path without the gate,
// and nobody noticing until a release is unpublishable.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

const GATE = '.github/scripts/lockfile-float-gate.mjs';
const BUMP_STEP = 'Update lockfile for version change';
const COMMIT_STEP = 'Commit and push';

// One gate after each of the three version bumps, and one before each of the three
// release commits -- every step in between is a chance to touch the lockfile, and
// `git add .` would commit it.
const EXPECTED_GATES = 6;

// `stable-merge` resolves a pnpm-lock.yaml merge conflict by re-running the resolver,
// which legitimately rewrites the file, so those two calls are deliberately ungated.
// Pinning the total means a NEW `--lockfile-only` site cannot appear unnoticed.
const EXPECTED_LOCKFILE_ONLY_CALLS = 5;

/**
 * Every YAML file that GitHub Actions executes: workflows and the composite actions
 * they call. Composite actions already run `pnpm install`, so a `--force` added there
 * would be just as damaging and is invisible to a workflows-only scan.
 *
 * @returns {Array<{rel: string, source: string}>} Each file's repo-relative path and contents.
 */
function actionsYaml() {
  const dirs = ['.github/workflows', '.github/actions'];
  const files = [];

  for (const dir of dirs) {
    for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true, recursive: true })) {
      if (!entry.isFile() || !/\.ya?ml$/.test(entry.name)) {
        continue;
      }

      // `parentPath` is absolute; make it relative so failures name a checked-in path.
      const rel = path.relative(root, path.join(entry.parentPath, entry.name));

      files.push({ rel, source: readFileSync(path.join(root, rel), 'utf8') });
    }
  }

  return files;
}

/**
 * Strip `#` comments so a ban cannot fire on prose that merely names the banned thing.
 *
 * Only handles whole-line and trailing comments, which is all these workflows contain.
 * A `#` inside a quoted string would be over-stripped; none of the assertions below
 * depend on quoted text.
 *
 * @param {string} source YAML source.
 * @returns {string} The source with comments removed.
 */
function withoutComments(source) {
  return source.split('\n').map(line => line.replace(/#.*$/, '')).join('\n');
}

/**
 * Split a workflow into its steps, text-based -- no YAML parser is a dependency of the
 * repo root, and adding one to assert a step-ordering shape is not worth it.
 *
 * A step runs from a `      - ` line until the next one, or until any line indented
 * less than the step body (the end of the job's `steps:` list). Bounding it at the job
 * matters: an unbounded forward scan would let a gate in a LATER job satisfy an
 * assertion about this one.
 *
 * @param {string} source Workflow source.
 * @returns {Array<{line: number, name: string, body: string}>} Steps in file order.
 */
function steps(source) {
  const lines = source.split('\n');
  const found = [];
  let current = null;

  const close = () => {
    if (current) {
      // The name may sit on the `- ` line or on any following key (`- uses:` first).
      const name = /(?:^|\n)\s*-?\s*name:\s*(.+)$/m.exec(current.body);

      current.name = name ? name[1].trim() : '';
      found.push(current);
      current = null;
    }
  };

  lines.forEach((line, index) => {
    if (/^ {6}- /.test(line)) {
      close();
      current = { line: index + 1, body: line };

    } else if (current) {
      // Blank lines and deeper indentation belong to the step; anything shallower
      // ends the job's step list.
      if (line.trim() === '' || /^ {7,}/.test(line)) {
        current.body += `\n${line}`;
      } else {
        close();
      }
    }
  });

  close();

  return found;
}

/**
 * The arguments of every `pnpm install` in a file.
 *
 * Scoped to each command's own logical line -- through backslash continuations, but
 * stopping at the end of the command. A window-based scan instead matches any nearby
 * flag, so a perfectly ordinary `rm -f` or `grep -f` on the next line of the same
 * `run:` block reads as `pnpm install -f` and fails the release.
 *
 * @param {string} source YAML source, comments already stripped.
 * @returns {string[]} One argument string per `pnpm install` found.
 */
function installArgs(source) {
  return [...source.matchAll(/pnpm\s+install((?:[^\n\\]|\\\r?\n|\\)*)/g)].map(([, args]) => args);
}

test('no workflow or composite action reinstalls with --force', () => {
  for (const { rel, source } of actionsYaml()) {
    assert.equal(
      installArgs(withoutComments(source)).some(args => /(?:^|\s)(?:--force|-f)(?![\w-])/.test(args)),
      false,
      `${rel}: \`pnpm install --force\` (or \`-f\`) re-resolves dependencies instead of `
      + 'installing the committed lockfile. Install with the lockfile as committed (DEV-2667).'
    );
  }
});

test('no workflow or composite action deletes the lockfile', () => {
  // The rc1 float happened because the lockfile was DELETED and the reinstall then
  // resolved from scratch -- deletion is the cause, not the reinstall flag. Ban the
  // helper, the npm script that wraps it, and a direct removal.
  const deletions = [
    [/cleanNodeModules/, 'cleanNodeModules() removes pnpm-lock.yaml'],
    [/clean:node_modules/, '`npm run clean:node_modules` wraps cleanNodeModules()'],
    [/\b(?:rm|rimraf|unlink)\b[^\n]*pnpm-lock\.yaml/, 'this removes pnpm-lock.yaml directly'],
  ];

  for (const { rel, source } of actionsYaml()) {
    const clean = withoutComments(source);

    for (const [pattern, why] of deletions) {
      assert.equal(
        pattern.test(clean),
        false,
        `${rel}: ${why}, so the next install re-resolves every specifier -- 15 of them are `
        + '`latest` (DEV-2667). It is a local developer script, not a CI step.'
      );
    }
  }
});

test('the gate is not quietly dropped from a site', () => {
  const found = read('.github/workflows/publish.yml').split(GATE).length - 1;

  assert.equal(
    found,
    EXPECTED_GATES,
    `publish.yml: expected ${EXPECTED_GATES} calls to ${GATE}, found ${found}. Removing one `
    + 'lets a floated lockfile reach a release commit unnoticed (DEV-2667).'
  );
});

test('no new --lockfile-only site appears ungated', () => {
  const source = read('.github/workflows/publish.yml');
  const found = source.split('pnpm install --lockfile-only').length - 1;

  assert.equal(
    found,
    EXPECTED_LOCKFILE_ONLY_CALLS,
    `publish.yml: expected ${EXPECTED_LOCKFILE_ONLY_CALLS} \`pnpm install --lockfile-only\` `
    + `calls, found ${found}. Three follow a version bump and are gated; two resolve a `
    + 'pnpm-lock.yaml merge conflict in `stable-merge` and legitimately rewrite the file. '
    + 'A new one needs a deliberate decision about which kind it is (DEV-2667).'
  );
});

test('every version bump is followed by the gate', () => {
  const all = steps(read('.github/workflows/publish.yml'));
  const bumps = all.filter(step => step.name === BUMP_STEP);

  assert.equal(bumps.length, 3, `publish.yml: expected 3 "${BUMP_STEP}" steps, found ${bumps.length}`);

  for (const bump of bumps) {
    const next = all[all.indexOf(bump) + 1];

    assert.equal(
      next?.body.includes(GATE),
      true,
      `publish.yml:${bump.line}: the version bump must be followed immediately by the `
      + 'lockfile gate. Without it a floated lockfile ships silently, because a floated '
      + 'lockfile is internally consistent and passes `--frozen-lockfile` (DEV-2667).'
    );
  }
});

test('every release commit is preceded by the gate', () => {
  const all = steps(read('.github/workflows/publish.yml'));
  const commits = all.filter(step => step.name === COMMIT_STEP);

  assert.equal(commits.length, 3, `publish.yml: expected 3 "${COMMIT_STEP}" steps, found ${commits.length}`);

  for (const commit of commits) {
    const previous = all[all.indexOf(commit) - 1];

    assert.equal(
      previous?.body.includes(GATE),
      true,
      `publish.yml:${commit.line}: this step runs \`git add .\`, so it must be preceded by `
      + 'the lockfile gate -- otherwise anything the build touched reaches the release '
      + 'commit unchecked (DEV-2667).'
    );
  }
});
