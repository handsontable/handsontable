
var version = Handsontable.version;
var buildDate = Handsontable.buildDate;

window.Handsontable = function Handsontable(rootElement, userSettings) {
  var instance = new Handsontable.Core(rootElement, userSettings || {});

  instance.init();

  return instance;
};

Handsontable.version = version;
Handsontable.buildDate = buildDate;

import './shims/array.filter.js';
import './shims/array.indexOf.js';
import './shims/array.isArray.js';
import './shims/classes.js';
import './shims/object.keys.js';
import './shims/string.trim.js';
import './shims/weakmap.js';

Handsontable.plugins = {};

import {Hooks} from './pluginHooks.js';

if (!Handsontable.hooks) {
  Handsontable.hooks = new Hooks();
}

import './core.js';
import './renderers/_cellDecorator.js';
import './cellTypes.js';
import './../plugins/jqueryHandsontable.js';
