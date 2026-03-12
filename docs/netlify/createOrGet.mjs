import { NetlifyAPI } from 'netlify';
import { writeFileSync } from 'node:fs';
import { createSubdomainFromBranch, siteMatchesSubdomain } from './subdomainHelpers.mjs';

const rawBranchName = process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME;
const branchName = createSubdomainFromBranch(
  rawBranchName,
  process.env.BRANCH_NAME_PREFIX
);

if (process.env.BRANCH_NAME && !branchName) {
  throw new Error(`Unable to build a valid Netlify subdomain from branch "${rawBranchName}".`);
}

const client = new NetlifyAPI(process.env.NETLIFY_AUTH_TOKEN);
const sites = await client.listSites();

let site = sites.find(_site => siteMatchesSubdomain(_site, branchName));

if (site) {
  // eslint-disable-next-line no-console
  console.log(`Found site: ${site.name}`);
  // only create site if BRANCH_NAME is set
} else if (process.env.BRANCH_NAME && branchName) {
  // eslint-disable-next-line no-console
  console.log(`Creating site: ${branchName}`);
  site = await client.createSite({
    body: {
      account_slug: process.env.NETLIFY_ACCOUNT_SLUG,
      name: branchName,
      subdomain: branchName,
    },
  });
}

await writeFileSync(
  'NETLIFY_VARS',
  site
    ? `NETLIFY_SITE_ID=${site.id}
NETLIFY_SITE_URL=${site.ssl_url || site.url}`
    : '',
  { encoding: 'utf-8' }
);
