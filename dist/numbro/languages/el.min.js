/*!
 * numbro.js language configuration
 * language : Greek (el)
 * author : Tim McIntosh (StayinFront NZ)
 */
(function(){"use strict";var a={langLocaleCode:"el",cultureCode:"el",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"χ",million:"ε",billion:"δ",trillion:"τ"},ordinal:function(){return"."},currency:{symbol:"€"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture("el",a)}).call("undefined"==typeof window?this:window);