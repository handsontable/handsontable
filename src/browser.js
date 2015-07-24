
let version = Handsontable.version;
let buildDate = Handsontable.buildDate;

window.Handsontable = function Handsontable(rootElement, userSettings) {
  var instance = new Handsontable.Core(rootElement, userSettings || {});

  instance.init();

  return instance;
};

Handsontable.version = version;
Handsontable.buildDate = buildDate;

import './shims/classes';
import 'es6collections';

Handsontable.plugins = {};

import {Hooks} from './pluginHooks';

if (!Handsontable.hooks) {
  Handsontable.hooks = new Hooks();
}

import './core';
import './renderers/_cellDecorator';
import './cellTypes';
import './../plugins/jqueryHandsontable';

// export helpers
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
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';

Handsontable.dom = {};
Handsontable.Dom = Handsontable.dom; // legacy support

arrayHelpers.arrayEach([domHelpers, domEventHelpers], (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});
