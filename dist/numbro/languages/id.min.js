/*!
 * numbro.js language configuration
 * language : Indonesian
 * author : Tim McIntosh (StayinFront NZ)
 */
(function(){"use strict";var a={langLocaleCode:"id",cultureCode:"id",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"r",million:"j",billion:"m",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"Rp"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture("id",a)}).call("undefined"==typeof window?this:window);