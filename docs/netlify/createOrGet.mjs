import { NetlifyAPI } from 'netlify';

import { writeFileSync } from 'node:fs';

const branchNameProcess = (branchName, prefix = '') => {
  return branchName ? prefix + branchName.replaceAll('_', '-').replaceAll('/', '-').replaceAll('.', '-') : '';
};

let branchName = branchNameProcess(
  process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME, process.env.BRANCH_NAME_PREFIX
).substring(0, 50);
branchName = branchName.endsWith('-') ? branchName.slice(0, -1) : branchName;

const client = new NetlifyAPI(process.env.NETLIFY_AUTH_TOKEN);
const sites = await client.listSites();

let site = sites.find(_site => _site.name === branchName);

if (site) {
  // eslint-disable-next-line no-console
  console.log(`Found site: ${site.name}`);
  // only create site if BRANCH_NAME is set
} else if (process.env.BRANCH_NAME) {
  // eslint-disable-next-line no-console
  console.log(`Creating site: ${branchName}`);
  site = await client.createSite({
    body: {
      account_slug: process.env.NETLIFY_ACCOUNT_SLUG,
      name: branchName,
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
