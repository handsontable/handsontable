/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

export default async(req: Request, context: Context) => {
  // This function implements nginx dynamic redirect declarations into netlify edge functions.
  // https://github.com/handsontable/handsontable/blob/develop/docs/docker/redirects.conf#L27-L29

  /**
  # --- redirect /docs/ to /docs/javascript-data-grid/ ---
  rewrite ^/docs/?$ /docs/$framework/ permanent;
  rewrite ^/docs/(\d+\.\d+|next)/?$ /docs/$1/$framework/ permanent;.
   */

  const major = parseInt(context.params['0'], 10);
  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const version = `${context.params['0']}.${context.params['1']}`;

  if (major < 12) {
    // Get the page content
    const response = await context.next();
    const page = await response.text();

    return new Response(page, response);
  }

  const url = new URL(
    major >= 12 ? `/docs/${version}/${framework}` : `/docs/${version}`,
    req.url
  );

  return Response.redirect(url);
};

export const config: Config = {
  path: '/docs/(\\d+).(\\d+){/}?',
};
