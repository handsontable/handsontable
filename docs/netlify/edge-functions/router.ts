import type { Context, Config } from "@netlify/edge-functions";

declare var Netlify: {
  env: {
    get: (key: string) => string;
    context: string;
  }
}

interface Redirect {
  from: RegExp;
  to: string;
  status: number;
  rewrite?: boolean;
}

function getRawRedirects() {
  return [
    {
      "from": "^/docs/hyperformula$",
      "to": "https://hyperformula.handsontable.com",
      "status": 301
    },
    {
      "from": "^/docs/hyperformula/(.*)$",
      "to": "https://hyperformula.handsontable.com/$1$2",
      "status": 301
    },
    {
      "from": "^/docs/?$",
      "to": "/docs/$framework/",
      "status": 301
    },
    {
      "from": "^/docs/(\\d+\\.\\d+|next)/?$",
      "to": "/docs/$1/$framework/",
      "status": 301
    },
    {
      "from": "^/docs/i18n/missing-language-code",
      "to": "/docs/$framework/language/#loading-the-prepared-language-files",
      "status": 301
    },
    {
      "from": "^/docs/react$",
      "to": "/docs/react-data-grid/installation/",
      "status": 301
    },
    {
      "from": "^/docs/angular$",
      "to": "/docs/javascript-data-grid/angular-installation/",
      "status": 301
    },
    {
      "from": "^/docs/vue$",
      "to": "/docs/javascript-data-grid/vue-installation/",
      "status": 301
    },
    {
      "from": "^/docs/vue3$",
      "to": "/docs/javascript-data-grid/vue3-installation/",
      "status": 301
    },
    {
      "from": "^/docs/frameworks-wrapper-for-((?:angular|vue).*)$",
      "to": "/docs/javascript-data-grid/$1/",
      "status": 301
    },
    {
      "from": "^/docs/(\\d+\\.\\d+|next)/frameworks-wrapper-for-((?:angular|vue).*)$",
      "to": "/docs/$1/javascript-data-grid/$2/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-installation/?$",
      "to": "/docs/$1react-data-grid/installation/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-simple-examples?/?$",
      "to": "/docs/$1react-data-grid/binding-to-data/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-modules/?$",
      "to": "/docs/$1react-data-grid/modules/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-hot-column/?$",
      "to": "/docs/$1react-data-grid/hot-column/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-setting-up-a-language/?$",
      "to": "/docs/$1react-data-grid/language/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-setting-up-a-locale/?$",
      "to": "/docs/$1react-data-grid/numeric-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-custom-context-menu-example/?$",
      "to": "/docs/$1react-data-grid/context-menu/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-custom-editor-example/?$",
      "to": "/docs/$1react-data-grid/cell-editor/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-custom-renderer-example/?$",
      "to": "/docs/$1react-data-grid/cell-renderer/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-language-change-example/?$",
      "to": "/docs/$1react-data-grid/language/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-redux-example/?$",
      "to": "/docs/$1react-data-grid/redux/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?react-hot-reference/?$",
      "to": "/docs/$1react-data-grid/methods/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-installation/?$",
      "to": "/docs/$1react-data-grid/installation/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-simple-examples/?$",
      "to": "/docs/$1react-data-grid/binding-to-data/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-hot-column/?$",
      "to": "/docs/$1react-data-grid/hot-column/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-setting-up-a-locale/?$",
      "to": "/docs/$1react-data-grid/numeric-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-custom-context-menu-example/?$",
      "to": "/docs/$1react-data-grid/context-menu/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-custom-editor-example/?$",
      "to": "/docs/$1react-data-grid/cell-editor/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-custom-renderer-example/?$",
      "to": "/docs/$1react-data-grid/cell-renderer/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-language-change-example/?$",
      "to": "/docs/$1react-data-grid/language/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-redux-example/?$",
      "to": "/docs/$1react-data-grid/redux/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?frameworks-wrapper-for-react-hot-reference/?$",
      "to": "/docs/$1react-data-grid/methods/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-introduction/?$",
      "to": "/docs/$1$framework/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-compatibility/?$",
      "to": "/docs/$1$framework/supported-browsers/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-licensing/?$",
      "to": "/docs/$1$framework/software-license/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-license-key/?$",
      "to": "/docs/$1$framework/license-key/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-quick-start/?$",
      "to": "/docs/$1$framework/installation/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-data-binding/?$",
      "to": "/docs/$1$framework/binding-to-data/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-data-sources/?$",
      "to": "/docs/$1$framework/binding-to-data/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-load-and-save/?$",
      "to": "/docs/$1$framework/saving-data/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-setting-options/?$",
      "to": "/docs/$1$framework/setting-options/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-grid-sizing/?$",
      "to": "/docs/$1$framework/grid-size/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-using-callbacks/?$",
      "to": "/docs/$1$framework/events-and-hooks/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-keyboard-navigation/?$",
      "to": "/docs/$1$framework/keyboard-navigation/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-internationalization/?$",
      "to": "/docs/$1$framework/internationalization-i18n/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-modules/?$",
      "to": "/docs/$1$framework/modules/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-custom-build/?$",
      "to": "/docs/$1$framework/building/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-custom-plugin/?$",
      "to": "/docs/$1$framework/plugins/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-cell-types/?$",
      "to": "/docs/$1$framework/cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-cell-editor/?$",
      "to": "/docs/$1$framework/cell-editor/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-cell-function/?$",
      "to": "/docs/$1$framework/cell-function/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-suspend-rendering/?$",
      "to": "/docs/$1$framework/batch-operations/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-testing/?$",
      "to": "/docs/$1$framework/testing/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-performance-tips/?$",
      "to": "/docs/$1$framework/performance/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-release-notes/?$",
      "to": "/docs/$1$framework/changelog/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-changelog/?$",
      "to": "/docs/$1$framework/changelog/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-migration-guide/?$",
      "to": "/docs/$1$framework/migration-from-7.4-to-8.0/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?tutorial-known-limitations/?$",
      "to": "/docs/$1$framework/third-party-licenses/",
      "status": 301
    },
    {
      "from": "^/docs/internationalization-i18n/?$",
      "to": "/docs/$framework/language/",
      "status": 301
    },
    {
      "from": "^/docs/keyboard-navigation/?$",
      "to": "/docs/$framework/keyboard-shortcuts/",
      "status": 301
    },
    {
      "from": "^/docs/hello-world/?$",
      "to": "/docs/$framework/demo/",
      "status": 301
    },
    {
      "from": "^/docs/building/?$",
      "to": "/docs/$framework/custom-builds/",
      "status": 301
    },
    {
      "from": "^/docs/plugins/?$",
      "to": "/docs/$framework/custom-plugins/",
      "status": 301
    },
    {
      "from": "^/docs/file-structure/?$",
      "to": "/docs/$framework/folder-structure/",
      "status": 301
    },
    {
      "from": "^/docs/examples/?$",
      "to": "/docs/$framework/",
      "status": 301
    },
    {
      "from": "^/docs/setting-options/?$",
      "to": "/docs/$framework/configuration-options/",
      "status": 301
    },
    {
      "from": "^/docs/angular-simple-example/?$",
      "to": "/docs/javascript-data-grid/angular-basic-example/",
      "status": 301
    },
    {
      "from": "^/docs/angular-setting-up-a-language/?$",
      "to": "/docs/javascript-data-grid/angular-setting-up-a-translation/",
      "status": 301
    },
    {
      "from": "^/docs/vue-simple-example/?$",
      "to": "/docs/javascript-data-grid/vue-basic-example/",
      "status": 301
    },
    {
      "from": "^/docs/vue-setting-up-a-language/?$",
      "to": "/docs/javascript-data-grid/vue-setting-up-a-translation/",
      "status": 301
    },
    {
      "from": "^/docs/vue3-simple-example/?$",
      "to": "/docs/javascript-data-grid/vue3-basic-example/",
      "status": 301
    },
    {
      "from": "^/docs/vue3-setting-up-a-language/?$",
      "to": "/docs/javascript-data-grid/vue3-setting-up-a-translation/",
      "status": 301
    },
    {
      "from": "^/docs/row-sorting/?$",
      "to": "/docs/$framework/rows-sorting/",
      "status": 301
    },
    {
      "from": "^/docs/column-sorting/?$",
      "to": "/docs/$framework/rows-sorting/",
      "status": 301
    },
    {
      "from": "^/docs/(javascript|react)-data-grid/row-sorting/?$",
      "to": "/docs/$framework/rows-sorting/",
      "status": 301
    },
    {
      "from": "^/docs/(javascript|react)-data-grid/column-sorting/?$",
      "to": "/docs/$framework/rows-sorting/",
      "status": 301
    },
    {
      "from": "^/docs/(javascript|react)-data-grid/release-notes/?$",
      "to": "/docs/$framework/changelog/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-scrolling/?$",
      "to": "/docs/$1$framework/row-virtualization/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-fixing/?$",
      "to": "/docs/$1$framework/column-freezing/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-resizing/?$",
      "to": "/docs/$1$framework/column-width/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-moving/?$",
      "to": "/docs/$1$framework/column-moving/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-pre-populating/?$",
      "to": "/docs/$1$framework/row-prepopulating/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-stretching/?$",
      "to": "/docs/$1$framework/column-width/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-freezing/?$",
      "to": "/docs/$1$framework/column-freezing/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-fixing-bottom/?$",
      "to": "/docs/$1$framework/row-freezing/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-hiding-rows/?$",
      "to": "/docs/$1$framework/row-hiding/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-hiding-columns/?$",
      "to": "/docs/$1$framework/column-hiding/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-trimming-rows/?$",
      "to": "/docs/$1$framework/row-trimming/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-bind-rows-headers/?$",
      "to": "/docs/$1$framework/row-header/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-collapsing-columns/?$",
      "to": "/docs/$1$framework/column-groups/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-nested-headers/?$",
      "to": "/docs/$1$framework/column-groups/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-nested-rows/?$",
      "to": "/docs/$1$framework/row-parent-child/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-dropdown-menu/?$",
      "to": "/docs/$1$framework/column-menu/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-sorting/?$",
      "to": "/docs/$1$framework/rows-sorting/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-multicolumn-sorting/?$",
      "to": "/docs/$1$framework/rows-sorting/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-searching/?$",
      "to": "/docs/$1$framework/searching-values/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-filtering/?$",
      "to": "/docs/$1$framework/column-filter/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-summary-calculations/?$",
      "to": "/docs/$1$framework/column-summary/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-data-validation/?$",
      "to": "/docs/$1$framework/cell-validator/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-auto-fill/?$",
      "to": "/docs/$1$framework/autofill-values/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-merged-cells/?$",
      "to": "/docs/$1$framework/merge-cells/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-alignment/?$",
      "to": "/docs/$1$framework/text-alignment/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-read-only/?$",
      "to": "/docs/$1$framework/disabled-cells/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-disabled-editing/?$",
      "to": "/docs/$1$framework/disabled-cells/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-custom-renderers/?$",
      "to": "/docs/$1$framework/cell-renderer/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-numeric/?$",
      "to": "/docs/$1$framework/numeric-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-date/?$",
      "to": "/docs/$1$framework/date-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-time/?$",
      "to": "/docs/$1$framework/time-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-checkbox/?$",
      "to": "/docs/$1$framework/checkbox-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-select/?$",
      "to": "/docs/$1$framework/select-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-dropdown/?$",
      "to": "/docs/$1$framework/dropdown-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-autocomplete/?$",
      "to": "/docs/$1$framework/autocomplete-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-password/?$",
      "to": "/docs/$1$framework/password-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-handsontable/?$",
      "to": "/docs/$1$framework/handsontable-cell-type/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-context-menu/?$",
      "to": "/docs/$1$framework/context-menu/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-spreadsheet-icons/?$",
      "to": "/docs/$1$framework/icon-pack/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-comments_/?$",
      "to": "/docs/$1$framework/comments/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-copy-paste/?$",
      "to": "/docs/$1$framework/basic-clipboard/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-export-file/?$",
      "to": "/docs/$1$framework/export-to-csv/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-conditional-formatting/?$",
      "to": "/docs/$1$framework/conditional-formatting/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-customizing-borders/?$",
      "to": "/docs/$1$framework/formatting-cells/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-custom-borders/?$",
      "to": "/docs/$1$framework/formatting-cells/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-selecting-ranges/?$",
      "to": "/docs/$1$framework/selection/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-formula-support/?$",
      "to": "/docs/$1$framework/formula-calculation/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-using-callbacks/?$",
      "to": "/docs/$1$framework/events-and-hooks/",
      "status": 301
    },
    {
      "from": "^/docs/((\\d+\\.\\d+|next)/)?demo-react-simple-examples/?$",
      "to": "/docs/$1$framework/react-simple-example/",
      "status": 301
    },
    {
      "from": "^/docs/((?:\\d+\\.\\d+|next)/)(?!(?:javascript|react)-data-grid|redirect|assets/|data/|handsontable|@handsontable/|img/|scripts/|404\\.html|sitemap\\.xml|securitum-certificate\\.pdf|seqred-certificate\\.pdf|testarmy-certificate\\.pdf|testarmy-certificate-2024\\.pdf)(.+)$",
      "to": "/docs/$1$framework/$2",
      "status": 301
    },
    {
      "from": "^/docs/(?!\\d+\\.\\d+|next\\/)(?!(?:javascript|react)-data-grid|redirect|assets/|data/|handsontable/|@handsontable/|img/|scripts/|404\\.html|sitemap\\.xml|securitum-certificate\\.pdf|seqred-certificate\\.pdf|testarmy-certificate\\.pdf|testarmy-certificate-2024\\.pdf)(.+)$",
      "to": "/docs/$framework/$1",
      "status": 301
    }
  ];
}

function getVersionRegexString(latestVersion: string) {
  const escapedVersion = latestVersion.replace('.', '\\.');
  return `^\\/docs\\/(?!${escapedVersion})(\\d+\\.\\d+)(\\/.*)?$`;
}

function prepareRedirects(framework: string): Redirect[] {
  const redirectsArray = getRawRedirects();
  const redirectOlderVersionsToOvh = {
    // Except of the latest version, all other versions should be redirected to the latest version
    // Fallback to ensure the value is not undefined
    from: getVersionRegexString(Netlify.env.get('LATEST_VERSION') || '14.5'),
    to: `https://_docs.handsontable.com/docs/$1$2`,
    status: 301,
    rewrite: true,
  };


  // Convert "from" string into a RegExp and replace $framework in "to" property
  const updatedRedirectsArray = [
    redirectOlderVersionsToOvh,
    ...redirectsArray
  ].map((redirect: { from: string, to: string, status: number, rewrite?: boolean }) => {
    const fromRegex = new RegExp(redirect.from); // Convert from string to RegExp
    const updatedTo = redirect.to.replace('$framework', framework); // Replace $framework with provided framework

    return {
      from: fromRegex,
      to: updatedTo,
      status: redirect.status,
      rewrite: redirect.rewrite,
    };
  });

  return updatedRedirectsArray;
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  console.log('Netlify env', Netlify.env);
  console.log('Current Netlify context', Netlify.env.context)
  console.log('Detected Docs Version', Netlify.env.get('LATEST_VERSION'));
  console.log('Request url', url);

  const cookieValue = context.cookies.get("docs_fw");
  const framework = cookieValue === 'react' ? 'react-data-grid' : 'javascript-data-grid';

  const redirects = prepareRedirects(framework);

  const matchFound = redirects.find(redirect => redirect.from.test(url.pathname));

  if (matchFound) {
    const newUrl = url.pathname.replace(matchFound.from, matchFound.to)

    if (matchFound.rewrite === true) {
      console.log('Match found, proxying to', newUrl);

      const response = await fetch(newUrl);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
    console.log('Match found, redirecting to', newUrl);
    return Response.redirect(newUrl, 301);
  }
  return context.next();
}

export const config: Config = {
  path: ["/*"],
}
