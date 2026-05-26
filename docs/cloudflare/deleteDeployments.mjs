/**
 * Deletes all Cloudflare Pages preview deployments for a specific branch.
 * Called when a pull request is closed to clean up the preview environment.
 *
 * Required environment variables:
 *   CLOUDFLARE_API_TOKEN - API token with Pages:Edit permission
 *   CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
 *   CF_PROJECT_NAME - Name of the Pages project
 *   CF_BRANCH_NAME - Branch name whose deployments should be removed
 */
const CF_API = 'https://api.cloudflare.com/client/v4';
const {
  CLOUDFLARE_API_TOKEN: apiToken,
  CLOUDFLARE_ACCOUNT_ID: accountId,
  CF_PROJECT_NAME: projectName,
  CF_BRANCH_NAME: branchName,
} = process.env;

if (!apiToken || !accountId || !projectName || !branchName) {
  throw new Error(
    'Missing required environment variables: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CF_PROJECT_NAME, CF_BRANCH_NAME'
  );
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

const listResponse = await cfFetch(
  `/accounts/${accountId}/pages/projects/${projectName}/deployments?per_page=25&sort_order=desc&env=preview`
);

if (!listResponse.ok) {
  if (listResponse.status === 404) {
    // eslint-disable-next-line no-console
    console.log(`Project "${projectName}" not found. Nothing to delete.`);
    process.exit(0);
  }

  const body = await listResponse.text();

  throw new Error(`Failed to list deployments (HTTP ${listResponse.status}): ${body}`);
}

const data = await listResponse.json();
const deployments = (data.result ?? []).filter(
  d => d.deployment_trigger?.metadata?.branch === branchName
);

if (deployments.length === 0) {
  // eslint-disable-next-line no-console
  console.log(`No preview deployments found for branch "${branchName}" in project "${projectName}". Nothing to delete.`);
  process.exit(0);
}

// eslint-disable-next-line no-console
console.log(`Found ${deployments.length} deployment(s) for branch "${branchName}". Deleting...`);

for (const deployment of deployments) {
  // force=true skips the "production deployment" protection check for branch previews
  const deleteResponse = await cfFetch(
    `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deployment.id}?force=true`,
    { method: 'DELETE' }
  );

  if (deleteResponse.ok || deleteResponse.status === 404) {
    // eslint-disable-next-line no-console
    console.log(`Deleted deployment ${deployment.id}.`);
  } else {
    const body = await deleteResponse.text();

    // eslint-disable-next-line no-console
    console.warn(`Failed to delete deployment ${deployment.id} (HTTP ${deleteResponse.status}): ${body}`);
  }
}

// eslint-disable-next-line no-console
console.log('Cloudflare Pages cleanup complete.');
