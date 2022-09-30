/**
 * Transform link which may contain version of documentation.
 *
 * @param {string} link A link which is transformed (version of documentation from docs may be removed).
 * @param {string} currentVersion The current version of documentation.
 * @param {string} latestVersion The latest version of documentation.
 * @returns {*}
 */
export function getLinkTransformed(link, currentVersion, latestVersion) {
  if (currentVersion === latestVersion) {
    return link.replace(`${currentVersion}/`, '');
  }

  return link;
}
