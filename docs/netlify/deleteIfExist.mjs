import { NetlifyAPI } from 'netlify';

const branchNameProcess = (branchName, prefix = '') => {
  return branchName ? prefix + branchName.replaceAll('_', '-').replaceAll('/', '-').replaceAll('.', '-') : '';
};

let branchName = branchNameProcess(
  process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME, process.env.BRANCH_NAME_PREFIX
).substring(0, 50);

branchName = branchName.endsWith('-') ? branchName.slice(0, -1) : branchName;

const client = new NetlifyAPI(process.env.NETLIFY_AUTH_TOKEN);
const sites = await client.listSites();

let site = sites.find(fSite => fSite.name === branchName);

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
