/*!
 * numbro.js language configuration
 * language : Chinese traditional
 * locale: Macau
 * author : Tim McIntosh (StayinFront NZ)
 */
!function(){"use strict";var a={langLocaleCode:"zh-MO",cultureCode:"zh-MO",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百萬",billion:"十億",trillion:"兆"},ordinal:function(){return"."},currency:{symbol:"MOP"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture("zh-MO",a)}();