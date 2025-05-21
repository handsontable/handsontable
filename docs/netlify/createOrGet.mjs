import { NetlifyAPI } from 'netlify';

import { writeFileSync } from 'node:fs';

const branchNameProcess = (branchName, prefix = '') => {
  return branchName ? prefix + branchName.replaceAll('_', '-').replaceAll('/', '-') : '';
};

const branchName = branchNameProcess(
  process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME, process.env.BRANCH_NAME_PREFIX
).substring(0,50);
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
      name: branchName,
    },
  });
}

await writeFileSync(
  'NETLIFY_VARS',
  site
    ? `NETLIFY_SITE_ID=${site.id}
NETLIFY_SITE_URL=${site.url}`
    : '',
  { encoding: 'utf-8' }
);
