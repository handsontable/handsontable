/**
 * Apply the `docs/content` changes a release introduced onto the checked-out
 * `prod-docs/<major.minor>` branch, layered under the branch's own edits.
 *
 * Why this exists (DEV-2925): on a PATCH release, `stable-publish` checks out the
 * existing prod-docs branch and inherits nothing from the release, so every
 * release-authored docs change stays frozen at the minor's cut -- the version
 * label, the per-major `changelog-<major>.md` section, and any `docs/content`
 * edit that rode in a mixed (source+docs) commit that `docs-sync` skips. On a
 * MINOR/MAJOR release the branch is cut fresh from the tag, so the delta computed
 * here is empty and this is a no-op. Making it unconditional turns the
 * release-type difference into one invariant with no branch conditional.
 *
 * Usage: node .github/scripts/sync-release-docs-delta.mjs <baseVersion> <headVersion>
 *
 * `<baseVersion>` is the version the prod-docs branch currently records
 * (`handsontable/package.json` on the checked-out branch). `<headVersion>` is the
 * release being published. The delta is `git diff <baseVersion>..<headVersion>`
 * restricted to `docs/content`, excluding the rolling `changelog/changelog.md`
 * (owned by `update-docs-changelog.mjs`) and the regenerated, gitignored
 * `content/api` reference. It is applied with `git apply --3way`, so a hunk that
 * conflicts with a prod-docs edit fails the run (fail-closed): the caller's
 * `continue-on-error` step then skips the push and names the step in the summary.
 */
import { execFileSync } from 'node:child_process';

// The checkout to operate on is the caller's working directory: in
// `stable-publish` that is the repo root with the prod-docs branch checked out,
// and a test points it at a fixture repo. Deliberately not derived from this
// file's location -- that would always target the real repo and be untestable.
const ROOT = process.cwd();

// The rolling changelog is written by `update-docs-changelog.mjs` in a sibling
// step, and `content/api` is regenerated (and gitignored). Excluding both keeps
// this delta from fighting steps that already own those trees.
const EXCLUDES = [
  ':(exclude)docs/content/guides/upgrade-and-migration/changelog/changelog.md',
  ':(exclude)docs/content/api',
];

/**
 * Run git in the checkout, optionally feeding a patch on stdin.
 *
 * @param {string[]} args Arguments after `git`.
 * @param {string} [input] stdin (the patch, for `git apply`).
 * @returns {string} Trimmed stdout.
 */
function git(args, input) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    input,
    // A whole docs/content delta can be large; never let a diff or an apply
    // report truncate against the default 1 MB stdio cap.
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

/**
 * Whether a ref resolves to a commit in this checkout.
 *
 * @param {string} ref
 * @returns {boolean}
 */
function commitExists(ref) {
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);

    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {number} Process exit code.
 */
function main() {
  const [baseVersion, headVersion] = process.argv.slice(2);

  if (!baseVersion || !headVersion) {
    process.stderr.write('Usage: node sync-release-docs-delta.mjs <baseVersion> <headVersion>\n');

    return 1;
  }

  // A fresh minor/major branch already carries the released version, so its base
  // equals its head: nothing to port. This is also what makes the step
  // idempotent -- once the version write lands `headVersion` on the branch, a
  // re-run computes an empty delta.
  if (baseVersion === headVersion) {
    process.stdout.write(`Docs branch already at ${headVersion}; no release delta to apply.\n`);

    return 0;
  }

  for (const ref of [baseVersion, headVersion]) {
    if (!commitExists(ref)) {
      process.stderr.write(`Error: ref "${ref}" does not resolve to a commit in this checkout.\n`);

      return 1;
    }
  }

  const range = `${baseVersion}..${headVersion}`;
  const files = git(['diff', '--name-only', range, '--', 'docs/content', ...EXCLUDES])
    .split('\n')
    .filter(Boolean);

  if (files.length === 0) {
    process.stdout.write(`No docs/content delta between ${baseVersion} and ${headVersion}.\n`);

    return 0;
  }

  // `--binary` so a change to an image, font, or other asset under docs/content
  // round-trips through `git apply` instead of emitting an unappliable
  // "Binary files differ" hunk that would fail the step (docs/content is text-only
  // today, so this is a guard, not a fix for a live case).
  const diff = git(['diff', '--binary', range, '--', 'docs/content', ...EXCLUDES]);

  try {
    // `--3way` merges each hunk against the branch's own copy, so a prod-docs
    // edit to an untouched part of a file survives; a genuine overlap conflicts
    // and throws. `--index` stages what applies so the commit step needs no
    // extra `git add` -- it also requires that every delta-touched file match
    // between the working tree and the index, which holds because the steps that
    // run before this one write only EXCLUDED trees (the rolling changelog and
    // `content/api`). Keeping those excludes is what keeps the index clean here.
    git(['apply', '--3way', '--index', '-'], diff);
  } catch (error) {
    const conflicts = git(['diff', '--name-only', '--diff-filter=U']).trim();

    process.stderr.write(`Error: could not cleanly apply the release docs delta ${range}.\n`);

    if (conflicts) {
      process.stderr.write(`Conflicted paths (a prod-docs edit overlaps a release change):\n${conflicts}\n`);
      process.stderr.write('Resolve them on the prod-docs branch by hand, then re-run this job.\n');
    } else {
      process.stderr.write(`${error.stderr ?? error.message ?? ''}\n`);
    }

    // Restore exactly the delta's own paths, so a partial apply or conflict
    // markers do not linger in the index/tree. The push is gated off this
    // failure, but a later step (or a relaxed gate) must never see half-applied
    // content. Scoped to `files`, so sibling steps' work is untouched.
    try {
      git(['checkout', 'HEAD', '--', ...files]);
    } catch {
      // Best effort: the branch is discarded on a failed run anyway.
    }

    return 1;
  }

  process.stdout.write(`Applied the release docs delta ${range}:\n${files.join('\n')}\n`);

  return 0;
}

process.exitCode = main();
