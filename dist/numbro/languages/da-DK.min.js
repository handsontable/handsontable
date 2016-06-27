/*!
 * numbro.js language configuration
 * language : Danish
 * locale: Denmark
 * author : Michael Storgaard : https://github.com/mstorgaard
 */
(function(){"use strict";var a={langLocaleCode:"da-DK",cultureCode:"da-DK",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mio",billion:"mia",trillion:"b"},ordinal:function(){return"."},currency:{symbol:"kr",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);