/*!
 * numbro.js language configuration
 * language : Chinese simplified (zh-HANS)
 * author : Tim McIntosh (StayinFront NZ)
 */
!function(){"use strict";var a={langLocaleCode:"zh-HANS",cultureCode:"zh-HANS",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百万",billion:"十亿",trillion:"兆"},ordinal:function(){return"."},currency:{symbol:"¥"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&this.numbro&&this.numbro.culture&&this.numbro.culture("zh-HANS",a)}();