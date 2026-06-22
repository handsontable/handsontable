/**
 * Ensures a Cloudflare Pages project exists, creating it if it does not.
 *
 * Also reconciles the project's production branch: a Cloudflare Pages
 * deployment is only served at the apex `<project>.pages.dev` when it is
 * deployed to the branch that matches the project's `production_branch`.
 * Any other branch becomes a preview deployment. When the project already
 * exists with a different production branch, this script patches it so the
 * apex URL tracks the branch the workflow actually deploys to.
 *
 * Required environment variables:
 *   CLOUDFLARE_API_TOKEN - API token with Pages:Edit permission
 *   CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
 *   CF_PROJECT_NAME - Name of the Pages project to ensure
 *
 * Optional environment variables:
 *   CF_PRODUCTION_BRANCH - Production branch for the project (default: 'develop')
 */
import { CF_API, accountId, cfFetch } from './cfFetch.mjs';

const { CF_PROJECT_NAME: projectName, CF_PRODUCTION_BRANCH: productionBranch = 'develop' } = process.env;

if (!projectName) {
  throw new Error('Missing required environment variable: CF_PROJECT_NAME');
}

const getResponse = await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`);

if (getResponse.ok) {
  const { result } = await getResponse.json();
  const currentBranch = result?.production_branch;

  if (currentBranch === productionBranch) {
    // eslint-disable-next-line no-console
    console.log(`Project "${projectName}" already exists with production branch "${productionBranch}".`);
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.log(`Project "${projectName}" production branch is "${currentBranch}", updating to "${productionBranch}"...`);

  const patchResponse = await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`, {
    method: 'PATCH',
    body: JSON.stringify({ production_branch: productionBranch }),
  });

  if (!patchResponse.ok) {
    const body = await patchResponse.text();

    throw new Error(`Failed to update production branch for "${projectName}" (HTTP ${patchResponse.status}): ${body}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Project "${projectName}" production branch updated to "${productionBranch}".`);
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
    production_branch: productionBranch,
  }),
});

if (!createResponse.ok) {
  const body = await createResponse.text();

  throw new Error(`Failed to create project "${projectName}" (HTTP ${createResponse.status}): ${body}`);
}

// eslint-disable-next-line no-console
console.log(`Project "${projectName}" created successfully.`);
