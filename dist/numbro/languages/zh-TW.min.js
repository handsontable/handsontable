/*!
 * numbro.js language configuration
 * language : Chinese (Taiwan)
 * author (numbro.js Version): Randy Wilander : https://github.com/rocketedaway
 * author (numeral.js Version) : Rich Daley : https://github.com/pedantic-git
 */
(function(){"use strict";var a={langLocaleCode:"zh-TW",cultureCode:"zh-TW",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百萬",billion:"十億",trillion:"兆"},ordinal:function(){return"第"},currency:{symbol:"NT$"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);