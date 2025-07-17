/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

export default async(req: Request, context: Context) => {

  /**
  # --- redirect /docs/{anything} to /docs/{framework}/{anything} ---.
   */

  const page = context.params[0];
  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const url = new URL(`/docs/${framework}/${page}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: '/docs/*',
  excludedPath: [
    '/docs/(javascript|angular|react)-data-grid/(*)',
    '/docs/(javascript|angular|react)-data-grid',
    '/docs/(*)/*.(html|css|js|json|png|jpg|jpeg|gif|svg|ico|pdf|webp|woff|woff2|ttf|eot|xml|mp4|txt)',
  ],
};
