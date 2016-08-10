/*!
 * numbro.js language configuration
 * language : Finnish
 * locale: Finland
 * author : Sami Saada : https://github.com/samitheberber
 */
(function(){"use strict";var a={langLocaleCode:"fi-FI",cultureCode:"fi-FI",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"M",billion:"G",trillion:"T"},ordinal:function(){return"."},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);