/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';

// Maps old integrate-with-vue3 page slugs to their new vue-data-grid/ destinations.
const redirectsMap: Record<string, string> = {
  'vue3-installation':                '/docs/vue-data-grid/installation/',
  'vue3-basic-example':               '/docs/vue-data-grid/installation/',
  'vue3-modules':                     '/docs/vue-data-grid/modules/',
  'vue3-hot-column':                  '/docs/vue-data-grid/vue-hot-column/',
  'vue3-hot-reference':               '/docs/vue-data-grid/vue-instance-reference/',
  'vue3-custom-renderer-example':     '/docs/vue-data-grid/cell-renderer/',
  'vue3-custom-editor-example':       '/docs/vue-data-grid/cell-editor/',
  'vue3-custom-context-menu-example': '/docs/vue-data-grid/context-menu/',
  'vue3-custom-id-class-style':       '/docs/vue-data-grid/vue-custom-id-class-style/',
  'vue3-formulas-example':            '/docs/vue-data-grid/formula-calculation/',
  'vue3-language-change-example':     '/docs/vue-data-grid/language/',
  'vue3-setting-up-a-translation':    '/docs/vue-data-grid/language/',
  'vue3-vuex-example':                '/docs/vue-data-grid/vue-vuex/',
};

const slugs = Object.keys(redirectsMap).join('|');

export default async(req: Request, context: Context) => {
  const page = context.params[1];
  const redirectPath = redirectsMap[page];

  return Response.redirect(new URL(redirectPath, req.url), 301);
};

export const config: Config = {
  path: `/docs/(javascript|react|angular|vue)-data-grid/(${slugs}){/}?`,
};
