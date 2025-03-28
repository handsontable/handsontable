import { NetlifyAPI } from "netlify";

import { writeFileSync } from "node:fs";

const branchNameProcess = (branchName, prefix = '') => {
  return branchName ? prefix + branchName.replaceAll("_", "-").replaceAll("/", "-") : "";
};

const branchName = branchNameProcess(
  process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME, process.env.BRANCH_NAME_PREFIX
);
const client = new NetlifyAPI(process.env.NETLIFY_AUTH_TOKEN);
const sites = await client.listSites();

let site = sites.find((site) => site.name === branchName);

// console.log('branchname', branchName);
console.log('site', site);
// console.log('sites', sites);

if (site) {
  console.log(`Found site: ${site.name}`);
} else {
  // only create site if BRANCH_NAME is set
  if (process.env.BRANCH_NAME) {
    console.log(`Creating site: ${branchName}`);
    site = await client.createSite({
      body: {
        name: branchName,
      },
    });
  }
}

await writeFileSync(
  "NETLIFY_VARS",
  site
    ? `NETLIFY_SITE_ID=${site.id}
NETLIFY_SITE_URL=${site.url}`
    : "",
  { encoding: "utf-8" }
);
