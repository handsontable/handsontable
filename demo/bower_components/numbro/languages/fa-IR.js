/*!
 * numbro.js language configuration
 * language : Farsi
 * locale: Iran
 * author : neo13 : https://github.com/neo13
 */
(function () {
    'use strict';

    var language = {
        langLocaleCode: 'fa-IR',
        cultureCode: 'fa-IR',
        delimiters: {
            thousands: '،',
            decimal: '.'
        },
        abbreviations: {
            thousand: 'هزار',
            million: 'میلیون',
            billion: 'میلیارد',
            trillion: 'تریلیون'
        },
        ordinal: function () {
            return 'ام';
        },
        currency: {
            symbol: '﷼'
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = language;
    }
    // Browser
    if (typeof window !== 'undefined' && window.numbro && window.numbro.culture) {
        window.numbro.culture(language.cultureCode, language);
    }
}.call(typeof window === 'undefined' ? this : window));
