/**
 * Shared Cloudflare API fetch helper.
 *
 * Required environment variables:
 *   CLOUDFLARE_API_TOKEN  - API token with Pages:Edit permission
 *   CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
 */
export const CF_API = 'https://api.cloudflare.com/client/v4';

const { CLOUDFLARE_API_TOKEN: apiToken, CLOUDFLARE_ACCOUNT_ID: accountId } = process.env;

if (!apiToken || !accountId) {
  throw new Error('Missing required environment variables: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID');
}

export { accountId };

/**
 * Performs a fetch against the Cloudflare API with the configured auth token.
 *
 * @param {string} path - API path (must start with /)
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function cfFetch(path, options = {}) {
  return fetch(`${CF_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
