/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

export default async(req: Request, context: Context) => {

  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const url = new URL(`/docs/${framework}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: '/docs{/}?',
};
