/**
 * Ensures a Cloudflare Pages project exists, creating it if it does not.
 *
 * Required environment variables:
 *   CLOUDFLARE_API_TOKEN - API token with Pages:Edit permission
 *   CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
 *   CF_PROJECT_NAME - Name of the Pages project to ensure
 */
const CF_API = 'https://api.cloudflare.com/client/v4';
const { CLOUDFLARE_API_TOKEN: apiToken, CLOUDFLARE_ACCOUNT_ID: accountId, CF_PROJECT_NAME: projectName } = process.env;

if (!apiToken || !accountId || !projectName) {
  throw new Error('Missing required environment variables: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CF_PROJECT_NAME');
}

async function cfFetch(path, options = {}) {
  return fetch(`${CF_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

const getResponse = await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`);

if (getResponse.ok) {
  // eslint-disable-next-line no-console
  console.log(`Project "${projectName}" already exists.`);
  process.exit(0);
}

if (getResponse.status === 403) {
  // eslint-disable-next-line no-console
  console.warn(`Warning: cannot verify project "${projectName}" (HTTP 403). The API token may lack read access, but wrangler will create the project on first deploy if it does not exist.`);
  process.exit(0);
}

if (getResponse.status !== 404) {
  const body = await getResponse.text();

  throw new Error(`Failed to check project existence (HTTP ${getResponse.status}): ${body}`);
}

// eslint-disable-next-line no-console
console.log(`Project "${projectName}" not found. Creating...`);

const createResponse = await cfFetch(`/accounts/${accountId}/pages/projects`, {
  method: 'POST',
  body: JSON.stringify({
    name: projectName,
    production_branch: 'develop',
  }),
});

if (!createResponse.ok) {
  const body = await createResponse.text();

  throw new Error(`Failed to create project "${projectName}" (HTTP ${createResponse.status}): ${body}`);
}

// eslint-disable-next-line no-console
console.log(`Project "${projectName}" created successfully.`);
