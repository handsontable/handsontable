/* eslint-disable no-unused-vars */
import { Config, Context } from '@netlify/edge-functions';
import { getFrameworkFromCookie } from '../cookieHelper.mts';

const redirectsMap = {
  'tutorial-introduction': '/',
  'tutorial-compatibility': '/supported-browsers/',
  'tutorial-licensing': '/software-license/',
  'tutorial-license-key': '/license-key/',
  'tutorial-quick-start': '/installation/',
  'tutorial-data-binding': '/binding-to-data/',
  'tutorial-data-sources': '/binding-to-data/',
  'tutorial-load-and-save': '/saving-data/',
  'tutorial-setting-options': '/setting-options/',
  'tutorial-grid-sizing': '/grid-size/',
  'tutorial-using-callbacks': '/events-and-hooks/',
  'tutorial-keyboard-navigation': '/keyboard-navigation/',
  'tutorial-internationalization': '/internationalization-i18n/',
  'tutorial-modules': '/modules/',
  'tutorial-custom-build': '/building/',
  'tutorial-custom-plugin': '/plugins/',
  'tutorial-cell-types': '/cell-type/',
  'tutorial-cell-editor': '/cell-editor/',
  'tutorial-cell-function': '/cell-function/',
  'tutorial-suspend-rendering': '/batch-operations/',
  'tutorial-testing': '/testing/',
  'tutorial-performance-tips': '/performance/',
  'tutorial-release-notes': '/changelog/',
  'tutorial-changelog': '/changelog/',
  'tutorial-migration-guide': '/migration-from-7.4-to-8.0/',
  'tutorial-known-limitations': '/third-party-licenses/',

  // Demos
  'demo-scrolling': '/row-virtualization/',
  'demo-fixing': '/column-freezing/',
  'demo-resizing': '/column-width/',
  'demo-moving': '/column-moving/',
  'demo-pre-populating': '/row-prepopulating/',
  'demo-stretching': '/column-width/',
  'demo-freezing': '/column-freezing/',
  'demo-fixing-bottom': '/row-freezing/',
  'demo-hiding-rows': '/row-hiding/',
  'demo-hiding-columns': '/column-hiding/',
  'demo-trimming-rows': '/row-trimming/',
  'demo-bind-rows-headers': '/row-header/',
  'demo-collapsing-columns': '/column-groups/',
  'demo-nested-headers': '/column-groups/',
  'demo-nested-rows': '/row-parent-child/',
  'demo-dropdown-menu': '/column-menu/',
  'demo-sorting': '/rows-sorting/',
  'demo-multicolumn-sorting': '/rows-sorting/',
  'demo-searching': '/searching-values/',
  'demo-filtering': '/column-filter/',
  'demo-summary-calculations': '/column-summary/',
  'demo-data-validation': '/cell-validator/',
  'demo-auto-fill': '/autofill-values/',
  'demo-merged-cells': '/merge-cells/',
  'demo-alignment': '/text-alignment/',
  'demo-read-only': '/disabled-cells/',
  'demo-disabled-editing': '/disabled-cells/',
  'demo-custom-renderers': '/cell-renderer/',
  'demo-numeric': '/numeric-cell-type/',
  'demo-date': '/date-cell-type/',
  'demo-time': '/time-cell-type/',
  'demo-checkbox': '/checkbox-cell-type/',
  'demo-select': '/select-cell-type/',
  'demo-dropdown': '/dropdown-cell-type/',
  'demo-autocomplete': '/autocomplete-cell-type/',
  'demo-password': '/password-cell-type/',
  'demo-handsontable': '/handsontable-cell-type/',
  'demo-context-menu': '/context-menu/',
  'demo-spreadsheet-icons': '/icon-pack/',
  'demo-comments_': '/comments/',
  'demo-copy-paste': '/basic-clipboard/',
  'demo-export-file': '/export-to-csv/',
  'demo-conditional-formatting': '/conditional-formatting/',
  'demo-customizing-borders': '/formatting-cells/',
  'demo-custom-borders': '/formatting-cells/',
  'demo-selecting-ranges': '/selection/',
  'demo-formula-support': '/formula-calculation/',
  'demo-using-callbacks': '/events-and-hooks/',
  'demo-react-simple-examples': '/react-simple-example/'
};

export default async(req: Request, context: Context) => {

  const framework = getFrameworkFromCookie(context.cookies.get('docs_fw'));
  const version = `${context.params[0]}.${context.params[1]}`;
  const page = context.params[2];
  const redirectPath = redirectsMap[page];
  const url = new URL(`/docs/${version}${framework}${redirectPath}`, req.url);

  return Response.redirect(url);
};

export const config: Config = {
  path: `/docs/(${Object.keys(redirectsMap).join('|')}).html`
};
