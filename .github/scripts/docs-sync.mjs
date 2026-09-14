#!/usr/bin/env node

/**
 * Port content-only documentation commits from `develop` to the live
 * `prod-docs/<major>.<minor>` branch through one bot-owned pull request.
 *
 * `develop` documents the NEXT release, so "sync everything under docs/" ships
 * unreleased feature guides to readers of the released version. This script
 * keeps every decision deterministic except one: for each content-only commit,
 * an LLM answers whether the change applies to the released version. The git
 * plumbing, the dedup, the version-scoped page rule, and the pull request
 * bookkeeping never depend on the model.
 *
 * Usage:
 *   node .github/scripts/docs-sync.mjs [--dry-run] [--target prod-docs/18.1]
 *                                      [--no-llm] [--skip-lint]
 *                                      [--repo-dir <path>] [--gh-bin <path>]
 *
 * Env: GH_TOKEN, GH_REPO, LITELLM_BASE_URL, LITELLM_API_KEY, DOCS_SYNC_MODEL,
 *      DOCS_SYNC_TEMPERATURE, DOCS_SYNC_JSON_MODE, DOCS_SYNC_REVIEWERS, DRY_RUN,
 *      TARGET, GITHUB_STEP_SUMMARY.
 */

import { execFileSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { repoRoot } from './lib/repo-root.mjs';
import { CONTENT_PREFIXES, categorize } from './lib/docs-sync/paths.mjs';
import { parseVersion, pickTarget, syncBranchFor } from './lib/docs-sync/target.mjs';
import {
  collectProdRefs, isAlreadyOnProd, parseCherryOutput, parseSquashSubject,
} from './lib/docs-sync/candidates.mjs';
import { versionScopedAbove } from './lib/docs-sync/version-scope.mjs';
import {
  buildUserMessage, cacheKey, collectUnreleased, loadPrompt, parseDecision, promptHash,
} from './lib/docs-sync/classify.mjs';
import { createClient } from './lib/docs-sync/llm.mjs';
import {
  INCLUDE_LABEL, SKIP_LABEL, SYNC_LABEL, extractState, renderBody, renderTitle,
} from './lib/docs-sync/pr-body.mjs';
import {
  applyCommits, git, hasForeignCommits, resetSyncBranch,
} from './lib/docs-sync/git-apply.mjs';
import { createGitHub } from './lib/docs-sync/github.mjs';
import { fenceForSummary, scrubSecrets } from './lib/docs-sync/log.mjs';

const HOLD_MARKER = '<!-- docs-sync-hold -->';
const CONTENT_PATHSPECS = CONTENT_PREFIXES.map((prefix) => prefix.replace(/\/$/, ''));

const { values: flags } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    target: { type: 'string' },
    'no-llm': { type: 'boolean', default: false },
    'skip-lint': { type: 'boolean', default: false },
    'repo-dir': { type: 'string' },
    'gh-bin': { type: 'string', default: 'gh' },
  },
});

const dryRun = flags['dry-run'] || /^(1|true)$/i.test(process.env.DRY_RUN ?? '');
const repoDir = flags['repo-dir'] ?? repoRoot();
const repo = process.env.GH_REPO || 'handsontable/handsontable';
const reviewers = (process.env.DOCS_SYNC_REVIEWERS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const gh = createGitHub({
  repo,
  run: (args) => execFileSync(flags['gh-bin'], args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(),
});
const summaryLines = [];
// GitHub drops the entire step summary if a step writes more than ~1 MiB to it,
// so the buffer is bounded well under that; the job log is never bounded.
const SUMMARY_BUDGET_CHARS = 900_000;
let summaryUsedChars = 0;
let summaryTruncated = false;

/**
 * Log to stdout and to the step summary buffer, with secrets scrubbed out of
 * every line -- a failed push echoes the tokenized remote URL through
 * `error.message`, and a LiteLLM error body can quote the request, including
 * the `Authorization` header, the proxy URL, or the key. The step summary is
 * not secret-masked by GitHub, so all three of the script's secrets are passed
 * as literals to be redacted wherever they appear, in whatever shape. This is
 * the one place all such messages pass through.
 *
 * The job log always gets the full scrubbed line. The step summary gets `line`
 * too, unless the caller passes a `summary` override (the failure path passes a
 * bounded, fenced copy) -- and once the summary buffer nears GitHub's size
 * limit, one marker is written and further summary appends stop, so a large run
 * never costs the whole summary.
 *
 * @param {string} line
 * @param {{ summary?: string }} [options] `summary` replaces `line` in the step
 *   summary only (already bounded by the caller); the job log still gets `line`.
 */
function log(line, { summary } = {}) {
  const secrets = [process.env.LITELLM_API_KEY, process.env.GH_TOKEN, process.env.LITELLM_BASE_URL];
  const forLog = scrubSecrets(line, secrets);

  console.log(forLog);

  if (summaryTruncated) {
    return;
  }

  const forSummary = summary === undefined ? forLog : scrubSecrets(summary, secrets);

  if (summaryUsedChars + forSummary.length + 1 > SUMMARY_BUDGET_CHARS) {
    summaryLines.push('[step summary truncated to stay within GitHub\'s size limit; see the full job log]');
    summaryTruncated = true;

    return;
  }

  summaryLines.push(forSummary);
  summaryUsedChars += forSummary.length + 1;
}

/**
 * Flush the buffered summary to `$GITHUB_STEP_SUMMARY` when present.
 */
async function flushSummary() {
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summaryLines.join('\n')}\n`);
  }
}

/**
 * Files changed by a commit.
 *
 * @param {string} sha
 * @returns {string[]}
 */
function changedFiles(sha) {
  return git(repoDir, ['show', '--format=', '--name-only', sha]).split('\n').filter(Boolean);
}

/**
 * The classifier: cached decisions first, then the model, or `unsure` under
 * `--no-llm`.
 *
 * @param {object} options
 * @returns {Promise<(candidate: object) => Promise<{ decision: string, reason: string }>>}
 */
async function makeClassifier({ prompt, hash, cache, target, releasedVersion, unreleased }) {
  if (flags['no-llm']) {
    return async() => ({ decision: 'unsure', reason: 'Classifier disabled with --no-llm.' });
  }

  const {
    LITELLM_BASE_URL: baseUrl, LITELLM_API_KEY: apiKey, DOCS_SYNC_MODEL: model,
    DOCS_SYNC_TEMPERATURE: temperatureText, DOCS_SYNC_JSON_MODE: jsonModeText,
  } = process.env;

  if (!baseUrl || !apiKey || !model) {
    throw new Error('LITELLM_BASE_URL, LITELLM_API_KEY and DOCS_SYNC_MODEL are required unless --no-llm is passed.');
  }

  // Unset repository variables expand to an empty string in the workflow, not
  // an absent env var, so treat `''` and `undefined` alike: both mean "omit
  // the temperature and let the model's own default apply". A present but
  // unparseable value is a configuration error, not a silent `NaN` that would
  // serialize to `"temperature": null` and 400 every call.
  let temperature;

  // `Number`, not `Number.parseFloat`: parseFloat stops at the first character
  // it cannot read and keeps what it has, so a comma typo (`0,7`) or a stray
  // suffix (`0.7x`) would silently pin a wrong value instead of throwing. The
  // `.trim()` on the empty check is what keeps `Number(' ') === 0` from reading
  // a whitespace-only value as a real temperature.
  if (temperatureText !== undefined && temperatureText.trim() !== '') {
    temperature = Number(temperatureText);

    if (!Number.isFinite(temperature)) {
      throw new Error(`DOCS_SYNC_TEMPERATURE must be a number, got "${temperatureText}".`);
    }
  }

  // On by default, so an unset variable keeps the `response_format` request
  // every provider that supports it benefits from. Turn it off only for a model
  // that rejects `response_format`. A present-but-unrecognized value is a
  // configuration error, not a silent fallback.
  let jsonMode = true;

  if (jsonModeText !== undefined && jsonModeText !== '') {
    if (/^(1|true|on|yes)$/i.test(jsonModeText)) {
      jsonMode = true;
    } else if (/^(0|false|off|no)$/i.test(jsonModeText)) {
      jsonMode = false;
    } else {
      throw new Error(`DOCS_SYNC_JSON_MODE must be a boolean (on/off), got "${jsonModeText}".`);
    }
  }

  const client = createClient({ baseUrl, apiKey, model, temperature, jsonMode });

  return async(candidate) => {
    const key = cacheKey(candidate.sha, hash);

    if (cache[key]) {
      return cache[key];
    }

    const diff = git(repoDir, ['show', '--format=', '--patch', candidate.sha, '--', ...CONTENT_PATHSPECS]);
    const user = buildUserMessage({
      pr: candidate.pr, files: candidate.files, diff, releasedVersion, target, unreleased,
    });
    const decision = parseDecision(await client.complete({ system: prompt, user }));

    cache[key] = decision;

    return decision;
  };
}

try {
  // Stage 1: target.
  git(repoDir, ['fetch', '--quiet', '--prune', 'origin', '+refs/heads/develop:refs/remotes/origin/develop', '+refs/heads/prod-docs/*:refs/remotes/origin/prod-docs/*', '+refs/heads/docs-sync/*:refs/remotes/origin/docs-sync/*']);

  const branchNames = git(repoDir, ['for-each-ref', '--format=%(refname:strip=3)', 'refs/remotes/origin/prod-docs/'])
    .split('\n').filter(Boolean);
  const latestTarget = pickTarget(branchNames);
  const override = flags.target || process.env.TARGET || '';

  if (override) {
    if (!/^prod-docs\/\d+\.\d+$/.test(override)) {
      throw new Error(`Target must look like prod-docs/<major>.<minor>, got "${override}"`);
    }
    if (git(repoDir, ['for-each-ref', `refs/remotes/origin/${override}`]) === '') {
      throw new Error(`Target branch ${override} does not exist on origin`);
    }
  }

  const target = override || latestTarget;

  if (!target) {
    throw new Error('No prod-docs/<major>.<minor> branch found.');
  }

  const targetRef = `origin/${target}`;
  const developRef = 'origin/develop';
  const releasedVersionText = JSON.parse(git(repoDir, ['show', `${targetRef}:handsontable/package.json`])).version;
  const released = parseVersion(releasedVersionText);
  const base = git(repoDir, ['merge-base', developRef, targetRef]);
  const syncBranch = syncBranchFor(target);
  const syncRef = `origin/${syncBranch}`;
  const syncExists = git(repoDir, ['for-each-ref', `refs/remotes/${syncRef}`]) !== '';

  log(`Target ${target} (released ${releasedVersionText}), sync branch ${syncBranch}${dryRun ? ', dry run' : ''}.`);

  // Stage 2: candidates.
  const rawLog = git(repoDir, ['log', '--no-merges', '--reverse', '--format=%H%x00%s%x00%an', `${targetRef}..${developRef}`, '--', ...CONTENT_PATHSPECS]);
  const candidates = rawLog.split('\n').filter(Boolean).map((line) => {
    const [sha, subject, author] = line.split('\0');

    return { sha, subject, author, prNumber: parseSquashSubject(subject), files: changedFiles(sha) };
  });

  // Stage 3: deterministic filters.
  const prodCommits = git(repoDir, ['log', '--format=%s%x00%b%x1e', `${base}..${targetRef}`])
    .split('\x1e').filter((s) => s.trim()).map((entry) => {
      const [subject, body] = entry.trim().split('\0');

      return { subject, body: body ?? '' };
    });
  const refs = collectProdRefs(prodCommits);
  const equivalent = parseCherryOutput(git(repoDir, ['cherry', targetRef, developRef, base]));

  const report = {
    target, targetSha: git(repoDir, ['rev-parse', targetRef]), developSha: git(repoDir, ['rev-parse', developRef]),
    releasedVersion: releasedVersionText, model: flags['no-llm'] ? 'none (--no-llm)' : process.env.DOCS_SYNC_MODEL ?? '',
    promptHash: '', generatedAt: new Date().toISOString(),
    included: [], conflicts: [], unsure: [], excluded: [], mixed: [], versionScoped: [], alreadyOnProd: [], noPrNumber: [],
    state: { version: 1, promptHash: '', decisions: {} },
  };
  const toClassify = [];
  let lookupFailures = 0;
  let lookupSuccesses = 0;

  for (const candidate of candidates) {
    if (candidate.prNumber === null) {
      report.noPrNumber.push(candidate);
      continue;
    }
    if (isAlreadyOnProd(candidate, refs, equivalent)) {
      report.alreadyOnProd.push(candidate);
      continue;
    }

    const { contentOnly, categories } = categorize(candidate.files);

    if (!contentOnly) {
      report.mixed.push({ ...candidate, categories });
      continue;
    }

    const scoped = versionScopedAbove(candidate.files, released);

    if (scoped.length > 0) {
      report.versionScoped.push({ ...candidate, files: scoped });
      continue;
    }

    try {
      candidate.pr = gh.getPullRequest(candidate.prNumber);
      lookupSuccesses += 1;
    } catch (error) {
      // The squash subject's `(#n)` can name an issue, a discussion, or a pull
      // request from another repository -- anything GitHub does not resolve
      // under this repo's pulls endpoint. That is not this run's problem to
      // solve; list the candidate and move on instead of failing the run.
      if (/HTTP 404/.test(error.stderr ?? '')) {
        lookupFailures += 1;
        report.noPrNumber.push({ ...candidate, reason: `No pull request #${candidate.prNumber} on GitHub.` });
        continue;
      }
      throw error;
    }
    // A ghost account (deleted or inaccessible to the token) renders as an
    // empty login; keep the git commit author rather than render a bare `@`.
    candidate.author = candidate.pr.author || candidate.author;

    if (candidate.pr.labels.includes(SKIP_LABEL)) {
      report.excluded.push({ ...candidate, reason: `Labeled \`${SKIP_LABEL}\`.` });
    } else if (candidate.pr.labels.includes(INCLUDE_LABEL)) {
      report.included.push(candidate);
    } else {
      toClassify.push(candidate);
    }
  }

  // A mass 404 on the pull request lookup almost always means the token
  // cannot read pull requests, not that every candidate's `(#n)` is foreign;
  // refuse to continue rather than silently treat every candidate as having
  // no resolvable pull request.
  if (lookupFailures > 0 && lookupSuccesses === 0) {
    throw new Error(`Every pull request lookup failed (${lookupFailures} of ${lookupFailures}); refusing to continue because a mass 404 usually means the token cannot read pull requests.`);
  }

  // Stage 4: classification. The prompt (and its hash) and the open pull
  // request are both needed by the hold check below, so they are resolved
  // before it even though the hold check itself never calls the model.
  const prompt = await loadPrompt();
  const hash = promptHash(prompt);
  const openPr = gh.findOpenPr(syncBranch, target);

  report.promptHash = hash;
  report.state.promptHash = hash;

  // Stage 5 gate, checked before classification: a branch with human commits
  // is left alone. This can be true whether or not a pull request is
  // currently open for it -- the fetched tip already carries the foreign
  // commit either way, and the lease that protects a human's work on push
  // does not depend on a pull request existing. Holding here, rather than
  // after classifying, means the model is never called for a run whose plan
  // cannot be applied anyway.
  if (syncExists && hasForeignCommits(repoDir, targetRef, syncRef)) {
    log(`Sync branch ${syncBranch} carries commits the bot did not make; leaving it untouched.`);

    for (const candidate of toClassify) {
      report.unsure.push({ ...candidate, reason: 'Not classified: the sync branch carries commits the bot did not make.' });
    }
    for (const candidate of report.included) {
      report.unsure.push({ ...candidate, reason: 'Not applied: the sync branch carries commits the bot did not make.' });
    }
    report.included = [];

    const body = renderBody(report);

    log(body);

    if (openPr && !dryRun) {
      gh.upsertComment(
        openPr.number,
        HOLD_MARKER,
        `The docs sync found commits on this branch that it did not make, so it did not rebuild the branch. Merge or close this pull request, or remove the foreign commits, to let the next run continue. Current plan:\n\n${body}`,
      );
    }

    process.exitCode = 0;
  } else {
    const previousState = openPr ? extractState(gh.getPullRequest(openPr.number).body) : null;
    const cache = previousState?.promptHash === hash ? { ...previousState.decisions } : {};

    log(`Classifier: ${report.model}, prompt ${hash}`);

    if (toClassify.length > 0) {
      // Read from `origin/develop` through git, not the local working tree:
      // Stage 5 below moves the checkout to the sync branch, and `--repo-dir`
      // can point at a checkout whose working tree is not develop at all.
      const changelogNames = git(repoDir, ['ls-tree', '--name-only', developRef, '.changelogs/'])
        .split('\n').filter((name) => name.endsWith('.json'));
      const pendingEntries = changelogNames.map((name) => JSON.parse(git(repoDir, ['show', `${developRef}:${name}`])));

      const unreleased = collectUnreleased({
        pendingEntries, changelogMarkdown: git(repoDir, ['show', `${developRef}:CHANGELOG.md`]), released,
      });
      const classify = await makeClassifier({ prompt, hash, cache, target, releasedVersion: releasedVersionText, unreleased });

      for (const candidate of toClassify) {
        const decision = await classify(candidate);

        // `unsure` is never cached: a synthetic --no-llm answer or a one-off
        // model uncertainty must be re-asked every run, not frozen into the
        // pull request's state block under the current prompt hash.
        if (decision.decision !== 'unsure') {
          report.state.decisions[cacheKey(candidate.sha, hash)] = decision;
        }

        if (decision.decision === 'include') {
          report.included.push(candidate);
        } else if (decision.decision === 'exclude') {
          report.excluded.push({ ...candidate, reason: decision.reason });
        } else {
          report.unsure.push({ ...candidate, reason: decision.reason });
        }
      }
    }

    const dirty = git(repoDir, ['status', '--porcelain']);

    if (dirty !== '') {
      throw new Error(`Refusing to rebuild ${syncBranch}: ${repoDir} has uncommitted changes:\n${dirty}`);
    }

    const originalHead = git(repoDir, ['rev-parse', '--abbrev-ref', 'HEAD']);

    try {
      resetSyncBranch(repoDir, syncBranch, targetRef);

      const applied = applyCommits(repoDir, report.included.map((c) => c.sha).sort((a, b) => candidates.findIndex((c) => c.sha === a) - candidates.findIndex((c) => c.sha === b)));
      const includedBySha = new Map(report.included.map((c) => [c.sha, c]));

      report.included = applied.applied.map((sha) => includedBySha.get(sha));
      report.conflicts = applied.conflicts.map(({ sha, files }) => ({ ...includedBySha.get(sha), files }));
      report.alreadyOnProd.push(...applied.empty.map((sha) => includedBySha.get(sha)));

      // Stage 6: verify.
      if (report.included.length > 0 && !flags['skip-lint']) {
        try {
          // The package's own ESLint, by path -- not npx: in an unbootstrapped
          // checkout, npx can resolve or fetch an unrelated eslint instead of
          // failing fast (the same reasoning `lint-ratchet.mjs` documents for its
          // own ESLint invocation). Scoped to `docs/content` only -- the sync never
          // touches `docs/src` -- so a pre-existing lint error elsewhere in the
          // target branch's site source never fails a run for content this tool
          // did not touch. `docs/node_modules` (gitignored, installed once from
          // develop's lockfile before this script runs) survives the checkout
          // swap `resetSyncBranch` performed above untouched, so the eslint binary
          // is available regardless of which tree is checked out; only its own
          // config resolution depends on the target's tree, same as before. This
          // does not solve every scoping gap: the installed eslint and its plugins
          // can still mismatch the target branch's own config; the full build and
          // content checks run on the pull request itself and catch that class of
          // problem.
          const eslintBin = path.join(repoDir, 'docs', 'node_modules', 'eslint', 'bin', 'eslint.js');

          execFileSync(process.execPath, [eslintBin, '--ext', '.js,.mjs,.ts,.astro', 'content'], {
            cwd: path.join(repoDir, 'docs'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
          });
        } catch (error) {
          const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;

          log('## Docs lint failed on the rebuilt branch');
          log(output.slice(0, 8192));
          log('Fix the source pull request on develop, or label it `docs-sync: skip` to keep it out of the sync.');
          throw new Error('docs:lint failed on the rebuilt branch');
        }
      }

      // Stage 7: pull request.
      const body = renderBody(report);
      const title = renderTitle(target);

      log(body);

      if (dryRun) {
        log('\nDry run: nothing pushed, no pull request touched.');
      } else {
        // Created on every non-dry run, before the include/conflict/close
        // branching below, so a conflicts-only or a nothing-to-sync run still
        // leaves the labels available for a human to apply by hand.
        gh.ensureLabels([SYNC_LABEL, SKIP_LABEL, INCLUDE_LABEL]);

        if (report.included.length > 0) {
          const treeChanged = !syncExists || git(repoDir, [
            'rev-parse', `${syncBranch}^{tree}`,
          ]) !== git(repoDir, ['rev-parse', `${syncRef}^{tree}`]);

          if (treeChanged) {
            const lease = syncExists ? [`--force-with-lease=refs/heads/${syncBranch}:${git(repoDir, ['rev-parse', syncRef])}`] : [];

            git(repoDir, ['push', '--quiet', ...lease, 'origin', `HEAD:refs/heads/${syncBranch}`]);
          } else {
            log(`No change: ${syncBranch}'s tree already matches ${syncRef}; skipping the push.`);
          }

          if (openPr) {
            gh.updatePr(openPr.number, { title, body });
            log(`Updated #${openPr.number}: ${openPr.url}`);
          } else {
            const url = gh.createPr({ head: syncBranch, base: target, title, body, labels: [SYNC_LABEL], reviewers });

            log(`Opened ${url}`);
          }
        } else if (report.conflicts.length > 0) {
          // Nothing to push, but the conflicts are real content this run could
          // not port -- never close the pull request or claim there is nothing
          // to sync while a conflict is still unresolved.
          if (openPr) {
            gh.updatePr(openPr.number, { title, body });
            log(`Updated #${openPr.number}: conflicts only, nothing applied`);
          } else {
            log(`${report.conflicts.length} commit(s) conflict with ${target}; nothing applied, manual port needed`);
          }
        } else if (openPr) {
          // A run whose pull request lookups all 404'd never learned whether
          // this open pull request's own candidates still belong in it; never
          // close it on the strength of a plan built from failed lookups.
          if (lookupFailures > 0) {
            log(`Skipped closing #${openPr.number}: ${lookupFailures} pull request lookup(s) failed this run.`);
          } else {
            gh.closePr(openPr.number, 'Everything this pull request carried has reached the target by another route. Closing; the next run reopens if new content lands.');
            log(`Closed #${openPr.number}: nothing left to sync.`);
          }
        } else {
          log('No documentation changes to sync.');
        }

        // Target rollover: close the bot's pull requests against any other base.
        // Runs on every non-dry run, including a zero-included one -- the run
        // right after a release cut is typically zero-included, and that is
        // exactly when the old target's pull request must be closed. An
        // explicitly overridden target never drives this cleanup: it is not
        // the highest prod-docs branch, so a stale-looking pull request
        // against the real latest target would otherwise be closed by mistake.
        if (target === latestTarget) {
          for (const stale of gh.listOpenPrsWithLabel(SYNC_LABEL)) {
            if (stale.baseRefName !== target && stale.headRefName.startsWith('docs-sync/')) {
              gh.closePr(stale.number, `The live documentation branch is now ${target}; this pull request targets ${stale.baseRefName}. Unmerged content was re-evaluated against the new target.`);
              log(`Closed stale #${stale.number} against ${stale.baseRefName}.`);
            }
          }
        } else {
          log(`Target ${target} was set explicitly; skipping the stale pull request cleanup (the highest prod-docs branch is ${latestTarget}).`);
        }
      }
    } finally {
      // Best-effort: a restore failure here must never mask an error from the
      // try block above.
      try {
        const currentBranch = git(repoDir, ['rev-parse', '--abbrev-ref', 'HEAD']);

        if (originalHead !== 'HEAD' && currentBranch !== originalHead) {
          git(repoDir, ['checkout', '-q', originalHead]);
        }
      } catch {
        // Ignored, see above.
      }
    }
  }

  await flushSummary();
} catch (error) {
  // The job log gets the whole error (a failed classifier call carries the full
  // upstream response); the summary gets a bounded, fenced copy so a block page
  // renders literally and cannot run the summary away.
  log(`Failed: ${error.message}`, { summary: `Failed:\n${fenceForSummary(error.message)}` });
  await flushSummary();
  process.exitCode = 1;
}
