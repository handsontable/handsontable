/*!
 * numeral.js language configuration
 * language : Romanian
 * author : Andrei Alecu https://github.com/andreialecu
 */
(function(){"use strict";var a={langLocaleCode:"ro-RO",cultureCode:"ro-RO",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"mii",million:"mil",billion:"mld",trillion:"bln"},ordinal:function(){return"."},currency:{symbol:" lei",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);