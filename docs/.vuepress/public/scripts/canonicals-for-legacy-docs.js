/* eslint-disable */
(function() {
  var docsPageRegExp = /^\/docs\/\d+\.\d+\.\d+\/.+\.html$/;

  if (!docsPageRegExp.test(location.pathname)) {
    return;
  }

  var urlsMap = [
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-introduction.html$/, '/docs/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-compatibility.html$/, '/docs/supported-browsers/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-licensing.html$/, '/docs/software-license/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-license-key.html$/, '/docs/license-key/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-quick-start.html$/, '/docs/installation/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-data-binding.html$/, '/docs/binding-to-data/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-data-sources.html$/, '/docs/binding-to-data/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-load-and-save.html$/, '/docs/saving-data/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-setting-options.html$/, '/docs/setting-options/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-grid-sizing.html$/, '/docs/grid-size/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-using-callbacks.html$/, '/docs/events-and-hooks/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-keyboard-navigation.html$/, '/docs/keyboard-navigation/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-internationalization.html$/, '/docs/internationalization-i18n/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-internationalization.html$/, '/docs/internationalization-i18n/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-modules.html$/, '/docs/modules/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-custom-build.html$/, '/docs/building/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-cell-types.html$/, '/docs/cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-cell-editor.html$/, '/docs/cell-editor/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-cell-function.html$/, '/docs/cell-function/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-suspend-rendering.html$/, '/docs/batch-operations/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-testing.html$/, '/docs/testing/'],
    [/\/docs\/\d+\.\d+\.\d+\/tutorial-migration-guide.html$/, '/docs/migration-from-7.4-to-8.0/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-installation.html$/, '/docs/react-installation/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-simple-examples.html$/, '/docs/react-simple-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-hot-column.html$/, '/docs/react-hot-column/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-setting-up-a-locale.html$/, '/docs/react-setting-up-a-language/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-custom-context-menu-example.html$/, '/docs/react-custom-context-menu-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-custom-editor-example.html$/, '/docs/react-custom-editor-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-custom-renderer-example.html$/, '/docs/react-custom-renderer-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-language-change-example.html$/, '/docs/react-language-change-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-redux-example.html$/, '/docs/react-redux-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-react-hot-reference.html$/, '/docs/react-hot-reference/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-installation.html$/, '/docs/angular-installation/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-simple-example.html$/, '/docs/angular-simple-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-custom-id.html$/, '/docs/angular-custom-id/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-setting-up-a-locale.html$/, '/docs/angular-setting-up-a-language/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-custom-context-menu-example.html$/, '/docs/angular-custom-context-menu-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-custom-editor-example.html$/, '/docs/angular-custom-editor-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-custom-renderer-example.html$/, '/docs/angular-custom-renderer-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-language-change-example.html$/, '/docs/angular-language-change-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-angular-hot-reference.html$/, '/docs/angular-hot-reference/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-installation.html$/, '/docs/vue-installation/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-simple-example.html$/, '/docs/vue-simple-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-hot-column.html$/, '/docs/vue-hot-column/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-setting-up-a-locale.html$/, '/docs/vue-setting-up-a-language/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-custom-id-class-style.html$/, '/docs/vue-custom-id-class-style/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-custom-context-menu-example.html$/, '/docs/vue-custom-context-menu-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-custom-editor-example.html$/, '/docs/vue-custom-editor-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-custom-renderer-example.html$/, '/docs/vue-custom-renderer-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-language-change-example.html$/, '/docs/vue-language-change-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-vuex-example.html$/, '/docs/vue-vuex-example/'],
    [/\/docs\/\d+\.\d+\.\d+\/frameworks-wrapper-for-vue-hot-reference.html$/, '/docs/vue-hot-reference/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-scrolling.html$/, '/docs/row-virtualization/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-fixing.html$/, '/docs/column-freezing/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-resizing.html$/, '/docs/column-width/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-moving.html$/, '/docs/column-moving/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-header-tooltips.html$/, '/docs/8.4.0/demo-header-tooltips.html'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-pre-populating.html$/, '/docs/row-prepopulating/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-stretching.html$/, '/docs/column-width/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-freezing.html$/, '/docs/column-freezing/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-fixing-bottom.html$/, '/docs/row-freezing/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-hiding-rows.html$/, '/docs/row-hiding/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-hiding-columns.html$/, '/docs/column-hiding/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-trimming-rows.html$/, '/docs/row-trimming/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-bind-rows-headers.html$/, '/docs/row-header/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-collapsing-columns.html$/, '/docs/column-groups/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-nested-headers.html$/, '/docs/column-groups/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-nested-rows.html$/, '/docs/row-parent-child/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-dropdown-menu.html$/, '/docs/column-menu/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-sorting.html$/, '/docs/row-sorting/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-multicolumn-sorting.html$/, '/docs/row-sorting/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-searching.html$/, '/docs/searching-values/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-filtering.html$/, '/docs/column-filter/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-summary-calculations.html$/, '/docs/column-summary//'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-data-validation.html$/, '/docs/cell-validator/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-auto-fill.html$/, '/docs/autofill-values/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-merged-cells.html$/, '/docs/merge-cells/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-alignment.html$/, '/docs/text-alignment/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-read-only.html$/, '/docs/disabled-cells/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-disabled-editing.html$/, '/docs/disabled-cells/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-custom-renderers.html$/, '/docs/cell-renderer/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-numeric.html$/, '/docs/numeric-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-date.html$/, '/docs/date-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-time.html$/, '/docs/time-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-checkbox.html$/, '/docs/checkbox-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-select.html$/, '/docs/select-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-dropdown.html$/, '/docs/dropdown-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-autocomplete.html$/, '/docs/autocomplete-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-password.html$/, '/docs/password-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-handsontable.html$/, '/docs/handsontable-cell-type/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-context-menu.html$/, '/docs/context-menu/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-custom-buttons.html$/, '/docs/8.4.0/demo-custom-buttons.html'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-spreadsheet-icons.html$/, '/docs/icon-pack/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-comments_.html$/, '/docs/comments/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-copy-paste.html$/, '/docs/basic-clipboard/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-export-file.html$/, '/docs/export-to-csv/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-conditional-formatting.html$/, '/docs/conditional-formatting/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-customizing-borders.html$/, '/docs/formatting-cells/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-selecting-ranges.html$/, '/docs/selection/'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-highlighting-selection.html$/, '/docs/8.4.0/demo-highlighting-selection.html'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-mobiles-and-tablets.html$/, '/docs/8.4.0/demo-mobiles-and-tablets.html'],
    [/\/docs\/\d+\.\d+\.\d+\/demo-formula-support.html$/, '/docs/formula-calculation/'],
  ];

  function getURLPathname(pathname) {
    var newPathname = pathname;

    for (var index = 0; index < urlsMap.length; index++) {
      var tester = urlsMap[index][0];

      if (tester.test(pathname)) {
        newPathname = urlsMap[index][1];
        break;
      }
    }

    return newPathname;
  }

  var link = document.querySelector("link[rel='canonical']") ? document.querySelector("link[rel='canonical']") : document.createElement('link');

  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', location.protocol + '//' + location.host + getURLPathname(location.pathname));

  document.head.appendChild(link);
}());
