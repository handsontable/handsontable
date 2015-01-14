/*!
 * Handsontable @@version
 * Handsontable is a JavaScript library for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012-2014 Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: @@timestamp
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

//var Handsontable = { //class namespace
//  plugins: {}, //plugin namespace
//  helper: {} //helper namespace
//};

var Handsontable = function (rootElement, userSettings) {
  userSettings = userSettings || {};
  var instance = new Handsontable.Core(rootElement, userSettings);
  instance.init();
  return instance;
};
Handsontable.plugins = {};

(function (window, Handsontable) {
  "use strict";
