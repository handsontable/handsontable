/**
 * The visual compare record: what one Compare job found, in a shape the cross-run flake ledger reads.
 *
 * Pure: `scripts/compare-record.mjs` reads `.reg/out.json`, hashes each changed and new item's render, and
 * writes the file.
 *
 * Until this record existed a visual flake had no memory. The pull request gate and the nightly both said
 * "changed" and moved on, so the second sighting of the same capture on an unrelated pull request was
 * rediscovered from scratch – which is how the filters family and the WebKit selection captures (DEV-2797)
 * flaked for weeks before anyone could say how often. The functional tier had the ledger for that since
 * the flake-ledger work (`.github/workflows/test-health.yml`); this record is how the visual tier joins it:
 * every Compare uploads one, green or red, as a `visual-compare-<tier>` artifact, and
 * `.github/scripts/lib/test-health.mjs` turns its changed items into ledger entries.
 *
 * Three decisions are worth knowing before changing it.
 *
 * - **An item is identified by its capture, not by its path.** The path carries the variant
 *   (`js/chromium-theme-main-dark/…`), and a capture that differs on two themes in one run is one
 *   recurrence, not two – the rule the ledger already applies to the two `-min` legs of the functional
 *   suite. So the record splits every path into its `leg` (the variant prefix) and its `capture` (the
 *   rest, without `.png`), and the ledger keys on the capture.
 * - **Each changed or new item carries the sha256 of its render** (a deleted item has none). That is the
 *   input to the byte-equality diagnostic `visual-tests/AGENTS.md` describes: when two unrelated pull
 *   requests fail on the same item with identical bytes, the render is deterministic and the golden record
 *   is the odd one out. The record keeps the hash; comparing two of them is still the reader's step.
 * - **The record is written before the verdict and the budget, and never carries either.** It is data
 *   about the comparison, taken the moment the comparison ends, so the same step serves the credentialed
 *   and the credential-free paths and a pull request whose verdict step later fails still leaves its
 *   evidence behind. Whether a difference blocked is the gate's business, not the ledger's.
 */

export const RECORD_VERSION = 1;

/**
 * Where a golden-record path came from: the variant it was rendered on, the spec that took it, and the
 * capture it is.
 *
 * The inverse of `helpers.screenshotPath()` (src/helpers.ts). A js or wrapper path is
 * `<framework>/<browser>[-theme-<theme>]/<spec path under tests/>-<N>.png`. A cross-browser path is
 * `cross-browser/<browser>/<spec basename><safeUrl>-<N>.png`, where `safeUrl` is the demo's pathname with
 * every non-word character turned into `-` and is empty on the root page – so the spec cannot be read off
 * the path alone and is matched against the cross-browser spec basenames, longest first. Measured on
 * 2026-09-23 against the live `base/develop/out.json`: all 1676 items map to a spec on disk, and no
 * cross-browser basename is a dash-boundary prefix of another, so the longest-first rule never has to
 * choose.
 *
 * @param {string} item A golden-record path, as reg-suit lists it.
 * @param {string[]} crossBrowserSpecs The basenames (no `.spec.ts`) of the specs under
 * `tests/cross-browser/`.
 * @returns {{leg: string, spec: string, capture: string, index: number} | null} The origin, or `null` when
 * the path has no shape this suite writes. `spec` is repository-relative.
 */
export function itemToSpec(item, crossBrowserSpecs) {
  const match = /^(.+)-(\d+)\.png$/.exec(String(item).replace(/^(\.\/)+/, ''));

  if (!match) {
    return null;
  }

  const [, stem, index] = match;
  const [framework, variant, ...rest] = stem.split('/');

  if (!framework || !variant || rest.length === 0) {
    return null;
  }

  const leg = `${framework}/${variant}`;
  const remainder = rest.join('/');

  if (framework === 'cross-browser') {
    const base = [...crossBrowserSpecs]
      .sort((a, b) => b.length - a.length)
      .find(name => remainder === name || remainder.startsWith(`${name}-`));

    return base
      ? {
        leg,
        spec: `visual-tests/tests/cross-browser/${base}.spec.ts`,
        capture: `${remainder}-${index}`,
        index: Number(index),
      }
      : null;
  }

  return {
    leg,
    spec: `visual-tests/tests/${remainder}.spec.ts`,
    capture: `${remainder}-${index}`,
    index: Number(index),
  };
}

/**
 * The record of one comparison.
 *
 * @param {object} options Inputs.
 * @param {object | null} options.report The parsed `.reg/out.json`, or `null` when the comparison wrote none
 * (a bootstrap, or a comparison step that died).
 * @param {string} options.tier The tier rendered: `pr`, `seed` or `full`.
 * @param {{expected: string, actual: string}} options.keys The snapshot keys compared.
 * @param {{branch: string, sha: string, event: string, runId: string, runAttempt: number}} options.run Where
 * the comparison ran.
 * @param {string[]} options.crossBrowserSpecs The cross-browser spec basenames (see `itemToSpec`).
 * @param {(item: string) => string | null} [options.hashOf] The sha256 of an item's rendered file, or `null`
 * when it is absent. A deleted item has no render, so it is never asked.
 * @param {(item: string) => string | null} [options.quarantineOf] The quarantine entry text covering an item
 * (`DEV-1234 until 2026-10-08 — why`), or `null`. Asked for changed items only: the gate and the nightly
 * quarantine nothing else, so a new or deleted item under an entry is stamped `null` and still blocks.
 * @returns {object} The record.
 */
export function buildRecord({
  report, tier, keys, run, crossBrowserSpecs, hashOf = () => null, quarantineOf = () => null,
}) {
  const bucket = name => (Array.isArray(report?.[name]) ? report[name] : []);
  const describe = (item, status) => {
    const origin = itemToSpec(item, crossBrowserSpecs);

    return {
      path: item,
      status,
      leg: origin?.leg ?? null,
      spec: origin?.spec ?? null,
      capture: origin?.capture ?? null,
      actualSha256: status === 'deleted' ? null : hashOf(item),
      quarantine: status === 'changed' ? quarantineOf(item) : null,
    };
  };

  return {
    version: RECORD_VERSION,
    tier,
    expectedKey: keys.expected,
    actualKey: keys.actual,
    ...run,
    // `compared: false` is the bootstrap or a comparison that wrote no report. The record is still
    // uploaded, so the ledger sees the run happened; it simply carries nothing to count.
    compared: report !== null,
    counts: {
      changed: bucket('failedItems').length,
      new: bucket('newItems').length,
      deleted: bucket('deletedItems').length,
      passed: bucket('passedItems').length,
    },
    // Passes are counted, never listed: the ledger stores only what differed.
    items: [
      ...bucket('failedItems').map(item => describe(item, 'changed')),
      ...bucket('newItems').map(item => describe(item, 'new')),
      ...bucket('deletedItems').map(item => describe(item, 'deleted')),
    ],
  };
}

/**
 * The file name a record is written under. One Compare job per run and tier, so the tier and the commit
 * make it unique; the artifact that carries it is named after the tier alone.
 *
 * @param {string} tier The tier.
 * @param {string} sha The commit compared.
 * @returns {string} The file name.
 */
export function recordFileName(tier, sha) {
  return `visual-compare-${tier}-${String(sha).slice(0, 12) || 'unknown'}.json`;
}
