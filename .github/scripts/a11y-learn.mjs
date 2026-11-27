#!/usr/bin/env node

/**
 * The accessibility learning routine: what the latest weekly audit found on code changed since the audit before it.
 *
 * Two modes, both read-only on the repository:
 *
 * - The packet (default). Reads the findings ledger (`test-health/a11y.json` on `gh-pages`) and the git range between
 *   the two audited commits of each source, sorts every new finding (`./lib/a11y-learn.mjs`, pure and unit-tested)
 *   and writes `learn-packet.json` and `learn-packet.md`. An agent or a person then sorts the attributable groups
 *   with `.claude/skills/handsontable-a11y-learn/SKILL.md`. It refuses unless every audit source has a night in the
 *   last 24 hours with no problem recorded.
 * - The guard (`--guard`). Checks the change set of the routine's own pull request: it may touch
 *   `.claude/skills/handsontable-a11y/` and the `defectClass` and `notDefect` fields of `tests/a11y/issues.json`,
 *   nothing else, and its text may name no task id but the branch's own.
 *
 * It fetches nothing: run `git fetch origin develop gh-pages` first. It needs no installed package.
 *
 * Exit status: 0 with a packet or with nothing attributable (and for a dry run, whatever it reports); 3 when the run
 * is refused; 1 when the guard finds a problem; 2 for the caller's own errors (a bad argument, a ledger or a commit
 * that cannot be read).
 *
 * Usage:
 *   node .github/scripts/a11y-learn.mjs
 *     [--ledger-ref origin/gh-pages]      # where the ledger is read from, and its history for the earlier state
 *     [--ledger after.json --before before.json [--commits commits.json]]   # the same from files, for a test
 *     [--out .claude/a11y-learn]          # where the packet goes (git-ignored)
 *     [--dry-run]                         # report even when refused; no pull request follows from a dry run
 *     [--now 2026-11-17T14:00:00Z]        # the time of the run, with --dry-run only: replays an older ledger
 *     [--max-age-hours 24]                # for a person who runs a missed Monday late
 *   node .github/scripts/a11y-learn.mjs --guard
 *     [--base origin/develop]             # what the routine's branch started from
 *     [--body body.md]                    # the pull request body, checked with the commit messages
 *     [--repo <dir>]                      # another checkout to guard, instead of this one
 */

import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import {
  LEARN_CATALOG_FILE,
  LEARN_MAX_AGE_HOURS,
  LEARN_RULES_FILE,
  auditPairs,
  docsGuideFolders,
  guardProblems,
  learnPacket,
  parseGitLog,
  parseRawDiff,
  renderPacket,
  secondStrikes,
  surfaceMaps,
  textProblems,
} from './lib/a11y-learn.mjs';
import { repoRoot } from './lib/repo-root.mjs';
import { compileIssuesCatalog } from '../../tests/lib/a11y-issues.mjs';

const LEDGER_PATH = 'test-health/a11y.json';
const PACKET_JSON = 'learn-packet.json';
const PACKET_MD = 'learn-packet.md';
// How many published states are read back for what the previous audit measured: a week holds about a dozen.
const STATES_READ = 80;
const MAX_BUFFER = 64 * 1024 * 1024;
let root = repoRoot();
// Git runs with an explicit cwd; the `GIT_DIR` and `GIT_WORK_TREE` a git hook exports would make it read another tree.
const env = { ...process.env };

delete env.GIT_DIR;
delete env.GIT_WORK_TREE;

/**
 * Ends the script over one of the caller's own errors.
 *
 * @param {string} message What is wrong.
 */
function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

/**
 * Runs git in the repository and returns its output.
 *
 * @param {string[]} args The arguments.
 * @returns {string} The output.
 */
function git(args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], { cwd: root, env, encoding: 'utf8', maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Runs git and says whether it succeeded, for a question git answers with its exit status.
 *
 * @param {string[]} args The arguments.
 * @returns {boolean} The verdict.
 */
function gitOk(args) {
  try {
    git(args);

    return true;
  } catch {
    // A non-zero exit is the answer "no" here (not an ancestor, no such object).
    return false;
  }
}

/**
 * A JSON file, parsed, or the script's end with the file named.
 *
 * @param {string} file The path.
 * @param {string} what What the file is, for the message.
 * @returns {unknown} The parsed content.
 */
function readJson(file, what) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return fail(`Cannot read ${what} (${file}): ${String(error.message).replace(/\s+/g, ' ')}`);
  }
}

/**
 * A module of the repository, loaded from the working tree.
 *
 * @param {string} file The path under the repository root.
 * @returns {Promise<object>} The module.
 */
function load(file) {
  return import(pathToFileURL(path.join(root, file)).href);
}

/**
 * Where each page's code lives, from the coverage maps, the page lists and the check registries of this checkout.
 *
 * @returns {Promise<object>} The maps `surfaceOf()` reads.
 */
async function readMaps() {
  const [coverage, catalogPages, reader, matrix, evidence, sites, docs] = await Promise.all([
    load('tests/a11y/coverage.mjs'), load('tests/a11y/pages.mjs'), load('tests/screenreader/coverage.mjs'),
    load('tests/lib/screenreader-matrix.mjs'), load('tests/lib/a11y-evidence.mjs'), load('tests/lib/a11y-site-checks.mjs'),
    load('tests/a11y/docs/pages.mjs'),
  ]);
  // Every framework's id of a guide, with the slug it is served at: the scan names a page once, by the first framework
  // that lists it, and the accessibility pages by each.
  const listed = docs.DOCS_FRAMEWORKS.flatMap(framework => framework.paths.map(({ path: listPath }) => {
    const slug = listPath.split('/').pop() === 'introduction' ? 'introduction' : docs.servedSlug(listPath);

    return { id: `${framework.prefix}-${docs.idPart(slug)}`, listPath, slug };
  }));
  // The guide files, and the slug each is served at (its `permalink`, read by the docs scan's own `servedSlug()`): the
  // list names some guides by that slug, in a folder that does not exist.
  const guidesDir = 'docs/content/guides';
  const files = readdirSync(path.join(root, guidesDir), { recursive: true }).map(file => `${guidesDir}/${file.split(path.sep).join('/')}`)
    .filter(file => /\.mdx?$/.test(file));
  const permalinks = {};

  for (const file of files) {
    const slug = docs.servedSlug(file.slice('docs/content/'.length).replace(/\.mdx?$/, ''));

    if (!Object.hasOwn(permalinks, slug)) {
      permalinks[slug] = file;
    }
  }

  const { guides: docsGuides, missing } = docsGuideFolders(listed, { files, permalinks });

  if (missing.length > 0) {
    // Not an error: a finding on such a page is tied by the code every docs page shares, or reads as not on changed code.
    process.stderr.write(`warning: ${missing.length} docs ${missing.length === 1 ? 'page has' : 'pages have'} no guide folder to tie a finding to: `
      + `${missing.join(', ')}\n`);
  }

  return surfaceMaps({
    plugins: coverage.PLUGIN_COVERAGE,
    editors: coverage.EDITOR_COVERAGE,
    pages: catalogPages.A11Y_PAGES,
    readerFeatures: reader.SR_FEATURE_COVERAGE,
    readerProjects: matrix.SCREENREADER_PROJECTS,
    checks: { ...evidence.EVIDENCE_CHECKS, ...sites.SITE_CHECKS },
    docsGuides,
  });
}

/**
 * The cluster catalog of this checkout, compiled, each cluster with the defect class the file gives it.
 *
 * @returns {object} The catalog.
 */
function readCatalog() {
  const raw = readJson(path.join(root, LEARN_CATALOG_FILE), 'the cluster catalog');
  const classes = new Map((raw.clusters ?? []).map(cluster => [cluster.id, cluster.defectClass ?? null]));

  try {
    const catalog = compileIssuesCatalog(raw);

    return { ...catalog, clusters: catalog.clusters.map(cluster => ({ ...cluster, defectClass: cluster.defectClass ?? classes.get(cluster.id) ?? null })) };
  } catch (error) {
    return fail(`The cluster catalog does not validate: ${String(error.message).replace(/\s+/g, ' ')}`);
  }
}

/**
 * The published ledger states to search for what the previous audit measured, newest first.
 *
 * @param {object} options The script's options.
 * @returns {Iterable<() => object>} One reader per state.
 */
function* earlierStates(options) {
  if (options.ledger) {
    for (const file of options.before ?? []) {
      yield () => readJson(file, 'an earlier ledger state');
    }

    return;
  }

  const commits = git(['log', `-n${STATES_READ}`, '--format=%H', options['ledger-ref'], '--', LEDGER_PATH]).split('\n').filter(Boolean);

  // The first is the state the run reads as the ledger; the previous audit's coverage is in an older one.
  for (const commit of commits.slice(1)) {
    yield () => JSON.parse(git(['show', `${commit}:${LEDGER_PATH}`]));
  }
}

/**
 * What the previous audit of each source measured: that night's record from the state published while it was the
 * latest of its source, which is the only one that keeps a night's coverage.
 *
 * @param {ReturnType<typeof auditPairs>} pairs The audits.
 * @param {object} options The script's options.
 * @returns {Record<string, object>} Per night source, the previous night's record with its coverage.
 */
function readCoverage(pairs, options) {
  const wanted = new Map(pairs.filter(pair => pair.previous !== null).map(pair => [pair.source, String(pair.previous.runId)]));
  const found = {};

  for (const read of earlierStates(options)) {
    if (wanted.size === 0) {
      break;
    }

    const state = read();

    for (const [source, runId] of [...wanted]) {
      const night = (state?.nights ?? []).find(entry => entry.source === source && String(entry.runId) === runId && entry.coverage);

      if (night) {
        found[source] = night;
        wanted.delete(source);
      }
    }
  }

  return found;
}

/**
 * The first-parent commits between the two audited commits of each source.
 *
 * @param {ReturnType<typeof auditPairs>} pairs The audits.
 * @param {object} options The script's options.
 * @returns {{commits: Record<string, object[]|null>, errors: Record<string, string>}} Per night source, the commits,
 * or `null` with the reason.
 */
function readRanges(pairs, options) {
  const commits = {};
  const errors = {};
  const ranges = new Map();

  if (options.commits) {
    return { commits: readJson(options.commits, 'the commits'), errors };
  }

  for (const { source, latest, previous } of pairs) {
    if (latest === null || previous === null || !latest.headSha || !previous.headSha) {
      continue;
    }

    const range = `${previous.headSha}..${latest.headSha}`;

    if (!ranges.has(range)) {
      const missing = [previous.headSha, latest.headSha].find(sha => !gitOk(['cat-file', '-e', `${sha}^{commit}`]));
      let result = null;

      if (missing) {
        result = `commit ${missing} is not in this clone: run git fetch origin develop, with full history`;
      } else if (!gitOk(['merge-base', '--is-ancestor', previous.headSha, latest.headSha])) {
        result = 'the earlier audited commit is not an ancestor of the later one';
      } else {
        result = parseGitLog(git(['log', '--first-parent', '--diff-merges=first-parent', '--name-only', '--format=%x1e%H%x1f%s', range]));
      }

      ranges.set(range, result);
    }

    const result = ranges.get(range);

    if (typeof result === 'string') {
      commits[source] = null;
      errors[source] = result;
    } else {
      commits[source] = result;
    }
  }

  return { commits, errors };
}

/**
 * The guard: whether the working tree, against the base it started from, is a change the routine may make.
 *
 * @param {object} options The script's options.
 */
function guard(options) {
  let base;

  if (options.repo) {
    root = path.resolve(options.repo);
  }

  try {
    base = git(['merge-base', options.base, 'HEAD']).trim();
  } catch (error) {
    fail(`Cannot find where the branch left ${options.base}: ${String(error.message).replace(/\s+/g, ' ')}`);
  }

  // An untracked file has no mode in git yet: read what it would be committed as.
  const modeOf = (file) => {
    const stats = lstatSync(path.join(root, file));

    if (stats.isSymbolicLink()) {
      return '120000';
    }

    // eslint-disable-next-line no-bitwise
    return (stats.mode & 0o111) === 0 ? '100644' : '100755';
  };
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)
    .map(file => ({ path: file, status: 'A', mode: modeOf(file) }));
  const changes = [...parseRawDiff(git(['diff', '--raw', '--no-renames', '--no-abbrev', '-z', base])), ...untracked];
  const atBase = (file) => {
    try {
      return JSON.parse(git(['show', `${base}:${file}`]));
    } catch {
      // The file is not at the base, or is not JSON there: nothing to compare with.
      return null;
    }
  };
  const inTree = (file) => {
    try {
      return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    } catch {
      // Deleted in the change, or not JSON: the guard says so where it matters.
      return null;
    }
  };
  const touches = file => changes.some(change => change.path === file);
  const rulesBefore = atBase(LEARN_RULES_FILE);
  const rulesAfter = inTree(LEARN_RULES_FILE);
  const body = options.body ? readFileSync(options.body, 'utf8') : null;
  const texts = [{ name: 'a commit message', text: git(['log', '--format=%B', `${base}..HEAD`]) }];

  if (body !== null) {
    texts.push({ name: 'the pull request body', text: body });
  }

  const promoted = secondStrikes(rulesBefore, rulesAfter);
  const problems = [
    ...guardProblems({
      changes,
      catalogBefore: touches(LEARN_CATALOG_FILE) ? atBase(LEARN_CATALOG_FILE) : null,
      catalogAfter: touches(LEARN_CATALOG_FILE) ? inTree(LEARN_CATALOG_FILE) : null,
      rulesBefore,
      rulesAfter,
    }),
    ...textProblems({ branch: git(['branch', '--show-current']).trim(), texts, body, promoted }),
  ];

  for (const id of promoted) {
    process.stdout.write(`second strike: ${id}\n`);
  }
  if (problems.length > 0) {
    process.stdout.write(`guard: ${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}\n${problems.map(problem => `- ${problem}`).join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`guard: ok (${changes.length} changed ${changes.length === 1 ? 'path' : 'paths'})\n`);
  }
}

let options;

try {
  ({ values: options } = parseArgs({
    options: {
      'ledger-ref': { type: 'string', default: 'origin/gh-pages' },
      ledger: { type: 'string' },
      before: { type: 'string', multiple: true },
      commits: { type: 'string' },
      out: { type: 'string', default: '.claude/a11y-learn' },
      'dry-run': { type: 'boolean', default: false },
      now: { type: 'string' },
      'max-age-hours': { type: 'string', default: String(LEARN_MAX_AGE_HOURS) },
      guard: { type: 'boolean', default: false },
      base: { type: 'string', default: 'origin/develop' },
      body: { type: 'string' },
      repo: { type: 'string' },
    },
  }));
} catch (error) {
  fail(String(error.message));
}

if (options.guard) {
  guard(options);
} else {
  const maxAgeHours = Number(options['max-age-hours']);
  const now = options.now ? new Date(options.now) : new Date();

  if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
    fail(`--max-age-hours must be a number of hours above 0, got ${JSON.stringify(options['max-age-hours'])}`);
  }
  if (Number.isNaN(now.getTime())) {
    fail(`--now must be a time (2026-11-17T14:00:00Z), got ${JSON.stringify(options.now)}`);
  }
  if (options.now && !options['dry-run']) {
    fail('--now replays an older ledger, so it goes with --dry-run: a real run reads the clock');
  }

  let ledger;

  if (options.ledger) {
    ledger = readJson(options.ledger, 'the ledger');
  } else {
    try {
      ledger = JSON.parse(git(['show', `${options['ledger-ref']}:${LEDGER_PATH}`]));
    } catch (error) {
      fail(`Cannot read ${LEDGER_PATH} at ${options['ledger-ref']} (run git fetch origin gh-pages): ${String(error.message).replace(/\s+/g, ' ').slice(0, 300)}`);
    }
  }

  const rulesFile = path.join(root, LEARN_RULES_FILE);
  let packet;

  try {
    const pairs = auditPairs(ledger);
    const { commits, errors } = readRanges(pairs, options);

    packet = learnPacket({
      ledger,
      coverage: readCoverage(pairs, options),
      commits,
      rangeErrors: errors,
      catalog: readCatalog(),
      rules: existsSync(rulesFile) ? readJson(rulesFile, 'the skill\'s rules') : null,
      maps: await readMaps(),
      now,
      maxAgeHours,
      dryRun: options['dry-run'],
    });
  } catch (error) {
    // A ledger of a version this code does not read, most likely: say so rather than sort a file it cannot read.
    fail(`Cannot build the packet: ${String(error.message).replace(/\s+/g, ' ')}`);
  }

  const outDir = path.resolve(root, options.out);
  const refusedForReal = packet.result === 'refused' && !options['dry-run'];

  if (refusedForReal) {
    // A packet left by an earlier run must not be read as this one's.
    for (const file of [PACKET_JSON, PACKET_MD]) {
      rmSync(path.join(outDir, file), { force: true });
    }
  } else {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, PACKET_JSON), `${JSON.stringify(packet, null, 2)}\n`);
    writeFileSync(path.join(outDir, PACKET_MD), renderPacket(packet));
  }

  const { outcomes } = packet.counts;
  const lines = [`result: ${packet.result}${options['dry-run'] ? ' (dry run)' : ''}`, ...packet.refusals.map(reason => `refused: ${reason}`)];

  if (!refusedForReal) {
    lines.push(`new findings: ${packet.counts.new}; came back: ${packet.counts.returned}; attributable: ${outcomes.attributable} in ${packet.counts.attributableGroups} groups; `
      + `inherited: ${outcomes.inherited}; newly measured: ${outcomes['newly-measured']}; not on changed code: ${outcomes['not-on-changed-code']}; `
      + `not a defect: ${outcomes['not-a-defect']}; needs triage: ${outcomes['needs-triage']}; not sorted: ${outcomes.unsorted}`,
    `packet: ${path.join(outDir, PACKET_MD)}`);
  }

  process.stdout.write(`${lines.join('\n')}\n`);

  if (refusedForReal) {
    process.exitCode = 3;
  }
}
