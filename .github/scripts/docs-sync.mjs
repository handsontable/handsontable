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
 * Design: `.ai/specs/2026-09-10-docs-sync-design.md`.
 *
 * Usage:
 *   node .github/scripts/docs-sync.mjs [--dry-run] [--target prod-docs/18.1]
 *                                      [--no-llm] [--skip-lint]
 *                                      [--repo-dir <path>] [--gh-bin <path>]
 *
 * Env: GH_TOKEN, GH_REPO, LITELLM_BASE_URL, LITELLM_API_KEY, DOCS_SYNC_MODEL,
 *      DOCS_SYNC_REVIEWERS, DRY_RUN, TARGET, GITHUB_STEP_SUMMARY.
 */

import { execFileSync } from 'node:child_process';
import { appendFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { repoRoot } from './lib/repo-root.mjs';
import { categorize } from './lib/docs-sync/paths.mjs';
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

const HOLD_MARKER = '<!-- docs-sync-hold -->';
const CONTENT_PATHSPECS = ['docs/content', 'docs/public/img'];

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

/**
 * Log to stdout and to the step summary buffer.
 *
 * @param {string} line
 */
function log(line) {
  console.log(line);
  summaryLines.push(line);
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

  const { LITELLM_BASE_URL: baseUrl, LITELLM_API_KEY: apiKey, DOCS_SYNC_MODEL: model } = process.env;

  if (!baseUrl || !apiKey || !model) {
    throw new Error('LITELLM_BASE_URL, LITELLM_API_KEY and DOCS_SYNC_MODEL are required unless --no-llm is passed.');
  }

  const client = createClient({ baseUrl, apiKey, model });

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
  const target = flags.target || process.env.TARGET || pickTarget(branchNames);

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

    candidate.pr = gh.getPullRequest(candidate.prNumber);
    candidate.author = candidate.pr.author;

    if (candidate.pr.labels.includes(SKIP_LABEL)) {
      report.excluded.push({ ...candidate, reason: `Labelled \`${SKIP_LABEL}\`.` });
    } else if (candidate.pr.labels.includes(INCLUDE_LABEL)) {
      report.included.push(candidate);
    } else {
      toClassify.push(candidate);
    }
  }

  // Stage 4: classification.
  const prompt = await loadPrompt();
  const hash = promptHash(prompt);
  const openPr = gh.findOpenPr(syncBranch, target);
  const previousState = openPr ? extractState(gh.getPullRequest(openPr.number).body) : null;
  const cache = previousState?.promptHash === hash ? { ...previousState.decisions } : {};

  report.promptHash = hash;
  report.state.promptHash = hash;

  log(`Classifier: ${report.model}, prompt ${hash}`);

  if (toClassify.length > 0) {
    const changelogDir = path.join(repoDir, '.changelogs');
    const pendingEntries = [];
    let changelogNames = [];

    try {
      changelogNames = await readdir(changelogDir);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    for (const name of changelogNames.filter((n) => n.endsWith('.json'))) {
      pendingEntries.push(JSON.parse(await readFile(path.join(changelogDir, name), 'utf8')));
    }

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

  // Stage 5: apply. A branch with human commits is left alone. This can be true
  // whether or not a pull request is currently open for it -- the fetched tip
  // already carries the foreign commit either way, and the lease that protects
  // a human's work on push does not depend on a pull request existing.
  if (syncExists && hasForeignCommits(repoDir, targetRef, syncRef)) {
    log(`Sync branch ${syncBranch} carries commits the bot did not make; leaving it untouched.`);
    if (openPr && !dryRun) {
      gh.upsertComment(openPr.number, HOLD_MARKER, 'The docs sync found commits on this branch that it did not make, so it did not rebuild the branch. Merge or close this pull request to let the next run continue.');
    }
    await flushSummary();
    process.exit(0);
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
      execFileSync('npm', ['run', 'docs:lint', '--prefix', 'docs'], { cwd: repoDir, stdio: 'inherit' });
    }

    // Stage 7: pull request.
    const body = renderBody(report);
    const title = renderTitle(target);

    log(body);

    if (dryRun) {
      log('\nDry run: nothing pushed, no pull request touched.');
    } else {
      if (report.included.length > 0) {
        const lease = syncExists ? [`--force-with-lease=refs/heads/${syncBranch}:${git(repoDir, ['rev-parse', syncRef])}`] : [];

        git(repoDir, ['push', '--quiet', ...lease, 'origin', `HEAD:refs/heads/${syncBranch}`]);
        gh.ensureLabels([SYNC_LABEL, SKIP_LABEL, INCLUDE_LABEL]);

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
        gh.closePr(openPr.number, 'Everything this pull request carried has reached the target by another route. Closing; the next run reopens if new content lands.');
        log(`Closed #${openPr.number}: nothing left to sync.`);
      } else {
        log('No documentation changes to sync.');
      }

      // Target rollover: close the bot's pull requests against any other base.
      // Runs on every non-dry run, including a zero-included one -- the run
      // right after a release cut is typically zero-included, and that is
      // exactly when the old target's pull request must be closed.
      for (const stale of gh.listOpenPrsWithLabel(SYNC_LABEL)) {
        if (stale.baseRefName !== target && stale.headRefName.startsWith('docs-sync/')) {
          gh.closePr(stale.number, `The live documentation branch is now ${target}; this pull request targets ${stale.baseRefName}. Unmerged content was re-evaluated against the new target.`);
          log(`Closed stale #${stale.number} against ${stale.baseRefName}.`);
        }
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

  await flushSummary();
} catch (error) {
  log(`Failed: ${error.message}`);
  await flushSummary();
  process.exitCode = 1;
}
