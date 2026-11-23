import { fileURLToPath } from 'node:url';
import semver from 'semver';

/**
 * Release list of the Handsontable repository, as published on GitHub.
 *
 * `astro.config.mjs` reads it at build time to write `/docs/data/common.json`,
 * the file that every deployed docs version (current and frozen) loads to fill
 * its version dropdown. A build that writes a one-version list therefore strips
 * the older versions from all of them (DEV-4146).
 */

/**
 * The anonymous request. It returns every release body, about 600 KB for 100
 * releases, has no paging here, and shares the runner IP's rate limit.
 */
export const RELEASES_URL = 'https://api.github.com/repos/handsontable/handsontable/releases?per_page=100';

/**
 * The authenticated request. GraphQL needs a token, answers with the tag names
 * only, and pages. `deploy/getListOrPreviousVersions.mjs` reads the list through
 * this module too; it moved from the REST list to GraphQL after "Premature
 * close" failures on GitHub Actions runners.
 */
export const GRAPHQL_URL = 'https://api.github.com/graphql';

const GRAPHQL_QUERY = `
  query($after: String) {
    repository(owner: "handsontable", name: "handsontable") {
      releases(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          tagName
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

/**
 * The oldest minor that has deployed docs. Older minors are not listed.
 */
export const MIN_DOCS_VERSION = '9.0';

/**
 * How many pages of 100 releases the GraphQL request reads before it gives up.
 * The list is newest first, so it stops earlier, once it holds every release of
 * `MIN_DOCS_VERSION` and a stable release older than it.
 */
export const MAX_PAGES = 5;

/**
 * Converts a patch version to its minor line.
 *
 * @param {string} patchVersion A version such as "17.0.1".
 * @returns {string | null} The minor line such as "17.0", or `null` for an invalid version.
 */
export function toMinor(patchVersion) {
  const parsed = semver.parse(patchVersion);

  return parsed ? `${parsed.major}.${parsed.minor}` : null;
}

/**
 * Groups release tags by minor line.
 *
 * Prereleases and tags that are not valid versions are dropped. The minors come
 * back newest first and end at `MIN_DOCS_VERSION`, the patches of each minor
 * newest first.
 *
 * @param {string[]} tags Release tag names.
 * @returns {{ minors: string[], minorMap: Map<string, string[]> }} The minor lines and their patches.
 */
export function groupReleaseTags(tags) {
  const patchTags = tags
    .filter((tag) => semver.valid(tag) && !semver.prerelease(tag))
    .sort((a, b) => semver.rcompare(a, b));
  const minorMap = new Map();

  for (const tag of patchTags) {
    const minor = toMinor(tag);

    if (!minorMap.has(minor)) {
      minorMap.set(minor, []);
    }

    minorMap.get(minor).push(tag);
  }

  const minors = [...minorMap.keys()].sort((a, b) => semver.rcompare(`${a}.0`, `${b}.0`));
  const minIndex = minors.indexOf(MIN_DOCS_VERSION);

  return {
    minors: minIndex === -1 ? minors : minors.slice(0, minIndex + 1),
    minorMap,
  };
}

/**
 * Whether the tags already cover every release of `MIN_DOCS_VERSION`.
 *
 * The list is newest first. It covers the floor when it holds a stable release
 * of that minor and its last stable tag is already older than the minor, so no
 * later page can add another patch of it.
 *
 * @param {string[]} tags Release tag names, newest first.
 * @returns {boolean} `true` when no older page is needed.
 */
function coversFloor(tags) {
  const stable = tags.filter((tag) => semver.valid(tag) && !semver.prerelease(tag));
  const holdsFloor = stable.some((tag) => toMinor(tag) === MIN_DOCS_VERSION);

  return holdsFloor && semver.lt(stable.at(-1), `${MIN_DOCS_VERSION}.0`);
}

/**
 * Reads the tag names and the next page cursor from a GitHub response body.
 *
 * @param {boolean} graphql Whether the request went to the GraphQL endpoint.
 * @param {any} body The parsed response body.
 * @returns {{ tags: string[], next: string | null }} The tag names, and the cursor of the next page or `null`.
 */
function readPage(graphql, body) {
  if (graphql) {
    if (body?.errors?.length) {
      throw new Error(`GitHub GraphQL answered with an error: ${body.errors[0]?.message ?? 'unknown'}.`);
    }

    const releases = body?.data?.repository?.releases;

    if (!Array.isArray(releases?.nodes) || releases.nodes.length === 0) {
      throw new Error('GitHub returned no releases.');
    }

    return {
      tags: releases.nodes.map((node) => node.tagName),
      next: releases.pageInfo?.hasNextPage ? releases.pageInfo.endCursor ?? null : null,
    };
  }

  if (!Array.isArray(body) || body.length === 0) {
    throw new Error('GitHub returned no releases.');
  }

  return { tags: body.map((release) => release.tag_name), next: null };
}

/**
 * Reads the release tags from GitHub, retrying a transient failure.
 *
 * With a token the request goes to GraphQL, which lifts the limit from about 60
 * requests per hour for a shared runner IP to the token's own, returns tag
 * names only, and reads further pages until the list covers `MIN_DOCS_VERSION`
 * (at most `MAX_PAGES`). Without a token it falls back to the anonymous REST
 * list, which is one page of 100. A rejected token (401) is not retried. The
 * function throws once every attempt at a page has failed, so the caller
 * decides whether a missing list is fatal.
 *
 * @param {object} [options] The request options.
 * @param {string} [options.token] A GitHub token. The request is anonymous without one.
 * @param {typeof fetch} [options.fetchImpl] The `fetch` implementation.
 * @param {number} [options.attempts] How many times to try one page.
 * @param {number} [options.delayMs] The wait before the second attempt. It doubles after each failure.
 * @param {number} [options.timeoutMs] How long one attempt may take.
 * @param {number} [options.maxPages] The most pages to read.
 * @param {(ms: number) => Promise<void>} [options.sleep] The wait implementation.
 * @returns {Promise<string[]>} The tag names, newest release first.
 */
export async function fetchReleaseTags({
  token,
  fetchImpl = fetch,
  attempts = 5,
  delayMs = 2000,
  timeoutMs = 15000,
  maxPages = MAX_PAGES,
  sleep = (ms) => new Promise((done) => { setTimeout(done, ms); }),
} = {}) {
  const graphql = Boolean(token);
  const headers = {
    'User-Agent': 'handsontable-docs-build',
    Accept: 'application/vnd.github+json',
  };

  if (graphql) {
    headers.Authorization = `Bearer ${token}`;
    headers['Content-Type'] = 'application/json';
  }

  /**
   * Reads one page, retrying a transient failure.
   *
   * @param {string | null} after The cursor of the page, `null` for the first.
   * @returns {Promise<{ tags: string[], next: string | null }>} The page.
   */
  async function readOnePage(after) {
    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await fetchImpl(graphql ? GRAPHQL_URL : RELEASES_URL, {
          headers,
          signal: AbortSignal.timeout(timeoutMs),
          ...(graphql ? { method: 'POST', body: JSON.stringify({ query: GRAPHQL_QUERY, variables: { after } }) } : {}),
        });

        if (response.status === 401) {
          const rejected = new Error('GitHub rejected GITHUB_TOKEN (401).');

          rejected.retryable = false;
          throw rejected;
        }

        if (!response.ok) {
          throw new Error(`GitHub ${graphql ? 'GraphQL' : 'releases'} API answered ${response.status}${graphql ? '' : ' (no GITHUB_TOKEN was set)'}.`);
        }

        return readPage(graphql, await response.json());
      } catch (error) {
        lastError = error;

        if (error.retryable === false) {
          break;
        }

        if (attempt < attempts) {
          await sleep(delayMs * (2 ** (attempt - 1)));
        }
      }
    }

    throw lastError;
  }

  const tags = [];
  let after = null;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await readOnePage(after);

    tags.push(...result.tags);

    if (!result.next || coversFloor(tags)) {
      break;
    }

    after = result.next;
  }

  return tags;
}

/**
 * Reads the release history and groups it by minor line.
 *
 * @param {Parameters<typeof fetchReleaseTags>[0] & { requireFloor?: boolean }} [options] The options of
 *   `fetchReleaseTags()`. With `requireFloor`, the list must reach `MIN_DOCS_VERSION`. A list that ends higher is
 *   truncated (the anonymous request is one page of 100, and the GraphQL one stops at `MAX_PAGES`) and would drop
 *   the older versions from the dropdown without any error.
 * @returns {Promise<{ minors: string[], minorMap: Map<string, string[]> }>} The minor lines and their patches.
 */
export async function resolveReleaseVersions({ requireFloor = false, ...options } = {}) {
  const grouped = groupReleaseTags(await fetchReleaseTags(options));

  if (grouped.minors.length === 0) {
    throw new Error('GitHub releases hold no stable version.');
  }

  if (requireFloor && !grouped.minors.includes(MIN_DOCS_VERSION)) {
    throw new Error(`The GitHub release list ends at ${grouped.minors.at(-1)} and never reaches ${MIN_DOCS_VERSION}, so it is truncated. Only the GraphQL request (GITHUB_TOKEN set) reads more than one page.`);
  }

  return grouped;
}

/**
 * Builds the version list that `data/common.json` carries.
 *
 * The local package version is always in the list. The GitHub history adds the
 * older minors and replaces the local minor's patches with the released ones.
 * A production build throws when the history cannot be read, because a list
 * with only the local version would strip the older versions from the dropdown
 * of every deployed docs version. Any other build warns and keeps the local
 * version only.
 *
 * @param {object} options The build inputs, plus the options of `resolveReleaseVersions()`.
 * @param {string | null} options.localPatch The version in `handsontable/package.json`, such as "18.1.3".
 * @param {boolean} options.isProduction Whether this is a production build (`BUILD_MODE=production`).
 * @param {(message: string) => void} [options.warn] Receives the warning of a tolerated failure.
 * @returns {Promise<{ minors: string[], minorMap: Map<string, string[]> }>} The minor lines, newest first, and their patches.
 */
export async function buildVersionList({
  localPatch,
  isProduction,
  warn = (message) => console.warn(message),
  ...fetchOptions
}) {
  const localMinor = localPatch ? toMinor(localPatch) : null;
  const minorMap = new Map();
  let minors = localMinor ? [localMinor] : [];

  if (localMinor && localPatch) {
    minorMap.set(localMinor, [localPatch]);
  }

  try {
    const github = await resolveReleaseVersions({ ...fetchOptions, requireFloor: isProduction });

    for (const [minor, patches] of github.minorMap) {
      minorMap.set(minor, patches);
    }

    const allMinors = new Set([...(localMinor ? [localMinor] : []), ...github.minors]);

    minors = [...allMinors].sort((a, b) => semver.rcompare(`${a}.0`, `${b}.0`));
  } catch (error) {
    if (isProduction) {
      throw new Error(`Cannot write data/common.json: ${error.message}`, { cause: error });
    }

    warn(`[common-json] Release list unavailable, writing the local version only: ${error.message}`);
  }

  return { minors, minorMap };
}

/**
 * Builds the Astro hooks of the `data/common.json` integration.
 *
 * The build-done hook awaits the write, so a rejection of `buildVersionList()`
 * fails a production build. A hook that does not await it lets the build pass
 * without the file.
 *
 * @param {(outDir: string, distDir: string) => Promise<void>} buildAndWrite Writes `data/common.json` under `outDir`.
 * @returns {Record<string, (options: { dir: URL }) => Promise<void>>} The hooks.
 */
export function createCommonJsonHooks(buildAndWrite) {
  return {
    'astro:build:done': async({ dir }) => {
      const outDir = fileURLToPath(dir);

      // Pass the dist directory so the URL list is read from the built pages,
      // which include the generated API pages that are not in content/.
      await buildAndWrite(outDir, outDir);
    },
  };
}
