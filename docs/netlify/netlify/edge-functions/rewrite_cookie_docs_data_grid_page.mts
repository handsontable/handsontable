import { Config, Context } from "@netlify/edge-functions";
import { getFrameworkFromCookie } from "../cookieHelper.mts";

const redirectsMap = {
  "row-sorting": "/rows-sorting/",
  "column-sorting": "/rows-sorting/",
  "release-notes" : "/changelog/"
};

export default async (req: Request, context: Context) => {


  // This function implements nginx dynamic redirect declarations into netlify edge functions.
  // https://github.com/handsontable/handsontable/blob/develop/docs/docker/redirects.conf#L27-L29

  /**

  rewrite ^/docs/(javascript|react)-data-grid/row-sorting/?$ /docs/$framework/rows-sorting/ permanent;
  rewrite ^/docs/(javascript|react)-data-grid/column-sorting/?$ /docs/$framework/rows-sorting/ permanent;
  rewrite ^/docs/(javascript|react)-data-grid/release-notes/?$ /docs/$framework/changelog/ permanent;

  */

  //const framework = getFrameworkFromCookie(context.cookies.get("docs_fw"))
  const framework = `${context.params[0]}-data-grid`;
  const page = context.params[1];
  const redirectPath = redirectsMap[page];

  const url = new URL(`/docs/${framework}${redirectPath}`, req.url);
  return Response.redirect(url);
};

export const config: Config = {
    path: "/docs/(javascript|angular|react)-data-grid/(row-sorting|column-sorting|release-notes){/}?"
}