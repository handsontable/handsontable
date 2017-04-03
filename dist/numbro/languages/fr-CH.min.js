/*!
 * numbro.js language configuration
 * language : French
 * locale: Switzerland
 * author : Adam Draper : https://github.com/adamwdraper
 */
(function(){"use strict";var a={langLocaleCode:"fr-CH",cultureCode:"fr-CH",delimiters:{thousands:" ",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){return 1===a?"er":"ème"},currency:{symbol:"CHF",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);