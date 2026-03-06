/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

export default async(req: Request, context: Context) => {
  const major = parseInt(context.params['0'], 10);
  const minor = parseInt(context.params['1'], 10);
  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const version = `${context.params['0']}.${context.params['1']}`;
  const isFrameworkVersion = (major === 12 && minor >= 1) || major >= 13;

  if (major < 12 || (major === 12 && minor < 1)) {
    // Get the page content
    const response = await context.next();
    const page = await response.text();

    return new Response(page, response);
  }

  const url = new URL(isFrameworkVersion ? `/docs/${version}/${framework}` : `/docs/${version}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: '/docs/(\\d+).(\\d+){/}?',
};
