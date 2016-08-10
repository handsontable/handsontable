/*!
 * numbro.js language configuration
 * language : Farsi
 * locale: Iran
 * author : neo13 : https://github.com/neo13
 */
(function(){"use strict";var a={langLocaleCode:"fa-IR",cultureCode:"fa-IR",delimiters:{thousands:"،",decimal:"."},abbreviations:{thousand:"هزار",million:"میلیون",billion:"میلیارد",trillion:"تریلیون"},ordinal:function(){return"ام"},currency:{symbol:"﷼"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window);