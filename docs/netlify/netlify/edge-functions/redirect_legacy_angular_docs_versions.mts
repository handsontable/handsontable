/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';

export default async(req: Request, context: Context) => {
  const major = parseInt(context.params['0'], 10);

  if (major >= 16) {
    return context.next();
  }

  const url = new URL('/docs/javascript-data-grid/', req.url);

  return Response.redirect(url, 301);
};

export const config: Config = {
  path: '/docs/(\\d+).(\\d+)/angular-data-grid(/.*)?'
};
