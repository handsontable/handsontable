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
