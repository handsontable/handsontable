/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

const redirectsMap = {
  'row-sorting': '/rows-sorting/',
  'column-sorting': '/rows-sorting/',
  'release-notes': '/changelog/',
  examples: '/',
  'hello-world': '/demo/',
  'setting-options': '/configuration-options/',
};

export default async(req: Request, context: Context) => {

  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const page = context.params[0];
  const redirectPath = redirectsMap[page];

  const url = new URL(`/docs/${framework}${redirectPath}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: `/docs/(${Object.keys(redirectsMap).join('|')}){/}?`
};
