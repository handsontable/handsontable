/**
 * Resolves which visual variants a build renders and compares — its tier — and maps a tier onto the
 * golden-record layout, so a subset render is compared against an exact subset of the goldens.
 *
 * Pure except `pruneExpected`, and dependency-free (node:fs, node:path, the config table), so the
 * branching that decides what a pull request renders and what it is measured against is unit-tested
 * without a browser or a bucket. The table itself is `VISUAL_TIERS` in `../src/config.mjs`; this
 * module only reads it. `scripts/utils/utils.mjs` is where the scripts pick it up.
 */

import { existsSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { BASE_BRANCH, REFERENCE_FRAMEWORK, VISUAL_TIERS, WRAPPERS } from '../src/config.mjs';

/**
 * The tier names, in the table's order.
 */
export const TIER_NAMES = Object.keys(VISUAL_TIERS);

/**
 * @typedef {object} ResolvedTier
 * @property {string} name The tier name.
 * @property {string[]} frameworks The frameworks `run-tests.mjs` renders, js first.
 * @property {boolean} classic Whether the bare chromium js run (no HOT_THEME) happens.
 * @property {string[]} themes The HOT_THEME runs.
 * @property {string[]} browsers The cross-browser leg's projects; empty when the leg does not run.
 * @property {boolean} copyWrappers Whether the js render is copied into every wrapper directory afterwards.
 * @property {string[]} wrappers The wrappers rendered for real.
 * @property {string[]} prefixes The screenshot-relative directory prefixes this tier's records sit under.
 */

/**
 * Parses `VISUAL_WRAPPERS` into the wrappers it names.
 *
 * Accepts every shape a caller produces: nothing (`undefined` or an empty string); a JSON array of
 * wrapper directory names (the Checks scope router's `visual-wrappers` output, which test.yml passes
 * through as it is); the router's Integration wrapper matrix, a JSON array of objects whose `pkg` is
 * the directory (`[{"name":"Angular","pkg":"angular-wrapper",…}]`), for a caller that has only that;
 * or a comma- or whitespace-separated list for a hand-typed local run.
 *
 * An unknown name throws instead of being dropped: a typo that silently rendered no wrapper would
 * pass a `wrappers/` pull request with the wrapper never looked at.
 *
 * @param {string | undefined} value The raw `VISUAL_WRAPPERS` value.
 * @returns {string[]} The wrappers named, in `WRAPPERS` order, without duplicates.
 */
export function parseWrappers(value) {
  const raw = (value ?? '').trim();

  if (raw === '') {
    return [];
  }

  let names;

  if (raw.startsWith('[')) {
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`VISUAL_WRAPPERS is not valid JSON: ${error.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error('VISUAL_WRAPPERS must be a JSON array when it starts with "[".');
    }

    names = parsed.map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }

      if (entry && typeof entry.pkg === 'string') {
        return entry.pkg;
      }

      throw new Error(`Unknown wrapper entry ${JSON.stringify(entry)} in VISUAL_WRAPPERS; `
        + 'expected a wrapper directory name or an object with a "pkg".');
    });
  } else {
    names = raw.split(/[\s,]+/).filter(Boolean);
  }

  const unknown = names.find(name => !WRAPPERS.includes(name));

  if (unknown !== undefined) {
    throw new Error(`Unknown wrapper "${unknown}" in VISUAL_WRAPPERS; expected any of ${WRAPPERS.join(', ')}.`);
  }

  return WRAPPERS.filter(wrapper => names.includes(wrapper));
}

/**
 * The screenshot-relative directory prefixes a tier's render lands in, each ending in `/`.
 *
 * Mirrors `helpers.screenshotPath()` in `../src/helpers.ts`: `js/chromium/` for the bare render,
 * `js/chromium-theme-<theme>/` per theme, `<wrapper>/chromium/` for a wrapper that is rendered or
 * copied, and `cross-browser/<browser>/` for the cross-browser leg. Every golden record sits under
 * exactly one of these, which is what makes a tier an exact subset of the golden set.
 *
 * @param {object} tier A tier, resolved or straight from `VISUAL_TIERS`.
 * @param {string[]} tier.frameworks The frameworks rendered.
 * @param {boolean} tier.classic Whether the bare js render runs.
 * @param {string[]} tier.themes The themes rendered.
 * @param {string[]} tier.browsers The cross-browser leg's projects.
 * @param {boolean} tier.copyWrappers Whether the js render is copied into every wrapper directory.
 * @returns {string[]} The prefixes, deduplicated, in layout order.
 */
export function tierPrefixes({ frameworks, classic, themes, browsers, copyWrappers }) {
  const prefixes = [];

  if (classic) {
    prefixes.push(`${REFERENCE_FRAMEWORK}/chromium/`);
  }

  themes.forEach((theme) => {
    prefixes.push(`${REFERENCE_FRAMEWORK}/chromium-theme-${theme}/`);
  });

  WRAPPERS.forEach((wrapper) => {
    if (copyWrappers || frameworks.includes(wrapper)) {
      prefixes.push(`${wrapper}/chromium/`);
    }
  });

  browsers.forEach((browser) => {
    prefixes.push(`cross-browser/${browser}/`);
  });

  return [...new Set(prefixes)];
}

/**
 * Resolves the tier a build runs in.
 *
 * `VISUAL_TIER` wins when set (the workflows always set it). Unset, the branch decides the way the
 * scripts always did before the tiers existed: `BASE_BRANCH` renders js and copies it into the
 * wrappers (`seed`), any other branch renders everything (`full`) — so a bare `npm run test` on a
 * feature branch is unchanged. The branch is `GITHUB_REF_NAME` when set, else what `currentBranch()`
 * returns when a caller passes one (the scripts pass `getCurrentBranchName`), else nothing.
 *
 * `VISUAL_WRAPPERS` is read in the `pr` tier only, where it adds the named wrappers to `frameworks`
 * after js. `seed` copies js and `full` renders every wrapper, so neither has anything to select.
 *
 * @param {object} [env=process.env] Where `VISUAL_TIER`, `VISUAL_WRAPPERS` and `GITHUB_REF_NAME` are read from.
 * @param {object} [options] Resolution options.
 * @param {() => string} [options.currentBranch] Returns the checked-out branch when `GITHUB_REF_NAME` is unset.
 * @returns {ResolvedTier} The tier.
 */
export function resolveTier(env = process.env, { currentBranch } = {}) {
  let name = env.VISUAL_TIER;

  if (name) {
    if (!TIER_NAMES.includes(name)) {
      throw new Error(`Unknown VISUAL_TIER "${name}"; expected one of ${TIER_NAMES.join(', ')}.`);
    }
  } else {
    const branch = env.GITHUB_REF_NAME || (currentBranch ? currentBranch() : '');

    name = branch === BASE_BRANCH ? 'seed' : 'full';
  }

  const table = VISUAL_TIERS[name];
  const wrappers = name === 'pr'
    ? parseWrappers(env.VISUAL_WRAPPERS)
    : table.frameworks.filter(framework => WRAPPERS.includes(framework));
  const tier = {
    name,
    frameworks: name === 'pr' ? [...table.frameworks, ...wrappers] : [...table.frameworks],
    classic: table.classic,
    themes: [...table.themes],
    browsers: [...table.browsers],
    copyWrappers: table.copyWrappers,
    wrappers,
  };

  return { ...tier, prefixes: tierPrefixes(tier) };
}

/**
 * Whether a golden record belongs to a tier.
 *
 * @param {string} item A path relative to the screenshots root, as reg-suit's manifest lists them
 * (`js/chromium-theme-main/js-only/x-1.png`); a leading `./` is tolerated.
 * @param {string[]} prefixes The tier's prefixes from `tierPrefixes()`.
 * @returns {boolean} `true` when the item sits under one of the prefixes.
 */
export function isInTier(item, prefixes) {
  const normalized = item.replace(/\\/g, '/').replace(/^(\.\/)+/, '');

  return prefixes.some(prefix => normalized.startsWith(prefix));
}

/**
 * Deletes every fetched golden record outside a tier, then the directories that emptied.
 *
 * reg-suit reports every expected file with no actual counterpart as a deleted item, so a subset
 * render compared against the whole baseline lists every variant it did not render as deleted —
 * about 1178 phantom deletions for the `pr` tier against a full `base/develop`. Pruning
 * `.reg/expected` to the tier's prefixes between `reg-suit sync-expected` and `reg-suit compare`
 * turns that into an exact subset comparison, and `visual-gate.mjs` reads the result unchanged.
 * `expectedDir` itself stays even when everything under it goes, so `compare` still finds it.
 *
 * Synchronous on purpose: `compare.mjs` runs it between two spawned processes and nothing else runs
 * meanwhile.
 *
 * @param {string} expectedDir The directory `sync-expected` filled (`.reg/expected`).
 * @param {string[]} prefixes The tier's prefixes from `tierPrefixes()`.
 * @returns {{ kept: number, pruned: number, prunedDirs: string[] }} The counts, and the top-two-level
 * directories (`js/chromium-theme-horizon/`, `cross-browser/webkit/`) that lost files, sorted, for the log line.
 */
export function pruneExpected(expectedDir, prefixes) {
  const result = { kept: 0, pruned: 0, prunedDirs: [] };

  if (!existsSync(expectedDir)) {
    return result;
  }

  const prunedDirs = new Set();
  const walk = (dir) => {
    readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);

        if (readdirSync(full).length === 0) {
          rmdirSync(full);
        }

        return;
      }

      const item = relative(expectedDir, full).split(sep).join('/');

      if (isInTier(item, prefixes)) {
        result.kept += 1;
      } else {
        unlinkSync(full);
        result.pruned += 1;
        prunedDirs.add(`${item.split('/').slice(0, -1).slice(0, 2).join('/') || '.'}/`);
      }
    });
  };

  walk(expectedDir);
  result.prunedDirs = [...prunedDirs].sort();

  return result;
}
