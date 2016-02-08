
window.Handsontable = function Handsontable(rootElement, userSettings) {
  let instance = new Handsontable.Core(rootElement, userSettings || {});

  instance.init();

  return instance;
};

import './shims/classes';
import 'es6collections';
import {Hooks} from './pluginHooks';

if (!Handsontable.hooks) {
  Handsontable.hooks = new Hooks();
}

import './core';
import './renderers/_cellDecorator';
import './cellTypes';
import './../plugins/jqueryHandsontable';
import * as arrayHelpers from './helpers/array';
import * as browserHelpers from './helpers/browser';
import * as dataHelpers from './helpers/data';
import * as functionHelpers from './helpers/function';
import * as mixedHelpers from './helpers/mixed';
import * as numberHelpers from './helpers/number';
import * as objectHelpers from './helpers/object';
import * as settingHelpers from './helpers/setting';
import * as stringHelpers from './helpers/string';
import * as unicodeHelpers from './helpers/unicode';
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';

const HELPERS = [
  arrayHelpers,
  browserHelpers,
  dataHelpers,
  functionHelpers,
  mixedHelpers,
  numberHelpers,
  objectHelpers,
  settingHelpers,
  stringHelpers,
  unicodeHelpers,
];
const DOM = [
  domHelpers,
  domEventHelpers,
];

Handsontable.buildDate = '@@timestamp';
Handsontable.packageName = '@@name';
Handsontable.version = '@@version';

let baseVersion = '@@baseVersion';

if (!/^@@/.test(baseVersion)) {
  Handsontable.baseVersion = baseVersion;
}

// namespace for plugins
Handsontable.plugins = {};

import {registerPlugin} from './plugins';

Handsontable.plugins.registerPlugin = registerPlugin;

Handsontable.helper = {};
Handsontable.dom = {};
// legacy support
Handsontable.Dom = Handsontable.dom;

// fill helpers
arrayHelpers.arrayEach(HELPERS, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.helper[key] = helper[key];
    }
  });
});

// fill dom helpers
arrayHelpers.arrayEach(DOM, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});
