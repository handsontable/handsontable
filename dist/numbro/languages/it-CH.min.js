/*!
 * numbro.js language configuration
 * language : Italian
 * locale: Switzerland
 * author : Tim McIntosh (StayinFront NZ)
 */
(function(){"use strict";var a={langLocaleCode:"it-CH",cultureCode:"it-CH",delimiters:{thousands:"'",decimal:"."},abbreviations:{thousand:"mila",million:"mil",billion:"b",trillion:"t"},ordinal:function(){return"°"},currency:{symbol:"CHF"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture("it-CH",a)}).call("undefined"==typeof window?this:window);