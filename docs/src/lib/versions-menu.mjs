/**
 * Shared, isomorphic logic for the version-switcher dropdown (header).
 *
 * Used by both `VersionsDropdown.astro`'s server-rendered frontmatter (build
 * time) and its client `<script>` (page-load time, using live data fetched
 * from `https://handsontable.com/docs/data/common.json`) so the two stay in
 * sync without duplicating the version-list/button-label logic.
 *
 * @typedef {object} DocsData
 * @property {string} latestVersion
 * @property {[string, string[]][]} versionsWithPatches
 */

/**
 * Builds the dropdown items and trigger-button label for the versions
 * dropdown from the shared docs metadata.
 *
 * @param {DocsData | null} docsData
 * @param {string} currentMinor - e.g. "17.1", or "next" for the dev build.
 * @param {string} [rawVersion] - Full local patch version (e.g. "17.1.0"),
 *   used only as a fallback label when `docsData` has no patch entry for
 *   `currentMinor`. Defaults to `currentMinor` when omitted (client-side).
 * @returns {{ buttonLabel: string, isLatest: boolean, latestVersion: string, versionItems: Array<{minor: string, display: string, href: string, isCurrent: boolean}> }}
 */
export function computeVersionsDisplay(docsData, currentMinor, rawVersion = currentMinor) {
  const latestVersion = docsData?.latestVersion ?? currentMinor;
  const isLatest = currentMinor === latestVersion;

  const versionItems =
    docsData?.versionsWithPatches
      .filter(([v]) => {
        const major = parseInt(v.split('.')[0], 10);
        return major >= 9;
      })
      .map(([minor, patches]) => ({
        minor,
        display: minor.toUpperCase() === 'NEXT' ? 'dev' : minor,
        // Link to handsontable.com for every published version.
        href: `https://handsontable.com/docs/${minor}`,
        isCurrent: minor === currentMinor,
      })) ?? [];

  function getButtonLabel() {
    if (isLatest) {
      const patchVersion =
        docsData?.versionsWithPatches.find(([v]) => v === latestVersion)?.[1]?.[0] ??
        rawVersion;
      const display = currentMinor === 'next' ? 'dev' : patchVersion;
      return `${display} latest`;
    }
    return currentMinor === 'next' ? 'dev' : currentMinor;
  }

  return {
    buttonLabel: getButtonLabel(),
    isLatest,
    latestVersion,
    versionItems,
  };
}
