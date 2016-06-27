/*!
 * numbro.js language configuration
 * language : Portuguese
 * locale : Portugal
 * author : Diogo Resende : https://github.com/dresende
 */
(function(){"use strict";var a={langLocaleCode:"pt-PT",cultureCode:"pt-PT",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(){return"º"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);