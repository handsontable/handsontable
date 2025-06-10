/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

const redirectsMap = {
  'row-sorting': '/rows-sorting/',
  'column-sorting': '/rows-sorting/',
  'release-notes': '/changelog/',
  'accessibility': '/accessibility/',
  'angular-modules': '/angular-modules/',
  'api': '/api/',
  'api/base-plugin': '/api/base-plugin/',
  'api/collapsible-columns': '/api/collapsible-columns/',
  'api/comments': '/api/comments/',
  'api/context-menu': '/api/context-menu/',
  'api/core': '/api/core/',
  'api/custom-borders': '/api/custom-borders/',
  'api/hooks': '/api/hooks/',
  'api/index-mapper': '/api/index-mapper/',
  'api/manual-column-freeze': '/api/manual-column-freeze/',
  'api/multi-column-sorting': '/api/multi-column-sorting/',
  'api/nested-rows': '/api/nested-rows/',
  'api/options': '/api/options/',
  'api/plugins': '/api/plugins/',
  'api/shortcut-manager': '/api/shortcut-manager',
  'api/undo-redo': '/api/undo-redo/',
  'autocomplete-cell-type': '/autocomplete-cell-type/',
  'autofill-values': '/autofill-values/',
  'basic-clipboard': '/basic-clipboard/',
  'binding-to-data': '/binding-to-data/',
  building: '/custom-builds/',
  'cell-renderer': '/cell-renderer/',
  'cell-validator': '/cell-validator/',
  changelog: '/changelog',
  'checkbox-cell-type': '/checkbox-cell-type/',
  'column-filter': '/column-filter/',
  'column-freezing': '/column-freezing',
  'column-groups': '/column-groups/',
  'column-hiding': '/column-hiding/',
  'column-menu': '/column-menu/',
  'column-moving': '/column-moving/',
  'column-summary': '/column-summary/',
  'column-virtualization': '/column-virtualization/',
  'column-width': '/column-width/',
  'comments': '/comments/',
  'conditional-formatting': '/conditional-formatting/',
  'configuration-options': '/configuration-options/',
  'context-menu': '/context-menu',
  'date-cell-type': '/date-cell-type/',
  'disabled-cells': '/disabled-cells/',
  'dropdown-cell-type': '/dropdown-cell-type/',
  'events-and-hooks': '/events-and-hooks/',
  'examples': '/',
  'export-to-csv': '/export-to-csv/',
  'formatting-cells': '/formatting-cells/',
  'formula-calculation': '/formula-calculation/',
  'handsontable-cell-type': '/handsontable-cell-type/',
  'hello-world': '/demo/',
  'ime-support': '/ime-support/',
  'installation': '/installation/',
  'keyboard-shortcuts': '/keyboard-shortcuts',
  'language': '/language/',
  'layout-direction': '/layout-direction',
  'license-key': '/license-key',
  'locale': '/locale/',
  'merge-cells': '/merge-cells/',
  'migration-from-10.0-to-11.0': '/migration-from-10.0-to-11.0/',
  'migration-from-11.1-to-12.0': '/migration-from-11.1-to-12.0',
  'migration-from-9.0-to-10.0': '/migration-from-9.0-to-10.0/',
  'modules': '/modules/',
  'numeric-cell-type': '/numeric-cell-type/',
  'password-cell-type': '/password-cell-type/',
  'plugins': '/custom-plugins/',
  'row-header': '/row-header/',
  'row-hiding': '/row-hiding/',
  'row-moving': '/row-moving/',
  'row-trimming': '/row-trimming/',
  'row-virtualization': '/row-virtualization/',
  'rows-sorting': '/rows-sorting',
  'saving-data': '/saving-data/',
  'security': '/security/',
  'select-cell-type': '/select-cell-type/',
  'selection': '/selection/',
  'setting-options': '/configuration-options/',
  'software-license': '/software-license/',
  'supported-browsers': '/supported-browsers/',
  'text-alignment': '/text-alignment/',
  themes: '/themes',
  'time-cell-type': '/time-cell-type/',
  'undo-redo': '/undo-redo/',
  'versioning-policy': '/versioning-policy/',
  'vue-modules': '/vue-modules/',
  'vue-simple-example': '/vue-basic-example/',
  'vue3-modules': '/vue3-modules/',
  'vue3-simple-example': '/vue3-basic-example/'
};

export default async(req: Request, context: Context) => {

  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const page = context.params[0];
  const redirectPath = redirectsMap[page];

  const url = new URL(`/docs/${framework}${redirectPath}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: `/docs/(${Object.keys(redirectsMap).join('|')}){/}?`
};
