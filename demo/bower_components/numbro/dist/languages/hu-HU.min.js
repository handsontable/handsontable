/*!
 * numbro.js language configuration
 * language : Hungarian
 * locale: Hungary
 * author : Peter Bakondy : https://github.com/pbakondy
 */
(function(){"use strict";var a={langLocaleCode:"hu-HU",cultureCode:"hu-HU",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"E",// ezer
million:"M",// millió
billion:"Mrd",// milliárd
trillion:"T"},ordinal:function(){return"."},currency:{symbol:" Ft",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);