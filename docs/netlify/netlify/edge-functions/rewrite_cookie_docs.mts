/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

export default async(req: Request, context: Context) => {

  // This function implements nginx dynamic redirect declarations into netlify edge functions.
  // https://github.com/handsontable/handsontable/blob/develop/docs/docker/redirects.conf#L27-L29

  /**
  # --- redirect /docs/ to /docs/javascript-data-grid/ ---
  rewrite ^/docs/?$ /docs/$framework/ permanent;.
   */

  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const url = new URL(`/docs/${framework}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: '/docs{/}?',
};
