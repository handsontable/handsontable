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
import { accountId, cfFetch } from './cfFetch.mjs';

const { CF_PROJECT_NAME: projectName, CF_BRANCH_NAME: branchName } = process.env;

if (!projectName || !branchName) {
  throw new Error(
    'Missing required environment variables: CF_PROJECT_NAME, CF_BRANCH_NAME'
  );
}

const PER_PAGE = 25;

async function fetchAllDeploymentsForBranch() {
  const results = [];
  let page = 1;

  for (;;) {
    const response = await cfFetch(
      `/accounts/${accountId}/pages/projects/${projectName}/deployments?per_page=${PER_PAGE}&page=${page}&sort_order=desc&env=preview`
    );

    if (!response.ok) {
      if (response.status === 404) {
        // eslint-disable-next-line no-console
        console.log(`Project "${projectName}" not found. Nothing to delete.`);
        process.exit(0);
      }

      const body = await response.text();

      throw new Error(`Failed to list deployments (HTTP ${response.status}): ${body}`);
    }

    const data = await response.json();
    const pageItems = data.result ?? [];

    results.push(...pageItems.filter(d => d.deployment_trigger?.metadata?.branch === branchName));

    // Stop when the page is not full — we've reached the last page.
    if (pageItems.length < PER_PAGE) {
      break;
    }

    page += 1;
  }

  return results;
}

const deployments = await fetchAllDeploymentsForBranch();

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
