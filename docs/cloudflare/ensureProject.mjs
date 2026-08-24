/**
 * Ensures a Cloudflare Pages project exists, creating it if it does not.
 *
 * Also reconciles the project's apex branch: a Cloudflare Pages deployment is
 * only served at the apex `<project>.pages.dev` when it is deployed to the
 * branch that matches the project's `production_branch` (Cloudflare's term).
 * Any other branch becomes a preview deployment. This value is a Cloudflare
 * label, NOT a git branch -- the workflow passes the same value to
 * `wrangler pages deploy --branch`. It must stay stable (e.g. 'production',
 * 'develop'); using a per-version git branch such as `prod-docs/18.0` would
 * move the apex on every release. When the project already exists with a
 * different value, this script patches it so the apex tracks the right branch.
 *
 * Required environment variables:
 *   CLOUDFLARE_API_TOKEN - API token with Pages:Edit permission
 *   CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
 *   CF_PROJECT_NAME - Name of the Pages project to ensure
 *
 * Optional environment variables:
 *   CF_PAGES_APEX_BRANCH - Cloudflare Pages branch label served at the apex
 *                          (must match the `wrangler --branch` value; default: 'develop')
 */
import { CF_API, accountId, cfFetch } from './cfFetch.mjs';

const { CF_PROJECT_NAME: projectName, CF_PAGES_APEX_BRANCH: apexBranch = 'develop' } = process.env;

if (!projectName) {
  throw new Error('Missing required environment variable: CF_PROJECT_NAME');
}

const getResponse = await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`);

if (getResponse.ok) {
  const { result } = await getResponse.json();
  const currentBranch = result?.production_branch;

  if (currentBranch === apexBranch) {
    // eslint-disable-next-line no-console
    console.log(`Project "${projectName}" already exists with apex branch "${apexBranch}".`);
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.log(`Project "${projectName}" apex branch is "${currentBranch}", updating to "${apexBranch}"...`);

  const patchResponse = await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`, {
    method: 'PATCH',
    body: JSON.stringify({ production_branch: apexBranch }),
  });

  if (!patchResponse.ok) {
    const body = await patchResponse.text();

    throw new Error(`Failed to update apex branch for "${projectName}" (HTTP ${patchResponse.status}): ${body}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Project "${projectName}" apex branch updated to "${apexBranch}".`);
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
    production_branch: apexBranch,
  }),
});

if (!createResponse.ok) {
  const body = await createResponse.text();

  throw new Error(`Failed to create project "${projectName}" (HTTP ${createResponse.status}): ${body}`);
}

// eslint-disable-next-line no-console
console.log(`Project "${projectName}" created successfully.`);
