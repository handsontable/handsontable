/*!
 * numbro.js language configuration
 * language : Polish
 * locale : Poland
 * author : Dominik Bulaj : https://github.com/dominikbulaj
 */
(function(){"use strict";var a={langLocaleCode:"pl-PL",cultureCode:"pl-PL",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tys.",million:"mln",billion:"mld",trillion:"bln"},ordinal:function(){return"."},currency:{symbol:" zł",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);