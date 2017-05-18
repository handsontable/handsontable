/*!
 * numbro.js language configuration
 * language : Bulgarian
 * author : Tim McIntosh (StayinFront NZ)
 */
(function(){"use strict";var a={langLocaleCode:"bg",cultureCode:"bg",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"И",million:"А",billion:"M",trillion:"T"},ordinal:function(){return"."},currency:{symbol:"лв."}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&this.numbro.culture("bg",a)}).call("undefined"==typeof window?this:window);