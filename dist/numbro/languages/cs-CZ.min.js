/*!
 * numbro.js language configuration
 * language : Czech
 * locale: Czech Republic
 * author : Jan Pesa : https://github.com/smajl (based on work from Anatoli Papirovski : https://github.com/apapirovski)
 */
(function(){"use strict";var a={langLocaleCode:"cs-CZ",cultureCode:"cs-CZ",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tis.",million:"mil.",billion:"mld.",trillion:"bil."},ordinal:function(){return"."},currency:{symbol:"Kč",position:"postfix",spaceSeparated:!0},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);