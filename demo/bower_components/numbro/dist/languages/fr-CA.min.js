/*!
 * numbro.js language configuration
 * language : French
 * locale: Canada
 * author : Léo Renaud-Allaire : https://github.com/renaudleo
 */
(function(){"use strict";var a={langLocaleCode:"fr-CA",cultureCode:"fr-CA",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"M",billion:"G",trillion:"T"},ordinal:function(a){return 1===a?"er":"ème"},currency:{symbol:"$",position:"postfix",spaceSeparated:!0},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);