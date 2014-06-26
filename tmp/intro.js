/**
 * Handsontable 0.10.5
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: Fri Apr 11 2014 10:36:17 GMT+0100 (GMT Daylight Time)
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

var Handsontable = { //class namespace
  extension: {}, //extenstion namespace
  plugins: {}, //plugin namespace
  helper: {} //helper namespace
};

(function ($, window, Handsontable) {
  "use strict";