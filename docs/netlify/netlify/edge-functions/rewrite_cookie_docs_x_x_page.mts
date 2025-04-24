import { Config, Context } from "@netlify/edge-functions";
import { getFrameworkFromCookie } from "../cookieHelper.mts";


const redirectsMap = {
    "tutorial-introduction": "/",
    "tutorial-compatibility": "/supported-browsers/",
    "tutorial-licensing": "/software-license/",
    "tutorial-license-key": "/license-key/",
    "tutorial-quick-start": "/installation/",
    "tutorial-data-binding": "/binding-to-data/",
    "tutorial-data-sources": "/binding-to-data/",
    "tutorial-load-and-save": "/saving-data/",
    "tutorial-setting-options": "/setting-options/",
    "tutorial-grid-sizing": "/grid-size/",
    "tutorial-using-callbacks": "/events-and-hooks/",
    "tutorial-keyboard-navigation": "/keyboard-navigation/",
    "tutorial-internationalization": "/internationalization-i18n/",
    "tutorial-modules": "/modules/",
    "tutorial-custom-build": "/building/",
    "tutorial-custom-plugin": "/plugins/",
    "tutorial-cell-types": "/cell-type/",
    "tutorial-cell-editor": "/cell-editor/",
    "tutorial-cell-function": "/cell-function/",
    "tutorial-suspend-rendering": "/batch-operations/",
    "tutorial-testing": "/testing/",
    "tutorial-performance-tips": "/performance/",
    "tutorial-release-notes": "/changelog/",
    "tutorial-changelog": "/changelog/",
    "tutorial-migration-guide": "/migration-from-7.4-to-8.0/",
    "tutorial-known-limitations": "/third-party-licenses/",

    // Demos
    "demo-scrolling": "/row-virtualization/",
    "demo-fixing": "/column-freezing/",
    "demo-resizing": "/column-width/",
    "demo-moving": "/column-moving/",
    "demo-pre-populating": "/row-prepopulating/",
    "demo-stretching": "/column-width/",
    "demo-freezing": "/column-freezing/",
    "demo-fixing-bottom": "/row-freezing/",
    "demo-hiding-rows": "/row-hiding/",
    "demo-hiding-columns": "/column-hiding/",
    "demo-trimming-rows": "/row-trimming/",
    "demo-bind-rows-headers": "/row-header/",
    "demo-collapsing-columns": "/column-groups/",
    "demo-nested-headers": "/column-groups/",
    "demo-nested-rows": "/row-parent-child/",
    "demo-dropdown-menu": "/column-menu/",
    "demo-sorting": "/rows-sorting/",
    "demo-multicolumn-sorting": "/rows-sorting/",
    "demo-searching": "/searching-values/",
    "demo-filtering": "/column-filter/",
    "demo-summary-calculations": "/column-summary/",
    "demo-data-validation": "/cell-validator/",
    "demo-auto-fill": "/autofill-values/",
    "demo-merged-cells": "/merge-cells/",
    "demo-alignment": "/text-alignment/",
    "demo-read-only": "/disabled-cells/",
    "demo-disabled-editing": "/disabled-cells/",
    "demo-custom-renderers": "/cell-renderer/",
    "demo-numeric": "/numeric-cell-type/",
    "demo-date": "/date-cell-type/",
    "demo-time": "/time-cell-type/",
    "demo-checkbox": "/checkbox-cell-type/",
    "demo-select": "/select-cell-type/",
    "demo-dropdown": "/dropdown-cell-type/",
    "demo-autocomplete": "/autocomplete-cell-type/",
    "demo-password": "/password-cell-type/",
    "demo-handsontable": "/handsontable-cell-type/",
    "demo-context-menu": "/context-menu/",
    "demo-spreadsheet-icons": "/icon-pack/",
    "demo-comments_": "/comments/",
    "demo-copy-paste": "/basic-clipboard/",
    "demo-export-file": "/export-to-csv/",
    "demo-conditional-formatting": "/conditional-formatting/",
    "demo-customizing-borders": "/formatting-cells/",
    "demo-custom-borders": "/formatting-cells/",
    "demo-selecting-ranges": "/selection/",
    "demo-formula-support": "/formula-calculation/",
    "demo-using-callbacks": "/events-and-hooks/",
    "demo-react-simple-examples": "/react-simple-example/"
}

export default async (req: Request, context: Context) => {

  // This function implements nginx dynamic redirect declarations into netlify edge functions.
  // https://github.com/handsontable/handsontable/blob/develop/docs/docker/redirects.conf#L27-L29

  /**

  # --- tutorials ---
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-introduction/?$ /docs/$1$framework/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-compatibility/?$ /docs/$1$framework/supported-browsers/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-licensing/?$ /docs/$1$framework/software-license/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-license-key/?$ /docs/$1$framework/license-key/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-quick-start/?$ /docs/$1$framework/installation/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-data-binding/?$ /docs/$1$framework/binding-to-data/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-data-sources/?$ /docs/$1$framework/binding-to-data/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-load-and-save/?$ /docs/$1$framework/saving-data/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-setting-options/?$ /docs/$1$framework/setting-options/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-grid-sizing/?$ /docs/$1$framework/grid-size/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-using-callbacks/?$ /docs/$1$framework/events-and-hooks/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-keyboard-navigation/?$ /docs/$1$framework/keyboard-navigation/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-internationalization/?$ /docs/$1$framework/internationalization-i18n/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-modules/?$ /docs/$1$framework/modules/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-custom-build/?$ /docs/$1$framework/building/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-custom-plugin/?$ /docs/$1$framework/plugins/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-cell-types/?$ /docs/$1$framework/cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-cell-editor/?$ /docs/$1$framework/cell-editor/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-cell-function/?$ /docs/$1$framework/cell-function/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-suspend-rendering/?$ /docs/$1$framework/batch-operations/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-testing/?$ /docs/$1$framework/testing/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-performance-tips/?$ /docs/$1$framework/performance/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-release-notes/?$ /docs/$1$framework/changelog/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-changelog/?$ /docs/$1$framework/changelog/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-migration-guide/?$ /docs/$1$framework/migration-from-7.4-to-8.0/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?tutorial-known-limitations/?$ /docs/$1$framework/third-party-licenses/ permanent;

  # --- demos ---
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-scrolling/?$ /docs/$1$framework/row-virtualization/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-fixing/?$ /docs/$1$framework/column-freezing/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-resizing/?$ /docs/$1$framework/column-width/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-moving/?$ /docs/$1$framework/column-moving/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-pre-populating/?$ /docs/$1$framework/row-prepopulating/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-stretching/?$ /docs/$1$framework/column-width/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-freezing/?$ /docs/$1$framework/column-freezing/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-fixing-bottom/?$ /docs/$1$framework/row-freezing/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-hiding-rows/?$ /docs/$1$framework/row-hiding/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-hiding-columns/?$ /docs/$1$framework/column-hiding/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-trimming-rows/?$ /docs/$1$framework/row-trimming/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-bind-rows-headers/?$ /docs/$1$framework/row-header/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-collapsing-columns/?$ /docs/$1$framework/column-groups/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-nested-headers/?$ /docs/$1$framework/column-groups/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-nested-rows/?$ /docs/$1$framework/row-parent-child/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-dropdown-menu/?$ /docs/$1$framework/column-menu/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-sorting/?$ /docs/$1$framework/rows-sorting/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-multicolumn-sorting/?$ /docs/$1$framework/rows-sorting/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-searching/?$ /docs/$1$framework/searching-values/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-filtering/?$ /docs/$1$framework/column-filter/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-summary-calculations/?$ /docs/$1$framework/column-summary/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-data-validation/?$ /docs/$1$framework/cell-validator/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-auto-fill/?$ /docs/$1$framework/autofill-values/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-merged-cells/?$ /docs/$1$framework/merge-cells/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-alignment/?$ /docs/$1$framework/text-alignment/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-read-only/?$ /docs/$1$framework/disabled-cells/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-disabled-editing/?$ /docs/$1$framework/disabled-cells/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-custom-renderers/?$ /docs/$1$framework/cell-renderer/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-numeric/?$ /docs/$1$framework/numeric-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-date/?$ /docs/$1$framework/date-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-time/?$ /docs/$1$framework/time-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-checkbox/?$ /docs/$1$framework/checkbox-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-select/?$ /docs/$1$framework/select-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-dropdown/?$ /docs/$1$framework/dropdown-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-autocomplete/?$ /docs/$1$framework/autocomplete-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-password/?$ /docs/$1$framework/password-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-handsontable/?$ /docs/$1$framework/handsontable-cell-type/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-context-menu/?$ /docs/$1$framework/context-menu/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-spreadsheet-icons/?$ /docs/$1$framework/icon-pack/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-comments_/?$ /docs/$1$framework/comments/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-copy-paste/?$ /docs/$1$framework/basic-clipboard/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-export-file/?$ /docs/$1$framework/export-to-csv/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-conditional-formatting/?$ /docs/$1$framework/conditional-formatting/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-customizing-borders/?$ /docs/$1$framework/formatting-cells/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-custom-borders/?$ /docs/$1$framework/formatting-cells/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-selecting-ranges/?$ /docs/$1$framework/selection/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-formula-support/?$ /docs/$1$framework/formula-calculation/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-using-callbacks/?$ /docs/$1$framework/events-and-hooks/ permanent;
  rewrite ^/docs/((\d+\.\d+|next)/)?demo-react-simple-examples/?$ /docs/$1$framework/react-simple-example/ permanent;
  */

  const framework = getFrameworkFromCookie(context.cookies.get("docs_fw"))
  // const version = `${context.params[0]}.${context.params[1]}`; 
  const page = context.params[2];
  const redirectPath = redirectsMap[page];
  const url = new URL(`/docs/${framework}${redirectPath}`, req.url);
  return Response.redirect(url);
};

export const config: Config = {
  path: "/docs/(\\d+).(\\d+)/(tutorial-introduction|tutorial-compatibility|tutorial-licensing|tutorial-license-key|tutorial-quick-start|tutorial-data-binding|tutorial-data-sources|tutorial-load-and-save|tutorial-setting-options|tutorial-grid-sizing|tutorial-using-callbacks|tutorial-keyboard-navigation|tutorial-internationalization|tutorial-modules|tutorial-custom-build|tutorial-custom-plugin|tutorial-cell-types|tutorial-cell-editor|tutorial-cell-function|tutorial-suspend-rendering|tutorial-testing|tutorial-performance-tips|tutorial-release-notes|tutorial-changelog|tutorial-migration-guide|tutorial-known-limitations|demo-scrolling|demo-fixing|demo-resizing|demo-moving|demo-pre-populating|demo-stretching|demo-freezing|demo-fixing-bottom|demo-hiding-rows|demo-hiding-columns|demo-trimming-rows|demo-bind-rows-headers|demo-collapsing-columns|demo-nested-headers|demo-nested-rows|demo-dropdown-menu|demo-sorting|demo-multicolumn-sorting|demo-searching|demo-filtering|demo-summary-calculations|demo-data-validation|demo-auto-fill|demo-merged-cells|demo-alignment|demo-read-only|demo-disabled-editing|demo-custom-renderers|demo-numeric|demo-date|demo-time|demo-checkbox|demo-select|demo-dropdown|demo-autocomplete|demo-password|demo-handsontable|demo-context-menu|demo-spreadsheet-icons|demo-comments_|demo-copy-paste|demo-export-file|demo-conditional-formatting|demo-customizing-borders|demo-custom-borders|demo-selecting-ranges|demo-formula-support|demo-using-callbacks|demo-react-simple-examples)"
};