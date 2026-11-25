import { resolveReleaseVersions } from '../src/lib/docs-versions.mjs';

/**
 * Prints the Docs versions as shell variable assignments for the deploy scripts:
 * `LATEST_VERSION` is the newest stable minor and `PREVIOUS_VERSIONS` the older
 * minors down to the oldest deployed docs version (`MIN_DOCS_VERSION` in
 * `src/lib/docs-versions.mjs`).
 *
 * The release list comes from the same module that writes `data/common.json`
 * for the version dropdown (`src/lib/docs-versions.mjs`), so both read the same
 * history. With GITHUB_TOKEN it uses the GraphQL API, which returns only the tag
 * names. The anonymous REST list returned full release bodies and failed on
 * GitHub Actions runners with an undici "Premature close", which blocked
 * production docs deploys. The module retries each request and reads further
 * pages until the list reaches the oldest deployed version.
 */
try {
  const { minors } = await resolveReleaseVersions({
    token: process.env.GITHUB_TOKEN || undefined,
    requireFloor: true,
  });

  // Please keep in mind that we have more versions than displayed, for the
  // purpose of creating canonicals.
  const [latestVersion, ...previousVersions] = minors;

  if (!latestVersion) {
    throw new Error('Resolved an empty latest Docs version from the GitHub releases list.');
  }

  // eslint-disable-next-line no-console
  console.log(`PREVIOUS_VERSIONS="${previousVersions.join(' ')}"
LATEST_VERSION="${latestVersion}"`);
} catch (error) {
  // Exit non-zero so the caller (build_current_version.sh, run under `set -e`)
  // aborts instead of producing an empty VERSIONS_VARS file and deploying a
  // partial docs site. The error goes to stderr, not into VERSIONS_VARS.
  // eslint-disable-next-line no-console
  console.error(`Failed to read the Docs versions list from GitHub: ${error.message}`);
  process.exit(1);
}
