import semver from 'semver';

/**
 * Whether to show the "newer version available" banner on docs pages.
 *
 * The banner is shown only when production's latest **minor** line is strictly
 * newer than this build's minor (user is viewing older docs). If this build
 * is ahead of production (e.g. RC for the next minor), returns false.
 *
 * @param {string} currentMinor - Major.minor from local package.json (e.g. "17.1").
 * @param {string} latestVersion - `latestVersion` from common.json (minor line).
 * @returns {boolean}
 */
export function shouldShowNewerVersionBanner(currentMinor, latestVersion) {
  if (!currentMinor || !latestVersion) {
    return false;
  }

  const cur = String(currentMinor).trim();
  const lat = String(latestVersion).trim();

  if (!cur || !lat) {
    return false;
  }

  if (cur.toLowerCase() === 'next' || lat.toLowerCase() === 'next') {
    return false;
  }

  const currentCoerced = semver.coerce(`${cur}.0`);
  const latestCoerced = semver.coerce(`${lat}.0`);

  if (!currentCoerced || !latestCoerced) {
    return false;
  }

  return semver.gt(latestCoerced, currentCoerced);
}
