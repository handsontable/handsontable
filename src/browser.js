
window.Handsontable = function (rootElement, userSettings) {
  var instance = new Handsontable.Core(rootElement, userSettings || {});

  instance.init();

  return instance;
};
Handsontable.plugins = {};

import {PluginHook} from './pluginHooks.js';

if (!Handsontable.hooks) {
  Handsontable.hooks = new PluginHook();
}

//import numeral from './../lib/numeral.js';
//
//// Fix for numeral languages extension
//window.numeral = numeral;

import './../lib/shims/array.filter.js';
import './../lib/shims/array.indexOf.js';
import './../lib/shims/array.isArray.js';
import './../lib/shims/object.keys.js';
import './../lib/shims/weakmap.js';

import './core.js';
//import './multiMap.js';
//import './dom.js';
//import './eventManager.js';
//import './tableView.js';
//import './editors.js';
//import './editorManager.js';
//import './renderers.js';
//import './helpers.js';
//import './dataMap.js';

import './renderers/cellDecorator.js';
import './renderers/textRenderer.js';
import './renderers/autocompleteRenderer.js';
import './renderers/checkboxRenderer.js';
import './renderers/numericRenderer.js';
import './renderers/passwordRenderer.js';
import './renderers/htmlRenderer.js';

import './editors/baseEditor.js';
import './editors/textEditor.js';
import './editors/mobileTextEditor.js';
import './editors/checkboxEditor.js';
import './editors/dateEditor.js';
import './editors/handsontableEditor.js';
import './editors/autocompleteEditor.js';
import './editors/passwordEditor.js';
import './editors/selectEditor.js';
import './editors/dropdownEditor.js';
import './editors/numericEditor.js';

import './validators/numericValidator.js';
import './validators/autocompleteValidator.js';

import './cellTypes.js';

//import './3rdparty/autoResize.js';
//import './3rdparty/sheetclip.js';
//import './3rdparty/copypaste.js';
//import './3rdparty/json-patch-duplex.js';

//import './pluginHooks.js';
import './plugins/autoColumnSize.js';
import './plugins/columnSorting.js';
import './plugins/contextMenu.js';
import './plugins/comments.js';
import './plugins/manualColumnMove.js';
import './plugins/manualColumnResize.js';
import './plugins/manualRowResize.js';
import './plugins/observeChanges.js';
import './plugins/persistentState.js';
import './plugins/undoRedo.js';
import './plugins/dragToScroll/dragToScroll.js';
import './plugins/copyPaste.js';
import './plugins/search.js';
import './plugins/mergeCells/mergeCells.js';
import './plugins/customBorders/customBorders.js';
import './plugins/manualRowMove.js';
import './plugins/autofill.js';
import './plugins/grouping/grouping.js';
import './plugins/contextMenuCopyPaste/contextMenuCopyPaste.js';
import './plugins/multipleSelectionHandles/multipleSelectionHandles.js';
import './plugins/touchScroll/touchScroll.js';

//import './3rdparty/walkontable/src/_overlay.js';
//import './3rdparty/walkontable/src/border.js';
//import './3rdparty/walkontable/src/cellCoords.js';
//import './3rdparty/walkontable/src/cellRange.js';
//import './3rdparty/walkontable/src/columnFilter.js';
//import './3rdparty/walkontable/src/columnStrategy.js';
//import './3rdparty/walkontable/src/core.js';
//import './3rdparty/walkontable/src/debugOverlay.js';
//import './3rdparty/walkontable/src/event.js';
//import './3rdparty/walkontable/src/helpers.js';
//import './3rdparty/walkontable/src/polyfill.js';
//import './3rdparty/walkontable/src/rowFilter.js';
//import './3rdparty/walkontable/src/scroll.js';
//import './3rdparty/walkontable/src/scrollbarNativeCorner.js';
//import './3rdparty/walkontable/src/scrollbarNativeHorizontal.js';
//import './3rdparty/walkontable/src/scrollbarNativeVertical.js';
//import './3rdparty/walkontable/src/scrollbars.js';
//import './3rdparty/walkontable/src/selection.js';
//import './3rdparty/walkontable/src/settings.js';
//import './3rdparty/walkontable/src/table.js';
//import './3rdparty/walkontable/src/tableRenderer.js';
//import './3rdparty/walkontable/src/viewport.js';
//import './3rdparty/walkontable/src/viewportColumnsCalculator.js';
//import './3rdparty/walkontable/src/viewportRowsCalculator.js';

import './../plugins/jqueryHandsontable.js';
