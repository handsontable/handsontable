/*!
 * numbro.js language configuration
 * language : Serbian (sr)
 * country : Serbia (Cyrillic)
 * author : Tim McIntosh (StayinFront NZ)
 */
!function(){"use strict";var a={langLocaleCode:"sr-Cyrl-RS",cultureCode:"sr-Cyrl-RS",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"тыс.",million:"млн",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"RSD"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture("sr-Cyrl-RS",a)}();