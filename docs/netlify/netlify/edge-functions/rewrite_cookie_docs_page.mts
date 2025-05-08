/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

const redirectsMap = {
  latest: '/',
  'internationalization-i18n': '/language/',
  'keyboard-navigation': '/keyboard-shortcuts/',
  'hello-world': '/demo/',
  building: '/custom-builds/',
  plugins: '/custom-plugins/',
  'file-structure': '/folder-structure/',
  examples: '/',
  'setting-options': '/configuration-options/',
  'angular-simple-example': '/angular-basic-example/',
  'angular-setting-up-a-language': '/angular-setting-up-a-translation/',
  'vue-simple-example': '/vue-basic-example/',
  'vue-setting-up-a-language': '/vue-setting-up-a-translation/',
  'vue3-simple-example': '/vue3-basic-example/',
  'vue3-setting-up-a-language': '/vue3-setting-up-a-translation/',
  'row-sorting': '/rows-sorting/',
  'column-sorting': '/rows-sorting/',
  'i18n/missing-language-code': '/language/#loading-the-prepared-language-files'
};

export default async(req: Request, context: Context) => {

  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));

  const page = context.params[0];
  const redirectPath = redirectsMap[page];

  const url = new URL(`/docs/${framework}${redirectPath}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: `/docs/(${Object.keys(redirectsMap).join('|')}).html`

};
