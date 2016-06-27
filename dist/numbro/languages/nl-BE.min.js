/*!
 * numbro.js language configuration
 * language : Dutch
 * locale: Belgium
 * author : Dieter Luypaert : https://github.com/moeriki
 */
(function(){"use strict";var a={langLocaleCode:"nl-BE",cultureCode:"nl-BE",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"mln",billion:"mld",trillion:"bln"},ordinal:function(a){var b=a%100;return 0!==a&&1>=b||8===b||b>=20?"ste":"de"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);