/**
 * Gate metrics CLI — sweep merged PRs and report enforcement-gate health.
 *
 * The recurring health report behind the DEV-2059 warn→block decision:
 * recomputes the presence-gate verdict for every merged PR (final state),
 * measures implementation:test added-line ratios, counts escape-hatch usage,
 * and (with --ci-history) how often the CI presence gate went red on the way.
 *
 * Usage:
 *   node scripts/gate-metrics.mjs --since 2026-07-21 [--ci-history]
 *
 * Requires an authenticated `gh` CLI. Read-only.
 */

import { execFileSync } from 'node:child_process';
import { analyzePr, summarize } from './lib/gate-metrics.mjs';

const args = process.argv.slice(2);
const since = args[args.indexOf('--since') + 1];
const ciHistory = args.includes('--ci-history');

if (!args.includes('--since') || !since) {
  console.error('Usage: node scripts/gate-metrics.mjs --since YYYY-MM-DD [--ci-history]');
  process.exit(1);
}

/**
 * Call the GitHub API through the gh CLI.
 *
 * @param {string} path API path (`:owner/:repo` placeholders allowed).
 * @param {string} [jq] Optional jq filter.
 * @param {boolean} [paginate] Paginate the endpoint.
 * @returns {any} Parsed JSON.
 */
function ghApi(path, jq, paginate = false) {
  const cliArgs = ['api', ...(paginate ? ['--paginate'] : []), path, ...(jq ? ['--jq', jq] : [])];
  const out = execFileSync('gh', cliArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  if (!paginate) {
    return JSON.parse(out);
  }

  // With --paginate, a --jq filter emits one JSON document PER PAGE
  // (newline-separated) — parse each and flatten (gh's --slurp is not
  // combinable with --jq in all gh versions).
  return out.trim().split('\n').filter(Boolean).map(line => JSON.parse(line)).flat();
}

const mergedPrs = ghApi(
  'repos/:owner/:repo/pulls?state=closed&base=develop&sort=updated&direction=desc&per_page=100',
  `[.[] | select(.merged_at != null and .merged_at >= "${since}")
     | {number, title, body, merged_at, head: .head.ref}]`
);

console.error(`Analyzing ${mergedPrs.length} PRs merged to develop since ${since}...`);

const rows = [];

for (const pr of mergedPrs) {
  const files = ghApi(`repos/:owner/:repo/pulls/${pr.number}/files?per_page=100`,
    '[.[] | {status, filename, additions}]', true);
  const commitMessages = ghApi(`repos/:owner/:repo/pulls/${pr.number}/commits?per_page=100`,
    '[.[].commit.message]', true);
  const row = analyzePr({ ...pr, files, commitMessages });

  if (ciHistory) {
    // How often did the CI presence gate go red on this PR's branch? A red
    // that later turned green means the gate prompted a test (worked); a
    // never-red PR needed no prompting.
    try {
      const branch = encodeURIComponent(pr.head);
      const runs = ghApi(
        `repos/:owner/:repo/actions/workflows/test.yml/runs?event=pull_request&branch=${branch}&per_page=8`,
        '[.workflow_runs[].id]'
      );

      row.presenceReds = 0;

      for (const runId of runs) {
        const conclusions = ghApi(`repos/:owner/:repo/actions/runs/${runId}/jobs?per_page=100`,
          '[.jobs[] | select(.name == "Checks / test presence") | .conclusion]', true);

        row.presenceReds += conclusions.filter(c => c === 'failure').length;
      }
    } catch {
      row.presenceReds = null;
    }
  }

  rows.push(row);
  console.error(`  #${pr.number} ${row.verdict}`);
}

const s = summarize(rows);
const fmtRatio = r => (r === null ? '—' : r.toFixed(2));

console.log(`\n## Gate metrics — PRs merged to develop since ${since}\n`);
console.log('| PR | Title | Src files | +src | +test | ratio | Verdict | Escapes | CI reds |');
console.log('|---|---|---|---|---|---|---|---|---|');

for (const r of rows) {
  const escapes = [
    r.refactorTrailer ? 'refactor-trailer' : '',
    r.changelogSkipped ? 'skip-changelog' : '',
  ].filter(Boolean).join(', ') || '—';

  console.log(`| #${r.number} | ${r.title.slice(0, 48)} | ${r.sourceFiles} | ${r.sourceAdded} | ${r.testAdded} `
    + `| ${fmtRatio(r.ratio)} | ${r.verdict} | ${escapes} | ${r.presenceReds ?? '—'} |`);
}

console.log('\n### Summary');
console.log(`- PRs merged: **${s.totalPrs}** (source-changing: **${s.sourcePrs}**)`);
console.log(`- Presence verdicts: ${Object.entries(s.byVerdict).map(([k, v]) => `${k}: **${v}**`).join(' · ')}`);
console.log(`- Median test:impl added-line ratio (source PRs): **${fmtRatio(s.medianRatio)}**`);
console.log(`- Escapes: Refactor-only trailers: **${s.refactorTrailers}** · [skip changelog]: **${s.changelogSkips}**`);

if (s.wouldBlock.length > 0) {
  console.log(`- **Would block under enforcement (${s.wouldBlock.length})** — judge each: real gap or false block?`);

  for (const r of s.wouldBlock) {
    console.log(`  - #${r.number} ${r.title.slice(0, 60)} (+${r.sourceAdded} src, +${r.testAdded} test)`);
  }
} else {
  console.log('- Would block under enforcement: **none** 🎉');
}
