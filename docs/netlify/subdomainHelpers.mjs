// Netlify validates site subdomains against a 37-char limit.
const MAX_SUBDOMAIN_LENGTH = 37;

/**
 * Build a Netlify-safe subdomain from branch metadata.
 *
 * @param {string|undefined} branchName Branch name.
 * @param {string|undefined} [prefix=''] Prefix added before branch name.
 * @returns {string}
 */
export const createSubdomainFromBranch = (branchName, prefix = '') => {
  const source = `${prefix ?? ''}${branchName ?? ''}`.toLowerCase();
  const normalized = source
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SUBDOMAIN_LENGTH)
    .replace(/-+$/g, '');

  return normalized;
};

/**
 * Check if a listed Netlify site matches a target subdomain.
 *
 * @param {object} site Site returned by Netlify API.
 * @param {string} subdomain Target subdomain.
 * @returns {boolean}
 */
export const siteMatchesSubdomain = (site, subdomain) => {
  if (!site || !subdomain) {
    return false;
  }

  if (site.name === subdomain || site.subdomain === subdomain) {
    return true;
  }

  return [site.ssl_url, site.url].some((urlCandidate) => {
    if (!urlCandidate) {
      return false;
    }

    try {
      const hostname = new URL(urlCandidate).hostname;

      return hostname === `${subdomain}.netlify.app`;

    } catch {
      // ignore malformed URL values from external API payloads
      return false;
    }
  });
};
