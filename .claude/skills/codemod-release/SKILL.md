---
name: codemod-release
description: Use when asked to cut, prepare, or publish a release of the migration codemod (`@handsontable/codemod`, the `codemod/` package) - "cut a codemod release", "release the codemod", "bump the codemod version", "codemod changelog". Covers choosing the version, the changelog section, the checks to run, and the release PR. Not for Handsontable releases.
---

The codemod has its own semantic version and is released on its own schedule, from `develop`. A release is one pull
request that bumps the version and dates the changelog. It never rides a Handsontable release, and a Handsontable
release never bumps it (the package is outside the root `workspaces` and the version-bump list on purpose).

## 1. Decide whether there is anything to release

The last release is the last commit that changed the `version` line of `codemod/package.json`. Before the first
release that commit is the one that added the file, so the range then starts at its parent and holds everything in
`codemod/`. No tag is involved. Set `ref` to the branch you release from (here `origin/develop`):

```bash
git fetch origin
ref=origin/develop
added=$(git log --diff-filter=A --format=%H "$ref" -- codemod/package.json | tail -1)
last=$(git log -1 --format=%H -G'^  "version":' "$ref" -- codemod/package.json)
if [ -z "$last" ]; then
  echo "codemod/ is not on $ref yet: nothing to release"
else
  if [ "$last" = "$added" ]; then base="$added^"; else base="$last"; fi
  git log --oneline "$base".."$ref" -- codemod
fi
```

No output, or the "nothing to release" line, means stop and say so. While the codemod is still on a feature branch,
`ref=origin/develop` prints `codemod/ is not on origin/develop yet: nothing to release`, and `ref=HEAD` lists every
commit of the package, ending with the commit that added the package skeleton (both checked on the branch of the first
pull request).

## 2. Choose the version

Read the commits and the `## [Unreleased]` section of `codemod/CHANGELOG.md`, then apply the rules at the top of that
file:

| Change | Bump |
|---|---|
| Fix to a rule, a message, or the printer; no rule goes from report to rewrite | patch |
| New migration manifest, new rule, new flag, or a rule that starts to rewrite | minor |
| Removed or renamed flag, changed exit code, or a rule that stops rewriting | major |

A manifest that flips from `"status": "draft"` to `"released"` is a new migration: minor. Flip it only in the release
that ships together with that Handsontable version, and only when its migration guide is final.

## 3. Prepare the release PR

Branch from `origin/develop` in a worktree. Then:

1. Set `version` in `codemod/package.json`. Touch no other `package.json`.
2. In `codemod/CHANGELOG.md`, rename `## [Unreleased]` to `## [<version>] – <YYYY-MM-DD>` and add a new empty
   `## [Unreleased]` above it. Every user-visible commit since the last release has a line under `Added`, `Changed`,
   `Fixed`, or `Removed`. Write the lines for someone who runs the tool, not for someone who reads its source.
3. If the README "Supported migrations" table or the rule counts changed, `codemod/test/readme.test.mjs` already
   forced the update in the PR that changed them. Check that it still passes.

Run, and paste the result lines into the PR:

```bash
npm run lint --prefix codemod
npm run test --prefix codemod
node codemod/bin/handsontable-codemod.mjs migrate --list --from 17 --to 18.1
```

Then check the package contents in a copy outside the monorepo (`npm pack --dry-run --json`): only `bin`, `src`, the
manifests, `rules/**`, `custom/**`, `README.md`, and `CHANGELOG.md` may be listed.

Open the PR with the `pr-creation` skill. Title: `<task ID>: Release @handsontable/codemod <version>`. The root
`.changelogs/` gets no entry: that directory is the Handsontable changelog, and the codemod has its own file.

## 4. After the merge

Publishing to npm is not wired yet. Until the publish workflow exists, a release ends at the merged PR: do not create a
tag, a GitHub Release, or an `npm publish` by hand. The record of a release is the merged release PR (the commit that
changed the `version` line, which step 1 reads) and `codemod/CHANGELOG.md`. Two traps for whoever wires publishing:

- **Never create a GitHub Release for the codemod.** `publish.yml` listens to `release: created` and reads the
  Handsontable version from the release name, so a codemod release would start a Handsontable release cut, and it
  would take the "Latest" badge. When publishing is wired, mark the release with a git tag `codemod-v<version>` on
  the release commit, and keep step 1 reading the `version` line, which works with and without the tag.
- The prerelease dist-tag of this repository is `experimental`, not `next`.
