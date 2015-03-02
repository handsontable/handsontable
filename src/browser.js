
var version = Handsontable.version;

window.Handsontable = function (rootElement, userSettings) {
  var instance = new Handsontable.Core(rootElement, userSettings || {});

  instance.init();

  return instance;
};

Handsontable.version = version;

import './shims/array.filter.js';
import './shims/array.indexOf.js';
import './shims/array.isArray.js';
import './shims/object.keys.js';
import './shims/classes.js';
import './shims/weakmap.js';

Handsontable.plugins = {};

import {PluginHook} from './pluginHooks.js';

if (!Handsontable.hooks) {
  Handsontable.hooks = new PluginHook();
}

import './core.js';

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

import './../plugins/jqueryHandsontable.js';
