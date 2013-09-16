/**
 * Handsontable @@version
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: @@timestamp
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

(function(factory){

  // AMD
  if (typeof define === 'function' && define.amd) {
    define('handsontable', ['jquery'], factory);

  // CommonJS
  } else if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('jquery'));

  // Global
  } else {
    window.Handsontable = factory(window.jQuery);
  }

}(function($){
  "use strict";

// Override locally to prevent 3rd party libraries from trying to export
var define = null;

var Handsontable = { //class namespace
  extension: {}, //extenstion namespace
  helper: {} //helper namespace
};
