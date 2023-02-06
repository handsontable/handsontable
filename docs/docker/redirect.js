/**
 * This njs script enables Nginx to redirect between different versions (e.g., 12.1 to 11.0)
 * of the same documentation page, based on each page's unique ID.
 *
 * For more info, see: https://github.com/handsontable/handsontable/pull/10163.
 *
 * For more info on njs, see: https://nginx.org/en/docs/njs.
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
