import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { CROSS_BROWSERS, THEMES, VISUAL_TIERS, WRAPPERS } from '../../src/config.mjs';
import {
  TIER_NAMES, isInTier, parseWrappers, pruneExpected, resolveTier, tierPrefixes,
} from '../visual-tiers.mjs';

// This module decides what a pull request renders and which golden records it is measured
// against. A prefix that drifts from `helpers.screenshotPath()` would either prune a variant the
// build did render (every one of its items reported as new) or keep one it did not (every item
// reported as deleted), so the layout is pinned against a real manifest.

// The 11 distinct top-two-level prefixes a real `base/develop` manifest held on 2026-09-11.
const DEVELOP_PREFIXES = [
  'js/chromium/',
  'js/chromium-theme-main/',
  'js/chromium-theme-main-dark/',
  'js/chromium-theme-horizon/',
  'js/chromium-theme-horizon-dark/',
  'angular-wrapper/chromium/',
  'react-wrapper/chromium/',
  'vue3/chromium/',
  'cross-browser/chromium/',
  'cross-browser/firefox/',
  'cross-browser/webkit/',
];
const PR_PREFIXES = ['js/chromium-theme-main/', 'js/chromium-theme-main-dark/'];

test('the table names the three tiers, in order', () => {
  assert.deepEqual(TIER_NAMES, ['pr', 'seed', 'full']);
});

test('the pr tier has no cross-browser leg and no classic render', () => {
  // visual.yml drops the cross-browser render job for `pr` on this basis, and run-tests.mjs skips
  // the bare pass; the workflow's matrix shape and this table must agree.
  assert.deepEqual(VISUAL_TIERS.pr.browsers, []);
  assert.equal(VISUAL_TIERS.pr.classic, false);
  assert.deepEqual(VISUAL_TIERS.seed.browsers, CROSS_BROWSERS);
  assert.deepEqual(VISUAL_TIERS.full.browsers, CROSS_BROWSERS);
});

test('parseWrappers accepts nothing', () => {
  assert.deepEqual(parseWrappers(undefined), []);
  assert.deepEqual(parseWrappers(''), []);
  assert.deepEqual(parseWrappers('   '), []);
  assert.deepEqual(parseWrappers('[]'), []);
});

test('parseWrappers accepts a JSON array of names, in WRAPPERS order, deduplicated', () => {
  assert.deepEqual(parseWrappers('["vue3", "react-wrapper", "vue3"]'), ['react-wrapper', 'vue3']);
});

test('parseWrappers accepts the Integration wrapper matrix shape too', () => {
  const matrix = JSON.stringify([
    { name: 'Vue 3', pkg: 'vue3', artifact: 'vue3-build', test: 'test' },
    { name: 'Angular', pkg: 'angular-wrapper', artifact: 'angular-wrapper-build', test: 'test:ci' },
  ]);

  assert.deepEqual(parseWrappers(matrix), ['angular-wrapper', 'vue3']);
});

test('parseWrappers accepts a comma- or whitespace-separated list', () => {
  assert.deepEqual(parseWrappers('react-wrapper vue3'), ['react-wrapper', 'vue3']);
  assert.deepEqual(parseWrappers('react-wrapper,vue3'), ['react-wrapper', 'vue3']);
  assert.deepEqual(parseWrappers(' vue3 , react-wrapper '), ['react-wrapper', 'vue3']);
});

test('parseWrappers throws on an unknown wrapper instead of rendering nothing', () => {
  assert.throws(() => parseWrappers('react'), /Unknown wrapper "react"/);
  assert.throws(() => parseWrappers('["vue3", "angular"]'), /Unknown wrapper "angular"/);
  assert.throws(() => parseWrappers('[{"name":"Vue 3","pkg":"vue"}]'), /Unknown wrapper "vue"/);
  assert.throws(() => parseWrappers('[{"name":"Vue 3"}]'), /Unknown wrapper entry/);
  assert.throws(() => parseWrappers('[not json'), /not valid JSON/);
  assert.throws(() => parseWrappers('["vue3"'), /not valid JSON/);
});

test('resolveTier honors VISUAL_TIER', () => {
  assert.equal(resolveTier({ VISUAL_TIER: 'pr' }).name, 'pr');
  assert.equal(resolveTier({ VISUAL_TIER: 'seed' }).name, 'seed');
  assert.equal(resolveTier({ VISUAL_TIER: 'full' }).name, 'full');
  // The environment wins over the branch: a develop build asked for `full` renders everything.
  assert.equal(resolveTier({ VISUAL_TIER: 'full', GITHUB_REF_NAME: 'develop' }).name, 'full');
});

test('resolveTier defaults to seed on the base branch and full anywhere else', () => {
  // The behavior every local run had before the tiers existed: develop renders js and copies it,
  // a feature branch renders everything.
  assert.equal(resolveTier({ GITHUB_REF_NAME: 'develop' }).name, 'seed');
  assert.equal(resolveTier({ GITHUB_REF_NAME: 'feature/x' }).name, 'full');
  assert.equal(resolveTier({}, { currentBranch: () => 'develop' }).name, 'seed');
  assert.equal(resolveTier({}, { currentBranch: () => 'feature/x' }).name, 'full');
  assert.equal(resolveTier({}).name, 'full');
});

test('GITHUB_REF_NAME wins over the branch callback', () => {
  let asked = false;
  const tier = resolveTier({ GITHUB_REF_NAME: 'develop' }, {
    currentBranch: () => {
      asked = true;

      return 'feature/x';
    },
  });

  assert.equal(tier.name, 'seed');
  assert.equal(asked, false);
});

test('resolveTier throws on an unknown tier', () => {
  assert.throws(
    () => resolveTier({ VISUAL_TIER: 'nightly' }),
    { message: 'Unknown VISUAL_TIER "nightly"; expected one of pr, seed, full.' },
  );
});

test('the pr tier renders the wrappers VISUAL_WRAPPERS names, after js', () => {
  const none = resolveTier({ VISUAL_TIER: 'pr' });
  const some = resolveTier({ VISUAL_TIER: 'pr', VISUAL_WRAPPERS: '[{"pkg":"vue3"},{"pkg":"angular-wrapper"}]' });

  assert.deepEqual(none.frameworks, ['js']);
  assert.deepEqual(none.wrappers, []);
  assert.deepEqual(some.frameworks, ['js', 'angular-wrapper', 'vue3']);
  assert.deepEqual(some.wrappers, ['angular-wrapper', 'vue3']);
  assert.deepEqual(some.prefixes, [...PR_PREFIXES, 'angular-wrapper/chromium/', 'vue3/chromium/']);
  assert.throws(() => resolveTier({ VISUAL_TIER: 'pr', VISUAL_WRAPPERS: 'reactt' }), /Unknown wrapper/);
});

test('seed and full ignore VISUAL_WRAPPERS', () => {
  const seed = resolveTier({ VISUAL_TIER: 'seed', VISUAL_WRAPPERS: '["vue3"]' });
  const full = resolveTier({ VISUAL_TIER: 'full', VISUAL_WRAPPERS: '["vue3"]' });

  // The seed copies js into every wrapper directory; nothing is selected and nothing is rendered.
  assert.deepEqual(seed.frameworks, ['js']);
  assert.deepEqual(seed.wrappers, []);
  assert.equal(seed.copyWrappers, true);
  // The full tier renders every wrapper for real, whatever the matrix said.
  assert.deepEqual(full.frameworks, ['js', ...WRAPPERS]);
  assert.deepEqual(full.wrappers, WRAPPERS);
  assert.equal(full.copyWrappers, false);
});

test('a resolved tier copies the table instead of sharing its arrays', () => {
  const tier = resolveTier({ VISUAL_TIER: 'seed' });

  tier.themes.push('x');
  tier.browsers.push('x');
  tier.frameworks.push('x');

  assert.deepEqual(VISUAL_TIERS.seed.themes, THEMES);
  assert.deepEqual(VISUAL_TIERS.seed.browsers, CROSS_BROWSERS);
  assert.deepEqual(VISUAL_TIERS.seed.frameworks, ['js']);
});

test('the pr tier compares js × {main, main-dark} and nothing else', () => {
  const { prefixes } = resolveTier({ VISUAL_TIER: 'pr' });

  assert.deepEqual(prefixes, PR_PREFIXES);
  DEVELOP_PREFIXES
    .filter(prefix => !PR_PREFIXES.includes(prefix))
    .forEach((prefix) => {
      assert.equal(isInTier(`${prefix}x/y-1.png`, prefixes), false, `${prefix} must be outside the pr tier`);
    });
});

test('seed and full cover every prefix a real base/develop manifest uses', () => {
  ['seed', 'full'].forEach((name) => {
    const { prefixes } = resolveTier({ VISUAL_TIER: name });

    assert.equal(prefixes.length, DEVELOP_PREFIXES.length, `${name} must have exactly the manifest's prefixes`);
    DEVELOP_PREFIXES.forEach((prefix) => {
      assert.ok(prefixes.includes(prefix), `${name} must include ${prefix}`);
    });
  });
});

test('tierPrefixes lists a wrapper once whether it is rendered, copied, or both', () => {
  const base = { classic: false, themes: [], browsers: [] };

  assert.deepEqual(
    tierPrefixes({ ...base, frameworks: ['js', 'vue3'], copyWrappers: false }),
    ['vue3/chromium/'],
  );
  assert.deepEqual(
    tierPrefixes({ ...base, frameworks: ['js'], copyWrappers: true }),
    WRAPPERS.map(wrapper => `${wrapper}/chromium/`),
  );
  assert.deepEqual(
    tierPrefixes({ ...base, frameworks: ['js', 'vue3'], copyWrappers: true }),
    WRAPPERS.map(wrapper => `${wrapper}/chromium/`),
  );
  // Layout order: classic, themes, wrappers, browsers.
  assert.deepEqual(
    tierPrefixes({ frameworks: ['js'], classic: true, themes: ['main'], browsers: ['webkit'], copyWrappers: false }),
    ['js/chromium/', 'js/chromium-theme-main/', 'cross-browser/webkit/'],
  );
});

test('isInTier matches on the directory prefix and tolerates a leading ./', () => {
  const prefixes = ['js/chromium/', 'js/chromium-theme-main/'];

  assert.equal(isInTier('js/chromium/js-only/x-1.png', prefixes), true);
  assert.equal(isInTier('./js/chromium-theme-main/js-only/x-1.png', prefixes), true);
  assert.equal(isInTier('js\\chromium\\js-only\\x-1.png', prefixes), true);
  // `js/chromium/` must not swallow the theme directories that share its stem.
  assert.equal(isInTier('js/chromium-theme-horizon/js-only/x-1.png', prefixes), false);
  assert.equal(isInTier('cross-browser/chromium/x-1.png', prefixes), false);
  assert.equal(isInTier('x-1.png', prefixes), false);
});

test('pruneExpected keeps the tier, deletes the rest, and removes the directories that emptied', () => {
  const dir = mkdtempSync(join(tmpdir(), 'visual-tiers-'));
  const files = [
    'js/chromium-theme-main/js-only/a-1.png',
    'js/chromium-theme-main-dark/js-only/a-1.png',
    'js/chromium/js-only/a-1.png',
    'js/chromium-theme-horizon/js-only/a-1.png',
    'react-wrapper/chromium/multi-frameworks/b-1.png',
    'cross-browser/webkit/c-1.png',
  ];

  files.forEach((file) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), file);
  });

  const result = pruneExpected(dir, PR_PREFIXES);

  assert.deepEqual(result, {
    kept: 2,
    pruned: 4,
    prunedDirs: ['cross-browser/webkit/', 'js/chromium-theme-horizon/', 'js/chromium/', 'react-wrapper/chromium/'],
  });
  // The in-tier files and their tree are untouched, next to the pruned siblings.
  assert.ok(existsSync(join(dir, 'js/chromium-theme-main/js-only/a-1.png')));
  assert.ok(existsSync(join(dir, 'js/chromium-theme-main-dark/js-only/a-1.png')));
  // Out-of-tier files are gone with the directories they emptied, down to the shared `js/` parent
  // that still holds in-tier records.
  assert.equal(existsSync(join(dir, 'js/chromium')), false);
  assert.equal(existsSync(join(dir, 'js/chromium-theme-horizon')), false);
  assert.equal(existsSync(join(dir, 'react-wrapper')), false);
  assert.equal(existsSync(join(dir, 'cross-browser')), false);
  assert.ok(existsSync(join(dir, 'js')));
  // The expected directory itself survives, so `reg-suit compare` still finds it.
  assert.ok(existsSync(dir));
});

test('pruneExpected on a full-tier render removes nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'visual-tiers-'));

  DEVELOP_PREFIXES.forEach((prefix) => {
    mkdirSync(join(dir, prefix), { recursive: true });
    writeFileSync(join(dir, prefix, 'x-1.png'), prefix);
  });

  assert.deepEqual(pruneExpected(dir, resolveTier({ VISUAL_TIER: 'full' }).prefixes), {
    kept: DEVELOP_PREFIXES.length, pruned: 0, prunedDirs: [],
  });
});

test('pruneExpected on a missing directory returns zeros without throwing', () => {
  // The bootstrap path: `sync-expected` fetched nothing because the key does not exist yet.
  assert.deepEqual(pruneExpected(join(tmpdir(), 'visual-tiers-does-not-exist'), PR_PREFIXES), {
    kept: 0, pruned: 0, prunedDirs: [],
  });
});
