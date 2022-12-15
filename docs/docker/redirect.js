/**
 * The script is used by the Nginx and is processed by the NJS module. It's
 * responsible for redirecting the pages between different Docs versions based on
 * the passed page id (https://github.com/handsontable/handsontable/pull/10163).
 *
 * The syntax and build-in modules you can viewed here https://nginx.org/en/docs/njs/.
 */
const fs = require('fs').promises;

const HTTP_REDIRECT_CODE = 301;

async function redirectToPageId(r) {
  const pageId = r.args.pageId;
  const docsVersion = r.variables.docs_version;

  if (typeof pageId !== 'string') {
    r.return(HTTP_REDIRECT_CODE, `/docs/${docsVersion}/`);

    return;
  }

  let data = {};

  try {
    const rawData = await fs.readFile('/etc/nginx/redirect-page-ids.json');

    data = JSON.parse(rawData);
  } catch (ex) {}

  if (typeof data[pageId] !== 'string') {
    r.return(HTTP_REDIRECT_CODE, `/docs/${docsVersion}/`);

    return;
  }

  r.return(HTTP_REDIRECT_CODE, `/docs/${docsVersion}${data[pageId]}`);
}

export default { redirectToPageId };
