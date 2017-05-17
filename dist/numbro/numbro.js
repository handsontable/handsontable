/*!
 * numbro.js
 * version : 1.11.0
 * author : Företagsplatsen AB
 * license : MIT
 * http://www.foretagsplatsen.se
 */

(function () {
    'use strict';

    /************************************
        Constants
    ************************************/

    var numbro,
        VERSION = '1.11.0',
        binarySuffixes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'],
        decimalSuffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        bytes = {
            general: { scale: 1024, suffixes: decimalSuffixes, marker: 'bd' },
            binary:  { scale: 1024, suffixes: binarySuffixes, marker: 'b' },
            decimal: { scale: 1000, suffixes: decimalSuffixes, marker: 'd' }
        },
        // general must be before the others because it reuses their characters!
        byteFormatOrder = [ bytes.general, bytes.binary, bytes.decimal ],
    // internal storage for culture config files
        cultures = {},
    // Todo: Remove in 2.0.0
        languages = cultures,
        currentCulture = 'en-US',
        zeroFormat = null,
        defaultFormat = '0,0',
        defaultCurrencyFormat = '0$',
        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),
    // default culture
        enUS = {
            delimiters: {
                thousands: ',',
                decimal: '.'
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't'
            },
            ordinal: function(number) {
                var b = number % 10;
                return (~~(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            },
            currency: {
                symbol: '$',
                position: 'prefix'
            },
            defaults: {
                currencyFormat: ',0000 a'
            },
            formats: {
                fourDigits: '0000 a',
                fullWithTwoDecimals: '$ ,0.00',
                fullWithTwoDecimalsNoCurrency: ',0.00'
            }
        };

    /************************************
        Constructors
    ************************************/


    // Numbro prototype object
    function Numbro(number) {
        this._value = number;
    }

    function numberLength(number) {
        if (number === 0) { return 1; }
        return Math.floor(Math.log(Math.abs(number)) / Math.LN10) + 1;
    }

    function zeroes(count) {
        var i, ret = '';

        for (i = 0; i < count; i++) {
            ret += '0';
        }

        return ret;
    }
    /**
     * Implementation of toFixed() for numbers with exponents
     * This function may return negative representations for zero values e.g. "-0.0"
     */
    function toFixedLargeSmall(value, precision) {
        var mantissa,
            beforeDec,
            afterDec,
            exponent,
            prefix,
            endStr,
            zerosStr,
            str;

        str = value.toString();

        mantissa = str.split('e')[0];
        exponent = str.split('e')[1];

        beforeDec = mantissa.split('.')[0];
        afterDec = mantissa.split('.')[1] || '';

        if (+exponent > 0) {
            // exponent is positive - add zeros after the numbers
            str = beforeDec + afterDec + zeroes(exponent - afterDec.length);
        } else {
            // exponent is negative

            if (+beforeDec < 0) {
                prefix = '-0';
            } else {
                prefix = '0';
            }

            // tack on the decimal point if needed
            if (precision > 0) {
                prefix += '.';
            }

            zerosStr = zeroes((-1 * exponent) - 1);
            // substring off the end to satisfy the precision
            endStr = (zerosStr + Math.abs(beforeDec) + afterDec).substr(0, precision);
            str = prefix + endStr;
        }

        // only add percision 0's if the exponent is positive
        if (+exponent > 0 && precision > 0) {
            str += '.' + zeroes(precision);
        }

        return str;
    }

    /**
     * Implementation of toFixed() that treats floats more like decimals
     *
     * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
     * problems for accounting- and finance-related software.
     *
     * Also removes negative signs for zero-formatted numbers. e.g. -0.01 w/ precision 1 -> 0.0
     */
    function toFixed(value, precision, roundingFunction, optionals) {
        var power = Math.pow(10, precision),
            optionalsRegExp,
            output;

        if (value.toString().indexOf('e') > -1) {
            // toFixed returns scientific notation for numbers above 1e21 and below 1e-7
            output = toFixedLargeSmall(value, precision);
            // remove the leading negative sign if it exists and should not be present (e.g. -0.00)
            if (output.charAt(0) === '-' && +output >= 0) {
                output = output.substr(1); // chop off the '-'
            }
        }
        else {
            // Multiply up by precision, round accurately, then divide and use native toFixed():
            output = (roundingFunction(value + 'e+' + precision) / power).toFixed(precision);
        }

        if (optionals) {
            optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
            output = output.replace(optionalsRegExp, '');
        }

        return output;
    }

    /************************************
        Formatting
    ************************************/

    // determine what type of formatting we need to do
    function formatNumbro(n, format, roundingFunction) {
        var output,
            escapedFormat = format.replace(/\{[^\{\}]*\}/g, '');

        // figure out what kind of format we are dealing with
        if (escapedFormat.indexOf('$') > -1) { // currency!!!!!
            output = formatCurrency(n, cultures[currentCulture].currency.symbol, format, roundingFunction);
        } else if (escapedFormat.indexOf('%') > -1) { // percentage
            output = formatPercentage(n, format, roundingFunction);
        } else if (escapedFormat.indexOf(':') > -1) { // time
            output = formatTime(n, format);
        } else { // plain ol' numbers or bytes
            output = formatNumber(n._value, format, roundingFunction);
        }

        // return string
        return output;
    }

    // revert to number
    function unformatNumbro(n, string) {
        var stringOriginal = string,
            thousandRegExp,
            millionRegExp,
            billionRegExp,
            trillionRegExp,
            bytesMultiplier = false,
            power;

        if (string.indexOf(':') > -1) {
            n._value = unformatTime(string);
        } else {
            if (string === zeroFormat) {
                n._value = 0;
            } else {
                if (cultures[currentCulture].delimiters.decimal !== '.') {
                    string = string.replace(/\./g, '').replace(cultures[currentCulture].delimiters.decimal, '.');
                }

                // see if abbreviations are there so that we can multiply to the correct number
                thousandRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.thousand +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');
                millionRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.million +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');
                billionRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.billion +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');
                trillionRegExp = new RegExp('[^a-zA-Z]' + cultures[currentCulture].abbreviations.trillion +
                    '(?:\\)|(\\' + cultures[currentCulture].currency.symbol + ')?(?:\\))?)?$');

                // see if bytes are there so that we can multiply to the correct number
                for (power = 1; power < binarySuffixes.length && !bytesMultiplier; ++power) {
                    if (string.indexOf(binarySuffixes[power]) > -1) {
                        bytesMultiplier = Math.pow(1024, power);
                    } else if (string.indexOf(decimalSuffixes[power]) > -1) {
                        bytesMultiplier = Math.pow(1000, power);
                    }
                }

                var str = string.replace(/[^0-9\.]+/g, '');
                if (str === '') {
                    // An empty string is not a number.
                    n._value = NaN;

                } else {
                    // do some math to create our number
                    n._value = ((bytesMultiplier) ? bytesMultiplier : 1) *
                        ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) *
                        ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) *
                        ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) *
                        ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) *
                        ((string.indexOf('%') > -1) ? 0.01 : 1) *
                        (((string.split('-').length +
                            Math.min(string.split('(').length - 1, string.split(')').length - 1)) % 2) ? 1 : -1) *
                        Number(str);

                    // round if we are talking about bytes
                    n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
                }
            }
        }
        return n._value;
    }

    function formatCurrency(n, currencySymbol, originalFormat, roundingFunction) {
        var format = originalFormat,
            symbolIndex = format.indexOf('$'),
            openParenIndex = format.indexOf('('),
            plusSignIndex = format.indexOf('+'),
            minusSignIndex = format.indexOf('-'),
            space = '',
            decimalSeparator = '',
            spliceIndex,
            output;

        if(format.indexOf('$') === -1){
            // Use defaults instead of the format provided
            if (cultures[currentCulture].currency.position === 'infix') {
                decimalSeparator = currencySymbol;
                if (cultures[currentCulture].currency.spaceSeparated) {
                    decimalSeparator = ' ' + decimalSeparator + ' ';
                }
            } else if (cultures[currentCulture].currency.spaceSeparated) {
                space = ' ';
            }
        } else {
            // check for space before or after currency
            if (format.indexOf(' $') > -1) {
                space = ' ';
                format = format.replace(' $', '');
            } else if (format.indexOf('$ ') > -1) {
                space = ' ';
                format = format.replace('$ ', '');
            } else {
                format = format.replace('$', '');
            }
        }

        // Format The Number
        output = formatNumber(n._value, format, roundingFunction, decimalSeparator);

        if (originalFormat.indexOf('$') === -1) {
            // Use defaults instead of the format provided
            switch (cultures[currentCulture].currency.position) {
                case 'postfix':
                    if (output.indexOf(')') > -1) {
                        output = output.split('');
                        output.splice(-1, 0, space + currencySymbol);
                        output = output.join('');
                    } else {
                        output = output + space + currencySymbol;
                    }
                    break;
                case 'infix':
                    break;
                case 'prefix':
                    if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                        output = output.split('');
                        spliceIndex = Math.max(openParenIndex, minusSignIndex) + 1;

                        output.splice(spliceIndex, 0, currencySymbol + space);
                        output = output.join('');
                    } else {
                        output = currencySymbol + space + output;
                    }
                    break;
                default:
                    throw Error('Currency position should be among ["prefix", "infix", "postfix"]');
            }
        } else {
            // position the symbol
            if (symbolIndex <= 1) {
                if (output.indexOf('(') > -1 || output.indexOf('+') > -1 || output.indexOf('-') > -1) {
                    output = output.split('');
                    spliceIndex = 1;
                    if (symbolIndex < openParenIndex || symbolIndex < plusSignIndex || symbolIndex < minusSignIndex) {
                        // the symbol appears before the "(", "+" or "-"
                        spliceIndex = 0;
                    }
                    output.splice(spliceIndex, 0, currencySymbol + space);
                    output = output.join('');
                } else {
                    output = currencySymbol + space + output;
                }
            } else {
                if (output.indexOf(')') > -1) {
                    output = output.split('');
                    output.splice(-1, 0, space + currencySymbol);
                    output = output.join('');
                } else {
                    output = output + space + currencySymbol;
                }
            }
        }

        return output;
    }

    function formatForeignCurrency(n, foreignCurrencySymbol, originalFormat, roundingFunction) {
        return formatCurrency(n, foreignCurrencySymbol, originalFormat, roundingFunction);
    }

    function formatPercentage(n, format, roundingFunction) {
        var space = '',
            output,
            value = n._value * 100;

        // check for space before %
        if (format.indexOf(' %') > -1) {
            space = ' ';
            format = format.replace(' %', '');
        } else {
            format = format.replace('%', '');
        }

        output = formatNumber(value, format, roundingFunction);

        if (output.indexOf(')') > -1) {
            output = output.split('');
            output.splice(-1, 0, space + '%');
            output = output.join('');
        } else {
            output = output + space + '%';
        }

        return output;
    }

    function formatTime(n) {
        var hours = Math.floor(n._value / 60 / 60),
            minutes = Math.floor((n._value - (hours * 60 * 60)) / 60),
            seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
        return hours + ':' +
            ((minutes < 10) ? '0' + minutes : minutes) + ':' +
            ((seconds < 10) ? '0' + seconds : seconds);
    }

    function unformatTime(string) {
        var timeArray = string.split(':'),
            seconds = 0;
        // turn hours and minutes into seconds and add them all up
        if (timeArray.length === 3) {
            // hours
            seconds = seconds + (Number(timeArray[0]) * 60 * 60);
            // minutes
            seconds = seconds + (Number(timeArray[1]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[2]);
        } else if (timeArray.length === 2) {
            // minutes
            seconds = seconds + (Number(timeArray[0]) * 60);
            // seconds
            seconds = seconds + Number(timeArray[1]);
        }
        return Number(seconds);
    }

    function formatByteUnits (value, suffixes, scale) {
        var suffix = suffixes[0],
            power,
            min,
            max,
            abs = Math.abs(value);

        if (abs >= scale) {
            for (power = 1; power < suffixes.length; ++power) {
                min = Math.pow(scale, power);
                max = Math.pow(scale, power + 1);

                if (abs >= min && abs < max) {
                    suffix = suffixes[power];
                    value = value / min;
                    break;
                }
            }

            // values greater than or equal to [scale] YB never set the suffix
            if (suffix === suffixes[0]) {
                value = value / Math.pow(scale, suffixes.length - 1);
                suffix = suffixes[suffixes.length - 1];
            }
        }

        return { value: value, suffix: suffix };
    }

    function formatNumber (value, format, roundingFunction, sep) {
        var negP = false,
            signed = false,
            optDec = false,
            abbr = '',
            abbrK = false, // force abbreviation to thousands
            abbrM = false, // force abbreviation to millions
            abbrB = false, // force abbreviation to billions
            abbrT = false, // force abbreviation to trillions
            abbrForce = false, // force abbreviation
            bytes = '',
            byteFormat,
            units,
            ord = '',
            abs = Math.abs(value),
            totalLength,
            length,
            minimumPrecision,
            pow,
            w,
            intPrecision,
            precision,
            prefix,
            postfix,
            thousands,
            d = '',
            forcedNeg = false,
            neg = false,
            indexOpenP,
            indexMinus,
            paren = '',
            minlen,
            i;

        // check if number is zero and a custom zero format has been set
        if (value === 0 && zeroFormat !== null) {
            return zeroFormat;
        }

        if (!isFinite(value)) {
            return '' + value;
        }

        if (format.indexOf('{') === 0) {
            var end = format.indexOf('}');
            if (end === -1) {
                throw Error('Format should also contain a "}"');
            }
            prefix = format.slice(1, end);
            format = format.slice(end + 1);
        } else {
            prefix = '';
        }

        if (format.indexOf('}') === format.length - 1 && format.length) {
            var start = format.indexOf('{');
            if (start === -1) {
                throw Error('Format should also contain a "{"');
            }
            postfix = format.slice(start + 1, -1);
            format = format.slice(0, start + 1);
        } else {
            postfix = '';
        }

        // check for min length
        var info;
        if (format.indexOf('.') === -1) {
            info = format.match(/([0-9]+).*/);
        } else {
            info = format.match(/([0-9]+)\..*/);
        }
        minlen = info === null ? -1 : info[1].length;

        // see if we should use parentheses for negative number or if we should prefix with a sign
        // if both are present we default to parentheses
        if (format.indexOf('-') !== -1) {
            forcedNeg = true;
        }
        if (format.indexOf('(') > -1) {
            negP = true;
            format = format.slice(1, -1);
        } else if (format.indexOf('+') > -1) {
            signed = true;
            format = format.replace(/\+/g, '');
        }

        // see if abbreviation is wanted
        if (format.indexOf('a') > -1) {
            intPrecision = format.split('.')[0].match(/[0-9]+/g) || ['0'];
            intPrecision = parseInt(intPrecision[0], 10);

            // check if abbreviation is specified
            abbrK = format.indexOf('aK') >= 0;
            abbrM = format.indexOf('aM') >= 0;
            abbrB = format.indexOf('aB') >= 0;
            abbrT = format.indexOf('aT') >= 0;
            abbrForce = abbrK || abbrM || abbrB || abbrT;

            // check for space before abbreviation
            if (format.indexOf(' a') > -1) {
                abbr = ' ';
                format = format.replace(' a', '');
            } else {
                format = format.replace('a', '');
            }

            totalLength = numberLength(value);
            minimumPrecision = totalLength % 3;
            minimumPrecision = minimumPrecision === 0 ? 3 : minimumPrecision;

            if (intPrecision && abs !== 0) {
                pow = 3 * ~~((Math.min(intPrecision, totalLength) - minimumPrecision) / 3);
                abs = abs / Math.pow(10, pow);
            }

            if (totalLength !== intPrecision) {
                if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
                    // trillion
                    abbr = abbr + cultures[currentCulture].abbreviations.trillion;
                    value = value / Math.pow(10, 12);
                } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
                    // billion
                    abbr = abbr + cultures[currentCulture].abbreviations.billion;
                    value = value / Math.pow(10, 9);
                } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
                    // million
                    abbr = abbr + cultures[currentCulture].abbreviations.million;
                    value = value / Math.pow(10, 6);
                } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
                    // thousand
                    abbr = abbr + cultures[currentCulture].abbreviations.thousand;
                    value = value / Math.pow(10, 3);
                }
            }

            length = numberLength(value);
            if (intPrecision && length < intPrecision && format.indexOf('.') === -1) {
                format += '[.]';
                format += zeroes(intPrecision - length);
            }
        }

        // see if we are formatting
        //   binary-decimal bytes (1024 MB), binary bytes (1024 MiB), or decimal bytes (1000 MB)
        for (i = 0; i < byteFormatOrder.length; ++i) {
            byteFormat = byteFormatOrder[i];

            if (format.indexOf(byteFormat.marker) > -1) {
                // check for space before
                if (format.indexOf(' ' + byteFormat.marker) >-1) {
                    bytes = ' ';
                }

                // remove the marker (with the space if it had one)
                format = format.replace(bytes + byteFormat.marker, '');

                units = formatByteUnits(value, byteFormat.suffixes, byteFormat.scale);

                value = units.value;
                bytes = bytes + units.suffix;

                break;
            }
        }

        // see if ordinal is wanted
        if (format.indexOf('o') > -1) {
            // check for space before
            if (format.indexOf(' o') > -1) {
                ord = ' ';
                format = format.replace(' o', '');
            } else {
                format = format.replace('o', '');
            }

            if (cultures[currentCulture].ordinal) {
                ord = ord + cultures[currentCulture].ordinal(value);
            }
        }

        if (format.indexOf('[.]') > -1) {
            optDec = true;
            format = format.replace('[.]', '.');
        }

        precision = format.split('.')[1];
        thousands = format.indexOf(',');

        if (precision) {
            var dSplit = [];

            if (precision.indexOf('*') !== -1) {
                d = value.toString();
                dSplit = d.split('.');
                if (dSplit.length > 1) {
                    d = toFixed(value, dSplit[1].length, roundingFunction);
                }
            } else {
                if (precision.indexOf('[') > -1) {
                    precision = precision.replace(']', '');
                    precision = precision.split('[');
                    d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction,
                        precision[1].length);
                } else {
                    d = toFixed(value, precision.length, roundingFunction);
                }
            }

            dSplit = d.split('.');
            w = dSplit[0];

            if (dSplit.length > 1 && dSplit[1].length) {
                var p = sep ? abbr + sep : cultures[currentCulture].delimiters.decimal;
                d = p + dSplit[1];
            } else {
                d = '';
            }

            if (optDec && Number(d.slice(1)) === 0) {
                d = '';
            }
        } else {
            w = toFixed(value, 0, roundingFunction);
        }

        // format number
        if (w.indexOf('-') > -1) {
            w = w.slice(1);
            neg = true;
        }

        if (w.length < minlen) {
            w = zeroes(minlen - w.length) + w;
        }

        if (thousands > -1) {
            w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' +
                cultures[currentCulture].delimiters.thousands);
        }

        if (format.indexOf('.') === 0) {
            w = '';
        }

        indexOpenP = format.indexOf('(');
        indexMinus = format.indexOf('-');

        if (indexOpenP < indexMinus) {
            paren = ((negP && neg) ? '(' : '') + (((forcedNeg && neg) || (!negP && neg)) ? '-' : '');
        } else {
            paren = (((forcedNeg && neg) || (!negP && neg)) ? '-' : '') + ((negP && neg) ? '(' : '');
        }

        return prefix +
            paren + ((!neg && signed && value !== 0) ? '+' : '') +
            w + d +
            ((ord) ? ord : '') +
            ((abbr && !sep) ? abbr : '') +
            ((bytes) ? bytes : '') +
            ((negP && neg) ? ')' : '') +
            postfix;
    }

    /************************************
        Top Level Functions
    ************************************/

    numbro = function(input) {
        if (numbro.isNumbro(input)) {
            input = input.value();
        } else if (typeof input === 'string' || typeof input === 'number') {
            input = numbro.fn.unformat(input);
        } else {
            input = NaN;
        }

        return new Numbro(Number(input));
    };

    // version number
    numbro.version = VERSION;

    // compare numbro object
    numbro.isNumbro = function(obj) {
        return obj instanceof Numbro;
    };

    /**
     * This function allow the user to set a new language with a fallback if
     * the language does not exist. If no fallback language is provided,
     * it fallbacks to english.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `setCulture` should be used instead.
     */
    numbro.setLanguage = function(newLanguage, fallbackLanguage) {
        console.warn('`setLanguage` is deprecated since version 1.6.0. Use `setCulture` instead');
        var key = newLanguage,
            prefix = newLanguage.split('-')[0],
            matchingLanguage = null;
        if (!languages[key]) {
            Object.keys(languages).forEach(function(language) {
                if (!matchingLanguage && language.split('-')[0] === prefix) {
                    matchingLanguage = language;
                }
            });
            key = matchingLanguage || fallbackLanguage || 'en-US';
        }
        chooseCulture(key);
    };

    /**
     * This function allow the user to set a new culture with a fallback if
     * the culture does not exist. If no fallback culture is provided,
     * it falls back to "en-US".
     */
    numbro.setCulture = function(newCulture, fallbackCulture) {
        var key = newCulture,
            suffix = newCulture.split('-')[1],
            matchingCulture = null;
        if (!cultures[key]) {
            if (suffix) {
                Object.keys(cultures).forEach(function(language) {
                    if (!matchingCulture && language.split('-')[1] === suffix) {
                        matchingCulture = language;
                    }
                });
            }

            key = matchingCulture || fallbackCulture || 'en-US';
        }
        chooseCulture(key);
    };

    /**
     * This function will load languages and then set the global language.  If
     * no arguments are passed in, it will simply return the current global
     * language key.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `culture` should be used instead.
     */
    numbro.language = function(key, values) {
        console.warn('`language` is deprecated since version 1.6.0. Use `culture` instead');

        if (!key) {
            return currentCulture;
        }

        if (key && !values) {
            if (!languages[key]) {
                throw new Error('Unknown language : ' + key);
            }
            chooseCulture(key);
        }

        if (values || !languages[key]) {
            setCulture(key, values);
        }

        return numbro;
    };

    /**
     * This function will load cultures and then set the global culture.  If
     * no arguments are passed in, it will simply return the current global
     * culture code.
     */
    numbro.culture = function(code, values) {
        if (!code) {
            return currentCulture;
        }

        if (code && !values) {
            if (!cultures[code]) {
                throw new Error('Unknown culture : ' + code);
            }
            chooseCulture(code);
        }

        if (values || !cultures[code]) {
            setCulture(code, values);
        }

        return numbro;
    };

    /**
     * This function provides access to the loaded language data.  If
     * no arguments are passed in, it will simply return the current
     * global language object.
     *
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `culture` should be used instead.
     */
    numbro.languageData = function(key) {
        console.warn('`languageData` is deprecated since version 1.6.0. Use `cultureData` instead');

        if (!key) {
            return languages[currentCulture];
        }

        if (!languages[key]) {
            throw new Error('Unknown language : ' + key);
        }

        return languages[key];
    };

    /**
     * This function provides access to the loaded culture data.  If
     * no arguments are passed in, it will simply return the current
     * global culture object.
     */
    numbro.cultureData = function(code) {
        if (!code) {
            return cultures[currentCulture];
        }

        if (!cultures[code]) {
            throw new Error('Unknown culture : ' + code);
        }

        return cultures[code];
    };

    numbro.culture('en-US', enUS);

    /**
     * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `cultures` should be used instead.
     */
    numbro.languages = function() {
        console.warn('`languages` is deprecated since version 1.6.0. Use `cultures` instead');

        return languages;
    };

    numbro.cultures = function() {
        return cultures;
    };

    numbro.zeroFormat = function(format) {
        zeroFormat = typeof(format) === 'string' ? format : null;
    };

    numbro.defaultFormat = function(format) {
        defaultFormat = typeof(format) === 'string' ? format : '0.0';
    };

    numbro.defaultCurrencyFormat = function (format) {
        defaultCurrencyFormat = typeof(format) === 'string' ? format : '0$';
    };

    numbro.validate = function(val, culture) {

        var _decimalSep,
            _thousandSep,
            _currSymbol,
            _valArray,
            _abbrObj,
            _thousandRegEx,
            cultureData,
            temp;

        //coerce val to string
        if (typeof val !== 'string') {
            val += '';
            if (console.warn) {
                console.warn('Numbro.js: Value is not string. It has been co-erced to: ', val);
            }
        }

        //trim whitespaces from either sides
        val = val.trim();

        //replace the initial '+' or '-' sign if present
        val = val.replace(/^[+-]?/, '');

        //if val is just digits return true
        if ( !! val.match(/^\d+$/)) {
            return true;
        }

        //if val is empty return false
        if (val === '') {
            return false;
        }

        //get the decimal and thousands separator from numbro.cultureData
        try {
            //check if the culture is understood by numbro. if not, default it to current culture
            cultureData = numbro.cultureData(culture);
        } catch (e) {
            cultureData = numbro.cultureData(numbro.culture());
        }

        //setup the delimiters and currency symbol based on culture
        _currSymbol = cultureData.currency.symbol;
        _abbrObj = cultureData.abbreviations;
        _decimalSep = cultureData.delimiters.decimal;
        if (cultureData.delimiters.thousands === '.') {
            _thousandSep = '\\.';
        } else {
            _thousandSep = cultureData.delimiters.thousands;
        }

        // validating currency symbol
        temp = val.match(/^[^\d\.\,]+/);
        if (temp !== null) {
            val = val.substr(1);
            if (temp[0] !== _currSymbol) {
                return false;
            }
        }

        //validating abbreviation symbol
        temp = val.match(/[^\d]+$/);
        if (temp !== null) {
            val = val.slice(0, -1);
            if (temp[0] !== _abbrObj.thousand && temp[0] !== _abbrObj.million &&
                    temp[0] !== _abbrObj.billion && temp[0] !== _abbrObj.trillion) {
                return false;
            }
        }

        _thousandRegEx = new RegExp(_thousandSep + '{2}');

        if (!val.match(/[^\d.,]/g)) {
            _valArray = val.split(_decimalSep);
            if (_valArray.length > 2) {
                return false;
            } else {
                if (_valArray.length < 2) {
                    return ( !! _valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx));
                } else {
                    if (_valArray[0] === '') {
                        // for values without leading zero eg. .984
                        return (!_valArray[0].match(_thousandRegEx) &&
                            !!_valArray[1].match(/^\d+$/));

                    } else if (_valArray[0].length === 1) {
                        return ( !! _valArray[0].match(/^\d+$/) &&
                            !_valArray[0].match(_thousandRegEx) &&
                            !! _valArray[1].match(/^\d+$/));
                    } else {
                        return ( !! _valArray[0].match(/^\d+.*\d$/) &&
                            !_valArray[0].match(_thousandRegEx) &&
                            !! _valArray[1].match(/^\d+$/));
                    }
                }
            }
        }

        return false;
    };

    /**
     * * @deprecated Since in version 1.6.0. It will be deleted in version 2.0
     * `loadCulturesInNode` should be used instead.
     */
    numbro.loadLanguagesInNode = function() {
        console.warn('`loadLanguagesInNode` is deprecated since version 1.6.0. Use `loadCulturesInNode` instead');

        numbro.loadCulturesInNode();
    };

    numbro.loadCulturesInNode = function() {
        // TODO: Rename the folder in 2.0.0
        var cultures = require('./languages');

        for(var langLocaleCode in cultures) {
            if(langLocaleCode) {
                numbro.culture(langLocaleCode, cultures[langLocaleCode]);
            }
        }
    };

    /************************************
        Helpers
    ************************************/

    function setCulture(code, values) {
        cultures[code] = values;
    }

    function chooseCulture(code) {
        currentCulture = code;
        var defaults = cultures[code].defaults;
        if (defaults && defaults.format) {
            numbro.defaultFormat(defaults.format);
        }
        if (defaults && defaults.currencyFormat) {
            numbro.defaultCurrencyFormat(defaults.currencyFormat);
        }
    }

    function inNodejsRuntime() {
        return (typeof process !== 'undefined') &&
            (process.browser === undefined) &&
            process.title &&
            (
                process.title.indexOf('node') !== -1 ||
                process.title.indexOf('meteor-tool') > 0 ||
                process.title === 'grunt' ||
                process.title === 'gulp'
            ) &&
            (typeof require !== 'undefined');
    }

    /************************************
        Floating-point helpers
    ************************************/

    // The floating-point helper functions and implementation
    // borrows heavily from sinful.js: http://guipn.github.io/sinful.js/

    /**
     * Array.prototype.reduce for browsers that don't support it
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce#Compatibility
     */
    if ('function' !== typeof Array.prototype.reduce) {
        Array.prototype.reduce = function(callback, optInitialValue) {

            if (null === this || 'undefined' === typeof this) {
                // At the moment all modern browsers, that support strict mode, have
                // native implementation of Array.prototype.reduce. For instance, IE8
                // does not support strict mode, so this check is actually useless.
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }

            if ('function' !== typeof callback) {
                throw new TypeError(callback + ' is not a function');
            }

            var index,
                value,
                length = this.length >>> 0,
                isValueSet = false;

            if (1 < arguments.length) {
                value = optInitialValue;
                isValueSet = true;
            }

            for (index = 0; length > index; ++index) {
                if (this.hasOwnProperty(index)) {
                    if (isValueSet) {
                        value = callback(value, this[index], index, this);
                    } else {
                        value = this[index];
                        isValueSet = true;
                    }
                }
            }

            if (!isValueSet) {
                throw new TypeError('Reduce of empty array with no initial value');
            }

            return value;
        };
    }


    /**
     * Computes the multiplier necessary to make x >= 1,
     * effectively eliminating miscalculations caused by
     * finite precision.
     */
    function multiplier(x) {
        var parts = x.toString().split('.');
        if (parts.length < 2) {
            return 1;
        }
        return Math.pow(10, parts[1].length);
    }

    /**
     * Given a variable number of arguments, returns the maximum
     * multiplier that must be used to normalize an operation involving
     * all of them.
     */
    function correctionFactor() {
        var args = Array.prototype.slice.call(arguments);
        return args.reduce(function(prev, next) {
            var mp = multiplier(prev),
                mn = multiplier(next);
            return mp > mn ? mp : mn;
        }, -Infinity);
    }

    /************************************
        Numbro Prototype
    ************************************/


    numbro.fn = Numbro.prototype = {

        clone: function() {
            return numbro(this);
        },

        format: function(inputString, roundingFunction) {
            return formatNumbro(this,
                inputString ? inputString : defaultFormat,
                (roundingFunction !== undefined) ? roundingFunction : Math.round
            );
        },

        formatCurrency: function(inputString, roundingFunction) {
            return formatCurrency(this,
                cultures[currentCulture].currency.symbol,
                inputString ? inputString : defaultCurrencyFormat,
                (roundingFunction !== undefined) ? roundingFunction : Math.round
            );
        },

        formatForeignCurrency: function(currencySymbol, inputString, roundingFunction) {
            return formatForeignCurrency(this,
                currencySymbol,
                inputString ? inputString : defaultCurrencyFormat,
                (roundingFunction !== undefined) ? roundingFunction : Math.round
            );
        },

        unformat: function(inputString) {
            if (typeof inputString === 'number') {
                return inputString;
            } else if (typeof inputString === 'string') {
                var result = unformatNumbro(this, inputString);

                // Any unparseable string (represented as NaN in the result) is
                // converted into undefined.
                return isNaN(result) ? undefined : result;
            } else {
                return undefined;
            }
        },

        binaryByteUnits: function() {
            return formatByteUnits(this._value, bytes.binary.suffixes, bytes.binary.scale).suffix;
        },

        byteUnits: function() {
            return formatByteUnits(this._value, bytes.general.suffixes, bytes.general.scale).suffix;
        },

        decimalByteUnits: function() {
            return formatByteUnits(this._value, bytes.decimal.suffixes, bytes.decimal.scale).suffix;
        },

        value: function() {
            return this._value;
        },

        valueOf: function() {
            return this._value;
        },

        set: function(value) {
            this._value = Number(value);
            return this;
        },

        add: function(value) {
            var corrFactor = correctionFactor.call(null, this._value, value);

            function cback(accum, curr) {
                return accum + corrFactor * curr;
            }
            this._value = [this._value, value].reduce(cback, 0) / corrFactor;
            return this;
        },

        subtract: function(value) {
            var corrFactor = correctionFactor.call(null, this._value, value);

            function cback(accum, curr) {
                return accum - corrFactor * curr;
            }
            this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;
            return this;
        },

        multiply: function(value) {
            function cback(accum, curr) {
                var corrFactor = correctionFactor(accum, curr),
                    result = accum * corrFactor;
                result *= curr * corrFactor;
                result /= corrFactor * corrFactor;
                return result;
            }
            this._value = [this._value, value].reduce(cback, 1);
            return this;
        },

        divide: function(value) {
            function cback(accum, curr) {
                var corrFactor = correctionFactor(accum, curr);
                return (accum * corrFactor) / (curr * corrFactor);
            }
            this._value = [this._value, value].reduce(cback);
            return this;
        },

        difference: function(value) {
            return Math.abs(numbro(this._value).subtract(value).value());
        }

    };

    /************************************
        Exposing Numbro
    ************************************/

    if (inNodejsRuntime()) {
        //Todo: Rename the folder in 2.0.0
        numbro.loadCulturesInNode();
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = numbro;
    } else {
        /*global ender:false */
        if (typeof ender === 'undefined') {
            // here, `this` means `window` in the browser, or `global` on the server
            // add `numbro` as a global object via a string identifier,
            // for Closure Compiler 'advanced' mode
            this.numbro = numbro;
        }

        /*global define:false */
        if (typeof define === 'function' && define.amd) {
            define([], function() {
                return numbro;
            });
        }
    }

}.call(typeof window === 'undefined' ? this : window));
