const HTTP_REDIRECT_CODE = 301;

async function redirectToPageId(r) {
  const docsVersion = r.variables.docs_version;

  r.return(HTTP_REDIRECT_CODE, `/docs/${docsVersion}/`);
}

export default { redirectToPageId };
