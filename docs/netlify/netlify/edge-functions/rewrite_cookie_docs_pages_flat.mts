/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

import redirects from '../redirects.mts';

export default async(req: Request, context: Context) => {

  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  let page = context.params[0];

  page = page.endsWith('/') ? page : `${page}/`;
  page = page.startsWith('/') ? page : `/${page}`;
  const url = new URL(`/docs/${framework}${page}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: `/docs/(${redirects.join('|')}){/}?`
};
