import { NetlifyAPI } from 'netlify';
import { createSubdomainFromBranch, siteMatchesSubdomain } from './subdomainHelpers.mjs';

const branchName = createSubdomainFromBranch(
  process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME,
  process.env.BRANCH_NAME_PREFIX
);

const client = new NetlifyAPI(process.env.NETLIFY_AUTH_TOKEN);
const sites = await client.listSites();

let site = sites.find(fSite => siteMatchesSubdomain(fSite, branchName));

if (site) {
  // eslint-disable-next-line no-console
  console.log(`Found site: ${site.name}`);
  site = await client.deleteSite({
    siteId: site.id
  });
  // eslint-disable-next-line no-console
  console.log('Site Deleted');
} else {
  // eslint-disable-next-line no-console
  console.log(`site: ${branchName} not found. Nothing to delete`);
}
