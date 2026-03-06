/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';

const redirectsMap = {
  'row-sorting': '/rows-sorting/',
  'column-sorting': '/rows-sorting/',
  'release-notes': '/changelog/'
};

export default async(req: Request, context: Context) => {

  const framework = `${context.params[0]}-data-grid`;
  const page = context.params[1];
  const redirectPath = redirectsMap[page];

  const url = new URL(`/docs/${framework}${redirectPath}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: '/docs/(javascript|angular|react)-data-grid/(row-sorting|column-sorting|release-notes){/}?'
};
