import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

// The example-lockfile surface (DEV-2714). Report-only, and a different file from the gate, so
// the gate's pinned occurrence count stays untouched.
const REPORT_SCRIPT = '.github/scripts/example-lockfile-report.mjs';
const EXAMPLE_CLEAN_SCRIPT = 'examples/scripts/clean-subpackages.mjs';

// One gate after each of the three version bumps, and one before each of the three
// release commits -- every step in between is a chance to touch the lockfile, and
// `git add .` would commit it.
const EXPECTED_GATES = 6;

// `stable-merge` resolves a pnpm-lock.yaml merge conflict by re-running the resolver,
// which legitimately rewrites the file, so those two calls are deliberately ungated.
// `stable-publish` adds a third kind: the docs branch gains a real devDependency
// (`@handsontable/angular-wrapper`), so its lockfile MUST change or every docs deploy
// dies on ERR_PNPM_OUTDATED_LOCKFILE -- `docs-production.yml` installs with
// `--frozen-lockfile`. That call cannot use the float gate, which demands zero change;
// it asserts the intended entry landed and that no other package lost its resolved
// `name@version` identity instead. It is also confined to a
// `prod-docs/*` branch that never reaches a registry.
// Pinning the total means a NEW `--lockfile-only` site cannot appear unnoticed.
const EXPECTED_LOCKFILE_ONLY_CALLS = 6;

// The two steps that have to agree about the docs outcomes. Named once, because the
// whole point of the assertions below is that a step id reaches BOTH of them.
const DOCS_PUSH_STEP = 'Commit and push docs branch';
const DOCS_RESULT_STEP = 'Set docs result output';

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
 * One job's source, so an assertion about `stable-publish` cannot be satisfied by a step
 * that happens to sit in a neighboring job.
 *
 * `offset` is what keeps a failure message pointing at the real file: line numbers from
 * `steps()` are relative to whatever source it was handed.
 *
 * @param {string} source Workflow source.
 * @param {string} name The job key, as written at two-space indent.
 * @returns {{source: string, offset: number}} The job's lines and its start line.
 */
function job(source, name) {
  const lines = source.split('\n');
  const start = lines.indexOf(`  ${name}:`);

  assert.notEqual(start, -1, `publish.yml: no \`${name}:\` job`);

  const end = lines.findIndex((line, index) => index > start && /^ {2}\S/.test(line));

  return {
    source: lines.slice(start, end === -1 ? lines.length : end).join('\n'),
    offset: start,
  };
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
    + 'pnpm-lock.yaml merge conflict in `stable-merge` and legitimately rewrite the file; '
    + 'one adds the docs devDependency on the `prod-docs/*` branch, and is checked for '
    + 'that entry landing with no other package losing its resolved identity. A new one '
    + 'needs a deliberate decision about which kind it is '
    + '(DEV-2667).'
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

// Every docs step in `stable-publish` is `continue-on-error`, so a failure there sets
// `conclusion` to success and survives only in `outcome`. Two steps have to read it:
// `docs-commit`, which must not push a branch assembled from failed steps, and
// `docs-result`, which is the only place an operator learns which step broke. Carrying
// an `id:` is what marks a step's result as meant to be read -- `Purge jsDelivr CDN
// cache` deliberately has none, because the CDN cannot affect what the branch contains.
test('every docs step outcome reaches the push gate and the summary', () => {
  const { source, offset } = job(read('.github/workflows/publish.yml'), 'stable-publish');
  const all = steps(source);
  const gate = all.find(step => step.name === DOCS_PUSH_STEP);
  const summary = all.find(step => step.name === DOCS_RESULT_STEP);

  assert.ok(gate, `publish.yml: no "${DOCS_PUSH_STEP}" step in \`stable-publish\``);
  assert.ok(summary, `publish.yml: no "${DOCS_RESULT_STEP}" step in \`stable-publish\``);

  // `docs-result` is not `continue-on-error`, so the filter drops it by itself; the gate
  // is excluded by name, because it cannot gate itself.
  const reported = all.filter(step => step !== gate
    && /\n\s+continue-on-error:\s*true/.test(step.body)
    && /\n\s+id:\s*\S+/.test(step.body));

  assert.ok(
    reported.length > 0,
    'publish.yml: found no reportable docs steps, so the job slice above is wrong'
  );

  for (const step of reported) {
    const [, id] = /\n\s+id:\s*(\S+)/.exec(step.body);
    const line = step.line + offset;

    assert.ok(
      gate.body.includes(`steps.${id}.outcome == 'success'`),
      `publish.yml:${line}: \`${id}\` is continue-on-error, so its failure lives `
      + `only in \`outcome\`. "${DOCS_PUSH_STEP}" must require `
      + `\`steps.${id}.outcome == 'success'\`, or a docs branch assembled from a failed `
      + 'step gets pushed -- and that push triggers docs-production.yml.'
    );

    assert.ok(
      summary.body.includes(`${id}:\${{ steps.${id}.outcome }}`),
      `publish.yml:${line}: \`${id}\` is missing from "${DOCS_RESULT_STEP}"'s `
      + 'OUTCOMES, so a failure there names no cause in the job summary and the release '
      + `looks green. Add \`${id}:\${{ steps.${id}.outcome }}\`.`
    );
  }
});

// A `run:` block is its own shell, so `$VERSION` is empty in any step that does not set
// it. That does not break loudly -- it WEAKENS whatever is built on it. In
// `docs-lockfile`, `grep "specifier: ~${VERSION}"` degrades from "the version this
// release intends" to "any tilde specifier at all", which a stale entry left behind by
// an earlier partial failure passes.
test('every step that reads $VERSION also sets it', () => {
  for (const step of steps(read('.github/workflows/publish.yml'))) {
    const body = withoutComments(step.body);

    if (!/\$\{?VERSION\b/.test(body)) {
      continue;
    }

    assert.ok(
      /\n\s+VERSION[=:]/.test(body),
      `publish.yml:${step.line}: this step reads \`$VERSION\` but never sets it. Each `
      + '`run:` block is a separate shell, so it expands empty and every check built on '
      + 'it silently passes. Assign it from `needs.<job>.outputs.version`, or hand it in '
      + 'through `env:`.'
    );
  }
});

// The nine tracked example lockfiles (`examples/next/<category>/<framework>/package-lock.json`)
// are the same failure mode one layer out, and they had the same cause: `examples:install`
// deleted them and reinstalled, so a release cut re-resolved 104 `latest` leaf specifiers and
// committed the result through `first-rc-build`'s bare `git add .`. The float gate cannot see
// them -- it hardcodes `pnpm-lock.yaml`. With the lockfile present npm honours the locked edge
// even for a dist-tag spec, so keeping the file is what makes the install reproducible; deleting
// it is the whole defect. `--reset-lockfiles` is the deliberate refresh, run by hand and landed
// on `develop` where CI and `npm audit` see it (DEV-2714).
test('the examples clean step keeps the lockfiles unless asked', () => {
  const source = read(EXAMPLE_CLEAN_SCRIPT);
  const removals = [...source.matchAll(/^(\s*)removes\.push\(([^\n]*)$/gm)];

  assert.ok(removals.length > 0, `${EXAMPLE_CLEAN_SCRIPT}: no \`removes.push(...)\` calls found`);

  const isLockfile = ([, , call]) => /package-lock\.json|pnpm-lock\.yaml/.test(call);
  const lockfileRemovals = removals.filter(isLockfile);

  assert.equal(
    lockfileRemovals.length,
    2,
    `${EXAMPLE_CLEAN_SCRIPT}: expected the \`package-lock.json\` and \`pnpm-lock.yaml\` `
    + `removals, found ${lockfileRemovals.length}.`
  );

  // Guarded means indented deeper than the removals that run unconditionally, which is what
  // sitting inside the `if (resetLockfiles)` block looks like. Text-based on purpose: the
  // regression to catch is a future edit moving these two lines back out of the block.
  const baseline = Math.min(...removals.filter(match => !isLockfile(match)).map(([, indent]) => indent.length));

  for (const [, indent, call] of lockfileRemovals) {
    assert.ok(
      indent.length > baseline,
      `${EXAMPLE_CLEAN_SCRIPT}: \`${call.trim()}\` is not inside the \`--reset-lockfiles\` `
      + 'guard. Deleting a tracked example lockfile on every install makes the next install '
      + 're-resolve 104 `latest` specifiers, and `first-rc-build` commits whatever comes out '
      + '(DEV-2714).'
    );
  }

  assert.match(
    source,
    /resetLockfiles\s*=\s*args\.includes\('--reset-lockfiles'\)/,
    `${EXAMPLE_CLEAN_SCRIPT}: the \`--reset-lockfiles\` opt-in is gone, so nothing can refresh `
    + 'the lockfiles on purpose (DEV-2714).'
  );
});

// Without a version the script cleans the `examples` workspace root and nothing under it, so a
// refresh that forgets the version argument would report success with all nine framework
// lockfiles untouched.
test('the examples clean step refuses --reset-lockfiles without a version', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'example-clean-noversion-'));

  try {
    assert.throws(
      () => execFileSync('node', [path.join(root, EXAMPLE_CLEAN_SCRIPT), '--reset-lockfiles'], {
        cwd: fixture,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
      error => {
        assert.equal(error.status, 1);
        assert.match(error.stderr, /needs the examples version/);

        return true;
      },
      `${EXAMPLE_CLEAN_SCRIPT}: \`--reset-lockfiles\` with no version must fail loudly, not clean `
      + 'the workspace root and report nothing (DEV-2714).'
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

// Report-only, and it must stay that way: these trees build documentation demos and visual-test
// fixtures and ship in no bundle, so a transitive bump there must not red a release candidate.
// Its position is load-bearing in one direction -- it has to sit ABOVE the float gate, because
// 'every release commit is preceded by the gate' asserts the gate is the step IMMEDIATELY before
// `Commit and push`.
test('first-rc-build reports the example lockfiles before the gate and the commit', () => {
  const { source, offset } = job(read('.github/workflows/publish.yml'), 'first-rc-build');
  const all = steps(source);
  const report = all.find(step => step.body.includes(REPORT_SCRIPT));

  assert.ok(
    report,
    'publish.yml: `first-rc-build` installs the examples and commits them with `git add .`, so '
    + `it must run ${REPORT_SCRIPT}. Without it a re-resolved example lockfile reaches the `
    + 'release branch with nobody told (DEV-2714).'
  );

  // The job carries two gate calls -- one after the version bump, one before the commit. The
  // second is the one the report has to stay above, so look backwards from the commit.
  const commit = all.findIndex(step => step.name === COMMIT_STEP);

  assert.notEqual(commit, -1, 'publish.yml: `first-rc-build` lost its `Commit and push` step');

  const gate = all.findLastIndex((step, index) => index < commit && step.body.includes(GATE));

  assert.notEqual(gate, -1, 'publish.yml: `first-rc-build` lost the gate before its commit');

  assert.ok(
    all.indexOf(report) < gate && gate < commit,
    `publish.yml:${offset + report.line}: expected the example lockfile report, then the float `
    + 'gate, then the commit. The gate has to be the step immediately before `Commit and push`, '
    + 'so this one goes above it, never between the two.'
  );

  // Reaches the step's own keys only. A comment block sits at the same indentation as the `- `
  // line, so `steps()` closes the current step on it and drops it: a gate path written in a
  // comment ABOVE this step is invisible here. 'the gate is not quietly dropped from a site' is
  // the backstop for that, because it counts raw occurrences across the whole file.
  assert.equal(
    report.body.includes(GATE),
    false,
    `publish.yml:${offset + report.line}: this step names ${GATE}, which inflates the raw `
    + `occurrence count that "the gate is not quietly dropped from a site" pins at `
    + `${EXPECTED_GATES}. Call it "the float gate" in prose instead.`
  );
});

// The report runs between a build and a `git add .` in the one job that cuts the first RC. A
// crash there would take the release down over files that ship nowhere, so exiting 0 is part of
// the contract, not an implementation detail -- and `execFileSync` throws on any other code.
test('the example lockfile report never fails the release', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'example-lockfile-report-'));

  try {
    const gitInFixture = args => execFileSync('git', args, { cwd: fixture, encoding: 'utf8' });
    const tracked = path.join('examples', 'next', 'docs', 'js', 'package-lock.json');
    const ignoredLeaf = path.join('examples', 'next', 'docs', 'js', 'demo', 'package-lock.json');
    const uncovered = path.join('examples', 'next', 'docs', 'svelte', 'package-lock.json');
    const write = (rel, contents) => {
      mkdirSync(path.dirname(path.join(fixture, rel)), { recursive: true });
      writeFileSync(path.join(fixture, rel), contents);
    };

    gitInFixture(['init', '--quiet', '--initial-branch', 'main']);
    gitInFixture(['config', 'user.email', 'test@example.com']);
    gitInFixture(['config', 'user.name', 'Test']);
    write(path.join('examples', '.gitignore'), '*/docs/js/*/package-lock.json\n');
    write(tracked, '{"lockfileVersion":3}\n');
    gitInFixture(['add', '.']);
    gitInFixture(['commit', '--quiet', '-m', 'fixture']);

    write(tracked, '{"lockfileVersion":3,"floated":true}\n');
    // Ignored, so `git add .` cannot commit it and the report must stay quiet about it.
    write(ignoredLeaf, '{}\n');
    // At a path no ignore pattern reaches, which is what `git add .` really would commit.
    write(uncovered, '{}\n');

    const summaryPath = path.join(fixture, 'summary.md');
    const stdout = execFileSync('node', [path.join(root, REPORT_SCRIPT), fixture], {
      cwd: fixture,
      encoding: 'utf8',
      // The audit leg needs a registry; the reporting shape is what this asserts.
      env: { ...process.env, SKIP_AUDIT: '1', GITHUB_STEP_SUMMARY: summaryPath },
    });

    for (const output of [stdout, readFileSync(summaryPath, 'utf8')]) {
      assert.match(output, /examples\/next\/docs\/js\/package-lock\.json/);
      assert.match(output, /examples\/next\/docs\/svelte\/package-lock\.json/);
      assert.doesNotMatch(output, /examples\/next\/docs\/js\/demo\/package-lock\.json/);
    }
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

// The degradation the script's docstring promises, and the one a release is most likely to hit
// through a bad argument: no `HEAD` to diff against. Every `git diff` fails, and the report must
// neither throw between the build and the commit nor claim the lockfiles are unchanged -- a
// false all-clear is worse than no report, because it is the thing an operator would trust.
test('the example lockfile report survives a checkout it cannot diff', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'example-lockfile-report-nohead-'));

  try {
    // Initialized but never committed, so `HEAD` does not resolve.
    execFileSync('git', ['init', '--quiet', '--initial-branch', 'main'], { cwd: fixture, encoding: 'utf8' });

    const stdout = execFileSync('node', [path.join(root, REPORT_SCRIPT), fixture], {
      cwd: fixture,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, SKIP_AUDIT: '1' },
    });

    assert.match(stdout, /Could not determine/);
    // The all-clear sentence specifically, not the word "unchanged" -- the failure message uses
    // it too, in "not as unchanged".
    assert.doesNotMatch(stdout, /lockfiles are unchanged/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
