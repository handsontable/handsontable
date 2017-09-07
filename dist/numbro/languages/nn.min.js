/*!
 * numbro.js language configuration
 * language : Norwegian Nynorsk (nn)
 * author : Tim McIntosh (StayinFront NZ)
 */
!function(){"use strict";var a={langLocaleCode:"nn",cultureCode:"nn",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"t",million:"mil",billion:"mia",trillion:"b"},ordinal:function(){return"."},currency:{symbol:"kr"}};
// Node
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.language&&window.numbro.language("nn",a)}();