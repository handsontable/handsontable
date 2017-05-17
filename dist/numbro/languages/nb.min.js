/*!
 * numbro.js language configuration
 * language : Norwegian Bokmål (nb)
 * author : Tim McIntosh (StayinFront NZ)
 */
(function(){"use strict";var a={langLocaleCode:"nb",cultureCode:"nb",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"t",million:"mil",billion:"mia",trillion:"b"},ordinal:function(){return"."},currency:{symbol:"kr"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture("nb",a)}).call("undefined"==typeof window?this:window);