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
 * releases, which is why a token switches the request to GraphQL.
 */
export const RELEASES_URL = 'https://api.github.com/repos/handsontable/handsontable/releases?per_page=100';

/**
 * The authenticated request. GraphQL needs a token and answers with the tag
 * names only. `deploy/getListOrPreviousVersions.mjs` moved to it for the same
 * reason: the REST list failed on GitHub Actions runners with "Premature close".
 */
export const GRAPHQL_URL = 'https://api.github.com/graphql';

const GRAPHQL_QUERY = `
  query {
    repository(owner: "handsontable", name: "handsontable") {
      releases(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          tagName
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
 * Reads the tag names from a GitHub response body.
 *
 * @param {boolean} graphql Whether the request went to the GraphQL endpoint.
 * @param {any} body The parsed response body.
 * @returns {string[]} The tag names.
 */
function readTagNames(graphql, body) {
  if (graphql) {
    if (body?.errors?.length) {
      throw new Error(`GitHub GraphQL answered with an error: ${body.errors[0]?.message ?? 'unknown'}.`);
    }

    const nodes = body?.data?.repository?.releases?.nodes;

    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new Error('GitHub returned no releases.');
    }

    return nodes.map((node) => node.tagName);
  }

  if (!Array.isArray(body) || body.length === 0) {
    throw new Error('GitHub returned no releases.');
  }

  return body.map((release) => release.tag_name);
}

/**
 * Reads the release tags from GitHub, retrying a transient failure.
 *
 * With a token the request goes to GraphQL, which lifts the limit from about 60
 * requests per hour for a shared runner IP to the token's own and returns tag
 * names only. Without one it falls back to the anonymous REST list. A rejected
 * token (401) is not retried. The function throws once every attempt has
 * failed, so the caller decides whether a missing list is fatal.
 *
 * @param {object} [options] The request options.
 * @param {string} [options.token] A GitHub token. The request is anonymous without one.
 * @param {typeof fetch} [options.fetchImpl] The `fetch` implementation.
 * @param {number} [options.attempts] How many times to try.
 * @param {number} [options.delayMs] The wait before the second attempt. It doubles after each failure.
 * @param {number} [options.timeoutMs] How long one attempt may take.
 * @param {(ms: number) => Promise<void>} [options.sleep] The wait implementation.
 * @returns {Promise<string[]>} The tag names of the latest 100 releases.
 */
export async function fetchReleaseTags({
  token,
  fetchImpl = fetch,
  attempts = 5,
  delayMs = 2000,
  timeoutMs = 15000,
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

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(graphql ? GRAPHQL_URL : RELEASES_URL, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        ...(graphql ? { method: 'POST', body: JSON.stringify({ query: GRAPHQL_QUERY }) } : {}),
      });

      if (response.status === 401) {
        const rejected = new Error('GitHub rejected GITHUB_TOKEN (401).');

        rejected.retryable = false;
        throw rejected;
      }

      if (!response.ok) {
        throw new Error(`GitHub ${graphql ? 'GraphQL' : 'releases'} API answered ${response.status}${graphql ? '' : ' (no GITHUB_TOKEN was set)'}.`);
      }

      return readTagNames(graphql, await response.json());
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

/**
 * Reads the release history and groups it by minor line.
 *
 * @param {Parameters<typeof fetchReleaseTags>[0] & { requireFloor?: boolean }} [options] The options of
 *   `fetchReleaseTags()`. With `requireFloor`, the list must reach `MIN_DOCS_VERSION`: the request returns the
 *   latest 100 releases and has no paging, so a list that ends higher is truncated and would drop the older
 *   versions from the dropdown without any error.
 * @returns {Promise<{ minors: string[], minorMap: Map<string, string[]> }>} The minor lines and their patches.
 */
export async function resolveReleaseVersions({ requireFloor = false, ...options } = {}) {
  const grouped = groupReleaseTags(await fetchReleaseTags(options));

  if (grouped.minors.length === 0) {
    throw new Error('GitHub releases hold no stable version.');
  }

  if (requireFloor && !grouped.minors.includes(MIN_DOCS_VERSION)) {
    throw new Error(`The GitHub release list ends at ${grouped.minors.at(-1)} and never reaches ${MIN_DOCS_VERSION}, so it is truncated.`);
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
