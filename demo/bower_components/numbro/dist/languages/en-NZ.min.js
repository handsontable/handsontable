/*!
 * numbro.js language configuration
 * language : English
 * locale: New Zealand
 * author : Benedikt Huss : https://github.com/ben305
 */
(function(){"use strict";var a={langLocaleCode:"en-NZ",cultureCode:"en-NZ",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"$",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);