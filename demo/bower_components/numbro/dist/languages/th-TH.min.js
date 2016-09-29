/*!
 * numbro.js language configuration
 * language : Thai
 * locale : Thailand
 * author : Sathit Jittanupat : https://github.com/jojosati
 */
(function(){"use strict";var a={langLocaleCode:"th-TH",cultureCode:"th-TH",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"พัน",million:"ล้าน",billion:"พันล้าน",trillion:"ล้านล้าน"},ordinal:function(){return"."},currency:{symbol:"฿",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);