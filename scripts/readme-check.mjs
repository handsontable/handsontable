/**
 * @file Consistency checks for the five published README files (root, the npm package, and the
 * three framework wrappers).
 *
 * These are the READMEs a developer meets first, on npm and on GitHub, and every class of problem
 * checked here has actually shipped: a Community link pointing at GitHub Discussions after that
 * feature was switched off, quick-start snippets that dropped their theme stylesheet and so render
 * an unstyled grid, wrapper feature lists left behind when the root gained a bullet, and setup
 * examples pinned to a version we no longer publish.
 *
 * Every exported function here is pure — it takes markdown text and returns findings — so the unit
 * tests in `scripts/__tests__/readme-check.test.mjs` cover the logic without touching the network
 * or the filesystem. Only `main()` reads files and makes requests.
 *
 * Usage:
 *   node scripts/readme-check.mjs              # everything, internal links only (the PR gate)
 *   node scripts/readme-check.mjs --links=all  # also resolve third-party links (nightly)
 *   node scripts/readme-check.mjs --links=none # no network at all
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The READMEs this script owns. `flavour` selects the docs URL prefix a file's links are expected
 * to use; `quickStart` is false where a README deliberately delegates setup to the wrappers.
 *
 * @type {{file: string, label: string, flavour: string}[]}
 */
export const READMES = [
  { file: 'README.md', label: 'root', flavour: 'javascript' },
  { file: 'handsontable/README.md', label: 'npm', flavour: 'javascript' },
  { file: 'wrappers/react-wrapper/README.md', label: 'react', flavour: 'react' },
  { file: 'wrappers/angular-wrapper/README.md', label: 'angular', flavour: 'angular' },
  { file: 'wrappers/vue3/README.md', label: 'vue', flavour: 'vue' },
];

/**
 * Docs URL prefix per flavour. `vue-data-grid` is deliberately not `vue3-data-grid`: the latter
 * 404s, and has done before — it is the exact wrong-prefix bug this check exists to catch.
 *
 * @type {Record<string, string>}
 */
export const DOCS_PREFIX = {
  javascript: 'javascript-data-grid',
  react: 'react-data-grid',
  angular: 'angular-data-grid',
  vue: 'vue-data-grid',
};

/** Hosts we publish ourselves, and so are able to break. Checked on every pull request. */
const INTERNAL = [/^([a-z0-9-]+\.)*handsontable\.com$/, /^github\.com$/, /^raw\.githubusercontent\.com$/];

/**
 * Pull every URL out of a markdown file, covering both markdown links and the raw HTML the
 * READMEs use for their headers and badges.
 *
 * @param {string} md Markdown source.
 * @returns {{url: string, line: number}[]} Every URL found, with its 1-based line number.
 */
export function extractLinks(md) {
  const out = [];
  const patterns = [
    /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, // [text](url)
    /\b(?:href|src|srcset)="([^"]+)"/g, // <a href> / <img src> / <source srcset>
  ];

  md.split('\n').forEach((text, i) => {
    for (const re of patterns) {
      re.lastIndex = 0;
      let m = re.exec(text);

      while (m !== null) {
        // srcset can carry a descriptor ("url 2x"); the URL is the first token.
        const url = m[1].split(/\s+/)[0];

        if (!url.startsWith('#') && !url.startsWith('mailto:')) {
          out.push({ url, line: i + 1 });
        }
        m = re.exec(text);
      }
    }
  });

  return out;
}

/**
 * Whether a URL points at something we publish, as opposed to a third party (npm, jsDelivr,
 * SonarCloud, Figma). Only internal links are resolved on a pull request: a third party being slow
 * or rate-limiting us is not a reason to fail someone's build.
 *
 * @param {string} url The URL to classify.
 * @returns {boolean} `true` for our own hosts and for repo-relative paths.
 */
export function isInternal(url) {
  if (!/^https?:/.test(url)) {
    return true; // relative path inside the repo
  }

  try {
    return INTERNAL.some(re => re.test(new URL(url).hostname));
  } catch {
    return false;
  }
}

/**
 * Feature bullets from the "Key Features" list, as their visible labels. The list is written as
 * `✅&nbsp; [Label](url)`, one per line.
 *
 * @param {string} md Markdown source.
 * @returns {string[]} Feature labels, in document order.
 */
export function extractFeatures(md) {
  return [...md.matchAll(/✅[^[]*\[([^\]]+)\]/g)].map(m => m[1].trim());
}

/**
 * Wording that is legitimately different between the root README and a wrapper, keyed by the root's
 * label. A wrapper may use the alternative instead of the root's phrasing without being flagged.
 *
 * @type {Record<string, string[]>}
 */
export const FEATURE_ALIASES = {
  'Frozen rows and columns': ['Pinned/frozen columns', 'Frozen columns'],
  'Hiding rows and columns': ['Hiding columns'],
};

/**
 * Compare each README's feature list against the root's. The root is the superset by convention:
 * a wrapper may word a bullet differently (see `FEATURE_ALIASES`) but may not silently drop one.
 *
 * @param {{label: string, features: string[]}[]} lists One entry per README, root included.
 * @returns {{label: string, missing: string[]}[]} Files that are missing root features.
 */
export function featureDrift(lists) {
  const root = lists.find(l => l.label === 'root');

  if (!root) {
    throw new Error('featureDrift needs the root README in its input');
  }

  return lists
    .filter(l => l.label !== 'root')
    .map(({ label, features }) => {
      const missing = root.features.filter((feature) => {
        const accepted = [feature, ...(FEATURE_ALIASES[feature] ?? [])];

        return !accepted.some(name => features.includes(name));
      });

      return { label, missing };
    })
    .filter(entry => entry.missing.length > 0);
}

/**
 * Version numbers written into setup examples that no longer match what we publish. Covers npm
 * specifiers, package.json snippets and version-pinned CDN paths.
 *
 * @param {string} md Markdown source.
 * @param {string} version The version the monorepo is on (`HOT_VERSION`).
 * @returns {{found: string, context: string}[]} Every stale reference.
 */
export function findStaleVersions(md, version) {
  const patterns = [
    /(?:^|[^\w@/])((?:@handsontable\/[a-z0-9-]+|handsontable)@(\d+\.\d+\.\d+))/g,
    /("(?:@handsontable\/[a-z0-9-]+|handsontable)":\s*"[\^~]?(\d+\.\d+\.\d+)")/g,
    /(cdn\.jsdelivr\.net\/npm\/(?:@handsontable\/[a-z0-9-]+|handsontable)@(\d+\.\d+\.\d+))/g,
  ];
  const out = [];

  for (const re of patterns) {
    for (const m of md.matchAll(re)) {
      if (m[2] !== version) {
        out.push({ found: m[2], context: m[1].trim() });
      }
    }
  }

  return out;
}

/**
 * Docs links that use the wrong framework prefix for the README they sit in — a Vue reader sent to
 * the JavaScript docs, or to the `vue3-data-grid` prefix that does not exist.
 *
 * @param {{url: string, line: number}[]} links Links from `extractLinks`.
 * @param {string} flavour The README's framework (`DOCS_PREFIX` key).
 * @returns {{url: string, line: number}[]} Links whose prefix does not match the flavour.
 */
export function findWrongDocsPrefix(links, flavour) {
  const expected = DOCS_PREFIX[flavour];
  const known = new Set(Object.values(DOCS_PREFIX));

  return links.filter(({ url }) => {
    const m = url.match(/handsontable\.com\/docs\/([a-z0-9-]+)(\/|$)/);

    // Only judge links that name a framework section; shared pages such as /docs/api/ are fine
    // anywhere, and an unknown first segment is a page path, not a prefix.
    return m !== null && known.has(m[1]) && m[1] !== expected;
  });
}

/**
 * Statuses that mean the page is genuinely gone. Everything else non-2xx is reported as a warning:
 * npm answers every scripted request with 403, Figma 403s any non-browser user agent, and a 5xx or
 * a timeout is the host having a bad minute. Failing a build on those would make this check
 * something people learn to ignore, which is worse than not having it.
 *
 * @type {number[]}
 */
const DEAD = [404, 410];

/** A browser user agent: several hosts serve a 403 to anything that does not look like one. */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Resolve one URL, following redirects. HEAD first, falling back to GET for the hosts that answer
 * HEAD with a 405 (and for those that 404 a HEAD they would have served as a GET).
 *
 * @param {string} url The URL to resolve.
 * @param {number} timeoutMs Abort each attempt after this long.
 * @returns {Promise<number>} The final HTTP status, or 0 when the request could not be made.
 */
async function resolve(url, timeoutMs) {
  let last = 0;

  for (const method of ['HEAD', 'GET']) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: ctl.signal,
        headers: { 'User-Agent': UA, Accept: '*/*' },
      });

      last = res.status;

      if (res.ok) {
        return res.status;
      }
    } catch {
      last = 0;
    } finally {
      clearTimeout(timer);
    }
  }

  return last;
}

/**
 * Check a batch of URLs, a few at a time.
 *
 * @param {string[]} urls Absolute URLs, already de-duplicated.
 * @returns {Promise<Map<string, number>>} URL to final status (0 = unreachable).
 */
async function resolveAll(urls) {
  const statuses = new Map();
  const queue = [...urls];
  const worker = async() => {
    while (queue.length > 0) {
      const url = queue.shift();

      statuses.set(url, await resolve(url, 15000));
    }
  };

  await Promise.all(Array.from({ length: 8 }, worker));

  return statuses;
}

/**
 * Run every check and report. Exits non-zero when a check fails.
 *
 * @returns {Promise<void>} Resolves once the report has been printed.
 */
async function main() {
  const arg = process.argv.find(a => a.startsWith('--links='));
  const mode = arg ? arg.split('=')[1] : 'internal';

  if (!['none', 'internal', 'all'].includes(mode)) {
    console.error(`--links must be none, internal or all (got '${mode}')`);
    process.exit(2);
  }

  // eslint-disable-next-line import/extensions
  const { HOT_VERSION } = (await import('../hot.config.js')).default;
  const failures = [];
  const warnings = [];
  const files = READMES.map((meta) => {
    const md = readFileSync(path.join(ROOT, meta.file), 'utf8');

    return { ...meta, md, links: extractLinks(md), features: extractFeatures(md) };
  });

  // --- versions, themes, docs prefixes -------------------------------------------------------
  for (const file of files) {
    for (const stale of findStaleVersions(file.md, HOT_VERSION)) {
      failures.push(`${file.file}: '${stale.context}' is stale — we publish ${HOT_VERSION}`);
    }
    for (const link of findWrongDocsPrefix(file.links, file.flavour)) {
      failures.push(
        `${file.file}:${link.line}: '${link.url}' uses the wrong docs prefix for the ` +
        `${file.flavour} README (expected '${DOCS_PREFIX[file.flavour]}')`);
    }
  }

  // --- feature parity ------------------------------------------------------------------------
  for (const { label, missing } of featureDrift(files)) {
    const file = files.find(f => f.label === label).file;

    failures.push(`${file}: missing ${missing.length} feature(s) the root README lists: ${missing.join(', ')}`);
  }

  // --- links ---------------------------------------------------------------------------------
  if (mode !== 'none') {
    const wanted = new Map();

    for (const file of files) {
      for (const link of file.links) {
        if (!/^https?:/.test(link.url)) {
          // A repo-relative path: resolve it against the file it appears in.
          const target = path.resolve(ROOT, path.dirname(file.file), link.url.split(/[?#]/)[0]);

          if (!existsSync(target)) {
            failures.push(`${file.file}:${link.line}: '${link.url}' does not exist in the repo`);
          }
          continue;
        }
        if (mode === 'all' || isInternal(link.url)) {
          if (!wanted.has(link.url)) {
            wanted.set(link.url, []);
          }
          wanted.get(link.url).push(`${file.file}:${link.line}`);
        }
      }
    }

    console.log(`Resolving ${wanted.size} ${mode === 'all' ? '' : 'internal '}link(s)…`);
    const statuses = await resolveAll([...wanted.keys()]);

    for (const [url, where] of wanted) {
      const status = statuses.get(url);

      if (DEAD.includes(status)) {
        failures.push(`${where.join(', ')}: '${url}' returns ${status}`);
      } else if (status === 0) {
        warnings.push(`${where.join(', ')}: '${url}' could not be reached`);
      } else if (status >= 400) {
        warnings.push(`${where.join(', ')}: '${url}' returns ${status} (blocked or unavailable, not dead)`);
      }
    }
  }

  // --- report --------------------------------------------------------------------------------
  for (const warning of warnings) {
    console.log(`  warn  ${warning}`);
  }
  if (failures.length > 0) {
    console.error(`\n${failures.length} README problem(s):\n`);
    failures.forEach(f => console.error(`  ✗ ${f}`));
    console.error('');
    process.exit(1);
  }
  console.log(`\nREADMEs are consistent (${files.length} files, ${files[0].features.length} features).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
