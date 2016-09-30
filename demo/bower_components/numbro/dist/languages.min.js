/*!
 * numbro.js language configuration
 * language : Czech
 * locale: Czech Republic
 * author : Anatoli Papirovski : https://github.com/apapirovski
 */
(function(){"use strict";var a={langLocaleCode:"cs-CZ",cultureCode:"cs-CZ",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tis.",million:"mil.",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"Kč",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}).call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Danish
 * locale: Denmark
 * author : Michael Storgaard : https://github.com/mstorgaard
 */
function(){"use strict";var a={langLocaleCode:"da-DK",cultureCode:"da-DK",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mio",billion:"mia",trillion:"b"},ordinal:function(){return"."},currency:{symbol:"kr",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : German
 * locale: Switzerland
 * author : Michael Piefel : https://github.com/piefel (based on work from Marco Krage : https://github.com/sinky)
 */
function(){"use strict";var a={langLocaleCode:"de-CH",cultureCode:"de-CH",delimiters:{thousands:"'",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"CHF",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : German
 * locale: Germany
 * author : Marco Krage : https://github.com/sinky
 *
 * Generally useful in Germany, Austria, Luxembourg, Belgium
 */
function(){"use strict";var a={langLocaleCode:"de-DE",cultureCode:"de-DE",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"€",position:"postfix",spaceSeparated:!0},defaults:{currencyFormat:",4"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : English
 * locale: Australia
 * author : Benedikt Huss : https://github.com/ben305
 */
function(){"use strict";var a={langLocaleCode:"en-AU",cultureCode:"en-AU",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"$",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : English
 * locale: United Kingdom of Great Britain and Northern Ireland
 * author : Dan Ristic : https://github.com/dristic
 */
function(){"use strict";var a={langLocaleCode:"en-GB",cultureCode:"en-GB",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"£",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : English
 * locale: New Zealand
 * author : Benedikt Huss : https://github.com/ben305
 */
function(){"use strict";var a={langLocaleCode:"en-NZ",cultureCode:"en-NZ",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"$",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : English
 * locale: South Africa
 * author : Stewart Scott https://github.com/stewart42
 */
function(){"use strict";var a={langLocaleCode:"en-ZA",cultureCode:"en-ZA",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"R",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Spanish
 * locale: Argentina
 * author : Hernan Garcia : https://github.com/hgarcia
 */
function(){"use strict";var a={langLocaleCode:"es-AR",cultureCode:"es-AR",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mm",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===b||3===b?"er":2===b?"do":7===b||0===b?"mo":8===b?"vo":9===b?"no":"to"},currency:{symbol:"$",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Spanish
 * locale: Spain
 * author : Hernan Garcia : https://github.com/hgarcia
 */
function(){"use strict";var a={langLocaleCode:"es-ES",cultureCode:"es-ES",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mm",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===b||3===b?"er":2===b?"do":7===b||0===b?"mo":8===b?"vo":9===b?"no":"to"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Estonian
 * locale: Estonia
 * author : Illimar Tambek : https://github.com/ragulka
 *
 * Note: in Estonian, abbreviations are always separated
 * from numbers with a space
 */
function(){"use strict";var a={langLocaleCode:"et-EE",cultureCode:"et-EE",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:" tuh",million:" mln",billion:" mld",trillion:" trl"},ordinal:function(){return"."},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Farsi
 * locale: Iran
 * author : neo13 : https://github.com/neo13
 */
function(){"use strict";var a={langLocaleCode:"fa-IR",cultureCode:"fa-IR",delimiters:{thousands:"،",decimal:"."},abbreviations:{thousand:"هزار",million:"میلیون",billion:"میلیارد",trillion:"تریلیون"},ordinal:function(){return"ام"},currency:{symbol:"﷼"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Finnish
 * locale: Finland
 * author : Sami Saada : https://github.com/samitheberber
 */
function(){"use strict";var a={langLocaleCode:"fi-FI",cultureCode:"fi-FI",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"M",billion:"G",trillion:"T"},ordinal:function(){return"."},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Filipino (Pilipino)
 * locale: Philippines
 * author : Michael Abadilla : https://github.com/mjmaix
 */
function(){"use strict";var a={langLocaleCode:"fil-PH",cultureCode:"fil-PH",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){var b=a%10;return 1===~~(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th"},currency:{symbol:"₱"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : French
 * locale: Canada
 * author : Léo Renaud-Allaire : https://github.com/renaudleo
 */
function(){"use strict";var a={langLocaleCode:"fr-CA",cultureCode:"fr-CA",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"M",billion:"G",trillion:"T"},ordinal:function(a){return 1===a?"er":"ème"},currency:{symbol:"$",position:"postfix",spaceSeparated:!0},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : French
 * locale: Switzerland
 * author : Adam Draper : https://github.com/adamwdraper
 */
function(){"use strict";var a={langLocaleCode:"fr-CH",cultureCode:"fr-CH",delimiters:{thousands:"'",decimal:"."},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){return 1===a?"er":"ème"},currency:{symbol:"CHF",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : French
 * locale: France
 * author : Adam Draper : https://github.com/adamwdraper
 */
function(){"use strict";var a={langLocaleCode:"fr-FR",cultureCode:"fr-FR",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(a){return 1===a?"er":"ème"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Hebrew
 * locale : IL
 * author : Eli Zehavi : https://github.com/eli-zehavi
 */
function(){"use strict";var a={langLocaleCode:"he-IL",cultureCode:"he-IL",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"אלף",million:"מליון",billion:"בליון",trillion:"טריליון"},currency:{symbol:"₪",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"₪ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"₪ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Hungarian
 * locale: Hungary
 * author : Peter Bakondy : https://github.com/pbakondy
 */
function(){"use strict";var a={langLocaleCode:"hu-HU",cultureCode:"hu-HU",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"E",// ezer
million:"M",// millió
billion:"Mrd",// milliárd
trillion:"T"},ordinal:function(){return"."},currency:{symbol:" Ft",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Italian
 * locale: Italy
 * author : Giacomo Trombi : http://cinquepunti.it
 */
function(){"use strict";var a={langLocaleCode:"it-IT",cultureCode:"it-IT",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"mila",million:"mil",billion:"b",trillion:"t"},ordinal:function(){return"º"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Japanese
 * locale: Japan
 * author : teppeis : https://github.com/teppeis
 */
function(){"use strict";var a={langLocaleCode:"ja-JP",cultureCode:"ja-JP",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百万",billion:"十億",trillion:"兆"},ordinal:function(){return"."},currency:{symbol:"¥",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Korean
 * author (numbro.js Version): Randy Wilander : https://github.com/rocketedaway
 * author (numeral.js Version) : Rich Daley : https://github.com/pedantic-git
 */
function(){"use strict";var a={langLocaleCode:"ko-KR",cultureCode:"ko-KR",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"천",million:"백만",billion:"십억",trillion:"일조"},ordinal:function(){return"."},currency:{symbol:"₩"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Latvian
 * locale: Latvia
 * author : Lauris Bukšis-Haberkorns : https://github.com/Lafriks
 */
function(){"use strict";var a={langLocaleCode:"lv-LV",cultureCode:"lv-LV",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:" tūkst.",million:" milj.",billion:" mljrd.",trillion:" trilj."},ordinal:function(){return"."},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language: Norwegian Bokmål
 * locale: Norway
 * author : Benjamin Van Ryseghem
 */
function(){"use strict";var a={langLocaleCode:"nb-NO",cultureCode:"nb-NO",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"t",million:"M",billion:"md",trillion:"t"},currency:{symbol:"kr",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Dutch
 * locale: Belgium
 * author : Dieter Luypaert : https://github.com/moeriki
 */
function(){"use strict";var a={langLocaleCode:"nl-BE",cultureCode:"nl-BE",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"mln",billion:"mld",trillion:"bln"},ordinal:function(a){var b=a%100;return 0!==a&&1>=b||8===b||b>=20?"ste":"de"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Dutch
 * locale: Netherlands
 * author : Dave Clayton : https://github.com/davedx
 */
function(){"use strict";var a={langLocaleCode:"nl-NL",cultureCode:"nl-NL",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"k",million:"mln",billion:"mrd",trillion:"bln"},ordinal:function(a){var b=a%100;return 0!==a&&1>=b||8===b||b>=20?"ste":"de"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Polish
 * locale : Poland
 * author : Dominik Bulaj : https://github.com/dominikbulaj
 */
function(){"use strict";var a={langLocaleCode:"pl-PL",cultureCode:"pl-PL",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tys.",million:"mln",billion:"mld",trillion:"bln"},ordinal:function(){return"."},currency:{symbol:" zł",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Portuguese
 * locale : Brazil
 * author : Ramiro Varandas Jr : https://github.com/ramirovjr
 */
function(){"use strict";var a={langLocaleCode:"pt-BR",cultureCode:"pt-BR",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"mil",million:"milhões",billion:"b",trillion:"t"},ordinal:function(){return"º"},currency:{symbol:"R$",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Portuguese
 * locale : Portugal
 * author : Diogo Resende : https://github.com/dresende
 */
function(){"use strict";var a={langLocaleCode:"pt-PT",cultureCode:"pt-PT",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"k",million:"m",billion:"b",trillion:"t"},ordinal:function(){return"º"},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Russian
 * locale : Russsia
 * author : Anatoli Papirovski : https://github.com/apapirovski
 */
function(){"use strict";var a={langLocaleCode:"ru-RU",cultureCode:"ru-RU",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"тыс.",million:"млн",billion:"b",trillion:"t"},ordinal:function(){
// not ideal, but since in Russian it can taken on
// different forms (masculine, feminine, neuter)
// this is all we can do
return"."},currency:{symbol:"руб.",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Russian
 * locale : Ukraine
 * author : Anatoli Papirovski : https://github.com/apapirovski
 */
function(){"use strict";var a={langLocaleCode:"ru-UA",cultureCode:"ru-UA",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"тыс.",million:"млн",billion:"b",trillion:"t"},ordinal:function(){
// not ideal, but since in Russian it can taken on
// different forms (masculine, feminine, neuter)
// this is all we can do
return"."},currency:{symbol:"₴",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Slovak
 * locale : Slovakia
 * author : Ahmed Al Hafoudh : http://www.freevision.sk
 */
function(){"use strict";var a={langLocaleCode:"sk-SK",cultureCode:"sk-SK",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"tis.",million:"mil.",billion:"b",trillion:"t"},ordinal:function(){return"."},currency:{symbol:"€",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Swedish
 * locale : Sweden
 * author : Benjamin Van Ryseghem (benjamin.vanryseghem.com)
 */
function(){"use strict";var a={langLocaleCode:"sv-SE",cultureCode:"sv-SE",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"t",million:"M",billion:"md",trillion:"tmd"},currency:{symbol:"kr",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Thai
 * locale : Thailand
 * author : Sathit Jittanupat : https://github.com/jojosati
 */
function(){"use strict";var a={langLocaleCode:"th-TH",cultureCode:"th-TH",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"พัน",million:"ล้าน",billion:"พันล้าน",trillion:"ล้านล้าน"},ordinal:function(){return"."},currency:{symbol:"฿",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Turkish
 * locale : Turkey
 * author : Ecmel Ercan : https://github.com/ecmel,
 *          Erhan Gundogan : https://github.com/erhangundogan,
 *          Burak Yiğit Kaya: https://github.com/BYK
 */
function(){"use strict";var a={1:"'inci",5:"'inci",8:"'inci",70:"'inci",80:"'inci",2:"'nci",7:"'nci",20:"'nci",50:"'nci",3:"'üncü",4:"'üncü",100:"'üncü",6:"'ncı",9:"'uncu",10:"'uncu",30:"'uncu",60:"'ıncı",90:"'ıncı"},b={langLocaleCode:"tr-TR",cultureCode:"tr-TR",delimiters:{thousands:".",decimal:","},abbreviations:{thousand:"bin",million:"milyon",billion:"milyar",trillion:"trilyon"},ordinal:function(b){if(0===b)// special case for zero
return"'ıncı";var c=b%10,d=b%100-c,e=b>=100?100:null;return a[c]||a[d]||a[e]},currency:{symbol:"₺",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=b),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(b.cultureCode,b)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Ukrainian
 * locale : Ukraine
 * author : Michael Piefel : https://github.com/piefel (with help from Tetyana Kuzmenko)
 */
function(){"use strict";var a={langLocaleCode:"uk-UA",cultureCode:"uk-UA",delimiters:{thousands:" ",decimal:","},abbreviations:{thousand:"тис.",million:"млн",billion:"млрд",trillion:"блн"},ordinal:function(){
// not ideal, but since in Ukrainian it can taken on
// different forms (masculine, feminine, neuter)
// this is all we can do
return""},currency:{symbol:"₴",position:"postfix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:",0.00 $",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:",0 $"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : simplified chinese
 * locale : China
 * author : badplum : https://github.com/badplum
 */
function(){"use strict";var a={langLocaleCode:"zh-CN",cultureCode:"zh-CN",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百万",billion:"十亿",trillion:"兆"},ordinal:function(){return"."},currency:{symbol:"¥",position:"prefix"},defaults:{currencyFormat:",4 a"},formats:{fourDigits:"4 a",fullWithTwoDecimals:"$ ,0.00",fullWithTwoDecimalsNoCurrency:",0.00",fullWithNoDecimals:"$ ,0"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window),/*!
 * numbro.js language configuration
 * language : Chinese (Taiwan)
 * author (numbro.js Version): Randy Wilander : https://github.com/rocketedaway
 * author (numeral.js Version) : Rich Daley : https://github.com/pedantic-git
 */
function(){"use strict";var a={langLocaleCode:"zh-TW",cultureCode:"zh-TW",delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"千",million:"百萬",billion:"十億",trillion:"兆"},ordinal:function(){return"第"},currency:{symbol:"NT$"}};
// CommonJS
"undefined"!=typeof module&&module.exports&&(module.exports=a),
// Browser
"undefined"!=typeof window&&window.numbro&&window.numbro.culture&&window.numbro.culture(a.cultureCode,a)}.call("undefined"==typeof window?this:window);