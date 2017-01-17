/*!
 * numbro.js language configuration
 * language : Korean
 * author (numbro.js Version): Randy Wilander : https://github.com/rocketedaway
 * author (numeral.js Version) : Rich Daley : https://github.com/pedantic-git
 */
(function(){"use strict";var a={langLocaleCode:"ko-KR",cultureCode:"ko-KR",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"천",million:"백만",billion:"십억",trillion:"일조"},ordinal:function(){return"."},currency:{symbol:"₩"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);