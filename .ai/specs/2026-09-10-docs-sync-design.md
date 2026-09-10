# Docs content sync: develop to the live prod-docs branch (DEV-1780)

Status: implemented on branch feature/DEV-1780_Docs-content-sync-workflow (2026-09-10); the schedule is disabled until rollout step 1 completes.
Tracker: DEV-1780.

## Goal

A daily GitHub Actions workflow that finds documentation content merged to `develop`,
decides which of it applies to the released version, and opens (or refreshes) one
pull request against the live `prod-docs/<major>.<minor>` branch. Humans review and
merge the pull request. Merging deploys, because `docs-production.yml` runs on every
push to `prod-docs/**`.

The workflow is code in this repository, testable with `node --test`, runnable locally
in dry-run mode, and readable by the whole team. The LLM is a component with one narrow
job, not the driver.

## Why the previous attempt failed

The first iteration was a Claude Code routine driven by a long prompt. Its output
(PR #12646, 31 commits, 7 conflicts) shows the failure mode:

- `develop` documents the *next* version. A blind "sync everything under `docs/`"
  carries unreleased feature guides, future migration pages, and changelog edits for
  unreleased entries onto the released branch.
- The routine resolved every conflict by taking the incoming side, which imported
  more `develop` drift. Modify/delete conflicts (pages that do not exist on prod) were
  "deferred to prod deletions", silently dropping content.
- One batch of 31 commits accumulated weeks of drift. Conflicts scale with batch size.
- The routine's logic lived in a prompt outside the repository. Nobody could test it,
  diff it, or run it locally.

The mechanics (git, `gh`) were never the hard part. Deciding *what applies to the
released version* is, and that is the only place an LLM is needed.

## Scope

In scope:

- Squash-merged commits on `develop` whose changed files are **all** under the
  content paths (see [Content paths](#content-paths)).
- The latest `prod-docs/<major>.<minor>` branch as the single target.
- One sync branch and one open pull request per target branch.
- LLM classification of each candidate: applies to the released version, or not.

Out of scope, deliberately:

- Docs tooling changes (`docs/src`, `docs/scripts`, `astro.config.mjs`,
  `docs/package.json`, `docs/tests`, `docs/cloudflare`, `docs/deploy`). These keep
  going to prod by hand, as today.
- Commits that mix content with anything else. A content change may depend on the
  tooling change shipped beside it, so the tool does not split commits. Mixed commits
  are listed in the pull request for a human to port.
- Feature work. Any commit touching `handsontable/`, `wrappers/`, or `.changelogs/`
  describes behavior that ships in the next release. It is mixed by definition and
  never a candidate.
- LLM conflict resolution. Conflicting cherry-picks are skipped and listed. Revisit
  after two weeks of measured conflict rate.
- Older `prod-docs/*` branches. Only the highest version receives syncs.
- Forward-porting from a prod-docs branch to `develop`.

## Architecture

Three pieces:

1. `.github/workflows/docs-sync.yml`: schedule, secrets, checkout, one script call,
   step summary.
2. `.github/scripts/docs-sync.mjs`: the CLI entry point, with the pipeline stages
   inlined in one top-level `try`/`catch`/`finally`. The pure pieces of each stage
   live in modules under `.github/scripts/lib/docs-sync/`. No third-party
   dependencies; `fetch` for LiteLLM (in `llm.mjs`), `gh` for GitHub (in
   `github.mjs`).
3. `.github/scripts/lib/docs-sync/prompt.md`: the classification prompt, versioned
   with the code. Its content hash is part of the decision cache key.

Everything the LLM does not decide is deterministic and unit-tested.

## Workflow

```yaml
on:
  schedule:
    - cron: '0 6 * * 1-5'      # 06:00 UTC, weekdays
  workflow_dispatch:
    inputs:
      dry_run:  { type: boolean, default: true }
      target:   { type: string, description: 'prod-docs/<major>.<minor>; blank = latest' }
permissions: {}
concurrency:
  group: docs-sync
  cancel-in-progress: false
```

Steps:

1. Mint a GitHub App token with `actions/create-github-app-token` from
   `RELEASE_APP_CLIENT_ID` / `RELEASE_APP_PRIVATE_KEY` (the app `publish.yml` already
   uses to open release pull requests). The built-in `GITHUB_TOKEN` is unsuitable:
   pull requests it opens do not trigger `pull_request` workflows, so the sync pull
   request would get no docs lint, no build, and no Cloudflare preview.
2. `actions/checkout` with `fetch-depth: 0` and `persist-credentials: false`; the
   script sets the push URL with the app token itself.
3. `pnpm install --frozen-lockfile` for the docs lint step (root install; `docs/`
   is a workspace member).
4. `node .github/scripts/docs-sync.mjs` with env `LITELLM_BASE_URL`,
   `LITELLM_API_KEY`, `DOCS_SYNC_MODEL`, `DOCS_SYNC_REVIEWERS`, `GH_TOKEN` (app
   token), `DRY_RUN`, `TARGET`.
5. The script writes its plan and outcome to `$GITHUB_STEP_SUMMARY` in every mode.

The workflow does not need the fork/Dependabot guard: it never runs on
`pull_request`.

## Pipeline

### Stage 1: resolve the target

- `git ls-remote --heads origin 'prod-docs/*'`, keep names matching
  `^prod-docs/\d+\.\d+$` (this drops `prod-docs/latest`), sort by semver, take the
  highest. `TARGET` input overrides.
- `RELEASED_VERSION` = `handsontable/package.json` `version` on the target branch.
- `BASE` = `git merge-base origin/develop origin/<target>`.

### Stage 2: collect candidates

```
git log --no-merges --reverse --format='%H%x00%s' origin/<target>..origin/develop -- <content paths>
```

Keep commits whose subject ends with `(#<n>)`; the PR number is the identity used
everywhere below. Commits without it are direct pushes and are listed under
"skipped: no pull request number".

`--no-merges` keeps out `Merge release/X.Y.Z to develop` merge commits, whose content
already reached prod through the release cut.

### Stage 3: deterministic filters

Applied in this order. Each rejection records a reason that appears in the pull
request body.

1. **Already on prod.** A candidate is done when any of these hold:
   - `git cherry origin/<target> origin/develop <BASE>` marks it `-` (identical
     patch-id).
   - Any commit on `<BASE>..origin/<target>` has `(#<n>)` in its subject or body,
     or `cherry picked from commit <sha>` in its body. This catches hand-made
     cherry-pick pull requests (squash-merged, so patch-ids differ) and the tool's
     own earlier merged pull requests (`cherry-pick -x` writes the trailer, and the
     squash body carries it).
2. **Content-only.** Every changed file must match the content paths. Anything else
   makes the commit **mixed**; it is skipped and listed with the categories it
   touched (`source`, `tooling`, `agent docs`, `other`), so the human porting it
   knows what they are looking at.
3. **Version-scoped pages.** Skip when the commit touches
   `docs/content/guides/upgrade-and-migration/migrating-from-<a>-to-<b>/` with
   `<b>` above `RELEASED_VERSION`'s `<major>.<minor>`, or
   `changelog-<N>/` with `<N>` above the released major. These pages exist for a
   version the target does not have.
4. **Author override.** Labels on the source pull request win over everything after
   this point: `docs-sync: skip` excludes, `docs-sync: include` includes without
   asking the LLM. Both labels are created by the tool if missing.

A pull request lookup that 404s is recorded and the candidate is listed as having no
resolvable pull request (see Stage 2); if every lookup this run 404s and none
succeeds, the run fails outright instead of continuing, since a mass 404 usually
means the token cannot read pull requests rather than that every candidate's `(#n)`
is foreign.

Measured on 2026-09-10 against `prod-docs/18.1` (73 develop commits touching
`docs/content` since the merge base): 51 source-mixed, 4 tooling-mixed, 1 agent-docs
mixed, 18 content-only; 3 of the 18 are already on prod by pull request reference.
So a typical daily run classifies zero to three commits.

### Stage 4: LLM classification

One request per surviving candidate. Input:

- The pull request title and body (body truncated at 4 KB).
- The changed file list and the unified diff of content files, capped at 60 KB.
  Larger diffs are truncated with a marker; the prompt tells the model to answer
  `unsure` when the visible part is not enough.
- `RELEASED_VERSION` and the target branch name.
- What is new on `develop` and absent from the target: every pending entry under
  `.changelogs/` on `develop`, plus `CHANGELOG.md` sections for versions above
  `RELEASED_VERSION`. This is the exact list of features the released docs must not
  describe.
- The question: does this change apply to documentation of `RELEASED_VERSION`, or
  does it describe, link to, or depend on something released later?

Output, enforced with `response_format: { type: 'json_object' }` and parsed
defensively:

```json
{ "decision": "include" | "exclude" | "unsure", "reason": "one sentence" }
```

Rules:

- `temperature: 0`. Model from `DOCS_SYNC_MODEL` (a Claude model exposed by the
  LiteLLM proxy; the exact name is set in the workflow env).
- Malformed or missing JSON is `unsure`. `unsure` is never applied; it is listed for
  a human with the reason.
- Three attempts with backoff on network or 5xx errors. If classification still
  fails for any candidate, the run fails and mutates nothing. An unclassified set is
  not safe to apply, and a loud failure is better than a partial pull request.
- Decisions are cached in the pull request body state block (see Stage 7) keyed by
  `sha + sha256(prompt.md)`. A rerun reclassifies only new commits. Changing the
  prompt invalidates the cache. `unsure` decisions are never cached: the cache lives
  only in an open pull request's body, so a run that opens no pull request
  reclassifies every `unsure` candidate again next time, rather than freezing a
  one-off model uncertainty (or a synthetic `--no-llm` answer) into a state block
  that outlives the run that produced it.
- Known traps the prompt names explicitly: `menuTag: new|updated` frontmatter edits
  that advertise develop-only content (see the #12858 revert), sidebar entries for
  pages the target lacks, links to `migrating-from-*` guides above the target, and
  version strings in prose.

### Stage 5: apply

- Sync branch: `docs-sync/<target with / replaced by ->`, e.g.
  `docs-sync/prod-docs-18.1`.
- The hold triggers on foreign commits alone, checked right after Stage 3 and
  before Stage 4 classifies anything: if the sync branch exists and any commit on
  it has a *committer* other than the app bot user (cherry-picks keep the original
  author, so the author field says nothing), the run leaves the branch alone. The
  model is not called while held -- every candidate that would otherwise have gone
  to the classifier is instead listed under "skipped: needs a human decision" with
  a reason naming the hold, so the step summary still carries the full plan. When a
  pull request is already open, its sticky comment is refreshed with that same
  plan; a human has started resolving something on the branch, and force-pushing
  would destroy that work.
- Otherwise reset the branch to `origin/<target>` and apply included commits, oldest
  first, with `git cherry-pick -x <sha>`.
- On conflict: `git cherry-pick --abort`, record the commit under "skipped:
  conflict" with the conflicting file list, continue. Modify/delete conflicts count
  as conflicts; the tool never deletes or recreates a page to make a pick apply.
- Push with `--force-with-lease`.

Small daily batches are the primary conflict control. The measured backlog shows
most content commits are one or two files.

### Stage 6: verify

`npm run docs:lint --prefix docs` on the resulting tree. A lint failure fails the run
before any push, with the captured output (capped at 8 KB) written to the step
summary along with the remedy: fix the source pull request on `develop`, or label
it `docs-sync: skip` to keep it out of the sync. The full docs build, the plugin
tests, and the Cloudflare preview run on the pull request itself through
`docs.yml`, which the app token makes possible.

### Stage 7: pull request

- One open pull request per target. Title:
  `Sync docs content from develop to <target>`.
- Body sections, always all present, "none" when empty:
  - Included (sha, subject, pull request, author)
  - Skipped: conflict (with files)
  - Skipped: needs a human decision (`unsure`, with the model's reason)
  - Excluded by the classifier (with reason, so the team can audit it)
  - Skipped: mixed (with categories)
  - Skipped: already on prod
  - Run metadata: `develop@sha`, `<target>@sha`, prompt hash, timestamp. The
    model name is logged to the run's step summary instead, because the pull
    request body carries no AI attribution and a real model name would count
    as one.
  - `[skip changelog]` outside any HTML comment
  - `<!-- docs-sync-state {json} -->`: the decision cache
- Labels `docs-sync`, `docs-sync: skip`, and `docs-sync: include` are created (if
  missing) on every non-dry run, before the included/conflicts/close branching
  below -- so they exist to label with even on a run that pushes nothing. Reviewers
  from an optional `DOCS_SYNC_REVIEWERS` env value.
- Included empty and conflicts non-empty: nothing to push, but the conflicts are
  real content this run could not port. Update the open pull request's body (or log
  the count when none is open); never push, and never close a pull request while a
  conflict is still unresolved.
- Zero included commits, zero conflicts, and no open pull request: exit 0 with a
  summary line. Zero included, zero conflicts, and an open pull request: close it
  with a comment (everything it carried was merged or ported by hand).
- Target rollover: after a release cut creates a new `prod-docs/<x>.<y>`, the tool
  closes its own open `docs-sync` pull requests whose base is any other branch, with
  a comment naming the new target. Unmerged content is re-evaluated against the new
  branch on the same run. An explicit `TARGET` never triggers this cleanup, and it
  must name an existing `prod-docs/<major>.<minor>` branch.
- Merge is manual, "Squash and merge", as for every pull request here.
- No AI attribution anywhere: commits keep their original author and message plus
  the `-x` trailer, branch names carry no `claude/` prefix, the body carries no
  "generated with" footer.

## Content paths

```
docs/content/**
docs/public/img/**
```

`docs/content/api/*` is gitignored (generated from JSDoc at build time), so it never
appears in a commit and needs no rule. `docs/public/img/` holds the images guides
reference as `/img/...`; a content pull request that adds a screenshot is still
content-only.

## Configuration

Workflow env and secrets:

| Name | Kind | Purpose |
|---|---|---|
| `LITELLM_BASE_URL` | secret | OpenAI-compatible base, `/v1/chat/completions` is appended |
| `LITELLM_API_KEY` | secret | bearer token |
| `DOCS_SYNC_MODEL` | env | model name on the proxy |
| `RELEASE_APP_CLIENT_ID`, `RELEASE_APP_PRIVATE_KEY` | secret (existing) | app token for push and `gh` |
| `DOCS_SYNC_REVIEWERS` | env, optional | comma-separated GitHub logins |

Script flags for local use: `--dry-run`, `--target <branch>`, `--no-llm` (treats every
candidate as `unsure`, for testing the git side without a key), `--skip-lint`
(skips Stage 6, for a machine without the docs toolchain installed),
`--repo-dir <path>` (checkout to operate on; defaults to the repository root),
`--gh-bin <path>` (the `gh` binary to invoke; overridable for tests).

## Testing

`node --test` under `.github/scripts/__tests__/`, wired into the root `test:tooling`
script like the other gates. One file per module, plus the CLI and the workflow:

- `docs-sync-paths.test.mjs`: content-path matching and mixed categorization.
- `docs-sync-target.test.mjs`: target branch selection and version parsing.
- `docs-sync-candidates.test.mjs`: PR-number extraction and dedup by
  subject/body/trailer against fixture commit lists.
- `docs-sync-version-scope.test.mjs`: the version-scoped page rule.
- `docs-sync-classify.test.mjs`: prompt assembly (truncation, feature list) and
  response parsing (valid, malformed, missing field).
- `docs-sync-llm.test.mjs`: the LiteLLM client, mocked with a fake `fetch`.
- `docs-sync-pr-body.test.mjs`: body rendering with every section, state block
  round-trip, `[skip changelog]` outside comments, model/subject text sanitized so
  it cannot forge a second state block.
- `docs-sync-git-apply.test.mjs`: a throwaway repository in a temp dir (a clean
  pick, a conflict, an empty pick, a modify/delete conflict, the foreign-commit
  check), asserting the recorded outcome.
- `docs-sync-github.test.mjs`: the `gh` adapter against an injectable runner.
- `docs-sync-log.test.mjs`: the push-token scrubber.
- `docs-sync-cli.test.mjs`: the whole script against a throwaway origin and clone,
  with a fake `gh` that records argv and answers from canned JSON -- the
  deterministic-filters path, the include/skip label overrides, `--dry-run`, a
  conflicting cherry-pick, and the foreign-commit hold.
- `docs-sync-workflow.test.mjs`: the workflow uses the app token, `permissions: {}`,
  no `GITHUB_TOKEN` (and no bare `github.token`) push, `workflow_dispatch` defaults
  to dry-run, and the schedule trigger is landed commented out.

## Rollout

1. Land the workflow with `schedule` commented out. Run `workflow_dispatch` with
   `dry_run: true` against the current backlog (18 candidates) and review the
   classifier's decisions with the docs team. Tune the prompt until the decisions
   match; each tuning is a normal pull request.
2. Enable the schedule. Review the first real pull request closely.
3. After two weeks, read the run summaries: conflict rate, `unsure` rate, wrong
   `include`/`exclude` calls. Decide then whether LLM conflict resolution or a
   different cadence is worth adding.

## Team policy that comes with it

- Documentation fixes land on `develop` first. The tool ports them. Hand cherry-picks
  to `prod-docs/*` stay allowed for tooling and for urgent fixes; the dedup rules
  recognize them as long as the squash subject or body keeps the `(#<n>)` reference,
  which GitHub adds by default.
- This also removes the branch-cut loss recorded on 2026-07-29 (32 docs fixes on
  `prod-docs/17.1` that never reached `prod-docs/18.0`): when `develop` is the source
  of truth, the next cut starts complete.
- Authors who know a content pull request must not reach the released docs add
  `docs-sync: skip` before or after merge.

## Documentation updates required by this change

- `docs/AGENTS.md`: replace the "cherry-pick by hand" guidance with the sync flow,
  the two labels, and the content-only rule.
- Root `AGENTS.md` monorepo gotchas: one entry on the app-token requirement for
  bot pull requests and on the `docs-sync/*` branch ownership (never commit to it by
  hand unless you intend to pause the bot).
- `.ai/STACK.md` or `.ai/README.md`: the LiteLLM dependency and where the prompt
  lives.

## Open items

- Confirm the `RELEASE_APP` installation has `contents: write` and
  `pull_requests: write` on this repository. It needs no bot login: the tool
  identifies its own commits by the fixed committer
  `docs-sync[bot]@users.noreply.github.com`, which is what the "human commits
  present" check in Stage 5 compares against.
- Pick the model name on the LiteLLM proxy and confirm it accepts
  `response_format: json_object`.
- Decide who is on `DOCS_SYNC_REVIEWERS`.
- A durable per-source-PR marker for `exclude` decisions (for example, a label the
  bot applies to the source pull request) would let an `exclude` survive a run that
  opens no sync pull request, the same way `docs-sync: skip` already does by hand.
  Not in v1.
