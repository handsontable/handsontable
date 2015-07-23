
let version = Handsontable.version;
let buildDate = Handsontable.buildDate;

window.Handsontable = function Handsontable(rootElement, userSettings) {
  var instance = new Handsontable.Core(rootElement, userSettings || {});

  instance.init();

  return instance;
};

Handsontable.version = version;
Handsontable.buildDate = buildDate;

import './shims/classes.js';
import 'es6collections';

Handsontable.plugins = {};

import {Hooks} from './pluginHooks.js';

if (!Handsontable.hooks) {
  Handsontable.hooks = new Hooks();
}

import './core.js';
import './renderers/_cellDecorator.js';
import './cellTypes.js';
import './../plugins/jqueryHandsontable.js';

// export helpers
import * as arrayHelpers from './helpers/array.js';
import * as browserHelpers from './helpers/browser.js';
import * as dataHelpers from './helpers/data.js';
import * as functionHelpers from './helpers/function.js';
import * as mixedHelpers from './helpers/mixed.js';
import * as numberHelpers from './helpers/number.js';
import * as objectHelpers from './helpers/object.js';
import * as settingHelpers from './helpers/setting.js';
import * as stringHelpers from './helpers/string.js';
import * as unicodeHelpers from './helpers/unicode.js';

const helpers = [arrayHelpers, browserHelpers, dataHelpers, functionHelpers, mixedHelpers, numberHelpers, objectHelpers,
  settingHelpers, stringHelpers, unicodeHelpers];

Handsontable.helper = {};

arrayHelpers.arrayEach(helpers, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.helper[key] = helper[key];
    }
  });
});

// export helpers
import * as domHelpers from './helpers/dom/element.js';
import * as domEventHelpers from './helpers/dom/event.js';

Handsontable.dom = {};
Handsontable.Dom = Handsontable.dom; // legacy support

arrayHelpers.arrayEach([domHelpers, domEventHelpers], (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});
