/**
 * Name of the Sentry release that docs events are filed under.
 *
 * Production builds only (`BUILD_MODE=production`). `develop` carries the next version in
 * `handsontable/package.json`, so a staging or pull request preview would otherwise file its
 * events under a release that real readers report too. The `package@version` form is parsed
 * by Sentry as semver, which its "new in release" views need.
 *
 * @param {object} options - Build facts the release derives from.
 * @param {string} [options.buildMode] - The `BUILD_MODE` of the docs build.
 * @param {string} [options.version] - The Handsontable core version, `''` when unreadable.
 * @returns {string | null} The release name, or `null` when the build sets none.
 */
export function resolveSentryRelease({ buildMode, version }) {
  if (buildMode !== 'production' || !version) {
    return null;
  }

  return `handsontable-docs@${version}`;
}
