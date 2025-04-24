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

  rewrite ^/docs/internationalization-i18n/?$ /docs/$framework/language/ permanent;
  rewrite ^/docs/keyboard-navigation/?$ /docs/$framework/keyboard-shortcuts/ permanent;
  rewrite ^/docs/hello-world/?$ /docs/$framework/demo/ permanent;
  rewrite ^/docs/building/?$ /docs/$framework/custom-builds/ permanent;
  rewrite ^/docs/plugins/?$ /docs/$framework/custom-plugins/ permanent;
  rewrite ^/docs/file-structure/?$ /docs/$framework/folder-structure/ permanent;
  rewrite ^/docs/examples/?$ /docs/$framework/ permanent;
  rewrite ^/docs/setting-options/?$ /docs/$framework/configuration-options/ permanent;
  rewrite ^/docs/angular-simple-example/?$ /docs/javascript-data-grid/angular-basic-example/ permanent;
  rewrite ^/docs/angular-setting-up-a-language/?$ /docs/javascript-data-grid/angular-setting-up-a-translation/ permanent;
  rewrite ^/docs/vue-simple-example/?$ /docs/javascript-data-grid/vue-basic-example/ permanent;
  rewrite ^/docs/vue-setting-up-a-language/?$ /docs/javascript-data-grid/vue-setting-up-a-translation/ permanent;
  rewrite ^/docs/vue3-simple-example/?$ /docs/javascript-data-grid/vue3-basic-example/ permanent;
  rewrite ^/docs/vue3-setting-up-a-language/?$ /docs/javascript-data-grid/vue3-setting-up-a-translation/ permanent;
  rewrite ^/docs/row-sorting/?$ /docs/$framework/rows-sorting/ permanent;
  rewrite ^/docs/column-sorting/?$ /docs/$framework/rows-sorting/ permanent;

  rewrite ^/docs/(javascript|react)-data-grid/row-sorting/?$ /docs/$framework/rows-sorting/ permanent;
  rewrite ^/docs/(javascript|react)-data-grid/column-sorting/?$ /docs/$framework/rows-sorting/ permanent;
  rewrite ^/docs/(javascript|react)-data-grid/release-notes/?$ /docs/$framework/changelog/ permanent;

  */

  const framework = getFrameworkFromCookie(context.cookies.get("docs_fw"))

  const page = context.params[1];
  const redirectPath = redirectsMap[page];

  const url = new URL(`/docs/${framework}${redirectPath}`, req.url);
  return Response.redirect(url);
};

export const config: Config = {
    path: "/docs/(javascript|angular|react)-data-grid)/(row-sorting|column-sorting|release-notes)"
}