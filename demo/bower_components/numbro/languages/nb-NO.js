/*!
 * numbro.js language configuration
 * language: Norwegian Bokmål
 * locale: Norway
 * author : Benjamin Van Ryseghem
 */
(function() {
    'use strict';

    var language = {
        langLocaleCode: 'nb-NO',
        cultureCode: 'nb-NO',
        delimiters: {
            thousands: ' ',
            decimal: ','
        },
        abbreviations: {
            thousand: 't',
            million: 'M',
            billion: 'md',
            trillion: 't'
        },
        currency: {
            symbol: 'kr',
            position: 'postfix'
        },
        defaults: {
            currencyFormat: ',4 a'
        },
        formats: {
            fourDigits: '4 a',
            fullWithTwoDecimals: ',0.00 $',
            fullWithTwoDecimalsNoCurrency: ',0.00',
            fullWithNoDecimals: ',0 $'
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
