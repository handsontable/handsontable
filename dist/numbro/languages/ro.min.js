/*!
 * numbro.js language configuration
 * language : Romanian (ro)
 * author : Tim McIntosh (StayinFront NZ)
 */
(function(){"use strict";var a={langLocaleCode:"ro",cultureCode:"ro",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"mie",million:"mln",billion:"mld",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"RON"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture("ro",a)}).call("undefined"==typeof window?this:window);