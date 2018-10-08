(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.numbro = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*! bignumber.js v4.0.4 https://github.com/MikeMcl/bignumber.js/LICENCE */

;(function (globalObj) {
    'use strict';

    /*
      bignumber.js v4.0.4
      A JavaScript library for arbitrary-precision arithmetic.
      https://github.com/MikeMcl/bignumber.js
      Copyright (c) 2017 Michael Mclaughlin <M8ch88l@gmail.com>
      MIT Expat Licence
    */


    var BigNumber,
        isNumeric = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
        mathceil = Math.ceil,
        mathfloor = Math.floor,
        notBool = ' not a boolean or binary digit',
        roundingMode = 'rounding mode',
        tooManyDigits = 'number type has more than 15 significant digits',
        ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_',
        BASE = 1e14,
        LOG_BASE = 14,
        MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
        // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
        POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
        SQRT_BASE = 1e7,

        /*
         * The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
         * the arguments to toExponential, toFixed, toFormat, and toPrecision, beyond which an
         * exception is thrown (if ERRORS is true).
         */
        MAX = 1E9;                                   // 0 to MAX_INT32


    /*
     * Create and return a BigNumber constructor.
     */
    function constructorFactory(config) {
        var div, parseNumeric,

            // id tracks the caller function, so its name can be included in error messages.
            id = 0,
            P = BigNumber.prototype,
            ONE = new BigNumber(1),


            /********************************* EDITABLE DEFAULTS **********************************/


            /*
             * The default values below must be integers within the inclusive ranges stated.
             * The values can also be changed at run-time using BigNumber.config.
             */

            // The maximum number of decimal places for operations involving division.
            DECIMAL_PLACES = 20,                     // 0 to MAX

            /*
             * The rounding mode used when rounding to the above decimal places, and when using
             * toExponential, toFixed, toFormat and toPrecision, and round (default value).
             * UP         0 Away from zero.
             * DOWN       1 Towards zero.
             * CEIL       2 Towards +Infinity.
             * FLOOR      3 Towards -Infinity.
             * HALF_UP    4 Towards nearest neighbour. If equidistant, up.
             * HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
             * HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
             * HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
             * HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
             */
            ROUNDING_MODE = 4,                       // 0 to 8

            // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

            // The exponent value at and beneath which toString returns exponential notation.
            // Number type: -7
            TO_EXP_NEG = -7,                         // 0 to -MAX

            // The exponent value at and above which toString returns exponential notation.
            // Number type: 21
            TO_EXP_POS = 21,                         // 0 to MAX

            // RANGE : [MIN_EXP, MAX_EXP]

            // The minimum exponent value, beneath which underflow to zero occurs.
            // Number type: -324  (5e-324)
            MIN_EXP = -1e7,                          // -1 to -MAX

            // The maximum exponent value, above which overflow to Infinity occurs.
            // Number type:  308  (1.7976931348623157e+308)
            // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
            MAX_EXP = 1e7,                           // 1 to MAX

            // Whether BigNumber Errors are ever thrown.
            ERRORS = true,                           // true or false

            // Change to intValidatorNoErrors if ERRORS is false.
            isValidInt = intValidatorWithErrors,     // intValidatorWithErrors/intValidatorNoErrors

            // Whether to use cryptographically-secure random number generation, if available.
            CRYPTO = false,                          // true or false

            /*
             * The modulo mode used when calculating the modulus: a mod n.
             * The quotient (q = a / n) is calculated according to the corresponding rounding mode.
             * The remainder (r) is calculated as: r = a - n * q.
             *
             * UP        0 The remainder is positive if the dividend is negative, else is negative.
             * DOWN      1 The remainder has the same sign as the dividend.
             *             This modulo mode is commonly known as 'truncated division' and is
             *             equivalent to (a % n) in JavaScript.
             * FLOOR     3 The remainder has the same sign as the divisor (Python %).
             * HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
             * EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
             *             The remainder is always positive.
             *
             * The truncated division, floored division, Euclidian division and IEEE 754 remainder
             * modes are commonly used for the modulus operation.
             * Although the other rounding modes can also be used, they may not give useful results.
             */
            MODULO_MODE = 1,                         // 0 to 9

            // The maximum number of significant digits of the result of the toPower operation.
            // If POW_PRECISION is 0, there will be unlimited significant digits.
            POW_PRECISION = 0,                       // 0 to MAX

            // The format specification used by the BigNumber.prototype.toFormat method.
            FORMAT = {
                decimalSeparator: '.',
                groupSeparator: ',',
                groupSize: 3,
                secondaryGroupSize: 0,
                fractionGroupSeparator: '\xA0',      // non-breaking space
                fractionGroupSize: 0
            };


        /******************************************************************************************/


        // CONSTRUCTOR


        /*
         * The BigNumber constructor and exported function.
         * Create and return a new instance of a BigNumber object.
         *
         * n {number|string|BigNumber} A numeric value.
         * [b] {number} The base of n. Integer, 2 to 64 inclusive.
         */
        function BigNumber( n, b ) {
            var c, e, i, num, len, str,
                x = this;

            // Enable constructor usage without new.
            if ( !( x instanceof BigNumber ) ) {

                // 'BigNumber() constructor call without new: {n}'
                if (ERRORS) raise( 26, 'constructor call without new', n );
                return new BigNumber( n, b );
            }

            // 'new BigNumber() base not an integer: {b}'
            // 'new BigNumber() base out of range: {b}'
            if ( b == null || !isValidInt( b, 2, 64, id, 'base' ) ) {

                // Duplicate.
                if ( n instanceof BigNumber ) {
                    x.s = n.s;
                    x.e = n.e;
                    x.c = ( n = n.c ) ? n.slice() : n;
                    id = 0;
                    return;
                }

                if ( ( num = typeof n == 'number' ) && n * 0 == 0 ) {
                    x.s = 1 / n < 0 ? ( n = -n, -1 ) : 1;

                    // Fast path for integers.
                    if ( n === ~~n ) {
                        for ( e = 0, i = n; i >= 10; i /= 10, e++ );
                        x.e = e;
                        x.c = [n];
                        id = 0;
                        return;
                    }

                    str = n + '';
                } else {
                    if ( !isNumeric.test( str = n + '' ) ) return parseNumeric( x, str, num );
                    x.s = str.charCodeAt(0) === 45 ? ( str = str.slice(1), -1 ) : 1;
                }
            } else {
                b = b | 0;
                str = n + '';

                // Ensure return value is rounded to DECIMAL_PLACES as with other bases.
                // Allow exponential notation to be used with base 10 argument.
                if ( b == 10 ) {
                    x = new BigNumber( n instanceof BigNumber ? n : str );
                    return round( x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE );
                }

                // Avoid potential interpretation of Infinity and NaN as base 44+ values.
                // Any number in exponential form will fail due to the [Ee][+-].
                if ( ( num = typeof n == 'number' ) && n * 0 != 0 ||
                  !( new RegExp( '^-?' + ( c = '[' + ALPHABET.slice( 0, b ) + ']+' ) +
                    '(?:\\.' + c + ')?$',b < 37 ? 'i' : '' ) ).test(str) ) {
                    return parseNumeric( x, str, num, b );
                }

                if (num) {
                    x.s = 1 / n < 0 ? ( str = str.slice(1), -1 ) : 1;

                    if ( ERRORS && str.replace( /^0\.0*|\./, '' ).length > 15 ) {

                        // 'new BigNumber() number type has more than 15 significant digits: {n}'
                        raise( id, tooManyDigits, n );
                    }

                    // Prevent later check for length on converted number.
                    num = false;
                } else {
                    x.s = str.charCodeAt(0) === 45 ? ( str = str.slice(1), -1 ) : 1;
                }

                str = convertBase( str, 10, b, x.s );
            }

            // Decimal point?
            if ( ( e = str.indexOf('.') ) > -1 ) str = str.replace( '.', '' );

            // Exponential form?
            if ( ( i = str.search( /e/i ) ) > 0 ) {

                // Determine exponent.
                if ( e < 0 ) e = i;
                e += +str.slice( i + 1 );
                str = str.substring( 0, i );
            } else if ( e < 0 ) {

                // Integer.
                e = str.length;
            }

            // Determine leading zeros.
            for ( i = 0; str.charCodeAt(i) === 48; i++ );

            // Determine trailing zeros.
            for ( len = str.length; str.charCodeAt(--len) === 48; );
            str = str.slice( i, len + 1 );

            if (str) {
                len = str.length;

                // Disallow numbers with over 15 significant digits if number type.
                // 'new BigNumber() number type has more than 15 significant digits: {n}'
                if ( num && ERRORS && len > 15 && ( n > MAX_SAFE_INTEGER || n !== mathfloor(n) ) ) {
                    raise( id, tooManyDigits, x.s * n );
                }

                e = e - i - 1;

                 // Overflow?
                if ( e > MAX_EXP ) {

                    // Infinity.
                    x.c = x.e = null;

                // Underflow?
                } else if ( e < MIN_EXP ) {

                    // Zero.
                    x.c = [ x.e = 0 ];
                } else {
                    x.e = e;
                    x.c = [];

                    // Transform base

                    // e is the base 10 exponent.
                    // i is where to slice str to get the first element of the coefficient array.
                    i = ( e + 1 ) % LOG_BASE;
                    if ( e < 0 ) i += LOG_BASE;

                    if ( i < len ) {
                        if (i) x.c.push( +str.slice( 0, i ) );

                        for ( len -= LOG_BASE; i < len; ) {
                            x.c.push( +str.slice( i, i += LOG_BASE ) );
                        }

                        str = str.slice(i);
                        i = LOG_BASE - str.length;
                    } else {
                        i -= len;
                    }

                    for ( ; i--; str += '0' );
                    x.c.push( +str );
                }
            } else {

                // Zero.
                x.c = [ x.e = 0 ];
            }

            id = 0;
        }


        // CONSTRUCTOR PROPERTIES


        BigNumber.another = constructorFactory;

        BigNumber.ROUND_UP = 0;
        BigNumber.ROUND_DOWN = 1;
        BigNumber.ROUND_CEIL = 2;
        BigNumber.ROUND_FLOOR = 3;
        BigNumber.ROUND_HALF_UP = 4;
        BigNumber.ROUND_HALF_DOWN = 5;
        BigNumber.ROUND_HALF_EVEN = 6;
        BigNumber.ROUND_HALF_CEIL = 7;
        BigNumber.ROUND_HALF_FLOOR = 8;
        BigNumber.EUCLID = 9;


        /*
         * Configure infrequently-changing library-wide settings.
         *
         * Accept an object or an argument list, with one or many of the following properties or
         * parameters respectively:
         *
         *   DECIMAL_PLACES  {number}  Integer, 0 to MAX inclusive
         *   ROUNDING_MODE   {number}  Integer, 0 to 8 inclusive
         *   EXPONENTIAL_AT  {number|number[]}  Integer, -MAX to MAX inclusive or
         *                                      [integer -MAX to 0 incl., 0 to MAX incl.]
         *   RANGE           {number|number[]}  Non-zero integer, -MAX to MAX inclusive or
         *                                      [integer -MAX to -1 incl., integer 1 to MAX incl.]
         *   ERRORS          {boolean|number}   true, false, 1 or 0
         *   CRYPTO          {boolean|number}   true, false, 1 or 0
         *   MODULO_MODE     {number}           0 to 9 inclusive
         *   POW_PRECISION   {number}           0 to MAX inclusive
         *   FORMAT          {object}           See BigNumber.prototype.toFormat
         *      decimalSeparator       {string}
         *      groupSeparator         {string}
         *      groupSize              {number}
         *      secondaryGroupSize     {number}
         *      fractionGroupSeparator {string}
         *      fractionGroupSize      {number}
         *
         * (The values assigned to the above FORMAT object properties are not checked for validity.)
         *
         * E.g.
         * BigNumber.config(20, 4) is equivalent to
         * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
         *
         * Ignore properties/parameters set to null or undefined.
         * Return an object with the properties current values.
         */
        BigNumber.config = BigNumber.set = function () {
            var v, p,
                i = 0,
                r = {},
                a = arguments,
                o = a[0],
                has = o && typeof o == 'object'
                  ? function () { if ( o.hasOwnProperty(p) ) return ( v = o[p] ) != null; }
                  : function () { if ( a.length > i ) return ( v = a[i++] ) != null; };

            // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
            // 'config() DECIMAL_PLACES not an integer: {v}'
            // 'config() DECIMAL_PLACES out of range: {v}'
            if ( has( p = 'DECIMAL_PLACES' ) && isValidInt( v, 0, MAX, 2, p ) ) {
                DECIMAL_PLACES = v | 0;
            }
            r[p] = DECIMAL_PLACES;

            // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
            // 'config() ROUNDING_MODE not an integer: {v}'
            // 'config() ROUNDING_MODE out of range: {v}'
            if ( has( p = 'ROUNDING_MODE' ) && isValidInt( v, 0, 8, 2, p ) ) {
                ROUNDING_MODE = v | 0;
            }
            r[p] = ROUNDING_MODE;

            // EXPONENTIAL_AT {number|number[]}
            // Integer, -MAX to MAX inclusive or [integer -MAX to 0 inclusive, 0 to MAX inclusive].
            // 'config() EXPONENTIAL_AT not an integer: {v}'
            // 'config() EXPONENTIAL_AT out of range: {v}'
            if ( has( p = 'EXPONENTIAL_AT' ) ) {

                if ( isArray(v) ) {
                    if ( isValidInt( v[0], -MAX, 0, 2, p ) && isValidInt( v[1], 0, MAX, 2, p ) ) {
                        TO_EXP_NEG = v[0] | 0;
                        TO_EXP_POS = v[1] | 0;
                    }
                } else if ( isValidInt( v, -MAX, MAX, 2, p ) ) {
                    TO_EXP_NEG = -( TO_EXP_POS = ( v < 0 ? -v : v ) | 0 );
                }
            }
            r[p] = [ TO_EXP_NEG, TO_EXP_POS ];

            // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
            // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
            // 'config() RANGE not an integer: {v}'
            // 'config() RANGE cannot be zero: {v}'
            // 'config() RANGE out of range: {v}'
            if ( has( p = 'RANGE' ) ) {

                if ( isArray(v) ) {
                    if ( isValidInt( v[0], -MAX, -1, 2, p ) && isValidInt( v[1], 1, MAX, 2, p ) ) {
                        MIN_EXP = v[0] | 0;
                        MAX_EXP = v[1] | 0;
                    }
                } else if ( isValidInt( v, -MAX, MAX, 2, p ) ) {
                    if ( v | 0 ) MIN_EXP = -( MAX_EXP = ( v < 0 ? -v : v ) | 0 );
                    else if (ERRORS) raise( 2, p + ' cannot be zero', v );
                }
            }
            r[p] = [ MIN_EXP, MAX_EXP ];

            // ERRORS {boolean|number} true, false, 1 or 0.
            // 'config() ERRORS not a boolean or binary digit: {v}'
            if ( has( p = 'ERRORS' ) ) {

                if ( v === !!v || v === 1 || v === 0 ) {
                    id = 0;
                    isValidInt = ( ERRORS = !!v ) ? intValidatorWithErrors : intValidatorNoErrors;
                } else if (ERRORS) {
                    raise( 2, p + notBool, v );
                }
            }
            r[p] = ERRORS;

            // CRYPTO {boolean|number} true, false, 1 or 0.
            // 'config() CRYPTO not a boolean or binary digit: {v}'
            // 'config() crypto unavailable: {crypto}'
            if ( has( p = 'CRYPTO' ) ) {

                if ( v === true || v === false || v === 1 || v === 0 ) {
                    if (v) {
                        v = typeof crypto == 'undefined';
                        if ( !v && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
                            CRYPTO = true;
                        } else if (ERRORS) {
                            raise( 2, 'crypto unavailable', v ? void 0 : crypto );
                        } else {
                            CRYPTO = false;
                        }
                    } else {
                        CRYPTO = false;
                    }
                } else if (ERRORS) {
                    raise( 2, p + notBool, v );
                }
            }
            r[p] = CRYPTO;

            // MODULO_MODE {number} Integer, 0 to 9 inclusive.
            // 'config() MODULO_MODE not an integer: {v}'
            // 'config() MODULO_MODE out of range: {v}'
            if ( has( p = 'MODULO_MODE' ) && isValidInt( v, 0, 9, 2, p ) ) {
                MODULO_MODE = v | 0;
            }
            r[p] = MODULO_MODE;

            // POW_PRECISION {number} Integer, 0 to MAX inclusive.
            // 'config() POW_PRECISION not an integer: {v}'
            // 'config() POW_PRECISION out of range: {v}'
            if ( has( p = 'POW_PRECISION' ) && isValidInt( v, 0, MAX, 2, p ) ) {
                POW_PRECISION = v | 0;
            }
            r[p] = POW_PRECISION;

            // FORMAT {object}
            // 'config() FORMAT not an object: {v}'
            if ( has( p = 'FORMAT' ) ) {

                if ( typeof v == 'object' ) {
                    FORMAT = v;
                } else if (ERRORS) {
                    raise( 2, p + ' not an object', v );
                }
            }
            r[p] = FORMAT;

            return r;
        };


        /*
         * Return a new BigNumber whose value is the maximum of the arguments.
         *
         * arguments {number|string|BigNumber}
         */
        BigNumber.max = function () { return maxOrMin( arguments, P.lt ); };


        /*
         * Return a new BigNumber whose value is the minimum of the arguments.
         *
         * arguments {number|string|BigNumber}
         */
        BigNumber.min = function () { return maxOrMin( arguments, P.gt ); };


        /*
         * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
         * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
         * zeros are produced).
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         *
         * 'random() decimal places not an integer: {dp}'
         * 'random() decimal places out of range: {dp}'
         * 'random() crypto unavailable: {crypto}'
         */
        BigNumber.random = (function () {
            var pow2_53 = 0x20000000000000;

            // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
            // Check if Math.random() produces more than 32 bits of randomness.
            // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
            // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
            var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
              ? function () { return mathfloor( Math.random() * pow2_53 ); }
              : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
                  (Math.random() * 0x800000 | 0); };

            return function (dp) {
                var a, b, e, k, v,
                    i = 0,
                    c = [],
                    rand = new BigNumber(ONE);

                dp = dp == null || !isValidInt( dp, 0, MAX, 14 ) ? DECIMAL_PLACES : dp | 0;
                k = mathceil( dp / LOG_BASE );

                if (CRYPTO) {

                    // Browsers supporting crypto.getRandomValues.
                    if (crypto.getRandomValues) {

                        a = crypto.getRandomValues( new Uint32Array( k *= 2 ) );

                        for ( ; i < k; ) {

                            // 53 bits:
                            // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
                            // 11111 11111111 11111111 11111111 11100000 00000000 00000000
                            // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
                            //                                     11111 11111111 11111111
                            // 0x20000 is 2^21.
                            v = a[i] * 0x20000 + (a[i + 1] >>> 11);

                            // Rejection sampling:
                            // 0 <= v < 9007199254740992
                            // Probability that v >= 9e15, is
                            // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
                            if ( v >= 9e15 ) {
                                b = crypto.getRandomValues( new Uint32Array(2) );
                                a[i] = b[0];
                                a[i + 1] = b[1];
                            } else {

                                // 0 <= v <= 8999999999999999
                                // 0 <= (v % 1e14) <= 99999999999999
                                c.push( v % 1e14 );
                                i += 2;
                            }
                        }
                        i = k / 2;

                    // Node.js supporting crypto.randomBytes.
                    } else if (crypto.randomBytes) {

                        // buffer
                        a = crypto.randomBytes( k *= 7 );

                        for ( ; i < k; ) {

                            // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
                            // 0x100000000 is 2^32, 0x1000000 is 2^24
                            // 11111 11111111 11111111 11111111 11111111 11111111 11111111
                            // 0 <= v < 9007199254740992
                            v = ( ( a[i] & 31 ) * 0x1000000000000 ) + ( a[i + 1] * 0x10000000000 ) +
                                  ( a[i + 2] * 0x100000000 ) + ( a[i + 3] * 0x1000000 ) +
                                  ( a[i + 4] << 16 ) + ( a[i + 5] << 8 ) + a[i + 6];

                            if ( v >= 9e15 ) {
                                crypto.randomBytes(7).copy( a, i );
                            } else {

                                // 0 <= (v % 1e14) <= 99999999999999
                                c.push( v % 1e14 );
                                i += 7;
                            }
                        }
                        i = k / 7;
                    } else {
                        CRYPTO = false;
                        if (ERRORS) raise( 14, 'crypto unavailable', crypto );
                    }
                }

                // Use Math.random.
                if (!CRYPTO) {

                    for ( ; i < k; ) {
                        v = random53bitInt();
                        if ( v < 9e15 ) c[i++] = v % 1e14;
                    }
                }

                k = c[--i];
                dp %= LOG_BASE;

                // Convert trailing digits to zeros according to dp.
                if ( k && dp ) {
                    v = POWS_TEN[LOG_BASE - dp];
                    c[i] = mathfloor( k / v ) * v;
                }

                // Remove trailing elements which are zero.
                for ( ; c[i] === 0; c.pop(), i-- );

                // Zero?
                if ( i < 0 ) {
                    c = [ e = 0 ];
                } else {

                    // Remove leading elements which are zero and adjust exponent accordingly.
                    for ( e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

                    // Count the digits of the first element of c to determine leading zeros, and...
                    for ( i = 1, v = c[0]; v >= 10; v /= 10, i++);

                    // adjust the exponent accordingly.
                    if ( i < LOG_BASE ) e -= LOG_BASE - i;
                }

                rand.e = e;
                rand.c = c;
                return rand;
            };
        })();


        // PRIVATE FUNCTIONS


        // Convert a numeric string of baseIn to a numeric string of baseOut.
        function convertBase( str, baseOut, baseIn, sign ) {
            var d, e, k, r, x, xc, y,
                i = str.indexOf( '.' ),
                dp = DECIMAL_PLACES,
                rm = ROUNDING_MODE;

            if ( baseIn < 37 ) str = str.toLowerCase();

            // Non-integer.
            if ( i >= 0 ) {
                k = POW_PRECISION;

                // Unlimited precision.
                POW_PRECISION = 0;
                str = str.replace( '.', '' );
                y = new BigNumber(baseIn);
                x = y.pow( str.length - i );
                POW_PRECISION = k;

                // Convert str as if an integer, then restore the fraction part by dividing the
                // result by its base raised to a power.
                y.c = toBaseOut( toFixedPoint( coeffToString( x.c ), x.e ), 10, baseOut );
                y.e = y.c.length;
            }

            // Convert the number as integer.
            xc = toBaseOut( str, baseIn, baseOut );
            e = k = xc.length;

            // Remove trailing zeros.
            for ( ; xc[--k] == 0; xc.pop() );
            if ( !xc[0] ) return '0';

            if ( i < 0 ) {
                --e;
            } else {
                x.c = xc;
                x.e = e;

                // sign is needed for correct rounding.
                x.s = sign;
                x = div( x, y, dp, rm, baseOut );
                xc = x.c;
                r = x.r;
                e = x.e;
            }

            d = e + dp + 1;

            // The rounding digit, i.e. the digit to the right of the digit that may be rounded up.
            i = xc[d];
            k = baseOut / 2;
            r = r || d < 0 || xc[d + 1] != null;

            r = rm < 4 ? ( i != null || r ) && ( rm == 0 || rm == ( x.s < 0 ? 3 : 2 ) )
                       : i > k || i == k &&( rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
                         rm == ( x.s < 0 ? 8 : 7 ) );

            if ( d < 1 || !xc[0] ) {

                // 1^-dp or 0.
                str = r ? toFixedPoint( '1', -dp ) : '0';
            } else {
                xc.length = d;

                if (r) {

                    // Rounding up may mean the previous digit has to be rounded up and so on.
                    for ( --baseOut; ++xc[--d] > baseOut; ) {
                        xc[d] = 0;

                        if ( !d ) {
                            ++e;
                            xc = [1].concat(xc);
                        }
                    }
                }

                // Determine trailing zeros.
                for ( k = xc.length; !xc[--k]; );

                // E.g. [4, 11, 15] becomes 4bf.
                for ( i = 0, str = ''; i <= k; str += ALPHABET.charAt( xc[i++] ) );
                str = toFixedPoint( str, e );
            }

            // The caller will add the sign.
            return str;
        }


        // Perform division in the specified base. Called by div and convertBase.
        div = (function () {

            // Assume non-zero x and k.
            function multiply( x, k, base ) {
                var m, temp, xlo, xhi,
                    carry = 0,
                    i = x.length,
                    klo = k % SQRT_BASE,
                    khi = k / SQRT_BASE | 0;

                for ( x = x.slice(); i--; ) {
                    xlo = x[i] % SQRT_BASE;
                    xhi = x[i] / SQRT_BASE | 0;
                    m = khi * xlo + xhi * klo;
                    temp = klo * xlo + ( ( m % SQRT_BASE ) * SQRT_BASE ) + carry;
                    carry = ( temp / base | 0 ) + ( m / SQRT_BASE | 0 ) + khi * xhi;
                    x[i] = temp % base;
                }

                if (carry) x = [carry].concat(x);

                return x;
            }

            function compare( a, b, aL, bL ) {
                var i, cmp;

                if ( aL != bL ) {
                    cmp = aL > bL ? 1 : -1;
                } else {

                    for ( i = cmp = 0; i < aL; i++ ) {

                        if ( a[i] != b[i] ) {
                            cmp = a[i] > b[i] ? 1 : -1;
                            break;
                        }
                    }
                }
                return cmp;
            }

            function subtract( a, b, aL, base ) {
                var i = 0;

                // Subtract b from a.
                for ( ; aL--; ) {
                    a[aL] -= i;
                    i = a[aL] < b[aL] ? 1 : 0;
                    a[aL] = i * base + a[aL] - b[aL];
                }

                // Remove leading zeros.
                for ( ; !a[0] && a.length > 1; a.splice(0, 1) );
            }

            // x: dividend, y: divisor.
            return function ( x, y, dp, rm, base ) {
                var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
                    yL, yz,
                    s = x.s == y.s ? 1 : -1,
                    xc = x.c,
                    yc = y.c;

                // Either NaN, Infinity or 0?
                if ( !xc || !xc[0] || !yc || !yc[0] ) {

                    return new BigNumber(

                      // Return NaN if either NaN, or both Infinity or 0.
                      !x.s || !y.s || ( xc ? yc && xc[0] == yc[0] : !yc ) ? NaN :

                        // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
                        xc && xc[0] == 0 || !yc ? s * 0 : s / 0
                    );
                }

                q = new BigNumber(s);
                qc = q.c = [];
                e = x.e - y.e;
                s = dp + e + 1;

                if ( !base ) {
                    base = BASE;
                    e = bitFloor( x.e / LOG_BASE ) - bitFloor( y.e / LOG_BASE );
                    s = s / LOG_BASE | 0;
                }

                // Result exponent may be one less then the current value of e.
                // The coefficients of the BigNumbers from convertBase may have trailing zeros.
                for ( i = 0; yc[i] == ( xc[i] || 0 ); i++ );
                if ( yc[i] > ( xc[i] || 0 ) ) e--;

                if ( s < 0 ) {
                    qc.push(1);
                    more = true;
                } else {
                    xL = xc.length;
                    yL = yc.length;
                    i = 0;
                    s += 2;

                    // Normalise xc and yc so highest order digit of yc is >= base / 2.

                    n = mathfloor( base / ( yc[0] + 1 ) );

                    // Not necessary, but to handle odd bases where yc[0] == ( base / 2 ) - 1.
                    // if ( n > 1 || n++ == 1 && yc[0] < base / 2 ) {
                    if ( n > 1 ) {
                        yc = multiply( yc, n, base );
                        xc = multiply( xc, n, base );
                        yL = yc.length;
                        xL = xc.length;
                    }

                    xi = yL;
                    rem = xc.slice( 0, yL );
                    remL = rem.length;

                    // Add zeros to make remainder as long as divisor.
                    for ( ; remL < yL; rem[remL++] = 0 );
                    yz = yc.slice();
                    yz = [0].concat(yz);
                    yc0 = yc[0];
                    if ( yc[1] >= base / 2 ) yc0++;
                    // Not necessary, but to prevent trial digit n > base, when using base 3.
                    // else if ( base == 3 && yc0 == 1 ) yc0 = 1 + 1e-15;

                    do {
                        n = 0;

                        // Compare divisor and remainder.
                        cmp = compare( yc, rem, yL, remL );

                        // If divisor < remainder.
                        if ( cmp < 0 ) {

                            // Calculate trial digit, n.

                            rem0 = rem[0];
                            if ( yL != remL ) rem0 = rem0 * base + ( rem[1] || 0 );

                            // n is how many times the divisor goes into the current remainder.
                            n = mathfloor( rem0 / yc0 );

                            //  Algorithm:
                            //  1. product = divisor * trial digit (n)
                            //  2. if product > remainder: product -= divisor, n--
                            //  3. remainder -= product
                            //  4. if product was < remainder at 2:
                            //    5. compare new remainder and divisor
                            //    6. If remainder > divisor: remainder -= divisor, n++

                            if ( n > 1 ) {

                                // n may be > base only when base is 3.
                                if (n >= base) n = base - 1;

                                // product = divisor * trial digit.
                                prod = multiply( yc, n, base );
                                prodL = prod.length;
                                remL = rem.length;

                                // Compare product and remainder.
                                // If product > remainder.
                                // Trial digit n too high.
                                // n is 1 too high about 5% of the time, and is not known to have
                                // ever been more than 1 too high.
                                while ( compare( prod, rem, prodL, remL ) == 1 ) {
                                    n--;

                                    // Subtract divisor from product.
                                    subtract( prod, yL < prodL ? yz : yc, prodL, base );
                                    prodL = prod.length;
                                    cmp = 1;
                                }
                            } else {

                                // n is 0 or 1, cmp is -1.
                                // If n is 0, there is no need to compare yc and rem again below,
                                // so change cmp to 1 to avoid it.
                                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                                if ( n == 0 ) {

                                    // divisor < remainder, so n must be at least 1.
                                    cmp = n = 1;
                                }

                                // product = divisor
                                prod = yc.slice();
                                prodL = prod.length;
                            }

                            if ( prodL < remL ) prod = [0].concat(prod);

                            // Subtract product from remainder.
                            subtract( rem, prod, remL, base );
                            remL = rem.length;

                             // If product was < remainder.
                            if ( cmp == -1 ) {

                                // Compare divisor and new remainder.
                                // If divisor < new remainder, subtract divisor from remainder.
                                // Trial digit n too low.
                                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                                while ( compare( yc, rem, yL, remL ) < 1 ) {
                                    n++;

                                    // Subtract divisor from remainder.
                                    subtract( rem, yL < remL ? yz : yc, remL, base );
                                    remL = rem.length;
                                }
                            }
                        } else if ( cmp === 0 ) {
                            n++;
                            rem = [0];
                        } // else cmp === 1 and n will be 0

                        // Add the next digit, n, to the result array.
                        qc[i++] = n;

                        // Update the remainder.
                        if ( rem[0] ) {
                            rem[remL++] = xc[xi] || 0;
                        } else {
                            rem = [ xc[xi] ];
                            remL = 1;
                        }
                    } while ( ( xi++ < xL || rem[0] != null ) && s-- );

                    more = rem[0] != null;

                    // Leading zero?
                    if ( !qc[0] ) qc.splice(0, 1);
                }

                if ( base == BASE ) {

                    // To calculate q.e, first get the number of digits of qc[0].
                    for ( i = 1, s = qc[0]; s >= 10; s /= 10, i++ );
                    round( q, dp + ( q.e = i + e * LOG_BASE - 1 ) + 1, rm, more );

                // Caller is convertBase.
                } else {
                    q.e = e;
                    q.r = +more;
                }

                return q;
            };
        })();


        /*
         * Return a string representing the value of BigNumber n in fixed-point or exponential
         * notation rounded to the specified decimal places or significant digits.
         *
         * n is a BigNumber.
         * i is the index of the last digit required (i.e. the digit that may be rounded up).
         * rm is the rounding mode.
         * caller is caller id: toExponential 19, toFixed 20, toFormat 21, toPrecision 24.
         */
        function format( n, i, rm, caller ) {
            var c0, e, ne, len, str;

            rm = rm != null && isValidInt( rm, 0, 8, caller, roundingMode )
              ? rm | 0 : ROUNDING_MODE;

            if ( !n.c ) return n.toString();
            c0 = n.c[0];
            ne = n.e;

            if ( i == null ) {
                str = coeffToString( n.c );
                str = caller == 19 || caller == 24 && ne <= TO_EXP_NEG
                  ? toExponential( str, ne )
                  : toFixedPoint( str, ne );
            } else {
                n = round( new BigNumber(n), i, rm );

                // n.e may have changed if the value was rounded up.
                e = n.e;

                str = coeffToString( n.c );
                len = str.length;

                // toPrecision returns exponential notation if the number of significant digits
                // specified is less than the number of digits necessary to represent the integer
                // part of the value in fixed-point notation.

                // Exponential notation.
                if ( caller == 19 || caller == 24 && ( i <= e || e <= TO_EXP_NEG ) ) {

                    // Append zeros?
                    for ( ; len < i; str += '0', len++ );
                    str = toExponential( str, e );

                // Fixed-point notation.
                } else {
                    i -= ne;
                    str = toFixedPoint( str, e );

                    // Append zeros?
                    if ( e + 1 > len ) {
                        if ( --i > 0 ) for ( str += '.'; i--; str += '0' );
                    } else {
                        i += e - len;
                        if ( i > 0 ) {
                            if ( e + 1 == len ) str += '.';
                            for ( ; i--; str += '0' );
                        }
                    }
                }
            }

            return n.s < 0 && c0 ? '-' + str : str;
        }


        // Handle BigNumber.max and BigNumber.min.
        function maxOrMin( args, method ) {
            var m, n,
                i = 0;

            if ( isArray( args[0] ) ) args = args[0];
            m = new BigNumber( args[0] );

            for ( ; ++i < args.length; ) {
                n = new BigNumber( args[i] );

                // If any number is NaN, return NaN.
                if ( !n.s ) {
                    m = n;
                    break;
                } else if ( method.call( m, n ) ) {
                    m = n;
                }
            }

            return m;
        }


        /*
         * Return true if n is an integer in range, otherwise throw.
         * Use for argument validation when ERRORS is true.
         */
        function intValidatorWithErrors( n, min, max, caller, name ) {
            if ( n < min || n > max || n != truncate(n) ) {
                raise( caller, ( name || 'decimal places' ) +
                  ( n < min || n > max ? ' out of range' : ' not an integer' ), n );
            }

            return true;
        }


        /*
         * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
         * Called by minus, plus and times.
         */
        function normalise( n, c, e ) {
            var i = 1,
                j = c.length;

             // Remove trailing zeros.
            for ( ; !c[--j]; c.pop() );

            // Calculate the base 10 exponent. First get the number of digits of c[0].
            for ( j = c[0]; j >= 10; j /= 10, i++ );

            // Overflow?
            if ( ( e = i + e * LOG_BASE - 1 ) > MAX_EXP ) {

                // Infinity.
                n.c = n.e = null;

            // Underflow?
            } else if ( e < MIN_EXP ) {

                // Zero.
                n.c = [ n.e = 0 ];
            } else {
                n.e = e;
                n.c = c;
            }

            return n;
        }


        // Handle values that fail the validity test in BigNumber.
        parseNumeric = (function () {
            var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
                dotAfter = /^([^.]+)\.$/,
                dotBefore = /^\.([^.]+)$/,
                isInfinityOrNaN = /^-?(Infinity|NaN)$/,
                whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

            return function ( x, str, num, b ) {
                var base,
                    s = num ? str : str.replace( whitespaceOrPlus, '' );

                // No exception on ±Infinity or NaN.
                if ( isInfinityOrNaN.test(s) ) {
                    x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
                } else {
                    if ( !num ) {

                        // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
                        s = s.replace( basePrefix, function ( m, p1, p2 ) {
                            base = ( p2 = p2.toLowerCase() ) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
                            return !b || b == base ? p1 : m;
                        });

                        if (b) {
                            base = b;

                            // E.g. '1.' to '1', '.1' to '0.1'
                            s = s.replace( dotAfter, '$1' ).replace( dotBefore, '0.$1' );
                        }

                        if ( str != s ) return new BigNumber( s, base );
                    }

                    // 'new BigNumber() not a number: {n}'
                    // 'new BigNumber() not a base {b} number: {n}'
                    if (ERRORS) raise( id, 'not a' + ( b ? ' base ' + b : '' ) + ' number', str );
                    x.s = null;
                }

                x.c = x.e = null;
                id = 0;
            }
        })();


        // Throw a BigNumber Error.
        function raise( caller, msg, val ) {
            var error = new Error( [
                'new BigNumber',     // 0
                'cmp',               // 1
                'config',            // 2
                'div',               // 3
                'divToInt',          // 4
                'eq',                // 5
                'gt',                // 6
                'gte',               // 7
                'lt',                // 8
                'lte',               // 9
                'minus',             // 10
                'mod',               // 11
                'plus',              // 12
                'precision',         // 13
                'random',            // 14
                'round',             // 15
                'shift',             // 16
                'times',             // 17
                'toDigits',          // 18
                'toExponential',     // 19
                'toFixed',           // 20
                'toFormat',          // 21
                'toFraction',        // 22
                'pow',               // 23
                'toPrecision',       // 24
                'toString',          // 25
                'BigNumber'          // 26
            ][caller] + '() ' + msg + ': ' + val );

            error.name = 'BigNumber Error';
            id = 0;
            throw error;
        }


        /*
         * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
         * If r is truthy, it is known that there are more digits after the rounding digit.
         */
        function round( x, sd, rm, r ) {
            var d, i, j, k, n, ni, rd,
                xc = x.c,
                pows10 = POWS_TEN;

            // if x is not Infinity or NaN...
            if (xc) {

                // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
                // n is a base 1e14 number, the value of the element of array x.c containing rd.
                // ni is the index of n within x.c.
                // d is the number of digits of n.
                // i is the index of rd within n including leading zeros.
                // j is the actual index of rd within n (if < 0, rd is a leading zero).
                out: {

                    // Get the number of digits of the first element of xc.
                    for ( d = 1, k = xc[0]; k >= 10; k /= 10, d++ );
                    i = sd - d;

                    // If the rounding digit is in the first element of xc...
                    if ( i < 0 ) {
                        i += LOG_BASE;
                        j = sd;
                        n = xc[ ni = 0 ];

                        // Get the rounding digit at index j of n.
                        rd = n / pows10[ d - j - 1 ] % 10 | 0;
                    } else {
                        ni = mathceil( ( i + 1 ) / LOG_BASE );

                        if ( ni >= xc.length ) {

                            if (r) {

                                // Needed by sqrt.
                                for ( ; xc.length <= ni; xc.push(0) );
                                n = rd = 0;
                                d = 1;
                                i %= LOG_BASE;
                                j = i - LOG_BASE + 1;
                            } else {
                                break out;
                            }
                        } else {
                            n = k = xc[ni];

                            // Get the number of digits of n.
                            for ( d = 1; k >= 10; k /= 10, d++ );

                            // Get the index of rd within n.
                            i %= LOG_BASE;

                            // Get the index of rd within n, adjusted for leading zeros.
                            // The number of leading zeros of n is given by LOG_BASE - d.
                            j = i - LOG_BASE + d;

                            // Get the rounding digit at index j of n.
                            rd = j < 0 ? 0 : n / pows10[ d - j - 1 ] % 10 | 0;
                        }
                    }

                    r = r || sd < 0 ||

                    // Are there any non-zero digits after the rounding digit?
                    // The expression  n % pows10[ d - j - 1 ]  returns all digits of n to the right
                    // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
                      xc[ni + 1] != null || ( j < 0 ? n : n % pows10[ d - j - 1 ] );

                    r = rm < 4
                      ? ( rd || r ) && ( rm == 0 || rm == ( x.s < 0 ? 3 : 2 ) )
                      : rd > 5 || rd == 5 && ( rm == 4 || r || rm == 6 &&

                        // Check whether the digit to the left of the rounding digit is odd.
                        ( ( i > 0 ? j > 0 ? n / pows10[ d - j ] : 0 : xc[ni - 1] ) % 10 ) & 1 ||
                          rm == ( x.s < 0 ? 8 : 7 ) );

                    if ( sd < 1 || !xc[0] ) {
                        xc.length = 0;

                        if (r) {

                            // Convert sd to decimal places.
                            sd -= x.e + 1;

                            // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                            xc[0] = pows10[ ( LOG_BASE - sd % LOG_BASE ) % LOG_BASE ];
                            x.e = -sd || 0;
                        } else {

                            // Zero.
                            xc[0] = x.e = 0;
                        }

                        return x;
                    }

                    // Remove excess digits.
                    if ( i == 0 ) {
                        xc.length = ni;
                        k = 1;
                        ni--;
                    } else {
                        xc.length = ni + 1;
                        k = pows10[ LOG_BASE - i ];

                        // E.g. 56700 becomes 56000 if 7 is the rounding digit.
                        // j > 0 means i > number of leading zeros of n.
                        xc[ni] = j > 0 ? mathfloor( n / pows10[ d - j ] % pows10[j] ) * k : 0;
                    }

                    // Round up?
                    if (r) {

                        for ( ; ; ) {

                            // If the digit to be rounded up is in the first element of xc...
                            if ( ni == 0 ) {

                                // i will be the length of xc[0] before k is added.
                                for ( i = 1, j = xc[0]; j >= 10; j /= 10, i++ );
                                j = xc[0] += k;
                                for ( k = 1; j >= 10; j /= 10, k++ );

                                // if i != k the length has increased.
                                if ( i != k ) {
                                    x.e++;
                                    if ( xc[0] == BASE ) xc[0] = 1;
                                }

                                break;
                            } else {
                                xc[ni] += k;
                                if ( xc[ni] != BASE ) break;
                                xc[ni--] = 0;
                                k = 1;
                            }
                        }
                    }

                    // Remove trailing zeros.
                    for ( i = xc.length; xc[--i] === 0; xc.pop() );
                }

                // Overflow? Infinity.
                if ( x.e > MAX_EXP ) {
                    x.c = x.e = null;

                // Underflow? Zero.
                } else if ( x.e < MIN_EXP ) {
                    x.c = [ x.e = 0 ];
                }
            }

            return x;
        }


        // PROTOTYPE/INSTANCE METHODS


        /*
         * Return a new BigNumber whose value is the absolute value of this BigNumber.
         */
        P.absoluteValue = P.abs = function () {
            var x = new BigNumber(this);
            if ( x.s < 0 ) x.s = 1;
            return x;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a whole
         * number in the direction of Infinity.
         */
        P.ceil = function () {
            return round( new BigNumber(this), this.e + 1, 2 );
        };


        /*
         * Return
         * 1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
         * -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
         * 0 if they have the same value,
         * or null if the value of either is NaN.
         */
        P.comparedTo = P.cmp = function ( y, b ) {
            id = 1;
            return compare( this, new BigNumber( y, b ) );
        };


        /*
         * Return the number of decimal places of the value of this BigNumber, or null if the value
         * of this BigNumber is ±Infinity or NaN.
         */
        P.decimalPlaces = P.dp = function () {
            var n, v,
                c = this.c;

            if ( !c ) return null;
            n = ( ( v = c.length - 1 ) - bitFloor( this.e / LOG_BASE ) ) * LOG_BASE;

            // Subtract the number of trailing zeros of the last number.
            if ( v = c[v] ) for ( ; v % 10 == 0; v /= 10, n-- );
            if ( n < 0 ) n = 0;

            return n;
        };


        /*
         *  n / 0 = I
         *  n / N = N
         *  n / I = 0
         *  0 / n = 0
         *  0 / 0 = N
         *  0 / N = N
         *  0 / I = 0
         *  N / n = N
         *  N / 0 = N
         *  N / N = N
         *  N / I = N
         *  I / n = I
         *  I / 0 = I
         *  I / N = N
         *  I / I = N
         *
         * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
         * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
         */
        P.dividedBy = P.div = function ( y, b ) {
            id = 3;
            return div( this, new BigNumber( y, b ), DECIMAL_PLACES, ROUNDING_MODE );
        };


        /*
         * Return a new BigNumber whose value is the integer part of dividing the value of this
         * BigNumber by the value of BigNumber(y, b).
         */
        P.dividedToIntegerBy = P.divToInt = function ( y, b ) {
            id = 4;
            return div( this, new BigNumber( y, b ), 0, 1 );
        };


        /*
         * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
         * otherwise returns false.
         */
        P.equals = P.eq = function ( y, b ) {
            id = 5;
            return compare( this, new BigNumber( y, b ) ) === 0;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a whole
         * number in the direction of -Infinity.
         */
        P.floor = function () {
            return round( new BigNumber(this), this.e + 1, 3 );
        };


        /*
         * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
         * otherwise returns false.
         */
        P.greaterThan = P.gt = function ( y, b ) {
            id = 6;
            return compare( this, new BigNumber( y, b ) ) > 0;
        };


        /*
         * Return true if the value of this BigNumber is greater than or equal to the value of
         * BigNumber(y, b), otherwise returns false.
         */
        P.greaterThanOrEqualTo = P.gte = function ( y, b ) {
            id = 7;
            return ( b = compare( this, new BigNumber( y, b ) ) ) === 1 || b === 0;

        };


        /*
         * Return true if the value of this BigNumber is a finite number, otherwise returns false.
         */
        P.isFinite = function () {
            return !!this.c;
        };


        /*
         * Return true if the value of this BigNumber is an integer, otherwise return false.
         */
        P.isInteger = P.isInt = function () {
            return !!this.c && bitFloor( this.e / LOG_BASE ) > this.c.length - 2;
        };


        /*
         * Return true if the value of this BigNumber is NaN, otherwise returns false.
         */
        P.isNaN = function () {
            return !this.s;
        };


        /*
         * Return true if the value of this BigNumber is negative, otherwise returns false.
         */
        P.isNegative = P.isNeg = function () {
            return this.s < 0;
        };


        /*
         * Return true if the value of this BigNumber is 0 or -0, otherwise returns false.
         */
        P.isZero = function () {
            return !!this.c && this.c[0] == 0;
        };


        /*
         * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
         * otherwise returns false.
         */
        P.lessThan = P.lt = function ( y, b ) {
            id = 8;
            return compare( this, new BigNumber( y, b ) ) < 0;
        };


        /*
         * Return true if the value of this BigNumber is less than or equal to the value of
         * BigNumber(y, b), otherwise returns false.
         */
        P.lessThanOrEqualTo = P.lte = function ( y, b ) {
            id = 9;
            return ( b = compare( this, new BigNumber( y, b ) ) ) === -1 || b === 0;
        };


        /*
         *  n - 0 = n
         *  n - N = N
         *  n - I = -I
         *  0 - n = -n
         *  0 - 0 = 0
         *  0 - N = N
         *  0 - I = -I
         *  N - n = N
         *  N - 0 = N
         *  N - N = N
         *  N - I = N
         *  I - n = I
         *  I - 0 = I
         *  I - N = N
         *  I - I = N
         *
         * Return a new BigNumber whose value is the value of this BigNumber minus the value of
         * BigNumber(y, b).
         */
        P.minus = P.sub = function ( y, b ) {
            var i, j, t, xLTy,
                x = this,
                a = x.s;

            id = 10;
            y = new BigNumber( y, b );
            b = y.s;

            // Either NaN?
            if ( !a || !b ) return new BigNumber(NaN);

            // Signs differ?
            if ( a != b ) {
                y.s = -b;
                return x.plus(y);
            }

            var xe = x.e / LOG_BASE,
                ye = y.e / LOG_BASE,
                xc = x.c,
                yc = y.c;

            if ( !xe || !ye ) {

                // Either Infinity?
                if ( !xc || !yc ) return xc ? ( y.s = -b, y ) : new BigNumber( yc ? x : NaN );

                // Either zero?
                if ( !xc[0] || !yc[0] ) {

                    // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
                    return yc[0] ? ( y.s = -b, y ) : new BigNumber( xc[0] ? x :

                      // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
                      ROUNDING_MODE == 3 ? -0 : 0 );
                }
            }

            xe = bitFloor(xe);
            ye = bitFloor(ye);
            xc = xc.slice();

            // Determine which is the bigger number.
            if ( a = xe - ye ) {

                if ( xLTy = a < 0 ) {
                    a = -a;
                    t = xc;
                } else {
                    ye = xe;
                    t = yc;
                }

                t.reverse();

                // Prepend zeros to equalise exponents.
                for ( b = a; b--; t.push(0) );
                t.reverse();
            } else {

                // Exponents equal. Check digit by digit.
                j = ( xLTy = ( a = xc.length ) < ( b = yc.length ) ) ? a : b;

                for ( a = b = 0; b < j; b++ ) {

                    if ( xc[b] != yc[b] ) {
                        xLTy = xc[b] < yc[b];
                        break;
                    }
                }
            }

            // x < y? Point xc to the array of the bigger number.
            if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

            b = ( j = yc.length ) - ( i = xc.length );

            // Append zeros to xc if shorter.
            // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
            if ( b > 0 ) for ( ; b--; xc[i++] = 0 );
            b = BASE - 1;

            // Subtract yc from xc.
            for ( ; j > a; ) {

                if ( xc[--j] < yc[j] ) {
                    for ( i = j; i && !xc[--i]; xc[i] = b );
                    --xc[i];
                    xc[j] += BASE;
                }

                xc[j] -= yc[j];
            }

            // Remove leading zeros and adjust exponent accordingly.
            for ( ; xc[0] == 0; xc.splice(0, 1), --ye );

            // Zero?
            if ( !xc[0] ) {

                // Following IEEE 754 (2008) 6.3,
                // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
                y.s = ROUNDING_MODE == 3 ? -1 : 1;
                y.c = [ y.e = 0 ];
                return y;
            }

            // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
            // for finite x and y.
            return normalise( y, xc, ye );
        };


        /*
         *   n % 0 =  N
         *   n % N =  N
         *   n % I =  n
         *   0 % n =  0
         *  -0 % n = -0
         *   0 % 0 =  N
         *   0 % N =  N
         *   0 % I =  0
         *   N % n =  N
         *   N % 0 =  N
         *   N % N =  N
         *   N % I =  N
         *   I % n =  N
         *   I % 0 =  N
         *   I % N =  N
         *   I % I =  N
         *
         * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
         * BigNumber(y, b). The result depends on the value of MODULO_MODE.
         */
        P.modulo = P.mod = function ( y, b ) {
            var q, s,
                x = this;

            id = 11;
            y = new BigNumber( y, b );

            // Return NaN if x is Infinity or NaN, or y is NaN or zero.
            if ( !x.c || !y.s || y.c && !y.c[0] ) {
                return new BigNumber(NaN);

            // Return x if y is Infinity or x is zero.
            } else if ( !y.c || x.c && !x.c[0] ) {
                return new BigNumber(x);
            }

            if ( MODULO_MODE == 9 ) {

                // Euclidian division: q = sign(y) * floor(x / abs(y))
                // r = x - qy    where  0 <= r < abs(y)
                s = y.s;
                y.s = 1;
                q = div( x, y, 0, 3 );
                y.s = s;
                q.s *= s;
            } else {
                q = div( x, y, 0, MODULO_MODE );
            }

            return x.minus( q.times(y) );
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber negated,
         * i.e. multiplied by -1.
         */
        P.negated = P.neg = function () {
            var x = new BigNumber(this);
            x.s = -x.s || null;
            return x;
        };


        /*
         *  n + 0 = n
         *  n + N = N
         *  n + I = I
         *  0 + n = n
         *  0 + 0 = 0
         *  0 + N = N
         *  0 + I = I
         *  N + n = N
         *  N + 0 = N
         *  N + N = N
         *  N + I = N
         *  I + n = I
         *  I + 0 = I
         *  I + N = N
         *  I + I = I
         *
         * Return a new BigNumber whose value is the value of this BigNumber plus the value of
         * BigNumber(y, b).
         */
        P.plus = P.add = function ( y, b ) {
            var t,
                x = this,
                a = x.s;

            id = 12;
            y = new BigNumber( y, b );
            b = y.s;

            // Either NaN?
            if ( !a || !b ) return new BigNumber(NaN);

            // Signs differ?
             if ( a != b ) {
                y.s = -b;
                return x.minus(y);
            }

            var xe = x.e / LOG_BASE,
                ye = y.e / LOG_BASE,
                xc = x.c,
                yc = y.c;

            if ( !xe || !ye ) {

                // Return ±Infinity if either ±Infinity.
                if ( !xc || !yc ) return new BigNumber( a / 0 );

                // Either zero?
                // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
                if ( !xc[0] || !yc[0] ) return yc[0] ? y : new BigNumber( xc[0] ? x : a * 0 );
            }

            xe = bitFloor(xe);
            ye = bitFloor(ye);
            xc = xc.slice();

            // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
            if ( a = xe - ye ) {
                if ( a > 0 ) {
                    ye = xe;
                    t = yc;
                } else {
                    a = -a;
                    t = xc;
                }

                t.reverse();
                for ( ; a--; t.push(0) );
                t.reverse();
            }

            a = xc.length;
            b = yc.length;

            // Point xc to the longer array, and b to the shorter length.
            if ( a - b < 0 ) t = yc, yc = xc, xc = t, b = a;

            // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
            for ( a = 0; b; ) {
                a = ( xc[--b] = xc[b] + yc[b] + a ) / BASE | 0;
                xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
            }

            if (a) {
                xc = [a].concat(xc);
                ++ye;
            }

            // No need to check for zero, as +x + +y != 0 && -x + -y != 0
            // ye = MAX_EXP + 1 possible
            return normalise( y, xc, ye );
        };


        /*
         * Return the number of significant digits of the value of this BigNumber.
         *
         * [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
         */
        P.precision = P.sd = function (z) {
            var n, v,
                x = this,
                c = x.c;

            // 'precision() argument not a boolean or binary digit: {z}'
            if ( z != null && z !== !!z && z !== 1 && z !== 0 ) {
                if (ERRORS) raise( 13, 'argument' + notBool, z );
                if ( z != !!z ) z = null;
            }

            if ( !c ) return null;
            v = c.length - 1;
            n = v * LOG_BASE + 1;

            if ( v = c[v] ) {

                // Subtract the number of trailing zeros of the last element.
                for ( ; v % 10 == 0; v /= 10, n-- );

                // Add the number of digits of the first element.
                for ( v = c[0]; v >= 10; v /= 10, n++ );
            }

            if ( z && x.e + 1 > n ) n = x.e + 1;

            return n;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a maximum of
         * dp decimal places using rounding mode rm, or to 0 and ROUNDING_MODE respectively if
         * omitted.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'round() decimal places out of range: {dp}'
         * 'round() decimal places not an integer: {dp}'
         * 'round() rounding mode not an integer: {rm}'
         * 'round() rounding mode out of range: {rm}'
         */
        P.round = function ( dp, rm ) {
            var n = new BigNumber(this);

            if ( dp == null || isValidInt( dp, 0, MAX, 15 ) ) {
                round( n, ~~dp + this.e + 1, rm == null ||
                  !isValidInt( rm, 0, 8, 15, roundingMode ) ? ROUNDING_MODE : rm | 0 );
            }

            return n;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
         * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
         *
         * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
         *
         * If k is out of range and ERRORS is false, the result will be ±0 if k < 0, or ±Infinity
         * otherwise.
         *
         * 'shift() argument not an integer: {k}'
         * 'shift() argument out of range: {k}'
         */
        P.shift = function (k) {
            var n = this;
            return isValidInt( k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER, 16, 'argument' )

              // k < 1e+21, or truncate(k) will produce exponential notation.
              ? n.times( '1e' + truncate(k) )
              : new BigNumber( n.c && n.c[0] && ( k < -MAX_SAFE_INTEGER || k > MAX_SAFE_INTEGER )
                ? n.s * ( k < 0 ? 0 : 1 / 0 )
                : n );
        };


        /*
         *  sqrt(-n) =  N
         *  sqrt( N) =  N
         *  sqrt(-I) =  N
         *  sqrt( I) =  I
         *  sqrt( 0) =  0
         *  sqrt(-0) = -0
         *
         * Return a new BigNumber whose value is the square root of the value of this BigNumber,
         * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
         */
        P.squareRoot = P.sqrt = function () {
            var m, n, r, rep, t,
                x = this,
                c = x.c,
                s = x.s,
                e = x.e,
                dp = DECIMAL_PLACES + 4,
                half = new BigNumber('0.5');

            // Negative/NaN/Infinity/zero?
            if ( s !== 1 || !c || !c[0] ) {
                return new BigNumber( !s || s < 0 && ( !c || c[0] ) ? NaN : c ? x : 1 / 0 );
            }

            // Initial estimate.
            s = Math.sqrt( +x );

            // Math.sqrt underflow/overflow?
            // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
            if ( s == 0 || s == 1 / 0 ) {
                n = coeffToString(c);
                if ( ( n.length + e ) % 2 == 0 ) n += '0';
                s = Math.sqrt(n);
                e = bitFloor( ( e + 1 ) / 2 ) - ( e < 0 || e % 2 );

                if ( s == 1 / 0 ) {
                    n = '1e' + e;
                } else {
                    n = s.toExponential();
                    n = n.slice( 0, n.indexOf('e') + 1 ) + e;
                }

                r = new BigNumber(n);
            } else {
                r = new BigNumber( s + '' );
            }

            // Check for zero.
            // r could be zero if MIN_EXP is changed after the this value was created.
            // This would cause a division by zero (x/t) and hence Infinity below, which would cause
            // coeffToString to throw.
            if ( r.c[0] ) {
                e = r.e;
                s = e + dp;
                if ( s < 3 ) s = 0;

                // Newton-Raphson iteration.
                for ( ; ; ) {
                    t = r;
                    r = half.times( t.plus( div( x, t, dp, 1 ) ) );

                    if ( coeffToString( t.c   ).slice( 0, s ) === ( n =
                         coeffToString( r.c ) ).slice( 0, s ) ) {

                        // The exponent of r may here be one less than the final result exponent,
                        // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
                        // are indexed correctly.
                        if ( r.e < e ) --s;
                        n = n.slice( s - 3, s + 1 );

                        // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
                        // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
                        // iteration.
                        if ( n == '9999' || !rep && n == '4999' ) {

                            // On the first iteration only, check to see if rounding up gives the
                            // exact result as the nines may infinitely repeat.
                            if ( !rep ) {
                                round( t, t.e + DECIMAL_PLACES + 2, 0 );

                                if ( t.times(t).eq(x) ) {
                                    r = t;
                                    break;
                                }
                            }

                            dp += 4;
                            s += 4;
                            rep = 1;
                        } else {

                            // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
                            // result. If not, then there are further digits and m will be truthy.
                            if ( !+n || !+n.slice(1) && n.charAt(0) == '5' ) {

                                // Truncate to the first rounding digit.
                                round( r, r.e + DECIMAL_PLACES + 2, 1 );
                                m = !r.times(r).eq(x);
                            }

                            break;
                        }
                    }
                }
            }

            return round( r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m );
        };


        /*
         *  n * 0 = 0
         *  n * N = N
         *  n * I = I
         *  0 * n = 0
         *  0 * 0 = 0
         *  0 * N = N
         *  0 * I = N
         *  N * n = N
         *  N * 0 = N
         *  N * N = N
         *  N * I = N
         *  I * n = I
         *  I * 0 = N
         *  I * N = N
         *  I * I = I
         *
         * Return a new BigNumber whose value is the value of this BigNumber times the value of
         * BigNumber(y, b).
         */
        P.times = P.mul = function ( y, b ) {
            var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
                base, sqrtBase,
                x = this,
                xc = x.c,
                yc = ( id = 17, y = new BigNumber( y, b ) ).c;

            // Either NaN, ±Infinity or ±0?
            if ( !xc || !yc || !xc[0] || !yc[0] ) {

                // Return NaN if either is NaN, or one is 0 and the other is Infinity.
                if ( !x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc ) {
                    y.c = y.e = y.s = null;
                } else {
                    y.s *= x.s;

                    // Return ±Infinity if either is ±Infinity.
                    if ( !xc || !yc ) {
                        y.c = y.e = null;

                    // Return ±0 if either is ±0.
                    } else {
                        y.c = [0];
                        y.e = 0;
                    }
                }

                return y;
            }

            e = bitFloor( x.e / LOG_BASE ) + bitFloor( y.e / LOG_BASE );
            y.s *= x.s;
            xcL = xc.length;
            ycL = yc.length;

            // Ensure xc points to longer array and xcL to its length.
            if ( xcL < ycL ) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

            // Initialise the result array with zeros.
            for ( i = xcL + ycL, zc = []; i--; zc.push(0) );

            base = BASE;
            sqrtBase = SQRT_BASE;

            for ( i = ycL; --i >= 0; ) {
                c = 0;
                ylo = yc[i] % sqrtBase;
                yhi = yc[i] / sqrtBase | 0;

                for ( k = xcL, j = i + k; j > i; ) {
                    xlo = xc[--k] % sqrtBase;
                    xhi = xc[k] / sqrtBase | 0;
                    m = yhi * xlo + xhi * ylo;
                    xlo = ylo * xlo + ( ( m % sqrtBase ) * sqrtBase ) + zc[j] + c;
                    c = ( xlo / base | 0 ) + ( m / sqrtBase | 0 ) + yhi * xhi;
                    zc[j--] = xlo % base;
                }

                zc[j] = c;
            }

            if (c) {
                ++e;
            } else {
                zc.splice(0, 1);
            }

            return normalise( y, zc, e );
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to a maximum of
         * sd significant digits using rounding mode rm, or ROUNDING_MODE if rm is omitted.
         *
         * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toDigits() precision out of range: {sd}'
         * 'toDigits() precision not an integer: {sd}'
         * 'toDigits() rounding mode not an integer: {rm}'
         * 'toDigits() rounding mode out of range: {rm}'
         */
        P.toDigits = function ( sd, rm ) {
            var n = new BigNumber(this);
            sd = sd == null || !isValidInt( sd, 1, MAX, 18, 'precision' ) ? null : sd | 0;
            rm = rm == null || !isValidInt( rm, 0, 8, 18, roundingMode ) ? ROUNDING_MODE : rm | 0;
            return sd ? round( n, sd, rm ) : n;
        };


        /*
         * Return a string representing the value of this BigNumber in exponential notation and
         * rounded using ROUNDING_MODE to dp fixed decimal places.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toExponential() decimal places not an integer: {dp}'
         * 'toExponential() decimal places out of range: {dp}'
         * 'toExponential() rounding mode not an integer: {rm}'
         * 'toExponential() rounding mode out of range: {rm}'
         */
        P.toExponential = function ( dp, rm ) {
            return format( this,
              dp != null && isValidInt( dp, 0, MAX, 19 ) ? ~~dp + 1 : null, rm, 19 );
        };


        /*
         * Return a string representing the value of this BigNumber in fixed-point notation rounding
         * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
         *
         * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
         * but e.g. (-0.00001).toFixed(0) is '-0'.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toFixed() decimal places not an integer: {dp}'
         * 'toFixed() decimal places out of range: {dp}'
         * 'toFixed() rounding mode not an integer: {rm}'
         * 'toFixed() rounding mode out of range: {rm}'
         */
        P.toFixed = function ( dp, rm ) {
            return format( this, dp != null && isValidInt( dp, 0, MAX, 20 )
              ? ~~dp + this.e + 1 : null, rm, 20 );
        };


        /*
         * Return a string representing the value of this BigNumber in fixed-point notation rounded
         * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
         * of the FORMAT object (see BigNumber.config).
         *
         * FORMAT = {
         *      decimalSeparator : '.',
         *      groupSeparator : ',',
         *      groupSize : 3,
         *      secondaryGroupSize : 0,
         *      fractionGroupSeparator : '\xA0',    // non-breaking space
         *      fractionGroupSize : 0
         * };
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toFormat() decimal places not an integer: {dp}'
         * 'toFormat() decimal places out of range: {dp}'
         * 'toFormat() rounding mode not an integer: {rm}'
         * 'toFormat() rounding mode out of range: {rm}'
         */
        P.toFormat = function ( dp, rm ) {
            var str = format( this, dp != null && isValidInt( dp, 0, MAX, 21 )
              ? ~~dp + this.e + 1 : null, rm, 21 );

            if ( this.c ) {
                var i,
                    arr = str.split('.'),
                    g1 = +FORMAT.groupSize,
                    g2 = +FORMAT.secondaryGroupSize,
                    groupSeparator = FORMAT.groupSeparator,
                    intPart = arr[0],
                    fractionPart = arr[1],
                    isNeg = this.s < 0,
                    intDigits = isNeg ? intPart.slice(1) : intPart,
                    len = intDigits.length;

                if (g2) i = g1, g1 = g2, g2 = i, len -= i;

                if ( g1 > 0 && len > 0 ) {
                    i = len % g1 || g1;
                    intPart = intDigits.substr( 0, i );

                    for ( ; i < len; i += g1 ) {
                        intPart += groupSeparator + intDigits.substr( i, g1 );
                    }

                    if ( g2 > 0 ) intPart += groupSeparator + intDigits.slice(i);
                    if (isNeg) intPart = '-' + intPart;
                }

                str = fractionPart
                  ? intPart + FORMAT.decimalSeparator + ( ( g2 = +FORMAT.fractionGroupSize )
                    ? fractionPart.replace( new RegExp( '\\d{' + g2 + '}\\B', 'g' ),
                      '$&' + FORMAT.fractionGroupSeparator )
                    : fractionPart )
                  : intPart;
            }

            return str;
        };


        /*
         * Return a string array representing the value of this BigNumber as a simple fraction with
         * an integer numerator and an integer denominator. The denominator will be a positive
         * non-zero value less than or equal to the specified maximum denominator. If a maximum
         * denominator is not specified, the denominator will be the lowest value necessary to
         * represent the number exactly.
         *
         * [md] {number|string|BigNumber} Integer >= 1 and < Infinity. The maximum denominator.
         *
         * 'toFraction() max denominator not an integer: {md}'
         * 'toFraction() max denominator out of range: {md}'
         */
        P.toFraction = function (md) {
            var arr, d0, d2, e, exp, n, n0, q, s,
                k = ERRORS,
                x = this,
                xc = x.c,
                d = new BigNumber(ONE),
                n1 = d0 = new BigNumber(ONE),
                d1 = n0 = new BigNumber(ONE);

            if ( md != null ) {
                ERRORS = false;
                n = new BigNumber(md);
                ERRORS = k;

                if ( !( k = n.isInt() ) || n.lt(ONE) ) {

                    if (ERRORS) {
                        raise( 22,
                          'max denominator ' + ( k ? 'out of range' : 'not an integer' ), md );
                    }

                    // ERRORS is false:
                    // If md is a finite non-integer >= 1, round it to an integer and use it.
                    md = !k && n.c && round( n, n.e + 1, 1 ).gte(ONE) ? n : null;
                }
            }

            if ( !xc ) return x.toString();
            s = coeffToString(xc);

            // Determine initial denominator.
            // d is a power of 10 and the minimum max denominator that specifies the value exactly.
            e = d.e = s.length - x.e - 1;
            d.c[0] = POWS_TEN[ ( exp = e % LOG_BASE ) < 0 ? LOG_BASE + exp : exp ];
            md = !md || n.cmp(d) > 0 ? ( e > 0 ? d : n1 ) : n;

            exp = MAX_EXP;
            MAX_EXP = 1 / 0;
            n = new BigNumber(s);

            // n0 = d1 = 0
            n0.c[0] = 0;

            for ( ; ; )  {
                q = div( n, d, 0, 1 );
                d2 = d0.plus( q.times(d1) );
                if ( d2.cmp(md) == 1 ) break;
                d0 = d1;
                d1 = d2;
                n1 = n0.plus( q.times( d2 = n1 ) );
                n0 = d2;
                d = n.minus( q.times( d2 = d ) );
                n = d2;
            }

            d2 = div( md.minus(d0), d1, 0, 1 );
            n0 = n0.plus( d2.times(n1) );
            d0 = d0.plus( d2.times(d1) );
            n0.s = n1.s = x.s;
            e *= 2;

            // Determine which fraction is closer to x, n0/d0 or n1/d1
            arr = div( n1, d1, e, ROUNDING_MODE ).minus(x).abs().cmp(
                  div( n0, d0, e, ROUNDING_MODE ).minus(x).abs() ) < 1
                    ? [ n1.toString(), d1.toString() ]
                    : [ n0.toString(), d0.toString() ];

            MAX_EXP = exp;
            return arr;
        };


        /*
         * Return the value of this BigNumber converted to a number primitive.
         */
        P.toNumber = function () {
            return +this;
        };


        /*
         * Return a BigNumber whose value is the value of this BigNumber raised to the power n.
         * If m is present, return the result modulo m.
         * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
         * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using
         * ROUNDING_MODE.
         *
         * The modular power operation works efficiently when x, n, and m are positive integers,
         * otherwise it is equivalent to calculating x.toPower(n).modulo(m) (with POW_PRECISION 0).
         *
         * n {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
         * [m] {number|string|BigNumber} The modulus.
         *
         * 'pow() exponent not an integer: {n}'
         * 'pow() exponent out of range: {n}'
         *
         * Performs 54 loop iterations for n of 9007199254740991.
         */
        P.toPower = P.pow = function ( n, m ) {
            var k, y, z,
                i = mathfloor( n < 0 ? -n : +n ),
                x = this;

            if ( m != null ) {
                id = 23;
                m = new BigNumber(m);
            }

            // Pass ±Infinity to Math.pow if exponent is out of range.
            if ( !isValidInt( n, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER, 23, 'exponent' ) &&
              ( !isFinite(n) || i > MAX_SAFE_INTEGER && ( n /= 0 ) ||
                parseFloat(n) != n && !( n = NaN ) ) || n == 0 ) {
                k = Math.pow( +x, n );
                return new BigNumber( m ? k % m : k );
            }

            if (m) {
                if ( n > 1 && x.gt(ONE) && x.isInt() && m.gt(ONE) && m.isInt() ) {
                    x = x.mod(m);
                } else {
                    z = m;

                    // Nullify m so only a single mod operation is performed at the end.
                    m = null;
                }
            } else if (POW_PRECISION) {

                // Truncating each coefficient array to a length of k after each multiplication
                // equates to truncating significant digits to POW_PRECISION + [28, 41],
                // i.e. there will be a minimum of 28 guard digits retained.
                // (Using + 1.5 would give [9, 21] guard digits.)
                k = mathceil( POW_PRECISION / LOG_BASE + 2 );
            }

            y = new BigNumber(ONE);

            for ( ; ; ) {
                if ( i % 2 ) {
                    y = y.times(x);
                    if ( !y.c ) break;
                    if (k) {
                        if ( y.c.length > k ) y.c.length = k;
                    } else if (m) {
                        y = y.mod(m);
                    }
                }

                i = mathfloor( i / 2 );
                if ( !i ) break;
                x = x.times(x);
                if (k) {
                    if ( x.c && x.c.length > k ) x.c.length = k;
                } else if (m) {
                    x = x.mod(m);
                }
            }

            if (m) return y;
            if ( n < 0 ) y = ONE.div(y);

            return z ? y.mod(z) : k ? round( y, POW_PRECISION, ROUNDING_MODE ) : y;
        };


        /*
         * Return a string representing the value of this BigNumber rounded to sd significant digits
         * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
         * necessary to represent the integer part of the value in fixed-point notation, then use
         * exponential notation.
         *
         * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * 'toPrecision() precision not an integer: {sd}'
         * 'toPrecision() precision out of range: {sd}'
         * 'toPrecision() rounding mode not an integer: {rm}'
         * 'toPrecision() rounding mode out of range: {rm}'
         */
        P.toPrecision = function ( sd, rm ) {
            return format( this, sd != null && isValidInt( sd, 1, MAX, 24, 'precision' )
              ? sd | 0 : null, rm, 24 );
        };


        /*
         * Return a string representing the value of this BigNumber in base b, or base 10 if b is
         * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
         * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
         * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
         * TO_EXP_NEG, return exponential notation.
         *
         * [b] {number} Integer, 2 to 64 inclusive.
         *
         * 'toString() base not an integer: {b}'
         * 'toString() base out of range: {b}'
         */
        P.toString = function (b) {
            var str,
                n = this,
                s = n.s,
                e = n.e;

            // Infinity or NaN?
            if ( e === null ) {

                if (s) {
                    str = 'Infinity';
                    if ( s < 0 ) str = '-' + str;
                } else {
                    str = 'NaN';
                }
            } else {
                str = coeffToString( n.c );

                if ( b == null || !isValidInt( b, 2, 64, 25, 'base' ) ) {
                    str = e <= TO_EXP_NEG || e >= TO_EXP_POS
                      ? toExponential( str, e )
                      : toFixedPoint( str, e );
                } else {
                    str = convertBase( toFixedPoint( str, e ), b | 0, 10, s );
                }

                if ( s < 0 && n.c[0] ) str = '-' + str;
            }

            return str;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber truncated to a whole
         * number.
         */
        P.truncated = P.trunc = function () {
            return round( new BigNumber(this), this.e + 1, 1 );
        };


        /*
         * Return as toString, but do not accept a base argument, and include the minus sign for
         * negative zero.
         */
        P.valueOf = P.toJSON = function () {
            var str,
                n = this,
                e = n.e;

            if ( e === null ) return n.toString();

            str = coeffToString( n.c );

            str = e <= TO_EXP_NEG || e >= TO_EXP_POS
                ? toExponential( str, e )
                : toFixedPoint( str, e );

            return n.s < 0 ? '-' + str : str;
        };


        P.isBigNumber = true;

        if ( config != null ) BigNumber.config(config);

        return BigNumber;
    }


    // PRIVATE HELPER FUNCTIONS


    function bitFloor(n) {
        var i = n | 0;
        return n > 0 || n === i ? i : i - 1;
    }


    // Return a coefficient array as a string of base 10 digits.
    function coeffToString(a) {
        var s, z,
            i = 1,
            j = a.length,
            r = a[0] + '';

        for ( ; i < j; ) {
            s = a[i++] + '';
            z = LOG_BASE - s.length;
            for ( ; z--; s = '0' + s );
            r += s;
        }

        // Determine trailing zeros.
        for ( j = r.length; r.charCodeAt(--j) === 48; );
        return r.slice( 0, j + 1 || 1 );
    }


    // Compare the value of BigNumbers x and y.
    function compare( x, y ) {
        var a, b,
            xc = x.c,
            yc = y.c,
            i = x.s,
            j = y.s,
            k = x.e,
            l = y.e;

        // Either NaN?
        if ( !i || !j ) return null;

        a = xc && !xc[0];
        b = yc && !yc[0];

        // Either zero?
        if ( a || b ) return a ? b ? 0 : -j : i;

        // Signs differ?
        if ( i != j ) return i;

        a = i < 0;
        b = k == l;

        // Either Infinity?
        if ( !xc || !yc ) return b ? 0 : !xc ^ a ? 1 : -1;

        // Compare exponents.
        if ( !b ) return k > l ^ a ? 1 : -1;

        j = ( k = xc.length ) < ( l = yc.length ) ? k : l;

        // Compare digit by digit.
        for ( i = 0; i < j; i++ ) if ( xc[i] != yc[i] ) return xc[i] > yc[i] ^ a ? 1 : -1;

        // Compare lengths.
        return k == l ? 0 : k > l ^ a ? 1 : -1;
    }


    /*
     * Return true if n is a valid number in range, otherwise false.
     * Use for argument validation when ERRORS is false.
     * Note: parseInt('1e+1') == 1 but parseFloat('1e+1') == 10.
     */
    function intValidatorNoErrors( n, min, max ) {
        return ( n = truncate(n) ) >= min && n <= max;
    }


    function isArray(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    }


    /*
     * Convert string of baseIn to an array of numbers of baseOut.
     * Eg. convertBase('255', 10, 16) returns [15, 15].
     * Eg. convertBase('ff', 16, 10) returns [2, 5, 5].
     */
    function toBaseOut( str, baseIn, baseOut ) {
        var j,
            arr = [0],
            arrL,
            i = 0,
            len = str.length;

        for ( ; i < len; ) {
            for ( arrL = arr.length; arrL--; arr[arrL] *= baseIn );
            arr[ j = 0 ] += ALPHABET.indexOf( str.charAt( i++ ) );

            for ( ; j < arr.length; j++ ) {

                if ( arr[j] > baseOut - 1 ) {
                    if ( arr[j + 1] == null ) arr[j + 1] = 0;
                    arr[j + 1] += arr[j] / baseOut | 0;
                    arr[j] %= baseOut;
                }
            }
        }

        return arr.reverse();
    }


    function toExponential( str, e ) {
        return ( str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str ) +
          ( e < 0 ? 'e' : 'e+' ) + e;
    }


    function toFixedPoint( str, e ) {
        var len, z;

        // Negative exponent?
        if ( e < 0 ) {

            // Prepend zeros.
            for ( z = '0.'; ++e; z += '0' );
            str = z + str;

        // Positive exponent
        } else {
            len = str.length;

            // Append zeros.
            if ( ++e > len ) {
                for ( z = '0', e -= len; --e; z += '0' );
                str += z;
            } else if ( e < len ) {
                str = str.slice( 0, e ) + '.' + str.slice(e);
            }
        }

        return str;
    }


    function truncate(n) {
        n = parseFloat(n);
        return n < 0 ? mathceil(n) : mathfloor(n);
    }


    // EXPORT


    BigNumber = constructorFactory();
    BigNumber['default'] = BigNumber.BigNumber = BigNumber;


    // AMD.
    if ( typeof define == 'function' && define.amd ) {
        define( function () { return BigNumber; } );

    // Node.js and other environments that support module.exports.
    } else if ( typeof module != 'undefined' && module.exports ) {
        module.exports = BigNumber;

    // Browser.
    } else {
        if ( !globalObj ) globalObj = typeof self != 'undefined' ? self : Function('return this')();
        globalObj.BigNumber = BigNumber;
    }
})(this);

},{}],2:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

module.exports = {
    languageTag: "en-US",
    delimiters: {
        thousands: ",",
        decimal: "."
    },
    abbreviations: {
        thousand: "k",
        million: "m",
        billion: "b",
        trillion: "t"
    },
    spaceSeparated: false,
    ordinal: function ordinal(number) {
        var b = number % 10;
        return ~~(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
    },
    currency: {
        symbol: "$",
        position: "prefix",
        code: "USD"
    },
    currencyFormat: {
        thousandSeparated: true,
        totalLength: 4,
        spaceSeparated: true
    },
    formats: {
        fourDigits: {
            totalLength: 4,
            spaceSeparated: true
        },
        fullWithTwoDecimals: {
            output: "currency",
            thousandSeparated: true,
            mantissa: 2
        },
        fullWithTwoDecimalsNoCurrency: {
            thousandSeparated: true,
            mantissa: 2
        },
        fullWithNoDecimals: {
            output: "currency",
            thousandSeparated: true,
            mantissa: 0
        }
    }
};

},{}],3:[function(require,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var globalState = require("./globalState");
var validating = require("./validating");
var parsing = require("./parsing");

var binarySuffixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
var decimalSuffixes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
var bytes = {
    general: { scale: 1024, suffixes: decimalSuffixes, marker: "bd" },
    binary: { scale: 1024, suffixes: binarySuffixes, marker: "b" },
    decimal: { scale: 1000, suffixes: decimalSuffixes, marker: "d" }
};

var defaultOptions = {
    totalLength: 0,
    characteristic: 0,
    forceAverage: false,
    average: false,
    mantissa: -1,
    optionalMantissa: true,
    thousandSeparated: false,
    spaceSeparated: false,
    negative: "sign",
    forceSign: false
};

/**
 * Entry point. Format the provided INSTANCE according to the PROVIDEDFORMAT.
 * This method ensure the prefix and postfix are added as the last step.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {NumbroFormat|string} [providedFormat] - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */
function _format(instance) {
    var providedFormat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var numbro = arguments[2];

    if (typeof providedFormat === "string") {
        providedFormat = parsing.parseFormat(providedFormat);
    }

    var valid = validating.validateFormat(providedFormat);

    if (!valid) {
        return "ERROR: invalid format";
    }

    var prefix = providedFormat.prefix || "";
    var postfix = providedFormat.postfix || "";

    var output = formatNumbro(instance, providedFormat, numbro);
    output = insertPrefix(output, prefix);
    output = insertPostfix(output, postfix);
    return output;
}

/**
 * Format the provided INSTANCE according to the PROVIDEDFORMAT.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */
function formatNumbro(instance, providedFormat, numbro) {
    switch (providedFormat.output) {
        case "currency":
            {
                providedFormat = formatOrDefault(providedFormat, globalState.currentCurrencyDefaultFormat());
                return formatCurrency(instance, providedFormat, globalState, numbro);
            }
        case "percent":
            {
                providedFormat = formatOrDefault(providedFormat, globalState.currentPercentageDefaultFormat());
                return formatPercentage(instance, providedFormat, globalState, numbro);
            }
        case "byte":
            providedFormat = formatOrDefault(providedFormat, globalState.currentByteDefaultFormat());
            return formatByte(instance, providedFormat, globalState, numbro);
        case "time":
            providedFormat = formatOrDefault(providedFormat, globalState.currentTimeDefaultFormat());
            return formatTime(instance, providedFormat, globalState, numbro);
        case "ordinal":
            providedFormat = formatOrDefault(providedFormat, globalState.currentOrdinalDefaultFormat());
            return formatOrdinal(instance, providedFormat, globalState, numbro);
        case "number":
        default:
            return formatNumber({
                instance: instance,
                providedFormat: providedFormat,
                numbro: numbro
            });
    }
}

/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1000).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */
function _getDecimalByteUnit(instance) {
    var data = bytes.decimal;
    return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}

/**
 * Get the binary byte unit (MiB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */
function _getBinaryByteUnit(instance) {
    var data = bytes.binary;
    return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}

/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */
function _getByteUnit(instance) {
    var data = bytes.general;
    return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}

/**
 * Return the value and the suffix computed in byte.
 * It uses the SUFFIXES and the SCALE provided.
 *
 * @param {number} value - Number to format
 * @param {[String]} suffixes - List of suffixes
 * @param {number} scale - Number in-between two units
 * @return {{value: Number, suffix: String}}
 */
function getFormatByteUnits(value, suffixes, scale) {
    var suffix = suffixes[0];
    var abs = Math.abs(value);

    if (abs >= scale) {
        for (var power = 1; power < suffixes.length; ++power) {
            var min = Math.pow(scale, power);
            var max = Math.pow(scale, power + 1);

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

/**
 * Format the provided INSTANCE as bytes using the PROVIDEDFORMAT, and STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */
function formatByte(instance, providedFormat, state, numbro) {
    var base = providedFormat.base || "binary";
    var baseInfo = bytes[base];

    var _getFormatByteUnits = getFormatByteUnits(instance._value, baseInfo.suffixes, baseInfo.scale),
        value = _getFormatByteUnits.value,
        suffix = _getFormatByteUnits.suffix;

    var output = formatNumber({
        instance: numbro(value),
        providedFormat: providedFormat,
        state: state,
        defaults: state.currentByteDefaultFormat()
    });
    var abbreviations = state.currentAbbreviations();
    return "" + output + (abbreviations.spaced ? " " : "") + suffix;
}

/**
 * Format the provided INSTANCE as an ordinal using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */
function formatOrdinal(instance, providedFormat, state) {
    var ordinalFn = state.currentOrdinal();
    var options = Object.assign({}, defaultOptions, providedFormat);

    var output = formatNumber({
        instance: instance,
        providedFormat: providedFormat,
        state: state
    });
    var ordinal = ordinalFn(instance._value);

    return "" + output + (options.spaceSeparated ? " " : "") + ordinal;
}

/**
 * Format the provided INSTANCE as a time HH:MM:SS.
 *
 * @param {Numbro} instance - numbro instance to format
 * @return {string}
 */
function formatTime(instance) {
    var hours = Math.floor(instance._value / 60 / 60);
    var minutes = Math.floor((instance._value - hours * 60 * 60) / 60);
    var seconds = Math.round(instance._value - hours * 60 * 60 - minutes * 60);
    return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */
function formatPercentage(instance, providedFormat, state, numbro) {
    var prefixSymbol = providedFormat.prefixSymbol;

    var output = formatNumber({
        instance: numbro(instance._value * 100),
        providedFormat: providedFormat,
        state: state
    });
    var options = Object.assign({}, defaultOptions, providedFormat);

    if (prefixSymbol) {
        return "%" + (options.spaceSeparated ? " " : "") + output;
    }

    return "" + output + (options.spaceSeparated ? " " : "") + "%";
}

/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */
function formatCurrency(instance, providedFormat, state) {
    var currentCurrency = state.currentCurrency();
    var options = Object.assign({}, defaultOptions, providedFormat);
    var decimalSeparator = undefined;
    var space = "";
    var average = !!options.totalLength || !!options.forceAverage || options.average;
    var position = providedFormat.currencyPosition || currentCurrency.position;
    var symbol = providedFormat.currencySymbol || currentCurrency.symbol;

    if (options.spaceSeparated) {
        space = " ";
    }

    if (position === "infix") {
        decimalSeparator = space + symbol + space;
    }

    var output = formatNumber({
        instance: instance,
        providedFormat: providedFormat,
        state: state,
        decimalSeparator: decimalSeparator
    });

    if (position === "prefix") {
        if (instance._value < 0 && options.negative === "sign") {
            output = "-" + space + symbol + output.slice(1);
        } else {
            output = symbol + space + output;
        }
    }

    if (!position || position === "postfix") {
        space = average ? "" : space;
        output = output + space + symbol;
    }

    return output;
}

/**
 * Compute the average value out of VALUE.
 * The other parameters are computation options.
 *
 * @param {number} value - value to compute
 * @param {string} [forceAverage] - forced unit used to compute
 * @param {{}} abbreviations - part of the language specification
 * @param {boolean} spaceSeparated - `true` if a space must be inserted between the value and the abbreviation
 * @param {number} [totalLength] - total length of the output including the characteristic and the mantissa
 * @return {{value: number, abbreviation: string, mantissaPrecision: number}}
 */
function computeAverage(_ref) {
    var value = _ref.value,
        forceAverage = _ref.forceAverage,
        abbreviations = _ref.abbreviations,
        _ref$spaceSeparated = _ref.spaceSeparated,
        spaceSeparated = _ref$spaceSeparated === undefined ? false : _ref$spaceSeparated,
        _ref$totalLength = _ref.totalLength,
        totalLength = _ref$totalLength === undefined ? 0 : _ref$totalLength;

    var abbreviation = "";
    var abs = Math.abs(value);
    var mantissaPrecision = -1;

    if (abs >= Math.pow(10, 12) && !forceAverage || forceAverage === "trillion") {
        // trillion
        abbreviation = abbreviations.trillion;
        value = value / Math.pow(10, 12);
    } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !forceAverage || forceAverage === "billion") {
        // billion
        abbreviation = abbreviations.billion;
        value = value / Math.pow(10, 9);
    } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !forceAverage || forceAverage === "million") {
        // million
        abbreviation = abbreviations.million;
        value = value / Math.pow(10, 6);
    } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !forceAverage || forceAverage === "thousand") {
        // thousand
        abbreviation = abbreviations.thousand;
        value = value / Math.pow(10, 3);
    }

    var optionalSpace = spaceSeparated ? " " : "";

    if (abbreviation) {
        abbreviation = optionalSpace + abbreviation;
    }

    if (totalLength) {
        var characteristic = value.toString().split(".")[0];
        mantissaPrecision = Math.max(totalLength - characteristic.length, 0);
    }

    return { value: value, abbreviation: abbreviation, mantissaPrecision: mantissaPrecision };
}

/**
 * Compute an exponential form for VALUE, taking into account CHARACTERISTIC
 * if provided.
 * @param {number} value - value to compute
 * @param {number} [characteristicPrecision] - optional characteristic length
 * @return {{value: number, abbreviation: string}}
 */
function computeExponential(_ref2) {
    var value = _ref2.value,
        _ref2$characteristicP = _ref2.characteristicPrecision,
        characteristicPrecision = _ref2$characteristicP === undefined ? 0 : _ref2$characteristicP;

    var _value$toExponential$ = value.toExponential().split("e"),
        _value$toExponential$2 = _slicedToArray(_value$toExponential$, 2),
        numberString = _value$toExponential$2[0],
        exponential = _value$toExponential$2[1];

    var number = +numberString;

    if (!characteristicPrecision) {
        return {
            value: number,
            abbreviation: "e" + exponential
        };
    }

    var characteristicLength = 1; // see `toExponential`

    if (characteristicLength < characteristicPrecision) {
        number = number * Math.pow(10, characteristicPrecision - characteristicLength);
        exponential = +exponential - (characteristicPrecision - characteristicLength);
        exponential = exponential >= 0 ? "+" + exponential : exponential;
    }

    return {
        value: number,
        abbreviation: "e" + exponential
    };
}

/**
 * Return a string of NUMBER zero.
 *
 * @param {number} number - Length of the output
 * @return {string}
 */
function zeroes(number) {
    var result = "";
    for (var i = 0; i < number; i++) {
        result += "0";
    }

    return result;
}

/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 * This method is for large/small numbers only (a.k.a. including a "e").
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @return {string}
 */
function toFixedLarge(value, precision) {
    var result = value.toString();

    var _result$split = result.split("e"),
        _result$split2 = _slicedToArray(_result$split, 2),
        base = _result$split2[0],
        exp = _result$split2[1];

    var _base$split = base.split("."),
        _base$split2 = _slicedToArray(_base$split, 2),
        characteristic = _base$split2[0],
        _base$split2$ = _base$split2[1],
        mantissa = _base$split2$ === undefined ? "" : _base$split2$;

    if (+exp > 0) {
        result = characteristic + mantissa + zeroes(exp - mantissa.length);
    } else {
        var prefix = ".";

        if (+characteristic < 0) {
            prefix = "-0" + prefix;
        } else {
            prefix = "0" + prefix;
        }

        var suffix = (zeroes(-exp - 1) + Math.abs(characteristic) + mantissa).substr(0, precision);
        if (suffix.length < precision) {
            suffix += zeroes(precision - suffix.length);
        }
        result = prefix + suffix;
    }

    if (+exp > 0 && precision > 0) {
        result += "." + zeroes(precision);
    }

    return result;
}

/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @return {string}
 */
function toFixed(value, precision) {
    if (value.toString().indexOf("e") !== -1) {
        return toFixedLarge(value, precision);
    }

    return (Math.round(+(value + "e+" + precision)) / Math.pow(10, precision)).toFixed(precision);
}

/**
 * Return the current OUTPUT with a mantissa precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalMantissa - `true` if the mantissa is omitted when it's only zeroes
 * @param {number} precision - desired precision of the mantissa
 * @param {boolean} trim - desired precision of the mantissa
 * @return {string}
 */
function setMantissaPrecision(output, value, optionalMantissa, precision, trim) {
    if (precision === -1) {
        return output;
    }

    var result = toFixed(value, precision);

    var _result$toString$spli = result.toString().split("."),
        _result$toString$spli2 = _slicedToArray(_result$toString$spli, 2),
        currentCharacteristic = _result$toString$spli2[0],
        _result$toString$spli3 = _result$toString$spli2[1],
        currentMantissa = _result$toString$spli3 === undefined ? "" : _result$toString$spli3;

    if (currentMantissa.match(/^0+$/) && (optionalMantissa || trim)) {
        return currentCharacteristic;
    }

    var hasLeadingZeroes = result.match(/0+$/);
    if (trim && hasLeadingZeroes) {
        return result.toString().slice(0, hasLeadingZeroes.index);
    }

    return result.toString();
}

/**
 * Return the current OUTPUT with a characteristic precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalCharacteristic - `true` if the characteristic is omitted when it's only zeroes
 * @param {number} precision - desired precision of the characteristic
 * @return {string}
 */
function setCharacteristicPrecision(output, value, optionalCharacteristic, precision) {
    var result = output;

    var _result$toString$spli4 = result.toString().split("."),
        _result$toString$spli5 = _slicedToArray(_result$toString$spli4, 2),
        currentCharacteristic = _result$toString$spli5[0],
        currentMantissa = _result$toString$spli5[1];

    if (currentCharacteristic.match(/^-?0$/) && optionalCharacteristic) {
        if (!currentMantissa) {
            return currentCharacteristic.replace("0", "");
        }

        return currentCharacteristic.replace("0", "") + "." + currentMantissa;
    }

    if (currentCharacteristic.length < precision) {
        var missingZeros = precision - currentCharacteristic.length;
        for (var i = 0; i < missingZeros; i++) {
            result = "0" + result;
        }
    }

    return result.toString();
}

/**
 * Return the indexes where are the group separations after splitting
 * `totalLength` in group of `groupSize` size.
 * Important: we start grouping from the right hand side.
 *
 * @param {number} totalLength - total length of the characteristic to split
 * @param {number} groupSize - length of each group
 * @return {[number]}
 */
function indexesOfGroupSpaces(totalLength, groupSize) {
    var result = [];
    var counter = 0;
    for (var i = totalLength; i > 0; i--) {
        if (counter === groupSize) {
            result.unshift(i);
            counter = 0;
        }
        counter++;
    }

    return result;
}

/**
 * Replace the decimal separator with DECIMALSEPARATOR and insert thousand
 * separators.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} thousandSeparated - `true` if the characteristic must be separated
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @return {string}
 */
function replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator) {
    var delimiters = state.currentDelimiters();
    var thousandSeparator = delimiters.thousands;
    decimalSeparator = decimalSeparator || delimiters.decimal;
    var thousandsSize = delimiters.thousandsSize || 3;

    var result = output.toString();
    var characteristic = result.split(".")[0];
    var mantissa = result.split(".")[1];

    if (thousandSeparated) {
        if (value < 0) {
            // Remove the minus sign
            characteristic = characteristic.slice(1);
        }

        var indexesToInsertThousandDelimiters = indexesOfGroupSpaces(characteristic.length, thousandsSize);
        indexesToInsertThousandDelimiters.forEach(function (position, index) {
            characteristic = characteristic.slice(0, position + index) + thousandSeparator + characteristic.slice(position + index);
        });

        if (value < 0) {
            // Add back the minus sign
            characteristic = "-" + characteristic;
        }
    }

    if (!mantissa) {
        result = characteristic;
    } else {
        result = characteristic + decimalSeparator + mantissa;
    }
    return result;
}

/**
 * Insert the provided ABBREVIATION at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} abbreviation - abbreviation to append
 * @return {*}
 */
function insertAbbreviation(output, abbreviation) {
    return output + abbreviation;
}

/**
 * Insert the positive/negative sign according to the NEGATIVE flag.
 * If the value is negative but still output as 0, the negative sign is removed.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {string} negative - flag for the negative form ("sign" or "parenthesis")
 * @return {*}
 */
function insertSign(output, value, negative) {
    if (value === 0) {
        return output;
    }

    if (+output === 0) {
        return output.replace("-", "");
    }

    if (value > 0) {
        return "+" + output;
    }

    if (negative === "sign") {
        return output;
    }

    return "(" + output.replace("-", "") + ")";
}

/**
 * Insert the provided PREFIX at the start of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} prefix - abbreviation to prepend
 * @return {*}
 */
function insertPrefix(output, prefix) {
    return prefix + output;
}

/**
 * Insert the provided POSTFIX at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} postfix - abbreviation to append
 * @return {*}
 */
function insertPostfix(output, postfix) {
    return output + postfix;
}

/**
 * Format the provided INSTANCE as a number using the PROVIDEDFORMAT,
 * and the STATE.
 * This is the key method of the framework!
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} [providedFormat] - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @param {{}} defaults - Set of default values used for formatting
 * @return {string}
 */
function formatNumber(_ref3) {
    var instance = _ref3.instance,
        providedFormat = _ref3.providedFormat,
        _ref3$state = _ref3.state,
        state = _ref3$state === undefined ? globalState : _ref3$state,
        decimalSeparator = _ref3.decimalSeparator,
        _ref3$defaults = _ref3.defaults,
        defaults = _ref3$defaults === undefined ? state.currentDefaults() : _ref3$defaults;

    var value = instance._value;

    if (value === 0 && state.hasZeroFormat()) {
        return state.getZeroFormat();
    }

    if (!isFinite(value)) {
        return value.toString();
    }

    var options = Object.assign({}, defaultOptions, defaults, providedFormat);

    var totalLength = options.totalLength;
    var characteristicPrecision = totalLength ? 0 : options.characteristic;
    var optionalCharacteristic = options.optionalCharacteristic;
    var forceAverage = options.forceAverage;
    var average = !!totalLength || !!forceAverage || options.average;

    // default when averaging is to chop off decimals
    var mantissaPrecision = totalLength ? -1 : average && providedFormat.mantissa === undefined ? 0 : options.mantissa;
    var optionalMantissa = totalLength ? false : providedFormat.optionalMantissa === undefined ? mantissaPrecision === -1 : options.optionalMantissa;
    var trimMantissa = options.trimMantissa;
    var thousandSeparated = options.thousandSeparated;
    var spaceSeparated = options.spaceSeparated;
    var negative = options.negative;
    var forceSign = options.forceSign;
    var exponential = options.exponential;

    var abbreviation = "";

    if (average) {
        var data = computeAverage({
            value: value,
            forceAverage: forceAverage,
            abbreviations: state.currentAbbreviations(),
            spaceSeparated: spaceSeparated,
            totalLength: totalLength
        });

        value = data.value;
        abbreviation += data.abbreviation;

        if (totalLength) {
            mantissaPrecision = data.mantissaPrecision;
        }
    }

    if (exponential) {
        var _data = computeExponential({
            value: value,
            characteristicPrecision: characteristicPrecision
        });

        value = _data.value;
        abbreviation = _data.abbreviation + abbreviation;
    }

    var output = setMantissaPrecision(value.toString(), value, optionalMantissa, mantissaPrecision, trimMantissa);
    output = setCharacteristicPrecision(output, value, optionalCharacteristic, characteristicPrecision);
    output = replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator);

    if (average || exponential) {
        output = insertAbbreviation(output, abbreviation);
    }

    if (forceSign || value < 0) {
        output = insertSign(output, value, negative);
    }

    return output;
}

/**
 * If FORMAT is non-null and not just an output, return FORMAT.
 * Return DEFAULTFORMAT otherwise.
 *
 * @param providedFormat
 * @param defaultFormat
 */
function formatOrDefault(providedFormat, defaultFormat) {
    if (!providedFormat) {
        return defaultFormat;
    }

    var keys = Object.keys(providedFormat);
    if (keys.length === 1 && keys[0] === "output") {
        return defaultFormat;
    }

    return providedFormat;
}

module.exports = function (numbro) {
    return {
        format: function format() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return _format.apply(undefined, args.concat([numbro]));
        },
        getByteUnit: function getByteUnit() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            return _getByteUnit.apply(undefined, args.concat([numbro]));
        },
        getBinaryByteUnit: function getBinaryByteUnit() {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            return _getBinaryByteUnit.apply(undefined, args.concat([numbro]));
        },
        getDecimalByteUnit: function getDecimalByteUnit() {
            for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                args[_key4] = arguments[_key4];
            }

            return _getDecimalByteUnit.apply(undefined, args.concat([numbro]));
        },
        formatOrDefault: formatOrDefault
    };
};

},{"./globalState":4,"./parsing":8,"./validating":10}],4:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var enUS = require("./en-US");
var validating = require("./validating");
var parsing = require("./parsing");

var state = {};

var currentLanguageTag = undefined;
var languages = {};

var zeroFormat = null;

var globalDefaults = {};

function chooseLanguage(tag) {
  currentLanguageTag = tag;
}

function currentLanguageData() {
  return languages[currentLanguageTag];
}

/**
 * Return all the register languages
 *
 * @return {{}}
 */
state.languages = function () {
  return Object.assign({}, languages);
};

//
// Current language accessors
//

/**
 * Return the current language tag
 *
 * @return {string}
 */
state.currentLanguage = function () {
  return currentLanguageTag;
};

/**
 * Return the current language currency data
 *
 * @return {{}}
 */
state.currentCurrency = function () {
  return currentLanguageData().currency;
};

/**
 * Return the current language abbreviations data
 *
 * @return {{}}
 */
state.currentAbbreviations = function () {
  return currentLanguageData().abbreviations;
};

/**
 * Return the current language delimiters data
 *
 * @return {{}}
 */
state.currentDelimiters = function () {
  return currentLanguageData().delimiters;
};

/**
 * Return the current language ordinal function
 *
 * @return {function}
 */
state.currentOrdinal = function () {
  return currentLanguageData().ordinal;
};

//
// Defaults
//

/**
 * Return the current formatting defaults.
 * Use first uses the current language default, then fallback to the globally defined defaults.
 *
 * @return {{}}
 */
state.currentDefaults = function () {
  return Object.assign({}, currentLanguageData().defaults, globalDefaults);
};

/**
 * Return the ordinal default-format.
 * Use first uses the current language ordinal default, then fallback to the regular defaults.
 *
 * @return {{}}
 */
state.currentOrdinalDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().ordinalFormat);
};

/**
 * Return the byte default-format.
 * Use first uses the current language byte default, then fallback to the regular defaults.
 *
 * @return {{}}
 */
state.currentByteDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().byteFormat);
};

/**
 * Return the percentage default-format.
 * Use first uses the current language percentage default, then fallback to the regular defaults.
 *
 * @return {{}}
 */
state.currentPercentageDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().percentageFormat);
};

/**
 * Return the currency default-format.
 * Use first uses the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */
state.currentCurrencyDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().currencyFormat);
};

/**
 * Return the time default-format.
 * Use first uses the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */
state.currentTimeDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().timeFormat);
};

/**
 * Set the global formatting defaults.
 *
 * @param {{}|string} format - formatting options to use as defaults
 */
state.setDefaults = function (format) {
  format = parsing.parseFormat(format);
  if (validating.validateFormat(format)) {
    globalDefaults = format;
  }
};

//
// Zero format
//

/**
 * Return the format string for 0.
 *
 * @return {string}
 */
state.getZeroFormat = function () {
  return zeroFormat;
};

/**
 * Set a STRING to output when the value is 0.
 *
 * @param {{}|string} string - string to set
 */
state.setZeroFormat = function (string) {
  return zeroFormat = typeof string === "string" ? string : null;
};

/**
 * Return true if a format for 0 has been set already.
 *
 * @return {boolean}
 */
state.hasZeroFormat = function () {
  return zeroFormat !== null;
};

//
// Getters/Setters
//

/**
 * Return the language data for the provided TAG.
 * Return the current language data if no tag is provided.
 *
 * Throw an error if the tag doesn't match any registered language.
 *
 * @param {string} [tag] - language tag of a registered language
 * @return {{}}
 */
state.languageData = function (tag) {
  if (tag) {
    if (languages[tag]) {
      return languages[tag];
    }
    throw new Error("Unknown tag \"" + tag + "\"");
  }

  return currentLanguageData();
};

/**
 * Register the provided DATA as a language if and only if the data is valid.
 * If the data is not valid, an error is thrown.
 *
 * When USELANGUAGE is true, the registered language is then used.
 *
 * @param {{}} data - language data to register
 * @param {boolean} [useLanguage] - `true` if the provided data should become the current language
 */
state.registerLanguage = function (data) {
  var useLanguage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!validating.validateLanguage(data)) {
    throw new Error("Invalid language data");
  }

  languages[data.languageTag] = data;

  if (useLanguage) {
    chooseLanguage(data.languageTag);
  }
};

/**
 * Set the current language according to TAG.
 * If TAG doesn't match a registered language, another language matching
 * the "language" part of the tag (according to BCP47: https://tools.ietf.org/rfc/bcp/bcp47.txt).
 * If none, the FALLBACKTAG is used. If the FALLBACKTAG doesn't match a register language,
 * `en-US` is finally used.
 *
 * @param tag
 * @param fallbackTag
 */
state.setLanguage = function (tag) {
  var fallbackTag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : enUS.languageTag;

  if (!languages[tag]) {
    var suffix = tag.split("-")[0];

    var matchingLanguageTag = Object.keys(languages).find(function (each) {
      return each.split("-")[0] === suffix;
    });

    if (!languages[matchingLanguageTag]) {
      chooseLanguage(fallbackTag);
      return;
    }

    chooseLanguage(matchingLanguageTag);
  }

  chooseLanguage(tag);
};

state.registerLanguage(enUS);
currentLanguageTag = enUS.languageTag;

module.exports = state;

},{"./en-US":2,"./parsing":8,"./validating":10}],5:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Load languages matching TAGS. Silently pass over the failing load.
 *
 * We assume here that we are in a node environment, so we don't check for it.
 * @param {[String]} tags - list of tags to load
 * @param {Numbro} numbro - the numbro singleton
 */
function _loadLanguagesInNode(tags, numbro) {
    tags.forEach(function (tag) {
        var data = undefined;
        try {
            data = require("../languages/" + tag);
        } catch (e) {
            console.error("Unable to load \"" + tag + "\". No matching language file found."); // eslint-disable-line no-console
        }

        if (data) {
            numbro.registerLanguage(data);
        }
    });
}

module.exports = function (numbro) {
    return {
        loadLanguagesInNode: function loadLanguagesInNode(tags) {
            return _loadLanguagesInNode(tags, numbro);
        }
    };
};

},{}],6:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var BigNumber = require("bignumber.js");

/**
 * Add a number or a numbro to N.
 *
 * @param {Numbro} n - augend
 * @param {number|Numbro} other - addend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */
function _add(n, other, numbro) {
    var value = new BigNumber(n._value);
    var otherValue = other;

    if (numbro.isNumbro(other)) {
        otherValue = other._value;
    }

    otherValue = new BigNumber(otherValue);

    n._value = value.add(otherValue).toNumber();
    return n;
}

/**
 * Subtract a number or a numbro from N.
 *
 * @param {Numbro} n - minuend
 * @param {number|Numbro} other - subtrahend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */
function _subtract(n, other, numbro) {
    var value = new BigNumber(n._value);
    var otherValue = other;

    if (numbro.isNumbro(other)) {
        otherValue = other._value;
    }

    otherValue = new BigNumber(otherValue);

    n._value = value.minus(otherValue).toNumber();
    return n;
}

/**
 * Multiply N by a number or a numbro.
 *
 * @param {Numbro} n - multiplicand
 * @param {number|Numbro} other - multiplier
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */
function _multiply(n, other, numbro) {
    var value = new BigNumber(n._value);
    var otherValue = other;

    if (numbro.isNumbro(other)) {
        otherValue = other._value;
    }

    otherValue = new BigNumber(otherValue);

    n._value = value.times(otherValue).toNumber();
    return n;
}

/**
 * Divide N by a number or a numbro.
 *
 * @param {Numbro} n - dividend
 * @param {number|Numbro} other - divisor
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */
function _divide(n, other, numbro) {
    var value = new BigNumber(n._value);
    var otherValue = other;

    if (numbro.isNumbro(other)) {
        otherValue = other._value;
    }

    otherValue = new BigNumber(otherValue);

    n._value = value.dividedBy(otherValue).toNumber();
    return n;
}

/**
 * Set N to the OTHER (or the value of OTHER when it's a numbro instance).
 *
 * @param {Numbro} n - numbro instance to mutate
 * @param {number|Numbro} other - new value to assign to N
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */
function _set(n, other, numbro) {
    var value = other;

    if (numbro.isNumbro(other)) {
        value = other._value;
    }

    n._value = value;
    return n;
}

/**
 * Return the distance between N and OTHER.
 *
 * @param {Numbro} n
 * @param {number|Numbro} other
 * @param {numbro} numbro - numbro singleton
 * @return {number}
 */
function _difference(n, other, numbro) {
    var clone = numbro(n._value);
    _subtract(clone, other, numbro);

    return Math.abs(clone._value);
}

module.exports = function (numbro) {
    return {
        add: function add(n, other) {
            return _add(n, other, numbro);
        },
        subtract: function subtract(n, other) {
            return _subtract(n, other, numbro);
        },
        multiply: function multiply(n, other) {
            return _multiply(n, other, numbro);
        },
        divide: function divide(n, other) {
            return _divide(n, other, numbro);
        },
        set: function set(n, other) {
            return _set(n, other, numbro);
        },
        difference: function difference(n, other) {
            return _difference(n, other, numbro);
        }
    };
};

},{"bignumber.js":1}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var VERSION = "2.1.0";

var globalState = require("./globalState");
var validator = require("./validating");
var loader = require("./loading")(numbro);
var unformatter = require("./unformatting");
var formatter = require("./formatting")(numbro);
var manipulate = require("./manipulating")(numbro);
var parsing = require("./parsing");

var Numbro = function () {
    function Numbro(number) {
        _classCallCheck(this, Numbro);

        this._value = number;
    }

    _createClass(Numbro, [{
        key: "clone",
        value: function clone() {
            return numbro(this._value);
        }
    }, {
        key: "format",
        value: function format() {
            var _format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            return formatter.format(this, _format);
        }
    }, {
        key: "formatCurrency",
        value: function formatCurrency(format) {
            if (typeof format === "string") {
                format = parsing.parseFormat(format);
            }
            format = formatter.formatOrDefault(format, globalState.currentCurrencyDefaultFormat());
            format.output = "currency";
            return formatter.format(this, format);
        }
    }, {
        key: "formatTime",
        value: function formatTime() {
            var format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            format.output = "time";
            return formatter.format(this, format);
        }
    }, {
        key: "binaryByteUnits",
        value: function binaryByteUnits() {
            return formatter.getBinaryByteUnit(this);
        }
    }, {
        key: "decimalByteUnits",
        value: function decimalByteUnits() {
            return formatter.getDecimalByteUnit(this);
        }
    }, {
        key: "byteUnits",
        value: function byteUnits() {
            return formatter.getByteUnit(this);
        }
    }, {
        key: "difference",
        value: function difference(other) {
            return manipulate.difference(this, other);
        }
    }, {
        key: "add",
        value: function add(other) {
            return manipulate.add(this, other);
        }
    }, {
        key: "subtract",
        value: function subtract(other) {
            return manipulate.subtract(this, other);
        }
    }, {
        key: "multiply",
        value: function multiply(other) {
            return manipulate.multiply(this, other);
        }
    }, {
        key: "divide",
        value: function divide(other) {
            return manipulate.divide(this, other);
        }
    }, {
        key: "set",
        value: function set(input) {
            return manipulate.set(this, normalizeInput(input));
        }
    }, {
        key: "value",
        value: function value() {
            return this._value;
        }
    }, {
        key: "valueOf",
        value: function valueOf() {
            return this._value;
        }
    }]);

    return Numbro;
}();

/**
 * Make its best to convert input into a number.
 *
 * @param {numbro|string|number} input - Input to convert
 * @return {number}
 */


function normalizeInput(input) {
    var result = input;
    if (numbro.isNumbro(input)) {
        result = input._value;
    } else if (typeof input === "string") {
        result = numbro.unformat(input);
    } else if (isNaN(input)) {
        result = NaN;
    }

    return result;
}

function numbro(input) {
    return new Numbro(normalizeInput(input));
}

numbro.version = VERSION;

numbro.isNumbro = function (object) {
    return object instanceof Numbro;
};

//
// `numbro` static methods
//

numbro.language = globalState.currentLanguage;
numbro.registerLanguage = globalState.registerLanguage;
numbro.setLanguage = globalState.setLanguage;
numbro.languages = globalState.languages;
numbro.languageData = globalState.languageData;
numbro.zeroFormat = globalState.setZeroFormat;
numbro.defaultFormat = globalState.currentDefaults;
numbro.setDefaults = globalState.setDefaults;
numbro.defaultCurrencyFormat = globalState.currentCurrencyDefaultFormat;
numbro.validate = validator.validate;
numbro.loadLanguagesInNode = loader.loadLanguagesInNode;
numbro.unformat = unformatter.unformat;

module.exports = numbro;

},{"./formatting":3,"./globalState":4,"./loading":5,"./manipulating":6,"./parsing":8,"./unformatting":9,"./validating":10}],8:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Parse the format STRING looking for a prefix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parsePrefix(string, result) {
    var match = string.match(/^{([^}]*)}/);
    if (match) {
        result.prefix = match[1];
        return string.slice(match[0].length);
    }

    return string;
}

/**
 * Parse the format STRING looking for a postfix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parsePostfix(string, result) {
    var match = string.match(/{([^}]*)}$/);
    if (match) {
        result.postfix = match[1];

        return string.slice(0, -match[0].length);
    }

    return string;
}

/**
 * Parse the format STRING looking for the output value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */
function parseOutput(string, result) {
    if (string.indexOf("$") !== -1) {
        result.output = "currency";
        return;
    }

    if (string.indexOf("%") !== -1) {
        result.output = "percent";
        return;
    }

    if (string.indexOf("bd") !== -1) {
        result.output = "byte";
        result.base = "general";
        return;
    }

    if (string.indexOf("b") !== -1) {
        result.output = "byte";
        result.base = "binary";
        return;
    }

    if (string.indexOf("d") !== -1) {
        result.output = "byte";
        result.base = "decimal";
        return;
    }

    if (string.indexOf(":") !== -1) {
        result.output = "time";
        return;
    }

    if (string.indexOf("o") !== -1) {
        result.output = "ordinal";
    }
}

/**
 * Parse the format STRING looking for the thousand separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseThousandSeparated(string, result) {
    if (string.indexOf(",") !== -1) {
        result.thousandSeparated = true;
    }
}

/**
 * Parse the format STRING looking for the space separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseSpaceSeparated(string, result) {
    if (string.indexOf(" ") !== -1) {
        result.spaceSeparated = true;
    }
}

/**
 * Parse the format STRING looking for the total length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseTotalLength(string, result) {
    var match = string.match(/[1-9]+[0-9]*/);

    if (match) {
        result.totalLength = +match[0];
    }
}

/**
 * Parse the format STRING looking for the characteristic length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseCharacteristic(string, result) {
    var characteristic = string.split(".")[0];
    var match = characteristic.match(/0+/);
    if (match) {
        result.characteristic = match[0].length;
    }
}

/**
 * Parse the format STRING looking for the mantissa length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseMantissa(string, result) {
    var mantissa = string.split(".")[1];
    if (mantissa) {
        var match = mantissa.match(/0+/);
        if (match) {
            result.mantissa = match[0].length;
        }
    }
}

/**
 * Parse the format STRING looking for the average value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseAverage(string, result) {
    if (string.indexOf("a") !== -1) {
        result.average = true;
    }
}

/**
 * Parse the format STRING looking for a forced average precision. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseForceAverage(string, result) {
    if (string.indexOf("K") !== -1) {
        result.forceAverage = "thousand";
    } else if (string.indexOf("M") !== -1) {
        result.forceAverage = "million";
    } else if (string.indexOf("B") !== -1) {
        result.forceAverage = "billion";
    } else if (string.indexOf("T") !== -1) {
        result.forceAverage = "trillion";
    }
}

/**
 * Parse the format STRING finding if the mantissa is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseOptionalMantissa(string, result) {
    if (string.match(/\[\.]/)) {
        result.optionalMantissa = true;
    } else if (string.match(/\./)) {
        result.optionalMantissa = false;
    }
}

/**
 * Parse the format STRING finding if the characteristic is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseOptionalCharacteristic(string, result) {
    if (string.indexOf(".") !== -1) {
        var characteristic = string.split(".")[0];
        result.optionalCharacteristic = characteristic.indexOf("0") === -1;
    }
}

/**
 * Parse the format STRING looking for the negative format. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parseNegative(string, result) {
    if (string.match(/^\+?\([^)]*\)$/)) {
        result.negative = "parenthesis";
    }
    if (string.match(/^\+?-/)) {
        result.negative = "sign";
    }
}

/**
 * Parse the format STRING finding if the sign is mandatory. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */
function parseForceSign(string, result) {
    if (string.match(/^\+/)) {
        result.forceSign = true;
    }
}

/**
 * Parse the format STRING and accumulating the values ie RESULT.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {NumbroFormat} - format
 */
function parseFormat(string) {
    var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (typeof string !== "string") {
        return string;
    }

    string = parsePrefix(string, result);
    string = parsePostfix(string, result);
    parseOutput(string, result);
    parseTotalLength(string, result);
    parseCharacteristic(string, result);
    parseOptionalCharacteristic(string, result);
    parseAverage(string, result);
    parseForceAverage(string, result);
    parseMantissa(string, result);
    parseOptionalMantissa(string, result);
    parseThousandSeparated(string, result);
    parseSpaceSeparated(string, result);
    parseNegative(string, result);
    parseForceSign(string, result);

    return result;
}

module.exports = {
    parseFormat: parseFormat
};

},{}],9:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var allSuffixes = [{ key: "ZiB", factor: Math.pow(1024, 7) }, { key: "ZB", factor: Math.pow(1000, 7) }, { key: "YiB", factor: Math.pow(1024, 8) }, { key: "YB", factor: Math.pow(1000, 8) }, { key: "TiB", factor: Math.pow(1024, 4) }, { key: "TB", factor: Math.pow(1000, 4) }, { key: "PiB", factor: Math.pow(1024, 5) }, { key: "PB", factor: Math.pow(1000, 5) }, { key: "MiB", factor: Math.pow(1024, 2) }, { key: "MB", factor: Math.pow(1000, 2) }, { key: "KiB", factor: Math.pow(1024, 1) }, { key: "KB", factor: Math.pow(1000, 1) }, { key: "GiB", factor: Math.pow(1024, 3) }, { key: "GB", factor: Math.pow(1000, 3) }, { key: "EiB", factor: Math.pow(1024, 6) }, { key: "EB", factor: Math.pow(1000, 6) }, { key: "B", factor: 1 }];

/**
 * Generate a RegExp where S get all RegExp specific characters escaped.
 *
 * @param {string} s - string representing a RegExp
 * @return {string}
 */
function escapeRegExp(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
 * Recursively compute the unformatted value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */
function computeUnformattedValue(inputString, delimiters) {
    var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    var ordinal = arguments[3];
    var zeroFormat = arguments[4];
    var abbreviations = arguments[5];
    var format = arguments[6];

    if (!isNaN(+inputString)) {
        return +inputString;
    }

    var stripped = "";
    // Negative

    var newInput = inputString.replace(/(^[^(]*)\((.*)\)([^)]*$)/, "$1$2$3");

    if (newInput !== inputString) {
        return -1 * computeUnformattedValue(newInput, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }

    // Byte

    for (var i = 0; i < allSuffixes.length; i++) {
        var suffix = allSuffixes[i];
        stripped = inputString.replace(suffix.key, "");

        if (stripped !== inputString) {
            return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * suffix.factor;
        }
    }

    // Percent

    stripped = inputString.replace("%", "");

    if (stripped !== inputString) {
        return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) / 100;
    }

    // Ordinal

    var possibleOrdinalValue = parseFloat(inputString);

    if (isNaN(possibleOrdinalValue)) {
        return undefined;
    }

    var ordinalString = ordinal(possibleOrdinalValue);
    if (ordinalString && ordinalString !== ".") {
        // if ordinal is "." it will be caught next round in the +inputString
        stripped = inputString.replace(new RegExp(escapeRegExp(ordinalString) + "$"), "");

        if (stripped !== inputString) {
            return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
        }
    }

    // Average

    var inversedAbbreviations = {};
    Object.keys(abbreviations).forEach(function (key) {
        inversedAbbreviations[abbreviations[key]] = key;
    });

    var abbreviationValues = Object.keys(inversedAbbreviations).sort().reverse();
    var numberOfAbbreviations = abbreviationValues.length;

    for (var _i = 0; _i < numberOfAbbreviations; _i++) {
        var value = abbreviationValues[_i];
        var key = inversedAbbreviations[value];

        stripped = inputString.replace(value, "");
        if (stripped !== inputString) {
            var factor = undefined;
            switch (key) {// eslint-disable-line default-case
                case "thousand":
                    factor = Math.pow(10, 3);
                    break;
                case "million":
                    factor = Math.pow(10, 6);
                    break;
                case "billion":
                    factor = Math.pow(10, 9);
                    break;
                case "trillion":
                    factor = Math.pow(10, 12);
                    break;
            }
            return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * factor;
        }
    }

    return undefined;
}

/**
 * Removes in one pass all formatting symbols.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @return {string}
 */
function removeFormattingSymbols(inputString, delimiters) {
    var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";

    // Currency

    var stripped = inputString.replace(currencySymbol, "");

    // Thousand separators

    stripped = stripped.replace(new RegExp("([0-9])" + escapeRegExp(delimiters.thousands) + "([0-9])", "g"), "$1$2");

    // Decimal

    stripped = stripped.replace(delimiters.decimal, ".");

    return stripped;
}

/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */
function unformatValue(inputString, delimiters) {
    var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
    var ordinal = arguments[3];
    var zeroFormat = arguments[4];
    var abbreviations = arguments[5];
    var format = arguments[6];

    if (inputString === "") {
        return undefined;
    }

    if (!isNaN(+inputString)) {
        return +inputString;
    }

    // Zero Format

    if (inputString === zeroFormat) {
        return 0;
    }

    var value = removeFormattingSymbols(inputString, delimiters, currencySymbol);
    return computeUnformattedValue(value, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
}

/**
 * Check if the INPUTSTRING represents a time.
 *
 * @param {string} inputString - string to check
 * @param {*} delimiters - Delimiters used while generating the inputString
 * @return {boolean}
 */
function matchesTime(inputString, delimiters) {
    var separators = inputString.indexOf(":") && delimiters.thousands !== ":";

    if (!separators) {
        return false;
    }

    var segments = inputString.split(":");
    if (segments.length !== 3) {
        return false;
    }

    var hours = +segments[0];
    var minutes = +segments[1];
    var seconds = +segments[2];

    return !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds);
}

/**
 * Unformat a numbro-generated string representing a time to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @return {number}
 */
function unformatTime(inputString) {
    var segments = inputString.split(":");

    var hours = +segments[0];
    var minutes = +segments[1];
    var seconds = +segments[2];

    return seconds + 60 * minutes + 3600 * hours;
}

/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {NumbroFormat} format - format used  while generating the inputString
 * @return {number}
 */
function unformat(inputString, format) {
    // Avoid circular references
    var globalState = require("./globalState");

    var delimiters = globalState.currentDelimiters();
    var currencySymbol = globalState.currentCurrency().symbol;
    var ordinal = globalState.currentOrdinal();
    var zeroFormat = globalState.getZeroFormat();
    var abbreviations = globalState.currentAbbreviations();

    var value = undefined;

    if (typeof inputString === "string") {
        if (matchesTime(inputString, delimiters)) {
            value = unformatTime(inputString);
        } else {
            value = unformatValue(inputString, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
        }
    } else if (typeof inputString === "number") {
        value = inputString;
    } else {
        return undefined;
    }

    if (value === undefined) {
        return undefined;
    }

    return value;
}

module.exports = {
    unformat: unformat
};

},{"./globalState":4}],10:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var unformatter = require("./unformatting");

// Simplified regexp supporting only `language`, `script`, and `region`
var bcp47RegExp = /^[a-z]{2,3}(-[a-zA-Z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;

var validOutputValues = ["currency", "percent", "byte", "time", "ordinal", "number"];

var validForceAverageValues = ["trillion", "billion", "million", "thousand"];

var validCurrencyPosition = ["prefix", "infix", "postfix"];

var validNegativeValues = ["sign", "parenthesis"];

var validMandatoryAbbreviations = {
    type: "object",
    children: {
        thousand: {
            type: "string",
            mandatory: true
        },
        million: {
            type: "string",
            mandatory: true
        },
        billion: {
            type: "string",
            mandatory: true
        },
        trillion: {
            type: "string",
            mandatory: true
        }
    },
    mandatory: true
};

var validAbbreviations = {
    type: "object",
    children: {
        thousand: "string",
        million: "string",
        billion: "string",
        trillion: "string"
    }
};

var validBaseValues = ["decimal", "binary", "general"];

var validFormat = {
    output: {
        type: "string",
        validValues: validOutputValues
    },
    base: {
        type: "string",
        validValues: validBaseValues,
        restriction: function restriction(number, format) {
            return format.output === "byte";
        },
        message: "`base` must be provided only when the output is `byte`",
        mandatory: function mandatory(format) {
            return format.output === "byte";
        }
    },
    characteristic: {
        type: "number",
        restriction: function restriction(number) {
            return number >= 0;
        },
        message: "value must be positive"
    },
    prefix: "string",
    postfix: "string",
    forceAverage: {
        type: "string",
        validValues: validForceAverageValues
    },
    average: "boolean",
    currencyPosition: {
        type: "string",
        validValues: validCurrencyPosition
    },
    currencySymbol: "string",
    totalLength: {
        type: "number",
        restrictions: [{
            restriction: function restriction(number) {
                return number >= 0;
            },
            message: "value must be positive"
        }, {
            restriction: function restriction(number, format) {
                return !format.exponential;
            },
            message: "`totalLength` is incompatible with `exponential`"
        }]
    },
    mantissa: {
        type: "number",
        restriction: function restriction(number) {
            return number >= 0;
        },
        message: "value must be positive"
    },
    optionalMantissa: "boolean",
    trimMantissa: "boolean",
    optionalCharacteristic: "boolean",
    thousandSeparated: "boolean",
    spaceSeparated: "boolean",
    abbreviations: validAbbreviations,
    negative: {
        type: "string",
        validValues: validNegativeValues
    },
    forceSign: "boolean",
    exponential: {
        type: "boolean"
    },
    prefixSymbol: {
        type: "boolean",
        restriction: function restriction(number, format) {
            return format.output === "percent";
        },
        message: "`prefixSymbol` can be provided only when the output is `percent`"
    }
};

var validLanguage = {
    languageTag: {
        type: "string",
        mandatory: true,
        restriction: function restriction(tag) {
            return tag.match(bcp47RegExp);
        },
        message: "the language tag must follow the BCP 47 specification (see https://tools.ieft.org/html/bcp47)"
    },
    delimiters: {
        type: "object",
        children: {
            thousands: "string",
            decimal: "string",
            thousandsSize: "number"
        },
        mandatory: true
    },
    abbreviations: validMandatoryAbbreviations,
    spaceSeparated: "boolean",
    ordinal: {
        type: "function",
        mandatory: true
    },
    currency: {
        type: "object",
        children: {
            symbol: "string",
            position: "string",
            code: "string"
        },
        mandatory: true
    },
    defaults: "format",
    ordinalFormat: "format",
    byteFormat: "format",
    percentageFormat: "format",
    currencyFormat: "format",
    timeDefaults: "format",
    formats: {
        type: "object",
        children: {
            fourDigits: {
                type: "format",
                mandatory: true
            },
            fullWithTwoDecimals: {
                type: "format",
                mandatory: true
            },
            fullWithTwoDecimalsNoCurrency: {
                type: "format",
                mandatory: true
            },
            fullWithNoDecimals: {
                type: "format",
                mandatory: true
            }
        }
    }
};

/**
 * Check the validity of the provided input and format.
 * The check is NOT lazy.
 *
 * @param {string|number|Numbro} input - input to check
 * @param {NumbroFormat} format - format to check
 * @return {boolean} True when everything is correct
 */
function validate(input, format) {
    var validInput = validateInput(input);
    var isFormatValid = validateFormat(format);

    return validInput && isFormatValid;
}

/**
 * Check the validity of the numbro input.
 *
 * @param {string|number|Numbro} input - input to check
 * @return {boolean} True when everything is correct
 */
function validateInput(input) {
    var value = unformatter.unformat(input);

    return !!value;
}

/**
 * Check the validity of the provided format TOVALIDATE against SPEC.
 *
 * @param {NumbroFormat} toValidate - format to check
 * @param {*} spec - specification against which to check
 * @param {string} prefix - prefix use for error messages
 * @param {boolean} skipMandatoryCheck - `true` when the check for mandatory key must be skipped
 * @return {boolean} True when everything is correct
 */
function validateSpec(toValidate, spec, prefix) {
    var skipMandatoryCheck = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var results = Object.keys(toValidate).map(function (key) {
        if (!spec[key]) {
            console.error(prefix + " Invalid key: " + key); // eslint-disable-line no-console
            return false;
        }

        var value = toValidate[key];
        var data = spec[key];

        if (typeof data === "string") {
            data = { type: data };
        }

        if (data.type === "format") {
            // all formats are partial (a.k.a will be merged with some default values) thus no need to check mandatory values
            var valid = validateSpec(value, validFormat, "[Validate " + key + "]", true);

            if (!valid) {
                return false;
            }
        } else if ((typeof value === "undefined" ? "undefined" : _typeof(value)) !== data.type) {
            console.error(prefix + " " + key + " type mismatched: \"" + data.type + "\" expected, \"" + (typeof value === "undefined" ? "undefined" : _typeof(value)) + "\" provided"); // eslint-disable-line no-console
            return false;
        }

        if (data.restrictions && data.restrictions.length) {
            var length = data.restrictions.length;
            for (var i = 0; i < length; i++) {
                var _data$restrictions$i = data.restrictions[i],
                    restriction = _data$restrictions$i.restriction,
                    message = _data$restrictions$i.message;

                if (!restriction(value, toValidate)) {
                    console.error(prefix + " " + key + " invalid value: " + message); // eslint-disable-line no-console
                    return false;
                }
            }
        }

        if (data.restriction && !data.restriction(value, toValidate)) {
            console.error(prefix + " " + key + " invalid value: " + data.message); // eslint-disable-line no-console
            return false;
        }

        if (data.validValues && data.validValues.indexOf(value) === -1) {
            console.error(prefix + " " + key + " invalid value: must be among " + JSON.stringify(data.validValues) + ", \"" + value + "\" provided"); // eslint-disable-line no-console
            return false;
        }

        if (data.children) {
            var _valid = validateSpec(value, data.children, "[Validate " + key + "]");

            if (!_valid) {
                return false;
            }
        }

        return true;
    });

    if (!skipMandatoryCheck) {
        results.push.apply(results, _toConsumableArray(Object.keys(spec).map(function (key) {
            var data = spec[key];
            if (typeof data === "string") {
                data = { type: data };
            }

            if (data.mandatory) {
                var mandatory = data.mandatory;
                if (typeof mandatory === "function") {
                    mandatory = mandatory(toValidate);
                }

                if (mandatory && toValidate[key] === undefined) {
                    console.error(prefix + " Missing mandatory key \"" + key + "\""); // eslint-disable-line no-console
                    return false;
                }
            }

            return true;
        })));
    }

    return results.reduce(function (acc, current) {
        return acc && current;
    }, true);
}

/**
 * Check the provided FORMAT.
 *
 * @param {NumbroFormat} format - format to check
 * @return {boolean}
 */
function validateFormat(format) {
    return validateSpec(format, validFormat, "[Validate format]");
}

/**
 * Check the provided LANGUAGE.
 *
 * @param {NumbroLanguage} language - language to check
 * @return {boolean}
 */
function validateLanguage(language) {
    return validateSpec(language, validLanguage, "[Validate language]");
}

module.exports = {
    validate: validate,
    validateFormat: validateFormat,
    validateInput: validateInput,
    validateLanguage: validateLanguage
};

},{"./unformatting":9}]},{},[7])(7)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnbnVtYmVyLmpzL2JpZ251bWJlci5qcyIsInNyYy9lbi1VUy5qcyIsInNyYy9mb3JtYXR0aW5nLmpzIiwic3JjL2dsb2JhbFN0YXRlLmpzIiwic3JjL2xvYWRpbmcuanMiLCJzcmMvbWFuaXB1bGF0aW5nLmpzIiwic3JjL251bWJyby5qcyIsInNyYy9wYXJzaW5nLmpzIiwic3JjL3VuZm9ybWF0dGluZy5qcyIsInNyYy92YWxpZGF0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBQ0g7O0FBRUQsb0JBQUksYUFBYSxXQUFXLEdBQVgsTUFBb0IsU0FBckMsRUFBZ0Q7QUFDNUMsNEJBQVEsS0FBUixDQUFpQixNQUFqQixpQ0FBa0QsR0FBbEQsU0FENEMsQ0FDZTtBQUMzRCwyQkFBTyxLQUFQO0FBQ0g7QUFDSjs7QUFFRCxtQkFBTyxJQUFQO0FBQ0gsU0FuQmUsQ0FBaEI7QUFvQkg7O0FBRUQsV0FBTyxRQUFRLE1BQVIsQ0FBZSxVQUFDLEdBQUQsRUFBTSxPQUFOLEVBQWtCO0FBQ3BDLGVBQU8sT0FBTyxPQUFkO0FBQ0gsS0FGTSxFQUVKLElBRkksQ0FBUDtBQUdIOztBQUVEOzs7Ozs7QUFNQSxTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0M7QUFDNUIsV0FBTyxhQUFhLE1BQWIsRUFBcUIsV0FBckIsRUFBa0MsbUJBQWxDLENBQVA7QUFDSDs7QUFFRDs7Ozs7O0FBTUEsU0FBUyxnQkFBVCxDQUEwQixRQUExQixFQUFvQztBQUNoQyxXQUFPLGFBQWEsUUFBYixFQUF1QixhQUF2QixFQUFzQyxxQkFBdEMsQ0FBUDtBQUNIOztBQUVELE9BQU8sT0FBUCxHQUFpQjtBQUNiLHNCQURhO0FBRWIsa0NBRmE7QUFHYixnQ0FIYTtBQUliO0FBSmEsQ0FBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohIGJpZ251bWJlci5qcyB2NC4wLjQgaHR0cHM6Ly9naXRodWIuY29tL01pa2VNY2wvYmlnbnVtYmVyLmpzL0xJQ0VOQ0UgKi9cclxuXHJcbjsoZnVuY3Rpb24gKGdsb2JhbE9iaikge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIC8qXHJcbiAgICAgIGJpZ251bWJlci5qcyB2NC4wLjRcclxuICAgICAgQSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGFyYml0cmFyeS1wcmVjaXNpb24gYXJpdGhtZXRpYy5cclxuICAgICAgaHR0cHM6Ly9naXRodWIuY29tL01pa2VNY2wvYmlnbnVtYmVyLmpzXHJcbiAgICAgIENvcHlyaWdodCAoYykgMjAxNyBNaWNoYWVsIE1jbGF1Z2hsaW4gPE04Y2g4OGxAZ21haWwuY29tPlxyXG4gICAgICBNSVQgRXhwYXQgTGljZW5jZVxyXG4gICAgKi9cclxuXHJcblxyXG4gICAgdmFyIEJpZ051bWJlcixcclxuICAgICAgICBpc051bWVyaWMgPSAvXi0/KFxcZCsoXFwuXFxkKik/fFxcLlxcZCspKGVbKy1dP1xcZCspPyQvaSxcclxuICAgICAgICBtYXRoY2VpbCA9IE1hdGguY2VpbCxcclxuICAgICAgICBtYXRoZmxvb3IgPSBNYXRoLmZsb29yLFxyXG4gICAgICAgIG5vdEJvb2wgPSAnIG5vdCBhIGJvb2xlYW4gb3IgYmluYXJ5IGRpZ2l0JyxcclxuICAgICAgICByb3VuZGluZ01vZGUgPSAncm91bmRpbmcgbW9kZScsXHJcbiAgICAgICAgdG9vTWFueURpZ2l0cyA9ICdudW1iZXIgdHlwZSBoYXMgbW9yZSB0aGFuIDE1IHNpZ25pZmljYW50IGRpZ2l0cycsXHJcbiAgICAgICAgQUxQSEFCRVQgPSAnMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVokXycsXHJcbiAgICAgICAgQkFTRSA9IDFlMTQsXHJcbiAgICAgICAgTE9HX0JBU0UgPSAxNCxcclxuICAgICAgICBNQVhfU0FGRV9JTlRFR0VSID0gMHgxZmZmZmZmZmZmZmZmZiwgICAgICAgICAvLyAyXjUzIC0gMVxyXG4gICAgICAgIC8vIE1BWF9JTlQzMiA9IDB4N2ZmZmZmZmYsICAgICAgICAgICAgICAgICAgIC8vIDJeMzEgLSAxXHJcbiAgICAgICAgUE9XU19URU4gPSBbMSwgMTAsIDEwMCwgMWUzLCAxZTQsIDFlNSwgMWU2LCAxZTcsIDFlOCwgMWU5LCAxZTEwLCAxZTExLCAxZTEyLCAxZTEzXSxcclxuICAgICAgICBTUVJUX0JBU0UgPSAxZTcsXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogVGhlIGxpbWl0IG9uIHRoZSB2YWx1ZSBvZiBERUNJTUFMX1BMQUNFUywgVE9fRVhQX05FRywgVE9fRVhQX1BPUywgTUlOX0VYUCwgTUFYX0VYUCwgYW5kXHJcbiAgICAgICAgICogdGhlIGFyZ3VtZW50cyB0byB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCwgYW5kIHRvUHJlY2lzaW9uLCBiZXlvbmQgd2hpY2ggYW5cclxuICAgICAgICAgKiBleGNlcHRpb24gaXMgdGhyb3duIChpZiBFUlJPUlMgaXMgdHJ1ZSkuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgTUFYID0gMUU5OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhfSU5UMzJcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgQmlnTnVtYmVyIGNvbnN0cnVjdG9yLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjb25zdHJ1Y3RvckZhY3RvcnkoY29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGRpdiwgcGFyc2VOdW1lcmljLFxyXG5cclxuICAgICAgICAgICAgLy8gaWQgdHJhY2tzIHRoZSBjYWxsZXIgZnVuY3Rpb24sIHNvIGl0cyBuYW1lIGNhbiBiZSBpbmNsdWRlZCBpbiBlcnJvciBtZXNzYWdlcy5cclxuICAgICAgICAgICAgaWQgPSAwLFxyXG4gICAgICAgICAgICBQID0gQmlnTnVtYmVyLnByb3RvdHlwZSxcclxuICAgICAgICAgICAgT05FID0gbmV3IEJpZ051bWJlcigxKSxcclxuXHJcblxyXG4gICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIEVESVRBQkxFIERFRkFVTFRTICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICogVGhlIGRlZmF1bHQgdmFsdWVzIGJlbG93IG11c3QgYmUgaW50ZWdlcnMgd2l0aGluIHRoZSBpbmNsdXNpdmUgcmFuZ2VzIHN0YXRlZC5cclxuICAgICAgICAgICAgICogVGhlIHZhbHVlcyBjYW4gYWxzbyBiZSBjaGFuZ2VkIGF0IHJ1bi10aW1lIHVzaW5nIEJpZ051bWJlci5jb25maWcuXHJcbiAgICAgICAgICAgICAqL1xyXG5cclxuICAgICAgICAgICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIGZvciBvcGVyYXRpb25zIGludm9sdmluZyBkaXZpc2lvbi5cclxuICAgICAgICAgICAgREVDSU1BTF9QTEFDRVMgPSAyMCwgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWFxyXG5cclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICogVGhlIHJvdW5kaW5nIG1vZGUgdXNlZCB3aGVuIHJvdW5kaW5nIHRvIHRoZSBhYm92ZSBkZWNpbWFsIHBsYWNlcywgYW5kIHdoZW4gdXNpbmdcclxuICAgICAgICAgICAgICogdG9FeHBvbmVudGlhbCwgdG9GaXhlZCwgdG9Gb3JtYXQgYW5kIHRvUHJlY2lzaW9uLCBhbmQgcm91bmQgKGRlZmF1bHQgdmFsdWUpLlxyXG4gICAgICAgICAgICAgKiBVUCAgICAgICAgIDAgQXdheSBmcm9tIHplcm8uXHJcbiAgICAgICAgICAgICAqIERPV04gICAgICAgMSBUb3dhcmRzIHplcm8uXHJcbiAgICAgICAgICAgICAqIENFSUwgICAgICAgMiBUb3dhcmRzICtJbmZpbml0eS5cclxuICAgICAgICAgICAgICogRkxPT1IgICAgICAzIFRvd2FyZHMgLUluZmluaXR5LlxyXG4gICAgICAgICAgICAgKiBIQUxGX1VQICAgIDQgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHVwLlxyXG4gICAgICAgICAgICAgKiBIQUxGX0RPV04gIDUgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIGRvd24uXHJcbiAgICAgICAgICAgICAqIEhBTEZfRVZFTiAgNiBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG93YXJkcyBldmVuIG5laWdoYm91ci5cclxuICAgICAgICAgICAgICogSEFMRl9DRUlMICA3IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzICtJbmZpbml0eS5cclxuICAgICAgICAgICAgICogSEFMRl9GTE9PUiA4IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFJPVU5ESU5HX01PREUgPSA0LCAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byA4XHJcblxyXG4gICAgICAgICAgICAvLyBFWFBPTkVOVElBTF9BVCA6IFtUT19FWFBfTkVHICwgVE9fRVhQX1BPU11cclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBleHBvbmVudCB2YWx1ZSBhdCBhbmQgYmVuZWF0aCB3aGljaCB0b1N0cmluZyByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgICAgICAvLyBOdW1iZXIgdHlwZTogLTdcclxuICAgICAgICAgICAgVE9fRVhQX05FRyA9IC03LCAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIC1NQVhcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBleHBvbmVudCB2YWx1ZSBhdCBhbmQgYWJvdmUgd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICAgICAgLy8gTnVtYmVyIHR5cGU6IDIxXHJcbiAgICAgICAgICAgIFRPX0VYUF9QT1MgPSAyMSwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhcclxuXHJcbiAgICAgICAgICAgIC8vIFJBTkdFIDogW01JTl9FWFAsIE1BWF9FWFBdXHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgbWluaW11bSBleHBvbmVudCB2YWx1ZSwgYmVuZWF0aCB3aGljaCB1bmRlcmZsb3cgdG8gemVybyBvY2N1cnMuXHJcbiAgICAgICAgICAgIC8vIE51bWJlciB0eXBlOiAtMzI0ICAoNWUtMzI0KVxyXG4gICAgICAgICAgICBNSU5fRVhQID0gLTFlNywgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0xIHRvIC1NQVhcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBtYXhpbXVtIGV4cG9uZW50IHZhbHVlLCBhYm92ZSB3aGljaCBvdmVyZmxvdyB0byBJbmZpbml0eSBvY2N1cnMuXHJcbiAgICAgICAgICAgIC8vIE51bWJlciB0eXBlOiAgMzA4ICAoMS43OTc2OTMxMzQ4NjIzMTU3ZSszMDgpXHJcbiAgICAgICAgICAgIC8vIEZvciBNQVhfRVhQID4gMWU3LCBlLmcuIG5ldyBCaWdOdW1iZXIoJzFlMTAwMDAwMDAwJykucGx1cygxKSBtYXkgYmUgc2xvdy5cclxuICAgICAgICAgICAgTUFYX0VYUCA9IDFlNywgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAxIHRvIE1BWFxyXG5cclxuICAgICAgICAgICAgLy8gV2hldGhlciBCaWdOdW1iZXIgRXJyb3JzIGFyZSBldmVyIHRocm93bi5cclxuICAgICAgICAgICAgRVJST1JTID0gdHJ1ZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0cnVlIG9yIGZhbHNlXHJcblxyXG4gICAgICAgICAgICAvLyBDaGFuZ2UgdG8gaW50VmFsaWRhdG9yTm9FcnJvcnMgaWYgRVJST1JTIGlzIGZhbHNlLlxyXG4gICAgICAgICAgICBpc1ZhbGlkSW50ID0gaW50VmFsaWRhdG9yV2l0aEVycm9ycywgICAgIC8vIGludFZhbGlkYXRvcldpdGhFcnJvcnMvaW50VmFsaWRhdG9yTm9FcnJvcnNcclxuXHJcbiAgICAgICAgICAgIC8vIFdoZXRoZXIgdG8gdXNlIGNyeXB0b2dyYXBoaWNhbGx5LXNlY3VyZSByYW5kb20gbnVtYmVyIGdlbmVyYXRpb24sIGlmIGF2YWlsYWJsZS5cclxuICAgICAgICAgICAgQ1JZUFRPID0gZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0cnVlIG9yIGZhbHNlXHJcblxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgKiBUaGUgbW9kdWxvIG1vZGUgdXNlZCB3aGVuIGNhbGN1bGF0aW5nIHRoZSBtb2R1bHVzOiBhIG1vZCBuLlxyXG4gICAgICAgICAgICAgKiBUaGUgcXVvdGllbnQgKHEgPSBhIC8gbikgaXMgY2FsY3VsYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGNvcnJlc3BvbmRpbmcgcm91bmRpbmcgbW9kZS5cclxuICAgICAgICAgICAgICogVGhlIHJlbWFpbmRlciAocikgaXMgY2FsY3VsYXRlZCBhczogciA9IGEgLSBuICogcS5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogVVAgICAgICAgIDAgVGhlIHJlbWFpbmRlciBpcyBwb3NpdGl2ZSBpZiB0aGUgZGl2aWRlbmQgaXMgbmVnYXRpdmUsIGVsc2UgaXMgbmVnYXRpdmUuXHJcbiAgICAgICAgICAgICAqIERPV04gICAgICAxIFRoZSByZW1haW5kZXIgaGFzIHRoZSBzYW1lIHNpZ24gYXMgdGhlIGRpdmlkZW5kLlxyXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICBUaGlzIG1vZHVsbyBtb2RlIGlzIGNvbW1vbmx5IGtub3duIGFzICd0cnVuY2F0ZWQgZGl2aXNpb24nIGFuZCBpc1xyXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICBlcXVpdmFsZW50IHRvIChhICUgbikgaW4gSmF2YVNjcmlwdC5cclxuICAgICAgICAgICAgICogRkxPT1IgICAgIDMgVGhlIHJlbWFpbmRlciBoYXMgdGhlIHNhbWUgc2lnbiBhcyB0aGUgZGl2aXNvciAoUHl0aG9uICUpLlxyXG4gICAgICAgICAgICAgKiBIQUxGX0VWRU4gNiBUaGlzIG1vZHVsbyBtb2RlIGltcGxlbWVudHMgdGhlIElFRUUgNzU0IHJlbWFpbmRlciBmdW5jdGlvbi5cclxuICAgICAgICAgICAgICogRVVDTElEICAgIDkgRXVjbGlkaWFuIGRpdmlzaW9uLiBxID0gc2lnbihuKSAqIGZsb29yKGEgLyBhYnMobikpLlxyXG4gICAgICAgICAgICAgKiAgICAgICAgICAgICBUaGUgcmVtYWluZGVyIGlzIGFsd2F5cyBwb3NpdGl2ZS5cclxuICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICogVGhlIHRydW5jYXRlZCBkaXZpc2lvbiwgZmxvb3JlZCBkaXZpc2lvbiwgRXVjbGlkaWFuIGRpdmlzaW9uIGFuZCBJRUVFIDc1NCByZW1haW5kZXJcclxuICAgICAgICAgICAgICogbW9kZXMgYXJlIGNvbW1vbmx5IHVzZWQgZm9yIHRoZSBtb2R1bHVzIG9wZXJhdGlvbi5cclxuICAgICAgICAgICAgICogQWx0aG91Z2ggdGhlIG90aGVyIHJvdW5kaW5nIG1vZGVzIGNhbiBhbHNvIGJlIHVzZWQsIHRoZXkgbWF5IG5vdCBnaXZlIHVzZWZ1bCByZXN1bHRzLlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgTU9EVUxPX01PREUgPSAxLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIDlcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBzaWduaWZpY2FudCBkaWdpdHMgb2YgdGhlIHJlc3VsdCBvZiB0aGUgdG9Qb3dlciBvcGVyYXRpb24uXHJcbiAgICAgICAgICAgIC8vIElmIFBPV19QUkVDSVNJT04gaXMgMCwgdGhlcmUgd2lsbCBiZSB1bmxpbWl0ZWQgc2lnbmlmaWNhbnQgZGlnaXRzLlxyXG4gICAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgZm9ybWF0IHNwZWNpZmljYXRpb24gdXNlZCBieSB0aGUgQmlnTnVtYmVyLnByb3RvdHlwZS50b0Zvcm1hdCBtZXRob2QuXHJcbiAgICAgICAgICAgIEZPUk1BVCA9IHtcclxuICAgICAgICAgICAgICAgIGRlY2ltYWxTZXBhcmF0b3I6ICcuJyxcclxuICAgICAgICAgICAgICAgIGdyb3VwU2VwYXJhdG9yOiAnLCcsXHJcbiAgICAgICAgICAgICAgICBncm91cFNpemU6IDMsXHJcbiAgICAgICAgICAgICAgICBzZWNvbmRhcnlHcm91cFNpemU6IDAsXHJcbiAgICAgICAgICAgICAgICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yOiAnXFx4QTAnLCAgICAgIC8vIG5vbi1icmVha2luZyBzcGFjZVxyXG4gICAgICAgICAgICAgICAgZnJhY3Rpb25Hcm91cFNpemU6IDBcclxuICAgICAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG5cclxuICAgICAgICAvLyBDT05TVFJVQ1RPUlxyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBUaGUgQmlnTnVtYmVyIGNvbnN0cnVjdG9yIGFuZCBleHBvcnRlZCBmdW5jdGlvbi5cclxuICAgICAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIG5ldyBpbnN0YW5jZSBvZiBhIEJpZ051bWJlciBvYmplY3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBuIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gQSBudW1lcmljIHZhbHVlLlxyXG4gICAgICAgICAqIFtiXSB7bnVtYmVyfSBUaGUgYmFzZSBvZiBuLiBJbnRlZ2VyLCAyIHRvIDY0IGluY2x1c2l2ZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBCaWdOdW1iZXIoIG4sIGIgKSB7XHJcbiAgICAgICAgICAgIHZhciBjLCBlLCBpLCBudW0sIGxlbiwgc3RyLFxyXG4gICAgICAgICAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAvLyBFbmFibGUgY29uc3RydWN0b3IgdXNhZ2Ugd2l0aG91dCBuZXcuXHJcbiAgICAgICAgICAgIGlmICggISggeCBpbnN0YW5jZW9mIEJpZ051bWJlciApICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vICdCaWdOdW1iZXIoKSBjb25zdHJ1Y3RvciBjYWxsIHdpdGhvdXQgbmV3OiB7bn0nXHJcbiAgICAgICAgICAgICAgICBpZiAoRVJST1JTKSByYWlzZSggMjYsICdjb25zdHJ1Y3RvciBjYWxsIHdpdGhvdXQgbmV3JywgbiApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoIG4sIGIgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gJ25ldyBCaWdOdW1iZXIoKSBiYXNlIG5vdCBhbiBpbnRlZ2VyOiB7Yn0nXHJcbiAgICAgICAgICAgIC8vICduZXcgQmlnTnVtYmVyKCkgYmFzZSBvdXQgb2YgcmFuZ2U6IHtifSdcclxuICAgICAgICAgICAgaWYgKCBiID09IG51bGwgfHwgIWlzVmFsaWRJbnQoIGIsIDIsIDY0LCBpZCwgJ2Jhc2UnICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRHVwbGljYXRlLlxyXG4gICAgICAgICAgICAgICAgaWYgKCBuIGluc3RhbmNlb2YgQmlnTnVtYmVyICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHgucyA9IG4ucztcclxuICAgICAgICAgICAgICAgICAgICB4LmUgPSBuLmU7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5jID0gKCBuID0gbi5jICkgPyBuLnNsaWNlKCkgOiBuO1xyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gMDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAoIG51bSA9IHR5cGVvZiBuID09ICdudW1iZXInICkgJiYgbiAqIDAgPT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICB4LnMgPSAxIC8gbiA8IDAgPyAoIG4gPSAtbiwgLTEgKSA6IDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZhc3QgcGF0aCBmb3IgaW50ZWdlcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBuID09PSB+fm4gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGUgPSAwLCBpID0gbjsgaSA+PSAxMDsgaSAvPSAxMCwgZSsrICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHguZSA9IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHguYyA9IFtuXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSBuICsgJyc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIWlzTnVtZXJpYy50ZXN0KCBzdHIgPSBuICsgJycgKSApIHJldHVybiBwYXJzZU51bWVyaWMoIHgsIHN0ciwgbnVtICk7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT09IDQ1ID8gKCBzdHIgPSBzdHIuc2xpY2UoMSksIC0xICkgOiAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYiA9IGIgfCAwO1xyXG4gICAgICAgICAgICAgICAgc3RyID0gbiArICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSByZXR1cm4gdmFsdWUgaXMgcm91bmRlZCB0byBERUNJTUFMX1BMQUNFUyBhcyB3aXRoIG90aGVyIGJhc2VzLlxyXG4gICAgICAgICAgICAgICAgLy8gQWxsb3cgZXhwb25lbnRpYWwgbm90YXRpb24gdG8gYmUgdXNlZCB3aXRoIGJhc2UgMTAgYXJndW1lbnQuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGIgPT0gMTAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeCA9IG5ldyBCaWdOdW1iZXIoIG4gaW5zdGFuY2VvZiBCaWdOdW1iZXIgPyBuIDogc3RyICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvdW5kKCB4LCBERUNJTUFMX1BMQUNFUyArIHguZSArIDEsIFJPVU5ESU5HX01PREUgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBdm9pZCBwb3RlbnRpYWwgaW50ZXJwcmV0YXRpb24gb2YgSW5maW5pdHkgYW5kIE5hTiBhcyBiYXNlIDQ0KyB2YWx1ZXMuXHJcbiAgICAgICAgICAgICAgICAvLyBBbnkgbnVtYmVyIGluIGV4cG9uZW50aWFsIGZvcm0gd2lsbCBmYWlsIGR1ZSB0byB0aGUgW0VlXVsrLV0uXHJcbiAgICAgICAgICAgICAgICBpZiAoICggbnVtID0gdHlwZW9mIG4gPT0gJ251bWJlcicgKSAmJiBuICogMCAhPSAwIHx8XHJcbiAgICAgICAgICAgICAgICAgICEoIG5ldyBSZWdFeHAoICdeLT8nICsgKCBjID0gJ1snICsgQUxQSEFCRVQuc2xpY2UoIDAsIGIgKSArICddKycgKSArXHJcbiAgICAgICAgICAgICAgICAgICAgJyg/OlxcXFwuJyArIGMgKyAnKT8kJyxiIDwgMzcgPyAnaScgOiAnJyApICkudGVzdChzdHIpICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZU51bWVyaWMoIHgsIHN0ciwgbnVtLCBiICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG51bSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHgucyA9IDEgLyBuIDwgMCA/ICggc3RyID0gc3RyLnNsaWNlKDEpLCAtMSApIDogMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBFUlJPUlMgJiYgc3RyLnJlcGxhY2UoIC9eMFxcLjAqfFxcLi8sICcnICkubGVuZ3RoID4gMTUgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAnbmV3IEJpZ051bWJlcigpIG51bWJlciB0eXBlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiB7bn0nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhaXNlKCBpZCwgdG9vTWFueURpZ2l0cywgbiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBsYXRlciBjaGVjayBmb3IgbGVuZ3RoIG9uIGNvbnZlcnRlZCBudW1iZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgbnVtID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHgucyA9IHN0ci5jaGFyQ29kZUF0KDApID09PSA0NSA/ICggc3RyID0gc3RyLnNsaWNlKDEpLCAtMSApIDogMTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzdHIgPSBjb252ZXJ0QmFzZSggc3RyLCAxMCwgYiwgeC5zICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERlY2ltYWwgcG9pbnQ/XHJcbiAgICAgICAgICAgIGlmICggKCBlID0gc3RyLmluZGV4T2YoJy4nKSApID4gLTEgKSBzdHIgPSBzdHIucmVwbGFjZSggJy4nLCAnJyApO1xyXG5cclxuICAgICAgICAgICAgLy8gRXhwb25lbnRpYWwgZm9ybT9cclxuICAgICAgICAgICAgaWYgKCAoIGkgPSBzdHIuc2VhcmNoKCAvZS9pICkgKSA+IDAgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGV4cG9uZW50LlxyXG4gICAgICAgICAgICAgICAgaWYgKCBlIDwgMCApIGUgPSBpO1xyXG4gICAgICAgICAgICAgICAgZSArPSArc3RyLnNsaWNlKCBpICsgMSApO1xyXG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZyggMCwgaSApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBlIDwgMCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJbnRlZ2VyLlxyXG4gICAgICAgICAgICAgICAgZSA9IHN0ci5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKCBpID0gMDsgc3RyLmNoYXJDb2RlQXQoaSkgPT09IDQ4OyBpKysgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgZm9yICggbGVuID0gc3RyLmxlbmd0aDsgc3RyLmNoYXJDb2RlQXQoLS1sZW4pID09PSA0ODsgKTtcclxuICAgICAgICAgICAgc3RyID0gc3RyLnNsaWNlKCBpLCBsZW4gKyAxICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RyKSB7XHJcbiAgICAgICAgICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERpc2FsbG93IG51bWJlcnMgd2l0aCBvdmVyIDE1IHNpZ25pZmljYW50IGRpZ2l0cyBpZiBudW1iZXIgdHlwZS5cclxuICAgICAgICAgICAgICAgIC8vICduZXcgQmlnTnVtYmVyKCkgbnVtYmVyIHR5cGUgaGFzIG1vcmUgdGhhbiAxNSBzaWduaWZpY2FudCBkaWdpdHM6IHtufSdcclxuICAgICAgICAgICAgICAgIGlmICggbnVtICYmIEVSUk9SUyAmJiBsZW4gPiAxNSAmJiAoIG4gPiBNQVhfU0FGRV9JTlRFR0VSIHx8IG4gIT09IG1hdGhmbG9vcihuKSApICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJhaXNlKCBpZCwgdG9vTWFueURpZ2l0cywgeC5zICogbiApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGUgPSBlIC0gaSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgIC8vIE92ZXJmbG93P1xyXG4gICAgICAgICAgICAgICAgaWYgKCBlID4gTUFYX0VYUCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSW5maW5pdHkuXHJcbiAgICAgICAgICAgICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBVbmRlcmZsb3c/XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBlIDwgTUlOX0VYUCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gWmVyby5cclxuICAgICAgICAgICAgICAgICAgICB4LmMgPSBbIHguZSA9IDAgXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5lID0gZTtcclxuICAgICAgICAgICAgICAgICAgICB4LmMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJhbnNmb3JtIGJhc2VcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZSBpcyB0aGUgYmFzZSAxMCBleHBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgICAvLyBpIGlzIHdoZXJlIHRvIHNsaWNlIHN0ciB0byBnZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGNvZWZmaWNpZW50IGFycmF5LlxyXG4gICAgICAgICAgICAgICAgICAgIGkgPSAoIGUgKyAxICkgJSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGUgPCAwICkgaSArPSBMT0dfQkFTRTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpIDwgbGVuICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSkgeC5jLnB1c2goICtzdHIuc2xpY2UoIDAsIGkgKSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggbGVuIC09IExPR19CQVNFOyBpIDwgbGVuOyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHguYy5wdXNoKCArc3RyLnNsaWNlKCBpLCBpICs9IExPR19CQVNFICkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyID0gc3RyLnNsaWNlKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpID0gTE9HX0JBU0UgLSBzdHIubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgLT0gbGVuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggOyBpLS07IHN0ciArPSAnMCcgKTtcclxuICAgICAgICAgICAgICAgICAgICB4LmMucHVzaCggK3N0ciApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICAgICAgICB4LmMgPSBbIHguZSA9IDAgXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWQgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIENPTlNUUlVDVE9SIFBST1BFUlRJRVNcclxuXHJcblxyXG4gICAgICAgIEJpZ051bWJlci5hbm90aGVyID0gY29uc3RydWN0b3JGYWN0b3J5O1xyXG5cclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfVVAgPSAwO1xyXG4gICAgICAgIEJpZ051bWJlci5ST1VORF9ET1dOID0gMTtcclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfQ0VJTCA9IDI7XHJcbiAgICAgICAgQmlnTnVtYmVyLlJPVU5EX0ZMT09SID0gMztcclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9VUCA9IDQ7XHJcbiAgICAgICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRE9XTiA9IDU7XHJcbiAgICAgICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRVZFTiA9IDY7XHJcbiAgICAgICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfQ0VJTCA9IDc7XHJcbiAgICAgICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRkxPT1IgPSA4O1xyXG4gICAgICAgIEJpZ051bWJlci5FVUNMSUQgPSA5O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBDb25maWd1cmUgaW5mcmVxdWVudGx5LWNoYW5naW5nIGxpYnJhcnktd2lkZSBzZXR0aW5ncy5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEFjY2VwdCBhbiBvYmplY3Qgb3IgYW4gYXJndW1lbnQgbGlzdCwgd2l0aCBvbmUgb3IgbWFueSBvZiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXMgb3JcclxuICAgICAgICAgKiBwYXJhbWV0ZXJzIHJlc3BlY3RpdmVseTpcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICAgREVDSU1BTF9QTEFDRVMgIHtudW1iZXJ9ICBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmVcclxuICAgICAgICAgKiAgIFJPVU5ESU5HX01PREUgICB7bnVtYmVyfSAgSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZVxyXG4gICAgICAgICAqICAgRVhQT05FTlRJQUxfQVQgIHtudW1iZXJ8bnVtYmVyW119ICBJbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ludGVnZXIgLU1BWCB0byAwIGluY2wuLCAwIHRvIE1BWCBpbmNsLl1cclxuICAgICAgICAgKiAgIFJBTkdFICAgICAgICAgICB7bnVtYmVyfG51bWJlcltdfSAgTm9uLXplcm8gaW50ZWdlciwgLU1BWCB0byBNQVggaW5jbHVzaXZlIG9yXHJcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtpbnRlZ2VyIC1NQVggdG8gLTEgaW5jbC4sIGludGVnZXIgMSB0byBNQVggaW5jbC5dXHJcbiAgICAgICAgICogICBFUlJPUlMgICAgICAgICAge2Jvb2xlYW58bnVtYmVyfSAgIHRydWUsIGZhbHNlLCAxIG9yIDBcclxuICAgICAgICAgKiAgIENSWVBUTyAgICAgICAgICB7Ym9vbGVhbnxudW1iZXJ9ICAgdHJ1ZSwgZmFsc2UsIDEgb3IgMFxyXG4gICAgICAgICAqICAgTU9EVUxPX01PREUgICAgIHtudW1iZXJ9ICAgICAgICAgICAwIHRvIDkgaW5jbHVzaXZlXHJcbiAgICAgICAgICogICBQT1dfUFJFQ0lTSU9OICAge251bWJlcn0gICAgICAgICAgIDAgdG8gTUFYIGluY2x1c2l2ZVxyXG4gICAgICAgICAqICAgRk9STUFUICAgICAgICAgIHtvYmplY3R9ICAgICAgICAgICBTZWUgQmlnTnVtYmVyLnByb3RvdHlwZS50b0Zvcm1hdFxyXG4gICAgICAgICAqICAgICAgZGVjaW1hbFNlcGFyYXRvciAgICAgICB7c3RyaW5nfVxyXG4gICAgICAgICAqICAgICAgZ3JvdXBTZXBhcmF0b3IgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICAgICAqICAgICAgZ3JvdXBTaXplICAgICAgICAgICAgICB7bnVtYmVyfVxyXG4gICAgICAgICAqICAgICAgc2Vjb25kYXJ5R3JvdXBTaXplICAgICB7bnVtYmVyfVxyXG4gICAgICAgICAqICAgICAgZnJhY3Rpb25Hcm91cFNlcGFyYXRvciB7c3RyaW5nfVxyXG4gICAgICAgICAqICAgICAgZnJhY3Rpb25Hcm91cFNpemUgICAgICB7bnVtYmVyfVxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogKFRoZSB2YWx1ZXMgYXNzaWduZWQgdG8gdGhlIGFib3ZlIEZPUk1BVCBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90IGNoZWNrZWQgZm9yIHZhbGlkaXR5LilcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEUuZy5cclxuICAgICAgICAgKiBCaWdOdW1iZXIuY29uZmlnKDIwLCA0KSBpcyBlcXVpdmFsZW50IHRvXHJcbiAgICAgICAgICogQmlnTnVtYmVyLmNvbmZpZyh7IERFQ0lNQUxfUExBQ0VTIDogMjAsIFJPVU5ESU5HX01PREUgOiA0IH0pXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBJZ25vcmUgcHJvcGVydGllcy9wYXJhbWV0ZXJzIHNldCB0byBudWxsIG9yIHVuZGVmaW5lZC5cclxuICAgICAgICAgKiBSZXR1cm4gYW4gb2JqZWN0IHdpdGggdGhlIHByb3BlcnRpZXMgY3VycmVudCB2YWx1ZXMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQmlnTnVtYmVyLmNvbmZpZyA9IEJpZ051bWJlci5zZXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB2LCBwLFxyXG4gICAgICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgICAgICByID0ge30sXHJcbiAgICAgICAgICAgICAgICBhID0gYXJndW1lbnRzLFxyXG4gICAgICAgICAgICAgICAgbyA9IGFbMF0sXHJcbiAgICAgICAgICAgICAgICBoYXMgPSBvICYmIHR5cGVvZiBvID09ICdvYmplY3QnXHJcbiAgICAgICAgICAgICAgICAgID8gZnVuY3Rpb24gKCkgeyBpZiAoIG8uaGFzT3duUHJvcGVydHkocCkgKSByZXR1cm4gKCB2ID0gb1twXSApICE9IG51bGw7IH1cclxuICAgICAgICAgICAgICAgICAgOiBmdW5jdGlvbiAoKSB7IGlmICggYS5sZW5ndGggPiBpICkgcmV0dXJuICggdiA9IGFbaSsrXSApICE9IG51bGw7IH07XHJcblxyXG4gICAgICAgICAgICAvLyBERUNJTUFMX1BMQUNFUyB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBERUNJTUFMX1BMQUNFUyBub3QgYW4gaW50ZWdlcjoge3Z9J1xyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgREVDSU1BTF9QTEFDRVMgb3V0IG9mIHJhbmdlOiB7dn0nXHJcbiAgICAgICAgICAgIGlmICggaGFzKCBwID0gJ0RFQ0lNQUxfUExBQ0VTJyApICYmIGlzVmFsaWRJbnQoIHYsIDAsIE1BWCwgMiwgcCApICkge1xyXG4gICAgICAgICAgICAgICAgREVDSU1BTF9QTEFDRVMgPSB2IHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW3BdID0gREVDSU1BTF9QTEFDRVM7XHJcblxyXG4gICAgICAgICAgICAvLyBST1VORElOR19NT0RFIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBST1VORElOR19NT0RFIG5vdCBhbiBpbnRlZ2VyOiB7dn0nXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBST1VORElOR19NT0RFIG91dCBvZiByYW5nZToge3Z9J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdST1VORElOR19NT0RFJyApICYmIGlzVmFsaWRJbnQoIHYsIDAsIDgsIDIsIHAgKSApIHtcclxuICAgICAgICAgICAgICAgIFJPVU5ESU5HX01PREUgPSB2IHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW3BdID0gUk9VTkRJTkdfTU9ERTtcclxuXHJcbiAgICAgICAgICAgIC8vIEVYUE9ORU5USUFMX0FUIHtudW1iZXJ8bnVtYmVyW119XHJcbiAgICAgICAgICAgIC8vIEludGVnZXIsIC1NQVggdG8gTUFYIGluY2x1c2l2ZSBvciBbaW50ZWdlciAtTUFYIHRvIDAgaW5jbHVzaXZlLCAwIHRvIE1BWCBpbmNsdXNpdmVdLlxyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgRVhQT05FTlRJQUxfQVQgbm90IGFuIGludGVnZXI6IHt2fSdcclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIEVYUE9ORU5USUFMX0FUIG91dCBvZiByYW5nZToge3Z9J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdFWFBPTkVOVElBTF9BVCcgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGlzQXJyYXkodikgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpc1ZhbGlkSW50KCB2WzBdLCAtTUFYLCAwLCAyLCBwICkgJiYgaXNWYWxpZEludCggdlsxXSwgMCwgTUFYLCAyLCBwICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSB2WzBdIHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgVE9fRVhQX1BPUyA9IHZbMV0gfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGlzVmFsaWRJbnQoIHYsIC1NQVgsIE1BWCwgMiwgcCApICkge1xyXG4gICAgICAgICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSAtKCBUT19FWFBfUE9TID0gKCB2IDwgMCA/IC12IDogdiApIHwgMCApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBbIFRPX0VYUF9ORUcsIFRPX0VYUF9QT1MgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJBTkdFIHtudW1iZXJ8bnVtYmVyW119IE5vbi16ZXJvIGludGVnZXIsIC1NQVggdG8gTUFYIGluY2x1c2l2ZSBvclxyXG4gICAgICAgICAgICAvLyBbaW50ZWdlciAtTUFYIHRvIC0xIGluY2x1c2l2ZSwgaW50ZWdlciAxIHRvIE1BWCBpbmNsdXNpdmVdLlxyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgUkFOR0Ugbm90IGFuIGludGVnZXI6IHt2fSdcclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIFJBTkdFIGNhbm5vdCBiZSB6ZXJvOiB7dn0nXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBSQU5HRSBvdXQgb2YgcmFuZ2U6IHt2fSdcclxuICAgICAgICAgICAgaWYgKCBoYXMoIHAgPSAnUkFOR0UnICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpc0FycmF5KHYpICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaXNWYWxpZEludCggdlswXSwgLU1BWCwgLTEsIDIsIHAgKSAmJiBpc1ZhbGlkSW50KCB2WzFdLCAxLCBNQVgsIDIsIHAgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTUlOX0VYUCA9IHZbMF0gfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBNQVhfRVhQID0gdlsxXSB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggaXNWYWxpZEludCggdiwgLU1BWCwgTUFYLCAyLCBwICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB2IHwgMCApIE1JTl9FWFAgPSAtKCBNQVhfRVhQID0gKCB2IDwgMCA/IC12IDogdiApIHwgMCApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKEVSUk9SUykgcmFpc2UoIDIsIHAgKyAnIGNhbm5vdCBiZSB6ZXJvJywgdiApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBbIE1JTl9FWFAsIE1BWF9FWFAgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIEVSUk9SUyB7Ym9vbGVhbnxudW1iZXJ9IHRydWUsIGZhbHNlLCAxIG9yIDAuXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBFUlJPUlMgbm90IGEgYm9vbGVhbiBvciBiaW5hcnkgZGlnaXQ6IHt2fSdcclxuICAgICAgICAgICAgaWYgKCBoYXMoIHAgPSAnRVJST1JTJyApICkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdiA9PT0gISF2IHx8IHYgPT09IDEgfHwgdiA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNWYWxpZEludCA9ICggRVJST1JTID0gISF2ICkgPyBpbnRWYWxpZGF0b3JXaXRoRXJyb3JzIDogaW50VmFsaWRhdG9yTm9FcnJvcnM7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEVSUk9SUykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJhaXNlKCAyLCBwICsgbm90Qm9vbCwgdiApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBFUlJPUlM7XHJcblxyXG4gICAgICAgICAgICAvLyBDUllQVE8ge2Jvb2xlYW58bnVtYmVyfSB0cnVlLCBmYWxzZSwgMSBvciAwLlxyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgQ1JZUFRPIG5vdCBhIGJvb2xlYW4gb3IgYmluYXJ5IGRpZ2l0OiB7dn0nXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBjcnlwdG8gdW5hdmFpbGFibGU6IHtjcnlwdG99J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdDUllQVE8nICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB2ID09PSB0cnVlIHx8IHYgPT09IGZhbHNlIHx8IHYgPT09IDEgfHwgdiA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gdHlwZW9mIGNyeXB0byA9PSAndW5kZWZpbmVkJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhdiAmJiBjcnlwdG8gJiYgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMgfHwgY3J5cHRvLnJhbmRvbUJ5dGVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChFUlJPUlMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhaXNlKCAyLCAnY3J5cHRvIHVuYXZhaWxhYmxlJywgdiA/IHZvaWQgMCA6IGNyeXB0byApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBDUllQVE8gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEVSUk9SUykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJhaXNlKCAyLCBwICsgbm90Qm9vbCwgdiApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBDUllQVE87XHJcblxyXG4gICAgICAgICAgICAvLyBNT0RVTE9fTU9ERSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIDkgaW5jbHVzaXZlLlxyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgTU9EVUxPX01PREUgbm90IGFuIGludGVnZXI6IHt2fSdcclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIE1PRFVMT19NT0RFIG91dCBvZiByYW5nZToge3Z9J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdNT0RVTE9fTU9ERScgKSAmJiBpc1ZhbGlkSW50KCB2LCAwLCA5LCAyLCBwICkgKSB7XHJcbiAgICAgICAgICAgICAgICBNT0RVTE9fTU9ERSA9IHYgfCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBNT0RVTE9fTU9ERTtcclxuXHJcbiAgICAgICAgICAgIC8vIFBPV19QUkVDSVNJT04ge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgUE9XX1BSRUNJU0lPTiBub3QgYW4gaW50ZWdlcjoge3Z9J1xyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgUE9XX1BSRUNJU0lPTiBvdXQgb2YgcmFuZ2U6IHt2fSdcclxuICAgICAgICAgICAgaWYgKCBoYXMoIHAgPSAnUE9XX1BSRUNJU0lPTicgKSAmJiBpc1ZhbGlkSW50KCB2LCAwLCBNQVgsIDIsIHAgKSApIHtcclxuICAgICAgICAgICAgICAgIFBPV19QUkVDSVNJT04gPSB2IHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW3BdID0gUE9XX1BSRUNJU0lPTjtcclxuXHJcbiAgICAgICAgICAgIC8vIEZPUk1BVCB7b2JqZWN0fVxyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgRk9STUFUIG5vdCBhbiBvYmplY3Q6IHt2fSdcclxuICAgICAgICAgICAgaWYgKCBoYXMoIHAgPSAnRk9STUFUJyApICkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIHYgPT0gJ29iamVjdCcgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgRk9STUFUID0gdjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoRVJST1JTKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFpc2UoIDIsIHAgKyAnIG5vdCBhbiBvYmplY3QnLCB2ICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcltwXSA9IEZPUk1BVDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIG1heGltdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIGFyZ3VtZW50cyB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgQmlnTnVtYmVyLm1heCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1heE9yTWluKCBhcmd1bWVudHMsIFAubHQgKTsgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgbWluaW11bSBvZiB0aGUgYXJndW1lbnRzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCaWdOdW1iZXIubWluID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbWF4T3JNaW4oIGFyZ3VtZW50cywgUC5ndCApOyB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdpdGggYSByYW5kb20gdmFsdWUgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIDAgYW5kIGxlc3MgdGhhbiAxLFxyXG4gICAgICAgICAqIGFuZCB3aXRoIGRwLCBvciBERUNJTUFMX1BMQUNFUyBpZiBkcCBpcyBvbWl0dGVkLCBkZWNpbWFsIHBsYWNlcyAob3IgbGVzcyBpZiB0cmFpbGluZ1xyXG4gICAgICAgICAqIHplcm9zIGFyZSBwcm9kdWNlZCkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAncmFuZG9tKCkgZGVjaW1hbCBwbGFjZXMgbm90IGFuIGludGVnZXI6IHtkcH0nXHJcbiAgICAgICAgICogJ3JhbmRvbSgpIGRlY2ltYWwgcGxhY2VzIG91dCBvZiByYW5nZToge2RwfSdcclxuICAgICAgICAgKiAncmFuZG9tKCkgY3J5cHRvIHVuYXZhaWxhYmxlOiB7Y3J5cHRvfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBCaWdOdW1iZXIucmFuZG9tID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHBvdzJfNTMgPSAweDIwMDAwMDAwMDAwMDAwO1xyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIGEgNTMgYml0IGludGVnZXIgbiwgd2hlcmUgMCA8PSBuIDwgOTAwNzE5OTI1NDc0MDk5Mi5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgTWF0aC5yYW5kb20oKSBwcm9kdWNlcyBtb3JlIHRoYW4gMzIgYml0cyBvZiByYW5kb21uZXNzLlxyXG4gICAgICAgICAgICAvLyBJZiBpdCBkb2VzLCBhc3N1bWUgYXQgbGVhc3QgNTMgYml0cyBhcmUgcHJvZHVjZWQsIG90aGVyd2lzZSBhc3N1bWUgYXQgbGVhc3QgMzAgYml0cy5cclxuICAgICAgICAgICAgLy8gMHg0MDAwMDAwMCBpcyAyXjMwLCAweDgwMDAwMCBpcyAyXjIzLCAweDFmZmZmZiBpcyAyXjIxIC0gMS5cclxuICAgICAgICAgICAgdmFyIHJhbmRvbTUzYml0SW50ID0gKE1hdGgucmFuZG9tKCkgKiBwb3cyXzUzKSAmIDB4MWZmZmZmXHJcbiAgICAgICAgICAgICAgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBtYXRoZmxvb3IoIE1hdGgucmFuZG9tKCkgKiBwb3cyXzUzICk7IH1cclxuICAgICAgICAgICAgICA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICgoTWF0aC5yYW5kb20oKSAqIDB4NDAwMDAwMDAgfCAwKSAqIDB4ODAwMDAwKSArXHJcbiAgICAgICAgICAgICAgICAgIChNYXRoLnJhbmRvbSgpICogMHg4MDAwMDAgfCAwKTsgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZHApIHtcclxuICAgICAgICAgICAgICAgIHZhciBhLCBiLCBlLCBrLCB2LFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGMgPSBbXSxcclxuICAgICAgICAgICAgICAgICAgICByYW5kID0gbmV3IEJpZ051bWJlcihPTkUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGRwID0gZHAgPT0gbnVsbCB8fCAhaXNWYWxpZEludCggZHAsIDAsIE1BWCwgMTQgKSA/IERFQ0lNQUxfUExBQ0VTIDogZHAgfCAwO1xyXG4gICAgICAgICAgICAgICAgayA9IG1hdGhjZWlsKCBkcCAvIExPR19CQVNFICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKENSWVBUTykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBCcm93c2VycyBzdXBwb3J0aW5nIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKCBuZXcgVWludDMyQXJyYXkoIGsgKj0gMiApICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBrOyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyA1MyBiaXRzOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gKChNYXRoLnBvdygyLCAzMikgLSAxKSAqIE1hdGgucG93KDIsIDIxKSkudG9TdHJpbmcoMilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDExMTExIDExMTExMTExIDExMTExMTExIDExMTExMTExIDExMTAwMDAwIDAwMDAwMDAwIDAwMDAwMDAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoKE1hdGgucG93KDIsIDMyKSAtIDEpID4+PiAxMSkudG9TdHJpbmcoMilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDExMTExIDExMTExMTExIDExMTExMTExXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAweDIwMDAwIGlzIDJeMjEuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ID0gYVtpXSAqIDB4MjAwMDAgKyAoYVtpICsgMV0gPj4+IDExKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWplY3Rpb24gc2FtcGxpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIDw9IHYgPCA5MDA3MTk5MjU0NzQwOTkyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcm9iYWJpbGl0eSB0aGF0IHYgPj0gOWUxNSwgaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDcxOTkyNTQ3NDA5OTIgLyA5MDA3MTk5MjU0NzQwOTkyIH49IDAuMDAwOCwgaS5lLiAxIGluIDEyNTFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdiA+PSA5ZTE1ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGIgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKCBuZXcgVWludDMyQXJyYXkoMikgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhW2ldID0gYlswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhW2kgKyAxXSA9IGJbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIDw9IHYgPD0gODk5OTk5OTk5OTk5OTk5OVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgPD0gKHYgJSAxZTE0KSA8PSA5OTk5OTk5OTk5OTk5OVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMucHVzaCggdiAlIDFlMTQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpICs9IDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaSA9IGsgLyAyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBOb2RlLmpzIHN1cHBvcnRpbmcgY3J5cHRvLnJhbmRvbUJ5dGVzLlxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3J5cHRvLnJhbmRvbUJ5dGVzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBidWZmZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgYSA9IGNyeXB0by5yYW5kb21CeXRlcyggayAqPSA3ICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBrOyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAweDEwMDAwMDAwMDAwMDAgaXMgMl40OCwgMHgxMDAwMDAwMDAwMCBpcyAyXjQwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAweDEwMDAwMDAwMCBpcyAyXjMyLCAweDEwMDAwMDAgaXMgMl4yNFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgPD0gdiA8IDkwMDcxOTkyNTQ3NDA5OTJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgPSAoICggYVtpXSAmIDMxICkgKiAweDEwMDAwMDAwMDAwMDAgKSArICggYVtpICsgMV0gKiAweDEwMDAwMDAwMDAwICkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBhW2kgKyAyXSAqIDB4MTAwMDAwMDAwICkgKyAoIGFbaSArIDNdICogMHgxMDAwMDAwICkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCBhW2kgKyA0XSA8PCAxNiApICsgKCBhW2kgKyA1XSA8PCA4ICkgKyBhW2kgKyA2XTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHYgPj0gOWUxNSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcnlwdG8ucmFuZG9tQnl0ZXMoNykuY29weSggYSwgaSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYy5wdXNoKCB2ICUgMWUxNCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gNztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpID0gayAvIDc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChFUlJPUlMpIHJhaXNlKCAxNCwgJ2NyeXB0byB1bmF2YWlsYWJsZScsIGNyeXB0byApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBVc2UgTWF0aC5yYW5kb20uXHJcbiAgICAgICAgICAgICAgICBpZiAoIUNSWVBUTykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBrOyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHJhbmRvbTUzYml0SW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdiA8IDllMTUgKSBjW2krK10gPSB2ICUgMWUxNDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgayA9IGNbLS1pXTtcclxuICAgICAgICAgICAgICAgIGRwICU9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgdHJhaWxpbmcgZGlnaXRzIHRvIHplcm9zIGFjY29yZGluZyB0byBkcC5cclxuICAgICAgICAgICAgICAgIGlmICggayAmJiBkcCApIHtcclxuICAgICAgICAgICAgICAgICAgICB2ID0gUE9XU19URU5bTE9HX0JBU0UgLSBkcF07XHJcbiAgICAgICAgICAgICAgICAgICAgY1tpXSA9IG1hdGhmbG9vciggayAvIHYgKSAqIHY7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIGVsZW1lbnRzIHdoaWNoIGFyZSB6ZXJvLlxyXG4gICAgICAgICAgICAgICAgZm9yICggOyBjW2ldID09PSAwOyBjLnBvcCgpLCBpLS0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgICAgICAgICAgaWYgKCBpIDwgMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBjID0gWyBlID0gMCBdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgZWxlbWVudHMgd2hpY2ggYXJlIHplcm8gYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBlID0gLTEgOyBjWzBdID09PSAwOyBjLnNwbGljZSgwLCAxKSwgZSAtPSBMT0dfQkFTRSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENvdW50IHRoZSBkaWdpdHMgb2YgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYyB0byBkZXRlcm1pbmUgbGVhZGluZyB6ZXJvcywgYW5kLi4uXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDEsIHYgPSBjWzBdOyB2ID49IDEwOyB2IC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBhZGp1c3QgdGhlIGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaSA8IExPR19CQVNFICkgZSAtPSBMT0dfQkFTRSAtIGk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmFuZC5lID0gZTtcclxuICAgICAgICAgICAgICAgIHJhbmQuYyA9IGM7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gUFJJVkFURSBGVU5DVElPTlNcclxuXHJcblxyXG4gICAgICAgIC8vIENvbnZlcnQgYSBudW1lcmljIHN0cmluZyBvZiBiYXNlSW4gdG8gYSBudW1lcmljIHN0cmluZyBvZiBiYXNlT3V0LlxyXG4gICAgICAgIGZ1bmN0aW9uIGNvbnZlcnRCYXNlKCBzdHIsIGJhc2VPdXQsIGJhc2VJbiwgc2lnbiApIHtcclxuICAgICAgICAgICAgdmFyIGQsIGUsIGssIHIsIHgsIHhjLCB5LFxyXG4gICAgICAgICAgICAgICAgaSA9IHN0ci5pbmRleE9mKCAnLicgKSxcclxuICAgICAgICAgICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMsXHJcbiAgICAgICAgICAgICAgICBybSA9IFJPVU5ESU5HX01PREU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGJhc2VJbiA8IDM3ICkgc3RyID0gc3RyLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBOb24taW50ZWdlci5cclxuICAgICAgICAgICAgaWYgKCBpID49IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBrID0gUE9XX1BSRUNJU0lPTjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBVbmxpbWl0ZWQgcHJlY2lzaW9uLlxyXG4gICAgICAgICAgICAgICAgUE9XX1BSRUNJU0lPTiA9IDA7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSggJy4nLCAnJyApO1xyXG4gICAgICAgICAgICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoYmFzZUluKTtcclxuICAgICAgICAgICAgICAgIHggPSB5LnBvdyggc3RyLmxlbmd0aCAtIGkgKTtcclxuICAgICAgICAgICAgICAgIFBPV19QUkVDSVNJT04gPSBrO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgc3RyIGFzIGlmIGFuIGludGVnZXIsIHRoZW4gcmVzdG9yZSB0aGUgZnJhY3Rpb24gcGFydCBieSBkaXZpZGluZyB0aGVcclxuICAgICAgICAgICAgICAgIC8vIHJlc3VsdCBieSBpdHMgYmFzZSByYWlzZWQgdG8gYSBwb3dlci5cclxuICAgICAgICAgICAgICAgIHkuYyA9IHRvQmFzZU91dCggdG9GaXhlZFBvaW50KCBjb2VmZlRvU3RyaW5nKCB4LmMgKSwgeC5lICksIDEwLCBiYXNlT3V0ICk7XHJcbiAgICAgICAgICAgICAgICB5LmUgPSB5LmMubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBudW1iZXIgYXMgaW50ZWdlci5cclxuICAgICAgICAgICAgeGMgPSB0b0Jhc2VPdXQoIHN0ciwgYmFzZUluLCBiYXNlT3V0ICk7XHJcbiAgICAgICAgICAgIGUgPSBrID0geGMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKCA7IHhjWy0ta10gPT0gMDsgeGMucG9wKCkgKTtcclxuICAgICAgICAgICAgaWYgKCAheGNbMF0gKSByZXR1cm4gJzAnO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBpIDwgMCApIHtcclxuICAgICAgICAgICAgICAgIC0tZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHguYyA9IHhjO1xyXG4gICAgICAgICAgICAgICAgeC5lID0gZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzaWduIGlzIG5lZWRlZCBmb3IgY29ycmVjdCByb3VuZGluZy5cclxuICAgICAgICAgICAgICAgIHgucyA9IHNpZ247XHJcbiAgICAgICAgICAgICAgICB4ID0gZGl2KCB4LCB5LCBkcCwgcm0sIGJhc2VPdXQgKTtcclxuICAgICAgICAgICAgICAgIHhjID0geC5jO1xyXG4gICAgICAgICAgICAgICAgciA9IHgucjtcclxuICAgICAgICAgICAgICAgIGUgPSB4LmU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGQgPSBlICsgZHAgKyAxO1xyXG5cclxuICAgICAgICAgICAgLy8gVGhlIHJvdW5kaW5nIGRpZ2l0LCBpLmUuIHRoZSBkaWdpdCB0byB0aGUgcmlnaHQgb2YgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgICAgIGkgPSB4Y1tkXTtcclxuICAgICAgICAgICAgayA9IGJhc2VPdXQgLyAyO1xyXG4gICAgICAgICAgICByID0gciB8fCBkIDwgMCB8fCB4Y1tkICsgMV0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHIgPSBybSA8IDQgPyAoIGkgIT0gbnVsbCB8fCByICkgJiYgKCBybSA9PSAwIHx8IHJtID09ICggeC5zIDwgMCA/IDMgOiAyICkgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgIDogaSA+IGsgfHwgaSA9PSBrICYmKCBybSA9PSA0IHx8IHIgfHwgcm0gPT0gNiAmJiB4Y1tkIC0gMV0gJiAxIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBybSA9PSAoIHgucyA8IDAgPyA4IDogNyApICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGQgPCAxIHx8ICF4Y1swXSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAxXi1kcCBvciAwLlxyXG4gICAgICAgICAgICAgICAgc3RyID0gciA/IHRvRml4ZWRQb2ludCggJzEnLCAtZHAgKSA6ICcwJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHhjLmxlbmd0aCA9IGQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUm91bmRpbmcgdXAgbWF5IG1lYW4gdGhlIHByZXZpb3VzIGRpZ2l0IGhhcyB0byBiZSByb3VuZGVkIHVwIGFuZCBzbyBvbi5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCAtLWJhc2VPdXQ7ICsreGNbLS1kXSA+IGJhc2VPdXQ7ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4Y1tkXSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGMgPSBbMV0uY29uY2F0KHhjKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCBrID0geGMubGVuZ3RoOyAheGNbLS1rXTsgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFLmcuIFs0LCAxMSwgMTVdIGJlY29tZXMgNGJmLlxyXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIHN0ciA9ICcnOyBpIDw9IGs7IHN0ciArPSBBTFBIQUJFVC5jaGFyQXQoIHhjW2krK10gKSApO1xyXG4gICAgICAgICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KCBzdHIsIGUgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVGhlIGNhbGxlciB3aWxsIGFkZCB0aGUgc2lnbi5cclxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyBQZXJmb3JtIGRpdmlzaW9uIGluIHRoZSBzcGVjaWZpZWQgYmFzZS4gQ2FsbGVkIGJ5IGRpdiBhbmQgY29udmVydEJhc2UuXHJcbiAgICAgICAgZGl2ID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEFzc3VtZSBub24temVybyB4IGFuZCBrLlxyXG4gICAgICAgICAgICBmdW5jdGlvbiBtdWx0aXBseSggeCwgaywgYmFzZSApIHtcclxuICAgICAgICAgICAgICAgIHZhciBtLCB0ZW1wLCB4bG8sIHhoaSxcclxuICAgICAgICAgICAgICAgICAgICBjYXJyeSA9IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IHgubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGtsbyA9IGsgJSBTUVJUX0JBU0UsXHJcbiAgICAgICAgICAgICAgICAgICAga2hpID0gayAvIFNRUlRfQkFTRSB8IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggeCA9IHguc2xpY2UoKTsgaS0tOyApIHtcclxuICAgICAgICAgICAgICAgICAgICB4bG8gPSB4W2ldICUgU1FSVF9CQVNFO1xyXG4gICAgICAgICAgICAgICAgICAgIHhoaSA9IHhbaV0gLyBTUVJUX0JBU0UgfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIG0gPSBraGkgKiB4bG8gKyB4aGkgKiBrbG87XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcCA9IGtsbyAqIHhsbyArICggKCBtICUgU1FSVF9CQVNFICkgKiBTUVJUX0JBU0UgKSArIGNhcnJ5O1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gKCB0ZW1wIC8gYmFzZSB8IDAgKSArICggbSAvIFNRUlRfQkFTRSB8IDAgKSArIGtoaSAqIHhoaTtcclxuICAgICAgICAgICAgICAgICAgICB4W2ldID0gdGVtcCAlIGJhc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNhcnJ5KSB4ID0gW2NhcnJ5XS5jb25jYXQoeCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNvbXBhcmUoIGEsIGIsIGFMLCBiTCApIHtcclxuICAgICAgICAgICAgICAgIHZhciBpLCBjbXA7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBhTCAhPSBiTCApIHtcclxuICAgICAgICAgICAgICAgICAgICBjbXAgPSBhTCA+IGJMID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IGNtcCA9IDA7IGkgPCBhTDsgaSsrICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBhW2ldICE9IGJbaV0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbXAgPSBhW2ldID4gYltpXSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNtcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gc3VidHJhY3QoIGEsIGIsIGFMLCBiYXNlICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IGIgZnJvbSBhLlxyXG4gICAgICAgICAgICAgICAgZm9yICggOyBhTC0tOyApIHtcclxuICAgICAgICAgICAgICAgICAgICBhW2FMXSAtPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIGkgPSBhW2FMXSA8IGJbYUxdID8gMSA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgYVthTF0gPSBpICogYmFzZSArIGFbYUxdIC0gYlthTF07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCA7ICFhWzBdICYmIGEubGVuZ3RoID4gMTsgYS5zcGxpY2UoMCwgMSkgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8geDogZGl2aWRlbmQsIHk6IGRpdmlzb3IuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoIHgsIHksIGRwLCBybSwgYmFzZSApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjbXAsIGUsIGksIG1vcmUsIG4sIHByb2QsIHByb2RMLCBxLCBxYywgcmVtLCByZW1MLCByZW0wLCB4aSwgeEwsIHljMCxcclxuICAgICAgICAgICAgICAgICAgICB5TCwgeXosXHJcbiAgICAgICAgICAgICAgICAgICAgcyA9IHgucyA9PSB5LnMgPyAxIDogLTEsXHJcbiAgICAgICAgICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgICAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRWl0aGVyIE5hTiwgSW5maW5pdHkgb3IgMD9cclxuICAgICAgICAgICAgICAgIGlmICggIXhjIHx8ICF4Y1swXSB8fCAheWMgfHwgIXljWzBdICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gTmFOIGlmIGVpdGhlciBOYU4sIG9yIGJvdGggSW5maW5pdHkgb3IgMC5cclxuICAgICAgICAgICAgICAgICAgICAgICF4LnMgfHwgIXkucyB8fCAoIHhjID8geWMgJiYgeGNbMF0gPT0geWNbMF0gOiAheWMgKSA/IE5hTiA6XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gwrEwIGlmIHggaXMgwrEwIG9yIHkgaXMgwrFJbmZpbml0eSwgb3IgcmV0dXJuIMKxSW5maW5pdHkgYXMgeSBpcyDCsTAuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhjICYmIHhjWzBdID09IDAgfHwgIXljID8gcyAqIDAgOiBzIC8gMFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcSA9IG5ldyBCaWdOdW1iZXIocyk7XHJcbiAgICAgICAgICAgICAgICBxYyA9IHEuYyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZSA9IHguZSAtIHkuZTtcclxuICAgICAgICAgICAgICAgIHMgPSBkcCArIGUgKyAxO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggIWJhc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFzZSA9IEJBU0U7XHJcbiAgICAgICAgICAgICAgICAgICAgZSA9IGJpdEZsb29yKCB4LmUgLyBMT0dfQkFTRSApIC0gYml0Rmxvb3IoIHkuZSAvIExPR19CQVNFICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcyA9IHMgLyBMT0dfQkFTRSB8IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVzdWx0IGV4cG9uZW50IG1heSBiZSBvbmUgbGVzcyB0aGVuIHRoZSBjdXJyZW50IHZhbHVlIG9mIGUuXHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgY29lZmZpY2llbnRzIG9mIHRoZSBCaWdOdW1iZXJzIGZyb20gY29udmVydEJhc2UgbWF5IGhhdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMDsgeWNbaV0gPT0gKCB4Y1tpXSB8fCAwICk7IGkrKyApO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB5Y1tpXSA+ICggeGNbaV0gfHwgMCApICkgZS0tO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggcyA8IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcWMucHVzaCgxKTtcclxuICAgICAgICAgICAgICAgICAgICBtb3JlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeEwgPSB4Yy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgeUwgPSB5Yy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgcyArPSAyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBOb3JtYWxpc2UgeGMgYW5kIHljIHNvIGhpZ2hlc3Qgb3JkZXIgZGlnaXQgb2YgeWMgaXMgPj0gYmFzZSAvIDIuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG4gPSBtYXRoZmxvb3IoIGJhc2UgLyAoIHljWzBdICsgMSApICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdCBuZWNlc3NhcnksIGJ1dCB0byBoYW5kbGUgb2RkIGJhc2VzIHdoZXJlIHljWzBdID09ICggYmFzZSAvIDIgKSAtIDEuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCBuID4gMSB8fCBuKysgPT0gMSAmJiB5Y1swXSA8IGJhc2UgLyAyICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggbiA+IDEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHljID0gbXVsdGlwbHkoIHljLCBuLCBiYXNlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhjID0gbXVsdGlwbHkoIHhjLCBuLCBiYXNlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHlMID0geWMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4TCA9IHhjLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHhpID0geUw7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtID0geGMuc2xpY2UoIDAsIHlMICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCB6ZXJvcyB0byBtYWtlIHJlbWFpbmRlciBhcyBsb25nIGFzIGRpdmlzb3IuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggOyByZW1MIDwgeUw7IHJlbVtyZW1MKytdID0gMCApO1xyXG4gICAgICAgICAgICAgICAgICAgIHl6ID0geWMuc2xpY2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB5eiA9IFswXS5jb25jYXQoeXopO1xyXG4gICAgICAgICAgICAgICAgICAgIHljMCA9IHljWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggeWNbMV0gPj0gYmFzZSAvIDIgKSB5YzArKztcclxuICAgICAgICAgICAgICAgICAgICAvLyBOb3QgbmVjZXNzYXJ5LCBidXQgdG8gcHJldmVudCB0cmlhbCBkaWdpdCBuID4gYmFzZSwgd2hlbiB1c2luZyBiYXNlIDMuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSBpZiAoIGJhc2UgPT0gMyAmJiB5YzAgPT0gMSApIHljMCA9IDEgKyAxZS0xNTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbXBhcmUgZGl2aXNvciBhbmQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbXAgPSBjb21wYXJlKCB5YywgcmVtLCB5TCwgcmVtTCApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgZGl2aXNvciA8IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBjbXAgPCAwICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0cmlhbCBkaWdpdCwgbi5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW0wID0gcmVtWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB5TCAhPSByZW1MICkgcmVtMCA9IHJlbTAgKiBiYXNlICsgKCByZW1bMV0gfHwgMCApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG4gaXMgaG93IG1hbnkgdGltZXMgdGhlIGRpdmlzb3IgZ29lcyBpbnRvIHRoZSBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4gPSBtYXRoZmxvb3IoIHJlbTAgLyB5YzAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgQWxnb3JpdGhtOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIDEuIHByb2R1Y3QgPSBkaXZpc29yICogdHJpYWwgZGlnaXQgKG4pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgMi4gaWYgcHJvZHVjdCA+IHJlbWFpbmRlcjogcHJvZHVjdCAtPSBkaXZpc29yLCBuLS1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAzLiByZW1haW5kZXIgLT0gcHJvZHVjdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIDQuIGlmIHByb2R1Y3Qgd2FzIDwgcmVtYWluZGVyIGF0IDI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICA1LiBjb21wYXJlIG5ldyByZW1haW5kZXIgYW5kIGRpdmlzb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIDYuIElmIHJlbWFpbmRlciA+IGRpdmlzb3I6IHJlbWFpbmRlciAtPSBkaXZpc29yLCBuKytcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG4gPiAxICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuIG1heSBiZSA+IGJhc2Ugb25seSB3aGVuIGJhc2UgaXMgMy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobiA+PSBiYXNlKSBuID0gYmFzZSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByb2R1Y3QgPSBkaXZpc29yICogdHJpYWwgZGlnaXQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZCA9IG11bHRpcGx5KCB5YywgbiwgYmFzZSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbXBhcmUgcHJvZHVjdCBhbmQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHByb2R1Y3QgPiByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJpYWwgZGlnaXQgbiB0b28gaGlnaC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuIGlzIDEgdG9vIGhpZ2ggYWJvdXQgNSUgb2YgdGhlIHRpbWUsIGFuZCBpcyBub3Qga25vd24gdG8gaGF2ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZXIgYmVlbiBtb3JlIHRoYW4gMSB0b28gaGlnaC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIGNvbXBhcmUoIHByb2QsIHJlbSwgcHJvZEwsIHJlbUwgKSA9PSAxICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuLS07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcHJvZHVjdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VidHJhY3QoIHByb2QsIHlMIDwgcHJvZEwgPyB5eiA6IHljLCBwcm9kTCwgYmFzZSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbXAgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG4gaXMgMCBvciAxLCBjbXAgaXMgLTEuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbiBpcyAwLCB0aGVyZSBpcyBubyBuZWVkIHRvIGNvbXBhcmUgeWMgYW5kIHJlbSBhZ2FpbiBiZWxvdyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyBjaGFuZ2UgY21wIHRvIDEgdG8gYXZvaWQgaXQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbiBpcyAxLCBsZWF2ZSBjbXAgYXMgLTEsIHNvIHljIGFuZCByZW0gYXJlIGNvbXBhcmVkIGFnYWluLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbiA9PSAwICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGl2aXNvciA8IHJlbWFpbmRlciwgc28gbiBtdXN0IGJlIGF0IGxlYXN0IDEuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtcCA9IG4gPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kID0geWMuc2xpY2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcHJvZEwgPCByZW1MICkgcHJvZCA9IFswXS5jb25jYXQocHJvZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgcHJvZHVjdCBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnRyYWN0KCByZW0sIHByb2QsIHJlbUwsIGJhc2UgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBwcm9kdWN0IHdhcyA8IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggY21wID09IC0xICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIG5ldyByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgZGl2aXNvciA8IG5ldyByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJpYWwgZGlnaXQgbiB0b28gbG93LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG4gaXMgMSB0b28gbG93IGFib3V0IDUlIG9mIHRoZSB0aW1lLCBhbmQgdmVyeSByYXJlbHkgMiB0b28gbG93LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICggY29tcGFyZSggeWMsIHJlbSwgeUwsIHJlbUwgKSA8IDEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4rKztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnRyYWN0KCByZW0sIHlMIDwgcmVtTCA/IHl6IDogeWMsIHJlbUwsIGJhc2UgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBjbXAgPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW0gPSBbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gLy8gZWxzZSBjbXAgPT09IDEgYW5kIG4gd2lsbCBiZSAwXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIG5leHQgZGlnaXQsIG4sIHRvIHRoZSByZXN1bHQgYXJyYXkuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHFjW2krK10gPSBuO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVtWzBdICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtW3JlbUwrK10gPSB4Y1t4aV0gfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbSA9IFsgeGNbeGldIF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1MID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKCAoIHhpKysgPCB4TCB8fCByZW1bMF0gIT0gbnVsbCApICYmIHMtLSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBtb3JlID0gcmVtWzBdICE9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIExlYWRpbmcgemVybz9cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFxY1swXSApIHFjLnNwbGljZSgwLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGJhc2UgPT0gQkFTRSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVG8gY2FsY3VsYXRlIHEuZSwgZmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHFjWzBdLlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAxLCBzID0gcWNbMF07IHMgPj0gMTA7IHMgLz0gMTAsIGkrKyApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdW5kKCBxLCBkcCArICggcS5lID0gaSArIGUgKiBMT0dfQkFTRSAtIDEgKSArIDEsIHJtLCBtb3JlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FsbGVyIGlzIGNvbnZlcnRCYXNlLlxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBxLmUgPSBlO1xyXG4gICAgICAgICAgICAgICAgICAgIHEuciA9ICttb3JlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBxO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pKCk7XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIEJpZ051bWJlciBuIGluIGZpeGVkLXBvaW50IG9yIGV4cG9uZW50aWFsXHJcbiAgICAgICAgICogbm90YXRpb24gcm91bmRlZCB0byB0aGUgc3BlY2lmaWVkIGRlY2ltYWwgcGxhY2VzIG9yIHNpZ25pZmljYW50IGRpZ2l0cy5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIG4gaXMgYSBCaWdOdW1iZXIuXHJcbiAgICAgICAgICogaSBpcyB0aGUgaW5kZXggb2YgdGhlIGxhc3QgZGlnaXQgcmVxdWlyZWQgKGkuZS4gdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXApLlxyXG4gICAgICAgICAqIHJtIGlzIHRoZSByb3VuZGluZyBtb2RlLlxyXG4gICAgICAgICAqIGNhbGxlciBpcyBjYWxsZXIgaWQ6IHRvRXhwb25lbnRpYWwgMTksIHRvRml4ZWQgMjAsIHRvRm9ybWF0IDIxLCB0b1ByZWNpc2lvbiAyNC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBmb3JtYXQoIG4sIGksIHJtLCBjYWxsZXIgKSB7XHJcbiAgICAgICAgICAgIHZhciBjMCwgZSwgbmUsIGxlbiwgc3RyO1xyXG5cclxuICAgICAgICAgICAgcm0gPSBybSAhPSBudWxsICYmIGlzVmFsaWRJbnQoIHJtLCAwLCA4LCBjYWxsZXIsIHJvdW5kaW5nTW9kZSApXHJcbiAgICAgICAgICAgICAgPyBybSB8IDAgOiBST1VORElOR19NT0RFO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhbi5jICkgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgYzAgPSBuLmNbMF07XHJcbiAgICAgICAgICAgIG5lID0gbi5lO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBpID09IG51bGwgKSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKCBuLmMgKTtcclxuICAgICAgICAgICAgICAgIHN0ciA9IGNhbGxlciA9PSAxOSB8fCBjYWxsZXIgPT0gMjQgJiYgbmUgPD0gVE9fRVhQX05FR1xyXG4gICAgICAgICAgICAgICAgICA/IHRvRXhwb25lbnRpYWwoIHN0ciwgbmUgKVxyXG4gICAgICAgICAgICAgICAgICA6IHRvRml4ZWRQb2ludCggc3RyLCBuZSApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbiA9IHJvdW5kKCBuZXcgQmlnTnVtYmVyKG4pLCBpLCBybSApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIG4uZSBtYXkgaGF2ZSBjaGFuZ2VkIGlmIHRoZSB2YWx1ZSB3YXMgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RyID0gY29lZmZUb1N0cmluZyggbi5jICk7XHJcbiAgICAgICAgICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHRvUHJlY2lzaW9uIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhlIG51bWJlciBvZiBzaWduaWZpY2FudCBkaWdpdHNcclxuICAgICAgICAgICAgICAgIC8vIHNwZWNpZmllZCBpcyBsZXNzIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHMgbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlclxyXG4gICAgICAgICAgICAgICAgLy8gcGFydCBvZiB0aGUgdmFsdWUgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24uXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgICAgICAgICAgICBpZiAoIGNhbGxlciA9PSAxOSB8fCBjYWxsZXIgPT0gMjQgJiYgKCBpIDw9IGUgfHwgZSA8PSBUT19FWFBfTkVHICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IGxlbiA8IGk7IHN0ciArPSAnMCcsIGxlbisrICk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gdG9FeHBvbmVudGlhbCggc3RyLCBlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRml4ZWQtcG9pbnQgbm90YXRpb24uXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGkgLT0gbmU7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KCBzdHIsIGUgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZSArIDEgPiBsZW4gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggLS1pID4gMCApIGZvciAoIHN0ciArPSAnLic7IGktLTsgc3RyICs9ICcwJyApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gZSAtIGxlbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBpID4gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZSArIDEgPT0gbGVuICkgc3RyICs9ICcuJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaS0tOyBzdHIgKz0gJzAnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuLnMgPCAwICYmIGMwID8gJy0nICsgc3RyIDogc3RyO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBCaWdOdW1iZXIubWF4IGFuZCBCaWdOdW1iZXIubWluLlxyXG4gICAgICAgIGZ1bmN0aW9uIG1heE9yTWluKCBhcmdzLCBtZXRob2QgKSB7XHJcbiAgICAgICAgICAgIHZhciBtLCBuLFxyXG4gICAgICAgICAgICAgICAgaSA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGlzQXJyYXkoIGFyZ3NbMF0gKSApIGFyZ3MgPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICBtID0gbmV3IEJpZ051bWJlciggYXJnc1swXSApO1xyXG5cclxuICAgICAgICAgICAgZm9yICggOyArK2kgPCBhcmdzLmxlbmd0aDsgKSB7XHJcbiAgICAgICAgICAgICAgICBuID0gbmV3IEJpZ051bWJlciggYXJnc1tpXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIGFueSBudW1iZXIgaXMgTmFOLCByZXR1cm4gTmFOLlxyXG4gICAgICAgICAgICAgICAgaWYgKCAhbi5zICkge1xyXG4gICAgICAgICAgICAgICAgICAgIG0gPSBuO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggbWV0aG9kLmNhbGwoIG0sIG4gKSApIHtcclxuICAgICAgICAgICAgICAgICAgICBtID0gbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG07XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiBuIGlzIGFuIGludGVnZXIgaW4gcmFuZ2UsIG90aGVyd2lzZSB0aHJvdy5cclxuICAgICAgICAgKiBVc2UgZm9yIGFyZ3VtZW50IHZhbGlkYXRpb24gd2hlbiBFUlJPUlMgaXMgdHJ1ZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBpbnRWYWxpZGF0b3JXaXRoRXJyb3JzKCBuLCBtaW4sIG1heCwgY2FsbGVyLCBuYW1lICkge1xyXG4gICAgICAgICAgICBpZiAoIG4gPCBtaW4gfHwgbiA+IG1heCB8fCBuICE9IHRydW5jYXRlKG4pICkge1xyXG4gICAgICAgICAgICAgICAgcmFpc2UoIGNhbGxlciwgKCBuYW1lIHx8ICdkZWNpbWFsIHBsYWNlcycgKSArXHJcbiAgICAgICAgICAgICAgICAgICggbiA8IG1pbiB8fCBuID4gbWF4ID8gJyBvdXQgb2YgcmFuZ2UnIDogJyBub3QgYW4gaW50ZWdlcicgKSwgbiApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFN0cmlwIHRyYWlsaW5nIHplcm9zLCBjYWxjdWxhdGUgYmFzZSAxMCBleHBvbmVudCBhbmQgY2hlY2sgYWdhaW5zdCBNSU5fRVhQIGFuZCBNQVhfRVhQLlxyXG4gICAgICAgICAqIENhbGxlZCBieSBtaW51cywgcGx1cyBhbmQgdGltZXMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXNlKCBuLCBjLCBlICkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDEsXHJcbiAgICAgICAgICAgICAgICBqID0gYy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKCA7ICFjWy0tal07IGMucG9wKCkgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgYmFzZSAxMCBleHBvbmVudC4gRmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIGNbMF0uXHJcbiAgICAgICAgICAgIGZvciAoIGogPSBjWzBdOyBqID49IDEwOyBqIC89IDEwLCBpKysgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE92ZXJmbG93P1xyXG4gICAgICAgICAgICBpZiAoICggZSA9IGkgKyBlICogTE9HX0JBU0UgLSAxICkgPiBNQVhfRVhQICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEluZmluaXR5LlxyXG4gICAgICAgICAgICAgICAgbi5jID0gbi5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIFVuZGVyZmxvdz9cclxuICAgICAgICAgICAgfSBlbHNlIGlmICggZSA8IE1JTl9FWFAgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gWmVyby5cclxuICAgICAgICAgICAgICAgIG4uYyA9IFsgbi5lID0gMCBdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbi5lID0gZTtcclxuICAgICAgICAgICAgICAgIG4uYyA9IGM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSB2YWx1ZXMgdGhhdCBmYWlsIHRoZSB2YWxpZGl0eSB0ZXN0IGluIEJpZ051bWJlci5cclxuICAgICAgICBwYXJzZU51bWVyaWMgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgYmFzZVByZWZpeCA9IC9eKC0/KTAoW3hib10pKD89XFx3W1xcdy5dKiQpL2ksXHJcbiAgICAgICAgICAgICAgICBkb3RBZnRlciA9IC9eKFteLl0rKVxcLiQvLFxyXG4gICAgICAgICAgICAgICAgZG90QmVmb3JlID0gL15cXC4oW14uXSspJC8sXHJcbiAgICAgICAgICAgICAgICBpc0luZmluaXR5T3JOYU4gPSAvXi0/KEluZmluaXR5fE5hTikkLyxcclxuICAgICAgICAgICAgICAgIHdoaXRlc3BhY2VPclBsdXMgPSAvXlxccypcXCsoPz1bXFx3Ll0pfF5cXHMrfFxccyskL2c7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCB4LCBzdHIsIG51bSwgYiApIHtcclxuICAgICAgICAgICAgICAgIHZhciBiYXNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHMgPSBudW0gPyBzdHIgOiBzdHIucmVwbGFjZSggd2hpdGVzcGFjZU9yUGx1cywgJycgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBObyBleGNlcHRpb24gb24gwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgICAgICAgICAgICBpZiAoIGlzSW5maW5pdHlPck5hTi50ZXN0KHMpICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHgucyA9IGlzTmFOKHMpID8gbnVsbCA6IHMgPCAwID8gLTEgOiAxO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFudW0gKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzID0gcy5yZXBsYWNlKCBiYXNlUHJlZml4LCBmdW5jdGlvbiAoIG0sIHAxLCBwMiApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2UgPSAoIHAyID0gcDIudG9Mb3dlckNhc2UoKSApID09ICd4JyA/IDE2IDogcDIgPT0gJ2InID8gMiA6IDg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIWIgfHwgYiA9PSBiYXNlID8gcDEgOiBtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlID0gYjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFLmcuICcxLicgdG8gJzEnLCAnLjEnIHRvICcwLjEnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzID0gcy5yZXBsYWNlKCBkb3RBZnRlciwgJyQxJyApLnJlcGxhY2UoIGRvdEJlZm9yZSwgJzAuJDEnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc3RyICE9IHMgKSByZXR1cm4gbmV3IEJpZ051bWJlciggcywgYmFzZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gJ25ldyBCaWdOdW1iZXIoKSBub3QgYSBudW1iZXI6IHtufSdcclxuICAgICAgICAgICAgICAgICAgICAvLyAnbmV3IEJpZ051bWJlcigpIG5vdCBhIGJhc2Uge2J9IG51bWJlcjoge259J1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChFUlJPUlMpIHJhaXNlKCBpZCwgJ25vdCBhJyArICggYiA/ICcgYmFzZSAnICsgYiA6ICcnICkgKyAnIG51bWJlcicsIHN0ciApO1xyXG4gICAgICAgICAgICAgICAgICAgIHgucyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGlkID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pKCk7XHJcblxyXG5cclxuICAgICAgICAvLyBUaHJvdyBhIEJpZ051bWJlciBFcnJvci5cclxuICAgICAgICBmdW5jdGlvbiByYWlzZSggY2FsbGVyLCBtc2csIHZhbCApIHtcclxuICAgICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCBbXHJcbiAgICAgICAgICAgICAgICAnbmV3IEJpZ051bWJlcicsICAgICAvLyAwXHJcbiAgICAgICAgICAgICAgICAnY21wJywgICAgICAgICAgICAgICAvLyAxXHJcbiAgICAgICAgICAgICAgICAnY29uZmlnJywgICAgICAgICAgICAvLyAyXHJcbiAgICAgICAgICAgICAgICAnZGl2JywgICAgICAgICAgICAgICAvLyAzXHJcbiAgICAgICAgICAgICAgICAnZGl2VG9JbnQnLCAgICAgICAgICAvLyA0XHJcbiAgICAgICAgICAgICAgICAnZXEnLCAgICAgICAgICAgICAgICAvLyA1XHJcbiAgICAgICAgICAgICAgICAnZ3QnLCAgICAgICAgICAgICAgICAvLyA2XHJcbiAgICAgICAgICAgICAgICAnZ3RlJywgICAgICAgICAgICAgICAvLyA3XHJcbiAgICAgICAgICAgICAgICAnbHQnLCAgICAgICAgICAgICAgICAvLyA4XHJcbiAgICAgICAgICAgICAgICAnbHRlJywgICAgICAgICAgICAgICAvLyA5XHJcbiAgICAgICAgICAgICAgICAnbWludXMnLCAgICAgICAgICAgICAvLyAxMFxyXG4gICAgICAgICAgICAgICAgJ21vZCcsICAgICAgICAgICAgICAgLy8gMTFcclxuICAgICAgICAgICAgICAgICdwbHVzJywgICAgICAgICAgICAgIC8vIDEyXHJcbiAgICAgICAgICAgICAgICAncHJlY2lzaW9uJywgICAgICAgICAvLyAxM1xyXG4gICAgICAgICAgICAgICAgJ3JhbmRvbScsICAgICAgICAgICAgLy8gMTRcclxuICAgICAgICAgICAgICAgICdyb3VuZCcsICAgICAgICAgICAgIC8vIDE1XHJcbiAgICAgICAgICAgICAgICAnc2hpZnQnLCAgICAgICAgICAgICAvLyAxNlxyXG4gICAgICAgICAgICAgICAgJ3RpbWVzJywgICAgICAgICAgICAgLy8gMTdcclxuICAgICAgICAgICAgICAgICd0b0RpZ2l0cycsICAgICAgICAgIC8vIDE4XHJcbiAgICAgICAgICAgICAgICAndG9FeHBvbmVudGlhbCcsICAgICAvLyAxOVxyXG4gICAgICAgICAgICAgICAgJ3RvRml4ZWQnLCAgICAgICAgICAgLy8gMjBcclxuICAgICAgICAgICAgICAgICd0b0Zvcm1hdCcsICAgICAgICAgIC8vIDIxXHJcbiAgICAgICAgICAgICAgICAndG9GcmFjdGlvbicsICAgICAgICAvLyAyMlxyXG4gICAgICAgICAgICAgICAgJ3BvdycsICAgICAgICAgICAgICAgLy8gMjNcclxuICAgICAgICAgICAgICAgICd0b1ByZWNpc2lvbicsICAgICAgIC8vIDI0XHJcbiAgICAgICAgICAgICAgICAndG9TdHJpbmcnLCAgICAgICAgICAvLyAyNVxyXG4gICAgICAgICAgICAgICAgJ0JpZ051bWJlcicgICAgICAgICAgLy8gMjZcclxuICAgICAgICAgICAgXVtjYWxsZXJdICsgJygpICcgKyBtc2cgKyAnOiAnICsgdmFsICk7XHJcblxyXG4gICAgICAgICAgICBlcnJvci5uYW1lID0gJ0JpZ051bWJlciBFcnJvcic7XHJcbiAgICAgICAgICAgIGlkID0gMDtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSb3VuZCB4IHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLiBDaGVjayBmb3Igb3Zlci91bmRlci1mbG93LlxyXG4gICAgICAgICAqIElmIHIgaXMgdHJ1dGh5LCBpdCBpcyBrbm93biB0aGF0IHRoZXJlIGFyZSBtb3JlIGRpZ2l0cyBhZnRlciB0aGUgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gcm91bmQoIHgsIHNkLCBybSwgciApIHtcclxuICAgICAgICAgICAgdmFyIGQsIGksIGosIGssIG4sIG5pLCByZCxcclxuICAgICAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICAgICAgcG93czEwID0gUE9XU19URU47XHJcblxyXG4gICAgICAgICAgICAvLyBpZiB4IGlzIG5vdCBJbmZpbml0eSBvciBOYU4uLi5cclxuICAgICAgICAgICAgaWYgKHhjKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmQgaXMgdGhlIHJvdW5kaW5nIGRpZ2l0LCBpLmUuIHRoZSBkaWdpdCBhZnRlciB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgICAgIC8vIG4gaXMgYSBiYXNlIDFlMTQgbnVtYmVyLCB0aGUgdmFsdWUgb2YgdGhlIGVsZW1lbnQgb2YgYXJyYXkgeC5jIGNvbnRhaW5pbmcgcmQuXHJcbiAgICAgICAgICAgICAgICAvLyBuaSBpcyB0aGUgaW5kZXggb2YgbiB3aXRoaW4geC5jLlxyXG4gICAgICAgICAgICAgICAgLy8gZCBpcyB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgICAgICAgICAgLy8gaSBpcyB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4gaW5jbHVkaW5nIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgICAvLyBqIGlzIHRoZSBhY3R1YWwgaW5kZXggb2YgcmQgd2l0aGluIG4gKGlmIDwgMCwgcmQgaXMgYSBsZWFkaW5nIHplcm8pLlxyXG4gICAgICAgICAgICAgICAgb3V0OiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBkID0gMSwgayA9IHhjWzBdOyBrID49IDEwOyBrIC89IDEwLCBkKysgKTtcclxuICAgICAgICAgICAgICAgICAgICBpID0gc2QgLSBkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPCAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpICs9IExPR19CQVNFO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBqID0gc2Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gPSB4Y1sgbmkgPSAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHJvdW5kaW5nIGRpZ2l0IGF0IGluZGV4IGogb2Ygbi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmQgPSBuIC8gcG93czEwWyBkIC0gaiAtIDEgXSAlIDEwIHwgMDtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuaSA9IG1hdGhjZWlsKCAoIGkgKyAxICkgLyBMT0dfQkFTRSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBuaSA+PSB4Yy5sZW5ndGggKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmVlZGVkIGJ5IHNxcnQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggOyB4Yy5sZW5ndGggPD0gbmk7IHhjLnB1c2goMCkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuID0gcmQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgJT0gTE9HX0JBU0U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaiA9IGkgLSBMT0dfQkFTRSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrIG91dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4gPSBrID0geGNbbmldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggZCA9IDE7IGsgPj0gMTA7IGsgLz0gMTAsIGQrKyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpICU9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4sIGFkanVzdGVkIGZvciBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG51bWJlciBvZiBsZWFkaW5nIHplcm9zIG9mIG4gaXMgZ2l2ZW4gYnkgTE9HX0JBU0UgLSBkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaiA9IGkgLSBMT0dfQkFTRSArIGQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSByb3VuZGluZyBkaWdpdCBhdCBpbmRleCBqIG9mIG4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZCA9IGogPCAwID8gMCA6IG4gLyBwb3dzMTBbIGQgLSBqIC0gMSBdICUgMTAgfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByID0gciB8fCBzZCA8IDAgfHxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQXJlIHRoZXJlIGFueSBub24temVybyBkaWdpdHMgYWZ0ZXIgdGhlIHJvdW5kaW5nIGRpZ2l0P1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBleHByZXNzaW9uICBuICUgcG93czEwWyBkIC0gaiAtIDEgXSAgcmV0dXJucyBhbGwgZGlnaXRzIG9mIG4gdG8gdGhlIHJpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb2YgdGhlIGRpZ2l0IGF0IGosIGUuZy4gaWYgbiBpcyA5MDg3MTQgYW5kIGogaXMgMiwgdGhlIGV4cHJlc3Npb24gZ2l2ZXMgNzE0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgeGNbbmkgKyAxXSAhPSBudWxsIHx8ICggaiA8IDAgPyBuIDogbiAlIHBvd3MxMFsgZCAtIGogLSAxIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgciA9IHJtIDwgNFxyXG4gICAgICAgICAgICAgICAgICAgICAgPyAoIHJkIHx8IHIgKSAmJiAoIHJtID09IDAgfHwgcm0gPT0gKCB4LnMgPCAwID8gMyA6IDIgKSApXHJcbiAgICAgICAgICAgICAgICAgICAgICA6IHJkID4gNSB8fCByZCA9PSA1ICYmICggcm0gPT0gNCB8fCByIHx8IHJtID09IDYgJiZcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGRpZ2l0IHRvIHRoZSBsZWZ0IG9mIHRoZSByb3VuZGluZyBkaWdpdCBpcyBvZGQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICggKCBpID4gMCA/IGogPiAwID8gbiAvIHBvd3MxMFsgZCAtIGogXSA6IDAgOiB4Y1tuaSAtIDFdICkgJSAxMCApICYgMSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJtID09ICggeC5zIDwgMCA/IDggOiA3ICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZCA8IDEgfHwgIXhjWzBdICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4Yy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHNkIHRvIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2QgLT0geC5lICsgMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAxLCAwLjEsIDAuMDEsIDAuMDAxLCAwLjAwMDEgZXRjLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGNbMF0gPSBwb3dzMTBbICggTE9HX0JBU0UgLSBzZCAlIExPR19CQVNFICkgJSBMT0dfQkFTRSBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeC5lID0gLXNkIHx8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWmVyby5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhjWzBdID0geC5lID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZXhjZXNzIGRpZ2l0cy5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeGMubGVuZ3RoID0gbmk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuaS0tO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhjLmxlbmd0aCA9IG5pICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgayA9IHBvd3MxMFsgTE9HX0JBU0UgLSBpIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBFLmcuIDU2NzAwIGJlY29tZXMgNTYwMDAgaWYgNyBpcyB0aGUgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGogPiAwIG1lYW5zIGkgPiBudW1iZXIgb2YgbGVhZGluZyB6ZXJvcyBvZiBuLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB4Y1tuaV0gPSBqID4gMCA/IG1hdGhmbG9vciggbiAvIHBvd3MxMFsgZCAtIGogXSAlIHBvd3MxMFtqXSApICogayA6IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggOyA7ICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBkaWdpdCB0byBiZSByb3VuZGVkIHVwIGlzIGluIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLi4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG5pID09IDAgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGkgd2lsbCBiZSB0aGUgbGVuZ3RoIG9mIHhjWzBdIGJlZm9yZSBrIGlzIGFkZGVkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAxLCBqID0geGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGogPSB4Y1swXSArPSBrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGsgPSAxOyBqID49IDEwOyBqIC89IDEwLCBrKysgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgaSAhPSBrIHRoZSBsZW5ndGggaGFzIGluY3JlYXNlZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGkgIT0gayApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeC5lKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggeGNbMF0gPT0gQkFTRSApIHhjWzBdID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4Y1tuaV0gKz0gaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHhjW25pXSAhPSBCQVNFICkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeGNbbmktLV0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IHhjLmxlbmd0aDsgeGNbLS1pXSA9PT0gMDsgeGMucG9wKCkgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBPdmVyZmxvdz8gSW5maW5pdHkuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHguZSA+IE1BWF9FWFAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBVbmRlcmZsb3c/IFplcm8uXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCB4LmUgPCBNSU5fRVhQICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHguYyA9IFsgeC5lID0gMCBdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyBQUk9UT1RZUEUvSU5TVEFOQ0UgTUVUSE9EU1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlci5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmFic29sdXRlVmFsdWUgPSBQLmFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHggPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoIHgucyA8IDAgKSB4LnMgPSAxO1xyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIGEgd2hvbGVcclxuICAgICAgICAgKiBudW1iZXIgaW4gdGhlIGRpcmVjdGlvbiBvZiBJbmZpbml0eS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmNlaWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByb3VuZCggbmV3IEJpZ051bWJlcih0aGlzKSwgdGhpcy5lICsgMSwgMiApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVyblxyXG4gICAgICAgICAqIDEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICAgICAqIC0xIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAgICAgKiAwIGlmIHRoZXkgaGF2ZSB0aGUgc2FtZSB2YWx1ZSxcclxuICAgICAgICAgKiBvciBudWxsIGlmIHRoZSB2YWx1ZSBvZiBlaXRoZXIgaXMgTmFOLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuY29tcGFyZWRUbyA9IFAuY21wID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICBpZCA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJlKCB0aGlzLCBuZXcgQmlnTnVtYmVyKCB5LCBiICkgKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdGhlIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsIG9yIG51bGwgaWYgdGhlIHZhbHVlXHJcbiAgICAgICAgICogb2YgdGhpcyBCaWdOdW1iZXIgaXMgwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5kZWNpbWFsUGxhY2VzID0gUC5kcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG4sIHYsXHJcbiAgICAgICAgICAgICAgICBjID0gdGhpcy5jO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhYyApIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICBuID0gKCAoIHYgPSBjLmxlbmd0aCAtIDEgKSAtIGJpdEZsb29yKCB0aGlzLmUgLyBMT0dfQkFTRSApICkgKiBMT0dfQkFTRTtcclxuXHJcbiAgICAgICAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgbnVtYmVyLlxyXG4gICAgICAgICAgICBpZiAoIHYgPSBjW3ZdICkgZm9yICggOyB2ICUgMTAgPT0gMDsgdiAvPSAxMCwgbi0tICk7XHJcbiAgICAgICAgICAgIGlmICggbiA8IDAgKSBuID0gMDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqICBuIC8gMCA9IElcclxuICAgICAgICAgKiAgbiAvIE4gPSBOXHJcbiAgICAgICAgICogIG4gLyBJID0gMFxyXG4gICAgICAgICAqICAwIC8gbiA9IDBcclxuICAgICAgICAgKiAgMCAvIDAgPSBOXHJcbiAgICAgICAgICogIDAgLyBOID0gTlxyXG4gICAgICAgICAqICAwIC8gSSA9IDBcclxuICAgICAgICAgKiAgTiAvIG4gPSBOXHJcbiAgICAgICAgICogIE4gLyAwID0gTlxyXG4gICAgICAgICAqICBOIC8gTiA9IE5cclxuICAgICAgICAgKiAgTiAvIEkgPSBOXHJcbiAgICAgICAgICogIEkgLyBuID0gSVxyXG4gICAgICAgICAqICBJIC8gMCA9IElcclxuICAgICAgICAgKiAgSSAvIE4gPSBOXHJcbiAgICAgICAgICogIEkgLyBJID0gTlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgZGl2aWRlZCBieSB0aGUgdmFsdWUgb2ZcclxuICAgICAgICAgKiBCaWdOdW1iZXIoeSwgYiksIHJvdW5kZWQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZCBST1VORElOR19NT0RFLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuZGl2aWRlZEJ5ID0gUC5kaXYgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIGlkID0gMztcclxuICAgICAgICAgICAgcmV0dXJuIGRpdiggdGhpcywgbmV3IEJpZ051bWJlciggeSwgYiApLCBERUNJTUFMX1BMQUNFUywgUk9VTkRJTkdfTU9ERSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIGludGVnZXIgcGFydCBvZiBkaXZpZGluZyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICAgICAqIEJpZ051bWJlciBieSB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuZGl2aWRlZFRvSW50ZWdlckJ5ID0gUC5kaXZUb0ludCA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgaWQgPSA0O1xyXG4gICAgICAgICAgICByZXR1cm4gZGl2KCB0aGlzLCBuZXcgQmlnTnVtYmVyKCB5LCBiICksIDAsIDEgKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAgICAgKiBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmVxdWFscyA9IFAuZXEgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIGlkID0gNTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmUoIHRoaXMsIG5ldyBCaWdOdW1iZXIoIHksIGIgKSApID09PSAwO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSB3aG9sZVxyXG4gICAgICAgICAqIG51bWJlciBpbiB0aGUgZGlyZWN0aW9uIG9mIC1JbmZpbml0eS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmZsb29yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcm91bmQoIG5ldyBCaWdOdW1iZXIodGhpcyksIHRoaXMuZSArIDEsIDMgKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgICAgICogb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5ncmVhdGVyVGhhbiA9IFAuZ3QgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIGlkID0gNjtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmUoIHRoaXMsIG5ldyBCaWdOdW1iZXIoIHksIGIgKSApID4gMDtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICAgICAqIEJpZ051bWJlcih5LCBiKSwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5ncmVhdGVyVGhhbk9yRXF1YWxUbyA9IFAuZ3RlID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICBpZCA9IDc7XHJcbiAgICAgICAgICAgIHJldHVybiAoIGIgPSBjb21wYXJlKCB0aGlzLCBuZXcgQmlnTnVtYmVyKCB5LCBiICkgKSApID09PSAxIHx8IGIgPT09IDA7XHJcblxyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhIGZpbml0ZSBudW1iZXIsIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuaXNGaW5pdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhIXRoaXMuYztcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgYW4gaW50ZWdlciwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmlzSW50ZWdlciA9IFAuaXNJbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhIXRoaXMuYyAmJiBiaXRGbG9vciggdGhpcy5lIC8gTE9HX0JBU0UgKSA+IHRoaXMuYy5sZW5ndGggLSAyO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBOYU4sIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuaXNOYU4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5zO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBuZWdhdGl2ZSwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5pc05lZ2F0aXZlID0gUC5pc05lZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucyA8IDA7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIDAgb3IgLTAsIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gISF0aGlzLmMgJiYgdGhpcy5jWzBdID09IDA7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICAgICAqIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAubGVzc1RoYW4gPSBQLmx0ID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICBpZCA9IDg7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJlKCB0aGlzLCBuZXcgQmlnTnVtYmVyKCB5LCBiICkgKSA8IDA7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgdmFsdWUgb2ZcclxuICAgICAgICAgKiBCaWdOdW1iZXIoeSwgYiksIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAubGVzc1RoYW5PckVxdWFsVG8gPSBQLmx0ZSA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgaWQgPSA5O1xyXG4gICAgICAgICAgICByZXR1cm4gKCBiID0gY29tcGFyZSggdGhpcywgbmV3IEJpZ051bWJlciggeSwgYiApICkgKSA9PT0gLTEgfHwgYiA9PT0gMDtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiAgbiAtIDAgPSBuXHJcbiAgICAgICAgICogIG4gLSBOID0gTlxyXG4gICAgICAgICAqICBuIC0gSSA9IC1JXHJcbiAgICAgICAgICogIDAgLSBuID0gLW5cclxuICAgICAgICAgKiAgMCAtIDAgPSAwXHJcbiAgICAgICAgICogIDAgLSBOID0gTlxyXG4gICAgICAgICAqICAwIC0gSSA9IC1JXHJcbiAgICAgICAgICogIE4gLSBuID0gTlxyXG4gICAgICAgICAqICBOIC0gMCA9IE5cclxuICAgICAgICAgKiAgTiAtIE4gPSBOXHJcbiAgICAgICAgICogIE4gLSBJID0gTlxyXG4gICAgICAgICAqICBJIC0gbiA9IElcclxuICAgICAgICAgKiAgSSAtIDAgPSBJXHJcbiAgICAgICAgICogIEkgLSBOID0gTlxyXG4gICAgICAgICAqICBJIC0gSSA9IE5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG1pbnVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICAgICAqIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLm1pbnVzID0gUC5zdWIgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIHZhciBpLCBqLCB0LCB4TFR5LFxyXG4gICAgICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBhID0geC5zO1xyXG5cclxuICAgICAgICAgICAgaWQgPSAxMDtcclxuICAgICAgICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoIHksIGIgKTtcclxuICAgICAgICAgICAgYiA9IHkucztcclxuXHJcbiAgICAgICAgICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICAgICAgICAgIGlmICggIWEgfHwgIWIgKSByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICAgICAgICBpZiAoIGEgIT0gYiApIHtcclxuICAgICAgICAgICAgICAgIHkucyA9IC1iO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHgucGx1cyh5KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgICAgICAgICB5ZSA9IHkuZSAvIExPR19CQVNFLFxyXG4gICAgICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgICAgICAgIGlmICggIXhlIHx8ICF5ZSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFaXRoZXIgSW5maW5pdHk/XHJcbiAgICAgICAgICAgICAgICBpZiAoICF4YyB8fCAheWMgKSByZXR1cm4geGMgPyAoIHkucyA9IC1iLCB5ICkgOiBuZXcgQmlnTnVtYmVyKCB5YyA/IHggOiBOYU4gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICAgICAgICAgIGlmICggIXhjWzBdIHx8ICF5Y1swXSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHkgaWYgeSBpcyBub24temVybywgeCBpZiB4IGlzIG5vbi16ZXJvLCBvciB6ZXJvIGlmIGJvdGggYXJlIHplcm8uXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHljWzBdID8gKCB5LnMgPSAtYiwgeSApIDogbmV3IEJpZ051bWJlciggeGNbMF0gPyB4IDpcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJRUVFIDc1NCAoMjAwOCkgNi4zOiBuIC0gbiA9IC0wIHdoZW4gcm91bmRpbmcgdG8gLUluZmluaXR5XHJcbiAgICAgICAgICAgICAgICAgICAgICBST1VORElOR19NT0RFID09IDMgPyAtMCA6IDAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgeGUgPSBiaXRGbG9vcih4ZSk7XHJcbiAgICAgICAgICAgIHllID0gYml0Rmxvb3IoeWUpO1xyXG4gICAgICAgICAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggaXMgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgICAgICAgIGlmICggYSA9IHhlIC0geWUgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB4TFR5ID0gYSA8IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgICAgICAgICAgIHQgPSB4YztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeWUgPSB4ZTtcclxuICAgICAgICAgICAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdC5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCBiID0gYTsgYi0tOyB0LnB1c2goMCkgKTtcclxuICAgICAgICAgICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEV4cG9uZW50cyBlcXVhbC4gQ2hlY2sgZGlnaXQgYnkgZGlnaXQuXHJcbiAgICAgICAgICAgICAgICBqID0gKCB4TFR5ID0gKCBhID0geGMubGVuZ3RoICkgPCAoIGIgPSB5Yy5sZW5ndGggKSApID8gYSA6IGI7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggYSA9IGIgPSAwOyBiIDwgajsgYisrICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHhjW2JdICE9IHljW2JdICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4TFR5ID0geGNbYl0gPCB5Y1tiXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB4IDwgeT8gUG9pbnQgeGMgdG8gdGhlIGFycmF5IG9mIHRoZSBiaWdnZXIgbnVtYmVyLlxyXG4gICAgICAgICAgICBpZiAoeExUeSkgdCA9IHhjLCB4YyA9IHljLCB5YyA9IHQsIHkucyA9IC15LnM7XHJcblxyXG4gICAgICAgICAgICBiID0gKCBqID0geWMubGVuZ3RoICkgLSAoIGkgPSB4Yy5sZW5ndGggKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcyB0byB4YyBpZiBzaG9ydGVyLlxyXG4gICAgICAgICAgICAvLyBObyBuZWVkIHRvIGFkZCB6ZXJvcyB0byB5YyBpZiBzaG9ydGVyIGFzIHN1YnRyYWN0IG9ubHkgbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICAgICAgICBpZiAoIGIgPiAwICkgZm9yICggOyBiLS07IHhjW2krK10gPSAwICk7XHJcbiAgICAgICAgICAgIGIgPSBCQVNFIC0gMTtcclxuXHJcbiAgICAgICAgICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICAgICAgICAgIGZvciAoIDsgaiA+IGE7ICkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggeGNbLS1qXSA8IHljW2pdICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSBqOyBpICYmICF4Y1stLWldOyB4Y1tpXSA9IGIgKTtcclxuICAgICAgICAgICAgICAgICAgICAtLXhjW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHhjW2pdICs9IEJBU0U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgeGNbal0gLT0geWNbal07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgICAgICAgIGZvciAoIDsgeGNbMF0gPT0gMDsgeGMuc3BsaWNlKDAsIDEpLCAtLXllICk7XHJcblxyXG4gICAgICAgICAgICAvLyBaZXJvP1xyXG4gICAgICAgICAgICBpZiAoICF4Y1swXSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGb2xsb3dpbmcgSUVFRSA3NTQgKDIwMDgpIDYuMyxcclxuICAgICAgICAgICAgICAgIC8vIG4gLSBuID0gKzAgIGJ1dCAgbiAtIG4gPSAtMCAgd2hlbiByb3VuZGluZyB0b3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgICAgICAgICAgIHkucyA9IFJPVU5ESU5HX01PREUgPT0gMyA/IC0xIDogMTtcclxuICAgICAgICAgICAgICAgIHkuYyA9IFsgeS5lID0gMCBdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE5vIG5lZWQgdG8gY2hlY2sgZm9yIEluZmluaXR5IGFzICt4IC0gK3kgIT0gSW5maW5pdHkgJiYgLXggLSAteSAhPSBJbmZpbml0eVxyXG4gICAgICAgICAgICAvLyBmb3IgZmluaXRlIHggYW5kIHkuXHJcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpc2UoIHksIHhjLCB5ZSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqICAgbiAlIDAgPSAgTlxyXG4gICAgICAgICAqICAgbiAlIE4gPSAgTlxyXG4gICAgICAgICAqICAgbiAlIEkgPSAgblxyXG4gICAgICAgICAqICAgMCAlIG4gPSAgMFxyXG4gICAgICAgICAqICAtMCAlIG4gPSAtMFxyXG4gICAgICAgICAqICAgMCAlIDAgPSAgTlxyXG4gICAgICAgICAqICAgMCAlIE4gPSAgTlxyXG4gICAgICAgICAqICAgMCAlIEkgPSAgMFxyXG4gICAgICAgICAqICAgTiAlIG4gPSAgTlxyXG4gICAgICAgICAqICAgTiAlIDAgPSAgTlxyXG4gICAgICAgICAqICAgTiAlIE4gPSAgTlxyXG4gICAgICAgICAqICAgTiAlIEkgPSAgTlxyXG4gICAgICAgICAqICAgSSAlIG4gPSAgTlxyXG4gICAgICAgICAqICAgSSAlIDAgPSAgTlxyXG4gICAgICAgICAqICAgSSAlIE4gPSAgTlxyXG4gICAgICAgICAqICAgSSAlIEkgPSAgTlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbW9kdWxvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICAgICAqIEJpZ051bWJlcih5LCBiKS4gVGhlIHJlc3VsdCBkZXBlbmRzIG9uIHRoZSB2YWx1ZSBvZiBNT0RVTE9fTU9ERS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLm1vZHVsbyA9IFAubW9kID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICB2YXIgcSwgcyxcclxuICAgICAgICAgICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWQgPSAxMTtcclxuICAgICAgICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoIHksIGIgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiBOYU4gaWYgeCBpcyBJbmZpbml0eSBvciBOYU4sIG9yIHkgaXMgTmFOIG9yIHplcm8uXHJcbiAgICAgICAgICAgIGlmICggIXguYyB8fCAheS5zIHx8IHkuYyAmJiAheS5jWzBdICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiB4IGlmIHkgaXMgSW5maW5pdHkgb3IgeCBpcyB6ZXJvLlxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCAheS5jIHx8IHguYyAmJiAheC5jWzBdICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoeCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggTU9EVUxPX01PREUgPT0gOSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFdWNsaWRpYW4gZGl2aXNpb246IHEgPSBzaWduKHkpICogZmxvb3IoeCAvIGFicyh5KSlcclxuICAgICAgICAgICAgICAgIC8vIHIgPSB4IC0gcXkgICAgd2hlcmUgIDAgPD0gciA8IGFicyh5KVxyXG4gICAgICAgICAgICAgICAgcyA9IHkucztcclxuICAgICAgICAgICAgICAgIHkucyA9IDE7XHJcbiAgICAgICAgICAgICAgICBxID0gZGl2KCB4LCB5LCAwLCAzICk7XHJcbiAgICAgICAgICAgICAgICB5LnMgPSBzO1xyXG4gICAgICAgICAgICAgICAgcS5zICo9IHM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBxID0gZGl2KCB4LCB5LCAwLCBNT0RVTE9fTU9ERSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geC5taW51cyggcS50aW1lcyh5KSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG5lZ2F0ZWQsXHJcbiAgICAgICAgICogaS5lLiBtdWx0aXBsaWVkIGJ5IC0xLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAubmVnYXRlZCA9IFAubmVnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgICAgICAgIHgucyA9IC14LnMgfHwgbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogIG4gKyAwID0gblxyXG4gICAgICAgICAqICBuICsgTiA9IE5cclxuICAgICAgICAgKiAgbiArIEkgPSBJXHJcbiAgICAgICAgICogIDAgKyBuID0gblxyXG4gICAgICAgICAqICAwICsgMCA9IDBcclxuICAgICAgICAgKiAgMCArIE4gPSBOXHJcbiAgICAgICAgICogIDAgKyBJID0gSVxyXG4gICAgICAgICAqICBOICsgbiA9IE5cclxuICAgICAgICAgKiAgTiArIDAgPSBOXHJcbiAgICAgICAgICogIE4gKyBOID0gTlxyXG4gICAgICAgICAqICBOICsgSSA9IE5cclxuICAgICAgICAgKiAgSSArIG4gPSBJXHJcbiAgICAgICAgICogIEkgKyAwID0gSVxyXG4gICAgICAgICAqICBJICsgTiA9IE5cclxuICAgICAgICAgKiAgSSArIEkgPSBJXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBwbHVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICAgICAqIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnBsdXMgPSBQLmFkZCA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgdmFyIHQsXHJcbiAgICAgICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICAgICAgICBpZCA9IDEyO1xyXG4gICAgICAgICAgICB5ID0gbmV3IEJpZ051bWJlciggeSwgYiApO1xyXG4gICAgICAgICAgICBiID0geS5zO1xyXG5cclxuICAgICAgICAgICAgLy8gRWl0aGVyIE5hTj9cclxuICAgICAgICAgICAgaWYgKCAhYSB8fCAhYiApIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAgICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICAgICAgICBpZiAoIGEgIT0gYiApIHtcclxuICAgICAgICAgICAgICAgIHkucyA9IC1iO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB4ZSA9IHguZSAvIExPR19CQVNFLFxyXG4gICAgICAgICAgICAgICAgeWUgPSB5LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICAgICAgICBpZiAoICF4ZSB8fCAheWUgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIMKxSW5maW5pdHkgaWYgZWl0aGVyIMKxSW5maW5pdHkuXHJcbiAgICAgICAgICAgICAgICBpZiAoICF4YyB8fCAheWMgKSByZXR1cm4gbmV3IEJpZ051bWJlciggYSAvIDAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICAgICAgICAgIC8vIFJldHVybiB5IGlmIHkgaXMgbm9uLXplcm8sIHggaWYgeCBpcyBub24temVybywgb3IgemVybyBpZiBib3RoIGFyZSB6ZXJvLlxyXG4gICAgICAgICAgICAgICAgaWYgKCAheGNbMF0gfHwgIXljWzBdICkgcmV0dXJuIHljWzBdID8geSA6IG5ldyBCaWdOdW1iZXIoIHhjWzBdID8geCA6IGEgKiAwICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHhlID0gYml0Rmxvb3IoeGUpO1xyXG4gICAgICAgICAgICB5ZSA9IGJpdEZsb29yKHllKTtcclxuICAgICAgICAgICAgeGMgPSB4Yy5zbGljZSgpO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuIEZhc3RlciB0byB1c2UgcmV2ZXJzZSB0aGVuIGRvIHVuc2hpZnRzLlxyXG4gICAgICAgICAgICBpZiAoIGEgPSB4ZSAtIHllICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBhID4gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgICAgICAgICAgIHQgPSB5YztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgICAgICAgICAgIHQgPSB4YztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgICAgIGZvciAoIDsgYS0tOyB0LnB1c2goMCkgKTtcclxuICAgICAgICAgICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhID0geGMubGVuZ3RoO1xyXG4gICAgICAgICAgICBiID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgLy8gUG9pbnQgeGMgdG8gdGhlIGxvbmdlciBhcnJheSwgYW5kIGIgdG8gdGhlIHNob3J0ZXIgbGVuZ3RoLlxyXG4gICAgICAgICAgICBpZiAoIGEgLSBiIDwgMCApIHQgPSB5YywgeWMgPSB4YywgeGMgPSB0LCBiID0gYTtcclxuXHJcbiAgICAgICAgICAgIC8vIE9ubHkgc3RhcnQgYWRkaW5nIGF0IHljLmxlbmd0aCAtIDEgYXMgdGhlIGZ1cnRoZXIgZGlnaXRzIG9mIHhjIGNhbiBiZSBpZ25vcmVkLlxyXG4gICAgICAgICAgICBmb3IgKCBhID0gMDsgYjsgKSB7XHJcbiAgICAgICAgICAgICAgICBhID0gKCB4Y1stLWJdID0geGNbYl0gKyB5Y1tiXSArIGEgKSAvIEJBU0UgfCAwO1xyXG4gICAgICAgICAgICAgICAgeGNbYl0gPSBCQVNFID09PSB4Y1tiXSA/IDAgOiB4Y1tiXSAlIEJBU0U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhKSB7XHJcbiAgICAgICAgICAgICAgICB4YyA9IFthXS5jb25jYXQoeGMpO1xyXG4gICAgICAgICAgICAgICAgKyt5ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG4gICAgICAgICAgICAvLyB5ZSA9IE1BWF9FWFAgKyAxIHBvc3NpYmxlXHJcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpc2UoIHksIHhjLCB5ZSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0aGUgbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0cyBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbel0ge2Jvb2xlYW58bnVtYmVyfSBXaGV0aGVyIHRvIGNvdW50IGludGVnZXItcGFydCB0cmFpbGluZyB6ZXJvczogdHJ1ZSwgZmFsc2UsIDEgb3IgMC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnByZWNpc2lvbiA9IFAuc2QgPSBmdW5jdGlvbiAoeikge1xyXG4gICAgICAgICAgICB2YXIgbiwgdixcclxuICAgICAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgYyA9IHguYztcclxuXHJcbiAgICAgICAgICAgIC8vICdwcmVjaXNpb24oKSBhcmd1bWVudCBub3QgYSBib29sZWFuIG9yIGJpbmFyeSBkaWdpdDoge3p9J1xyXG4gICAgICAgICAgICBpZiAoIHogIT0gbnVsbCAmJiB6ICE9PSAhIXogJiYgeiAhPT0gMSAmJiB6ICE9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKEVSUk9SUykgcmFpc2UoIDEzLCAnYXJndW1lbnQnICsgbm90Qm9vbCwgeiApO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB6ICE9ICEheiApIHogPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoICFjICkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIHYgPSBjLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIG4gPSB2ICogTE9HX0JBU0UgKyAxO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB2ID0gY1t2XSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCB0aGUgbnVtYmVyIG9mIHRyYWlsaW5nIHplcm9zIG9mIHRoZSBsYXN0IGVsZW1lbnQuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCA7IHYgJSAxMCA9PSAwOyB2IC89IDEwLCBuLS0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2YgdGhlIGZpcnN0IGVsZW1lbnQuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2ID0gY1swXTsgdiA+PSAxMDsgdiAvPSAxMCwgbisrICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggeiAmJiB4LmUgKyAxID4gbiApIG4gPSB4LmUgKyAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG47XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgcm91bmRlZCB0byBhIG1heGltdW0gb2ZcclxuICAgICAgICAgKiBkcCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciB0byAwIGFuZCBST1VORElOR19NT0RFIHJlc3BlY3RpdmVseSBpZlxyXG4gICAgICAgICAqIG9taXR0ZWQuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogJ3JvdW5kKCkgZGVjaW1hbCBwbGFjZXMgb3V0IG9mIHJhbmdlOiB7ZHB9J1xyXG4gICAgICAgICAqICdyb3VuZCgpIGRlY2ltYWwgcGxhY2VzIG5vdCBhbiBpbnRlZ2VyOiB7ZHB9J1xyXG4gICAgICAgICAqICdyb3VuZCgpIHJvdW5kaW5nIG1vZGUgbm90IGFuIGludGVnZXI6IHtybX0nXHJcbiAgICAgICAgICogJ3JvdW5kKCkgcm91bmRpbmcgbW9kZSBvdXQgb2YgcmFuZ2U6IHtybX0nXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5yb3VuZCA9IGZ1bmN0aW9uICggZHAsIHJtICkge1xyXG4gICAgICAgICAgICB2YXIgbiA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRwID09IG51bGwgfHwgaXNWYWxpZEludCggZHAsIDAsIE1BWCwgMTUgKSApIHtcclxuICAgICAgICAgICAgICAgIHJvdW5kKCBuLCB+fmRwICsgdGhpcy5lICsgMSwgcm0gPT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAgICAgICAhaXNWYWxpZEludCggcm0sIDAsIDgsIDE1LCByb3VuZGluZ01vZGUgKSA/IFJPVU5ESU5HX01PREUgOiBybSB8IDAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG47XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgc2hpZnRlZCBieSBrIHBsYWNlc1xyXG4gICAgICAgICAqIChwb3dlcnMgb2YgMTApLiBTaGlmdCB0byB0aGUgcmlnaHQgaWYgbiA+IDAsIGFuZCB0byB0aGUgbGVmdCBpZiBuIDwgMC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIGsge251bWJlcn0gSW50ZWdlciwgLU1BWF9TQUZFX0lOVEVHRVIgdG8gTUFYX1NBRkVfSU5URUdFUiBpbmNsdXNpdmUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBJZiBrIGlzIG91dCBvZiByYW5nZSBhbmQgRVJST1JTIGlzIGZhbHNlLCB0aGUgcmVzdWx0IHdpbGwgYmUgwrEwIGlmIGsgPCAwLCBvciDCsUluZmluaXR5XHJcbiAgICAgICAgICogb3RoZXJ3aXNlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogJ3NoaWZ0KCkgYXJndW1lbnQgbm90IGFuIGludGVnZXI6IHtrfSdcclxuICAgICAgICAgKiAnc2hpZnQoKSBhcmd1bWVudCBvdXQgb2YgcmFuZ2U6IHtrfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnNoaWZ0ID0gZnVuY3Rpb24gKGspIHtcclxuICAgICAgICAgICAgdmFyIG4gPSB0aGlzO1xyXG4gICAgICAgICAgICByZXR1cm4gaXNWYWxpZEludCggaywgLU1BWF9TQUZFX0lOVEVHRVIsIE1BWF9TQUZFX0lOVEVHRVIsIDE2LCAnYXJndW1lbnQnIClcclxuXHJcbiAgICAgICAgICAgICAgLy8gayA8IDFlKzIxLCBvciB0cnVuY2F0ZShrKSB3aWxsIHByb2R1Y2UgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgICAgICAgICAgPyBuLnRpbWVzKCAnMWUnICsgdHJ1bmNhdGUoaykgKVxyXG4gICAgICAgICAgICAgIDogbmV3IEJpZ051bWJlciggbi5jICYmIG4uY1swXSAmJiAoIGsgPCAtTUFYX1NBRkVfSU5URUdFUiB8fCBrID4gTUFYX1NBRkVfSU5URUdFUiApXHJcbiAgICAgICAgICAgICAgICA/IG4ucyAqICggayA8IDAgPyAwIDogMSAvIDAgKVxyXG4gICAgICAgICAgICAgICAgOiBuICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogIHNxcnQoLW4pID0gIE5cclxuICAgICAgICAgKiAgc3FydCggTikgPSAgTlxyXG4gICAgICAgICAqICBzcXJ0KC1JKSA9ICBOXHJcbiAgICAgICAgICogIHNxcnQoIEkpID0gIElcclxuICAgICAgICAgKiAgc3FydCggMCkgPSAgMFxyXG4gICAgICAgICAqICBzcXJ0KC0wKSA9IC0wXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsXHJcbiAgICAgICAgICogcm91bmRlZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5zcXVhcmVSb290ID0gUC5zcXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbSwgbiwgciwgcmVwLCB0LFxyXG4gICAgICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBjID0geC5jLFxyXG4gICAgICAgICAgICAgICAgcyA9IHgucyxcclxuICAgICAgICAgICAgICAgIGUgPSB4LmUsXHJcbiAgICAgICAgICAgICAgICBkcCA9IERFQ0lNQUxfUExBQ0VTICsgNCxcclxuICAgICAgICAgICAgICAgIGhhbGYgPSBuZXcgQmlnTnVtYmVyKCcwLjUnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE5lZ2F0aXZlL05hTi9JbmZpbml0eS96ZXJvP1xyXG4gICAgICAgICAgICBpZiAoIHMgIT09IDEgfHwgIWMgfHwgIWNbMF0gKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlciggIXMgfHwgcyA8IDAgJiYgKCAhYyB8fCBjWzBdICkgPyBOYU4gOiBjID8geCA6IDEgLyAwICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEluaXRpYWwgZXN0aW1hdGUuXHJcbiAgICAgICAgICAgIHMgPSBNYXRoLnNxcnQoICt4ICk7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXRoLnNxcnQgdW5kZXJmbG93L292ZXJmbG93P1xyXG4gICAgICAgICAgICAvLyBQYXNzIHggdG8gTWF0aC5zcXJ0IGFzIGludGVnZXIsIHRoZW4gYWRqdXN0IHRoZSBleHBvbmVudCBvZiB0aGUgcmVzdWx0LlxyXG4gICAgICAgICAgICBpZiAoIHMgPT0gMCB8fCBzID09IDEgLyAwICkge1xyXG4gICAgICAgICAgICAgICAgbiA9IGNvZWZmVG9TdHJpbmcoYyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoICggbi5sZW5ndGggKyBlICkgJSAyID09IDAgKSBuICs9ICcwJztcclxuICAgICAgICAgICAgICAgIHMgPSBNYXRoLnNxcnQobik7XHJcbiAgICAgICAgICAgICAgICBlID0gYml0Rmxvb3IoICggZSArIDEgKSAvIDIgKSAtICggZSA8IDAgfHwgZSAlIDIgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHMgPT0gMSAvIDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbiA9ICcxZScgKyBlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBuID0gcy50b0V4cG9uZW50aWFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbiA9IG4uc2xpY2UoIDAsIG4uaW5kZXhPZignZScpICsgMSApICsgZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByID0gbmV3IEJpZ051bWJlcihuKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKCBzICsgJycgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHplcm8uXHJcbiAgICAgICAgICAgIC8vIHIgY291bGQgYmUgemVybyBpZiBNSU5fRVhQIGlzIGNoYW5nZWQgYWZ0ZXIgdGhlIHRoaXMgdmFsdWUgd2FzIGNyZWF0ZWQuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgd291bGQgY2F1c2UgYSBkaXZpc2lvbiBieSB6ZXJvICh4L3QpIGFuZCBoZW5jZSBJbmZpbml0eSBiZWxvdywgd2hpY2ggd291bGQgY2F1c2VcclxuICAgICAgICAgICAgLy8gY29lZmZUb1N0cmluZyB0byB0aHJvdy5cclxuICAgICAgICAgICAgaWYgKCByLmNbMF0gKSB7XHJcbiAgICAgICAgICAgICAgICBlID0gci5lO1xyXG4gICAgICAgICAgICAgICAgcyA9IGUgKyBkcDtcclxuICAgICAgICAgICAgICAgIGlmICggcyA8IDMgKSBzID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBOZXd0b24tUmFwaHNvbiBpdGVyYXRpb24uXHJcbiAgICAgICAgICAgICAgICBmb3IgKCA7IDsgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdCA9IHI7XHJcbiAgICAgICAgICAgICAgICAgICAgciA9IGhhbGYudGltZXMoIHQucGx1cyggZGl2KCB4LCB0LCBkcCwgMSApICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjb2VmZlRvU3RyaW5nKCB0LmMgICApLnNsaWNlKCAwLCBzICkgPT09ICggbiA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb2VmZlRvU3RyaW5nKCByLmMgKSApLnNsaWNlKCAwLCBzICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgZXhwb25lbnQgb2YgciBtYXkgaGVyZSBiZSBvbmUgbGVzcyB0aGFuIHRoZSBmaW5hbCByZXN1bHQgZXhwb25lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGUuZyAwLjAwMDk5OTkgKGUtNCkgLS0+IDAuMDAxIChlLTMpLCBzbyBhZGp1c3QgcyBzbyB0aGUgcm91bmRpbmcgZGlnaXRzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFyZSBpbmRleGVkIGNvcnJlY3RseS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByLmUgPCBlICkgLS1zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuID0gbi5zbGljZSggcyAtIDMsIHMgKyAxICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgNHRoIHJvdW5kaW5nIGRpZ2l0IG1heSBiZSBpbiBlcnJvciBieSAtMSBzbyBpZiB0aGUgNCByb3VuZGluZyBkaWdpdHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXJlIDk5OTkgb3IgNDk5OSAoaS5lLiBhcHByb2FjaGluZyBhIHJvdW5kaW5nIGJvdW5kYXJ5KSBjb250aW51ZSB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG4gPT0gJzk5OTknIHx8ICFyZXAgJiYgbiA9PSAnNDk5OScgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT24gdGhlIGZpcnN0IGl0ZXJhdGlvbiBvbmx5LCBjaGVjayB0byBzZWUgaWYgcm91bmRpbmcgdXAgZ2l2ZXMgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleGFjdCByZXN1bHQgYXMgdGhlIG5pbmVzIG1heSBpbmZpbml0ZWx5IHJlcGVhdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIXJlcCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3VuZCggdCwgdC5lICsgREVDSU1BTF9QTEFDRVMgKyAyLCAwICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdC50aW1lcyh0KS5lcSh4KSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcCArPSA0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcyArPSA0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiByb3VuZGluZyBkaWdpdHMgYXJlIG51bGwsIDB7MCw0fSBvciA1MHswLDN9LCBjaGVjayBmb3IgZXhhY3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlc3VsdC4gSWYgbm90LCB0aGVuIHRoZXJlIGFyZSBmdXJ0aGVyIGRpZ2l0cyBhbmQgbSB3aWxsIGJlIHRydXRoeS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIStuIHx8ICErbi5zbGljZSgxKSAmJiBuLmNoYXJBdCgwKSA9PSAnNScgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRydW5jYXRlIHRvIHRoZSBmaXJzdCByb3VuZGluZyBkaWdpdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3VuZCggciwgci5lICsgREVDSU1BTF9QTEFDRVMgKyAyLCAxICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbSA9ICFyLnRpbWVzKHIpLmVxKHgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcm91bmQoIHIsIHIuZSArIERFQ0lNQUxfUExBQ0VTICsgMSwgUk9VTkRJTkdfTU9ERSwgbSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqICBuICogMCA9IDBcclxuICAgICAgICAgKiAgbiAqIE4gPSBOXHJcbiAgICAgICAgICogIG4gKiBJID0gSVxyXG4gICAgICAgICAqICAwICogbiA9IDBcclxuICAgICAgICAgKiAgMCAqIDAgPSAwXHJcbiAgICAgICAgICogIDAgKiBOID0gTlxyXG4gICAgICAgICAqICAwICogSSA9IE5cclxuICAgICAgICAgKiAgTiAqIG4gPSBOXHJcbiAgICAgICAgICogIE4gKiAwID0gTlxyXG4gICAgICAgICAqICBOICogTiA9IE5cclxuICAgICAgICAgKiAgTiAqIEkgPSBOXHJcbiAgICAgICAgICogIEkgKiBuID0gSVxyXG4gICAgICAgICAqICBJICogMCA9IE5cclxuICAgICAgICAgKiAgSSAqIE4gPSBOXHJcbiAgICAgICAgICogIEkgKiBJID0gSVxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgdGltZXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudGltZXMgPSBQLm11bCA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgdmFyIGMsIGUsIGksIGosIGssIG0sIHhjTCwgeGxvLCB4aGksIHljTCwgeWxvLCB5aGksIHpjLFxyXG4gICAgICAgICAgICAgICAgYmFzZSwgc3FydEJhc2UsXHJcbiAgICAgICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICAgICAgeWMgPSAoIGlkID0gMTcsIHkgPSBuZXcgQmlnTnVtYmVyKCB5LCBiICkgKS5jO1xyXG5cclxuICAgICAgICAgICAgLy8gRWl0aGVyIE5hTiwgwrFJbmZpbml0eSBvciDCsTA/XHJcbiAgICAgICAgICAgIGlmICggIXhjIHx8ICF5YyB8fCAheGNbMF0gfHwgIXljWzBdICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJldHVybiBOYU4gaWYgZWl0aGVyIGlzIE5hTiwgb3Igb25lIGlzIDAgYW5kIHRoZSBvdGhlciBpcyBJbmZpbml0eS5cclxuICAgICAgICAgICAgICAgIGlmICggIXgucyB8fCAheS5zIHx8IHhjICYmICF4Y1swXSAmJiAheWMgfHwgeWMgJiYgIXljWzBdICYmICF4YyApIHtcclxuICAgICAgICAgICAgICAgICAgICB5LmMgPSB5LmUgPSB5LnMgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB5LnMgKj0geC5zO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgaXMgwrFJbmZpbml0eS5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICF4YyB8fCAheWMgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHkuYyA9IHkuZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiDCsTAgaWYgZWl0aGVyIGlzIMKxMC5cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5LmMgPSBbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHkuZSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB5O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlID0gYml0Rmxvb3IoIHguZSAvIExPR19CQVNFICkgKyBiaXRGbG9vciggeS5lIC8gTE9HX0JBU0UgKTtcclxuICAgICAgICAgICAgeS5zICo9IHgucztcclxuICAgICAgICAgICAgeGNMID0geGMubGVuZ3RoO1xyXG4gICAgICAgICAgICB5Y0wgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAvLyBFbnN1cmUgeGMgcG9pbnRzIHRvIGxvbmdlciBhcnJheSBhbmQgeGNMIHRvIGl0cyBsZW5ndGguXHJcbiAgICAgICAgICAgIGlmICggeGNMIDwgeWNMICkgemMgPSB4YywgeGMgPSB5YywgeWMgPSB6YywgaSA9IHhjTCwgeGNMID0geWNMLCB5Y0wgPSBpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGlzZSB0aGUgcmVzdWx0IGFycmF5IHdpdGggemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoIGkgPSB4Y0wgKyB5Y0wsIHpjID0gW107IGktLTsgemMucHVzaCgwKSApO1xyXG5cclxuICAgICAgICAgICAgYmFzZSA9IEJBU0U7XHJcbiAgICAgICAgICAgIHNxcnRCYXNlID0gU1FSVF9CQVNFO1xyXG5cclxuICAgICAgICAgICAgZm9yICggaSA9IHljTDsgLS1pID49IDA7ICkge1xyXG4gICAgICAgICAgICAgICAgYyA9IDA7XHJcbiAgICAgICAgICAgICAgICB5bG8gPSB5Y1tpXSAlIHNxcnRCYXNlO1xyXG4gICAgICAgICAgICAgICAgeWhpID0geWNbaV0gLyBzcXJ0QmFzZSB8IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggayA9IHhjTCwgaiA9IGkgKyBrOyBqID4gaTsgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeGxvID0geGNbLS1rXSAlIHNxcnRCYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHhoaSA9IHhjW2tdIC8gc3FydEJhc2UgfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIG0gPSB5aGkgKiB4bG8gKyB4aGkgKiB5bG87XHJcbiAgICAgICAgICAgICAgICAgICAgeGxvID0geWxvICogeGxvICsgKCAoIG0gJSBzcXJ0QmFzZSApICogc3FydEJhc2UgKSArIHpjW2pdICsgYztcclxuICAgICAgICAgICAgICAgICAgICBjID0gKCB4bG8gLyBiYXNlIHwgMCApICsgKCBtIC8gc3FydEJhc2UgfCAwICkgKyB5aGkgKiB4aGk7XHJcbiAgICAgICAgICAgICAgICAgICAgemNbai0tXSA9IHhsbyAlIGJhc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgemNbal0gPSBjO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYykge1xyXG4gICAgICAgICAgICAgICAgKytlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgemMuc3BsaWNlKDAsIDEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbm9ybWFsaXNlKCB5LCB6YywgZSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSBtYXhpbXVtIG9mXHJcbiAgICAgICAgICogc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFtzZF0ge251bWJlcn0gU2lnbmlmaWNhbnQgZGlnaXRzLiBJbnRlZ2VyLCAxIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogJ3RvRGlnaXRzKCkgcHJlY2lzaW9uIG91dCBvZiByYW5nZToge3NkfSdcclxuICAgICAgICAgKiAndG9EaWdpdHMoKSBwcmVjaXNpb24gbm90IGFuIGludGVnZXI6IHtzZH0nXHJcbiAgICAgICAgICogJ3RvRGlnaXRzKCkgcm91bmRpbmcgbW9kZSBub3QgYW4gaW50ZWdlcjoge3JtfSdcclxuICAgICAgICAgKiAndG9EaWdpdHMoKSByb3VuZGluZyBtb2RlIG91dCBvZiByYW5nZToge3JtfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRvRGlnaXRzID0gZnVuY3Rpb24gKCBzZCwgcm0gKSB7XHJcbiAgICAgICAgICAgIHZhciBuID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgICAgICAgc2QgPSBzZCA9PSBudWxsIHx8ICFpc1ZhbGlkSW50KCBzZCwgMSwgTUFYLCAxOCwgJ3ByZWNpc2lvbicgKSA/IG51bGwgOiBzZCB8IDA7XHJcbiAgICAgICAgICAgIHJtID0gcm0gPT0gbnVsbCB8fCAhaXNWYWxpZEludCggcm0sIDAsIDgsIDE4LCByb3VuZGluZ01vZGUgKSA/IFJPVU5ESU5HX01PREUgOiBybSB8IDA7XHJcbiAgICAgICAgICAgIHJldHVybiBzZCA/IHJvdW5kKCBuLCBzZCwgcm0gKSA6IG47XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZXhwb25lbnRpYWwgbm90YXRpb24gYW5kXHJcbiAgICAgICAgICogcm91bmRlZCB1c2luZyBST1VORElOR19NT0RFIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICd0b0V4cG9uZW50aWFsKCkgZGVjaW1hbCBwbGFjZXMgbm90IGFuIGludGVnZXI6IHtkcH0nXHJcbiAgICAgICAgICogJ3RvRXhwb25lbnRpYWwoKSBkZWNpbWFsIHBsYWNlcyBvdXQgb2YgcmFuZ2U6IHtkcH0nXHJcbiAgICAgICAgICogJ3RvRXhwb25lbnRpYWwoKSByb3VuZGluZyBtb2RlIG5vdCBhbiBpbnRlZ2VyOiB7cm19J1xyXG4gICAgICAgICAqICd0b0V4cG9uZW50aWFsKCkgcm91bmRpbmcgbW9kZSBvdXQgb2YgcmFuZ2U6IHtybX0nXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC50b0V4cG9uZW50aWFsID0gZnVuY3Rpb24gKCBkcCwgcm0gKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXQoIHRoaXMsXHJcbiAgICAgICAgICAgICAgZHAgIT0gbnVsbCAmJiBpc1ZhbGlkSW50KCBkcCwgMCwgTUFYLCAxOSApID8gfn5kcCArIDEgOiBudWxsLCBybSwgMTkgKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiByb3VuZGluZ1xyXG4gICAgICAgICAqIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIE5vdGU6IGFzIHdpdGggSmF2YVNjcmlwdCdzIG51bWJlciB0eXBlLCAoLTApLnRvRml4ZWQoMCkgaXMgJzAnLFxyXG4gICAgICAgICAqIGJ1dCBlLmcuICgtMC4wMDAwMSkudG9GaXhlZCgwKSBpcyAnLTAnLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICd0b0ZpeGVkKCkgZGVjaW1hbCBwbGFjZXMgbm90IGFuIGludGVnZXI6IHtkcH0nXHJcbiAgICAgICAgICogJ3RvRml4ZWQoKSBkZWNpbWFsIHBsYWNlcyBvdXQgb2YgcmFuZ2U6IHtkcH0nXHJcbiAgICAgICAgICogJ3RvRml4ZWQoKSByb3VuZGluZyBtb2RlIG5vdCBhbiBpbnRlZ2VyOiB7cm19J1xyXG4gICAgICAgICAqICd0b0ZpeGVkKCkgcm91bmRpbmcgbW9kZSBvdXQgb2YgcmFuZ2U6IHtybX0nXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC50b0ZpeGVkID0gZnVuY3Rpb24gKCBkcCwgcm0gKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXQoIHRoaXMsIGRwICE9IG51bGwgJiYgaXNWYWxpZEludCggZHAsIDAsIE1BWCwgMjAgKVxyXG4gICAgICAgICAgICAgID8gfn5kcCArIHRoaXMuZSArIDEgOiBudWxsLCBybSwgMjAgKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiByb3VuZGVkXHJcbiAgICAgICAgICogdXNpbmcgcm0gb3IgUk9VTkRJTkdfTU9ERSB0byBkcCBkZWNpbWFsIHBsYWNlcywgYW5kIGZvcm1hdHRlZCBhY2NvcmRpbmcgdG8gdGhlIHByb3BlcnRpZXNcclxuICAgICAgICAgKiBvZiB0aGUgRk9STUFUIG9iamVjdCAoc2VlIEJpZ051bWJlci5jb25maWcpLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogRk9STUFUID0ge1xyXG4gICAgICAgICAqICAgICAgZGVjaW1hbFNlcGFyYXRvciA6ICcuJyxcclxuICAgICAgICAgKiAgICAgIGdyb3VwU2VwYXJhdG9yIDogJywnLFxyXG4gICAgICAgICAqICAgICAgZ3JvdXBTaXplIDogMyxcclxuICAgICAgICAgKiAgICAgIHNlY29uZGFyeUdyb3VwU2l6ZSA6IDAsXHJcbiAgICAgICAgICogICAgICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yIDogJ1xceEEwJywgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgICAgICogICAgICBmcmFjdGlvbkdyb3VwU2l6ZSA6IDBcclxuICAgICAgICAgKiB9O1xyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICd0b0Zvcm1hdCgpIGRlY2ltYWwgcGxhY2VzIG5vdCBhbiBpbnRlZ2VyOiB7ZHB9J1xyXG4gICAgICAgICAqICd0b0Zvcm1hdCgpIGRlY2ltYWwgcGxhY2VzIG91dCBvZiByYW5nZToge2RwfSdcclxuICAgICAgICAgKiAndG9Gb3JtYXQoKSByb3VuZGluZyBtb2RlIG5vdCBhbiBpbnRlZ2VyOiB7cm19J1xyXG4gICAgICAgICAqICd0b0Zvcm1hdCgpIHJvdW5kaW5nIG1vZGUgb3V0IG9mIHJhbmdlOiB7cm19J1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudG9Gb3JtYXQgPSBmdW5jdGlvbiAoIGRwLCBybSApIHtcclxuICAgICAgICAgICAgdmFyIHN0ciA9IGZvcm1hdCggdGhpcywgZHAgIT0gbnVsbCAmJiBpc1ZhbGlkSW50KCBkcCwgMCwgTUFYLCAyMSApXHJcbiAgICAgICAgICAgICAgPyB+fmRwICsgdGhpcy5lICsgMSA6IG51bGwsIHJtLCAyMSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmMgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaSxcclxuICAgICAgICAgICAgICAgICAgICBhcnIgPSBzdHIuc3BsaXQoJy4nKSxcclxuICAgICAgICAgICAgICAgICAgICBnMSA9ICtGT1JNQVQuZ3JvdXBTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIGcyID0gK0ZPUk1BVC5zZWNvbmRhcnlHcm91cFNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXBhcmF0b3IgPSBGT1JNQVQuZ3JvdXBTZXBhcmF0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgaW50UGFydCA9IGFyclswXSxcclxuICAgICAgICAgICAgICAgICAgICBmcmFjdGlvblBhcnQgPSBhcnJbMV0sXHJcbiAgICAgICAgICAgICAgICAgICAgaXNOZWcgPSB0aGlzLnMgPCAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGludERpZ2l0cyA9IGlzTmVnID8gaW50UGFydC5zbGljZSgxKSA6IGludFBhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVuID0gaW50RGlnaXRzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZzIpIGkgPSBnMSwgZzEgPSBnMiwgZzIgPSBpLCBsZW4gLT0gaTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGcxID4gMCAmJiBsZW4gPiAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGkgPSBsZW4gJSBnMSB8fCBnMTtcclxuICAgICAgICAgICAgICAgICAgICBpbnRQYXJ0ID0gaW50RGlnaXRzLnN1YnN0ciggMCwgaSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IGkgPCBsZW47IGkgKz0gZzEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc3Vic3RyKCBpLCBnMSApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBnMiA+IDAgKSBpbnRQYXJ0ICs9IGdyb3VwU2VwYXJhdG9yICsgaW50RGlnaXRzLnNsaWNlKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc05lZykgaW50UGFydCA9ICctJyArIGludFBhcnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc3RyID0gZnJhY3Rpb25QYXJ0XHJcbiAgICAgICAgICAgICAgICAgID8gaW50UGFydCArIEZPUk1BVC5kZWNpbWFsU2VwYXJhdG9yICsgKCAoIGcyID0gK0ZPUk1BVC5mcmFjdGlvbkdyb3VwU2l6ZSApXHJcbiAgICAgICAgICAgICAgICAgICAgPyBmcmFjdGlvblBhcnQucmVwbGFjZSggbmV3IFJlZ0V4cCggJ1xcXFxkeycgKyBnMiArICd9XFxcXEInLCAnZycgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICckJicgKyBGT1JNQVQuZnJhY3Rpb25Hcm91cFNlcGFyYXRvciApXHJcbiAgICAgICAgICAgICAgICAgICAgOiBmcmFjdGlvblBhcnQgKVxyXG4gICAgICAgICAgICAgICAgICA6IGludFBhcnQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgc3RyaW5nIGFycmF5IHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgYXMgYSBzaW1wbGUgZnJhY3Rpb24gd2l0aFxyXG4gICAgICAgICAqIGFuIGludGVnZXIgbnVtZXJhdG9yIGFuZCBhbiBpbnRlZ2VyIGRlbm9taW5hdG9yLiBUaGUgZGVub21pbmF0b3Igd2lsbCBiZSBhIHBvc2l0aXZlXHJcbiAgICAgICAgICogbm9uLXplcm8gdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBzcGVjaWZpZWQgbWF4aW11bSBkZW5vbWluYXRvci4gSWYgYSBtYXhpbXVtXHJcbiAgICAgICAgICogZGVub21pbmF0b3IgaXMgbm90IHNwZWNpZmllZCwgdGhlIGRlbm9taW5hdG9yIHdpbGwgYmUgdGhlIGxvd2VzdCB2YWx1ZSBuZWNlc3NhcnkgdG9cclxuICAgICAgICAgKiByZXByZXNlbnQgdGhlIG51bWJlciBleGFjdGx5LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogW21kXSB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IEludGVnZXIgPj0gMSBhbmQgPCBJbmZpbml0eS4gVGhlIG1heGltdW0gZGVub21pbmF0b3IuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAndG9GcmFjdGlvbigpIG1heCBkZW5vbWluYXRvciBub3QgYW4gaW50ZWdlcjoge21kfSdcclxuICAgICAgICAgKiAndG9GcmFjdGlvbigpIG1heCBkZW5vbWluYXRvciBvdXQgb2YgcmFuZ2U6IHttZH0nXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC50b0ZyYWN0aW9uID0gZnVuY3Rpb24gKG1kKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIsIGQwLCBkMiwgZSwgZXhwLCBuLCBuMCwgcSwgcyxcclxuICAgICAgICAgICAgICAgIGsgPSBFUlJPUlMsXHJcbiAgICAgICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICAgICAgZCA9IG5ldyBCaWdOdW1iZXIoT05FKSxcclxuICAgICAgICAgICAgICAgIG4xID0gZDAgPSBuZXcgQmlnTnVtYmVyKE9ORSksXHJcbiAgICAgICAgICAgICAgICBkMSA9IG4wID0gbmV3IEJpZ051bWJlcihPTkUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBtZCAhPSBudWxsICkge1xyXG4gICAgICAgICAgICAgICAgRVJST1JTID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBuID0gbmV3IEJpZ051bWJlcihtZCk7XHJcbiAgICAgICAgICAgICAgICBFUlJPUlMgPSBrO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggISggayA9IG4uaXNJbnQoKSApIHx8IG4ubHQoT05FKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEVSUk9SUykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByYWlzZSggMjIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ21heCBkZW5vbWluYXRvciAnICsgKCBrID8gJ291dCBvZiByYW5nZScgOiAnbm90IGFuIGludGVnZXInICksIG1kICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBFUlJPUlMgaXMgZmFsc2U6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgbWQgaXMgYSBmaW5pdGUgbm9uLWludGVnZXIgPj0gMSwgcm91bmQgaXQgdG8gYW4gaW50ZWdlciBhbmQgdXNlIGl0LlxyXG4gICAgICAgICAgICAgICAgICAgIG1kID0gIWsgJiYgbi5jICYmIHJvdW5kKCBuLCBuLmUgKyAxLCAxICkuZ3RlKE9ORSkgPyBuIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCAheGMgKSByZXR1cm4geC50b1N0cmluZygpO1xyXG4gICAgICAgICAgICBzID0gY29lZmZUb1N0cmluZyh4Yyk7XHJcblxyXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgaW5pdGlhbCBkZW5vbWluYXRvci5cclxuICAgICAgICAgICAgLy8gZCBpcyBhIHBvd2VyIG9mIDEwIGFuZCB0aGUgbWluaW11bSBtYXggZGVub21pbmF0b3IgdGhhdCBzcGVjaWZpZXMgdGhlIHZhbHVlIGV4YWN0bHkuXHJcbiAgICAgICAgICAgIGUgPSBkLmUgPSBzLmxlbmd0aCAtIHguZSAtIDE7XHJcbiAgICAgICAgICAgIGQuY1swXSA9IFBPV1NfVEVOWyAoIGV4cCA9IGUgJSBMT0dfQkFTRSApIDwgMCA/IExPR19CQVNFICsgZXhwIDogZXhwIF07XHJcbiAgICAgICAgICAgIG1kID0gIW1kIHx8IG4uY21wKGQpID4gMCA/ICggZSA+IDAgPyBkIDogbjEgKSA6IG47XHJcblxyXG4gICAgICAgICAgICBleHAgPSBNQVhfRVhQO1xyXG4gICAgICAgICAgICBNQVhfRVhQID0gMSAvIDA7XHJcbiAgICAgICAgICAgIG4gPSBuZXcgQmlnTnVtYmVyKHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gbjAgPSBkMSA9IDBcclxuICAgICAgICAgICAgbjAuY1swXSA9IDA7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCA7IDsgKSAge1xyXG4gICAgICAgICAgICAgICAgcSA9IGRpdiggbiwgZCwgMCwgMSApO1xyXG4gICAgICAgICAgICAgICAgZDIgPSBkMC5wbHVzKCBxLnRpbWVzKGQxKSApO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkMi5jbXAobWQpID09IDEgKSBicmVhaztcclxuICAgICAgICAgICAgICAgIGQwID0gZDE7XHJcbiAgICAgICAgICAgICAgICBkMSA9IGQyO1xyXG4gICAgICAgICAgICAgICAgbjEgPSBuMC5wbHVzKCBxLnRpbWVzKCBkMiA9IG4xICkgKTtcclxuICAgICAgICAgICAgICAgIG4wID0gZDI7XHJcbiAgICAgICAgICAgICAgICBkID0gbi5taW51cyggcS50aW1lcyggZDIgPSBkICkgKTtcclxuICAgICAgICAgICAgICAgIG4gPSBkMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZDIgPSBkaXYoIG1kLm1pbnVzKGQwKSwgZDEsIDAsIDEgKTtcclxuICAgICAgICAgICAgbjAgPSBuMC5wbHVzKCBkMi50aW1lcyhuMSkgKTtcclxuICAgICAgICAgICAgZDAgPSBkMC5wbHVzKCBkMi50aW1lcyhkMSkgKTtcclxuICAgICAgICAgICAgbjAucyA9IG4xLnMgPSB4LnM7XHJcbiAgICAgICAgICAgIGUgKj0gMjtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSB3aGljaCBmcmFjdGlvbiBpcyBjbG9zZXIgdG8geCwgbjAvZDAgb3IgbjEvZDFcclxuICAgICAgICAgICAgYXJyID0gZGl2KCBuMSwgZDEsIGUsIFJPVU5ESU5HX01PREUgKS5taW51cyh4KS5hYnMoKS5jbXAoXHJcbiAgICAgICAgICAgICAgICAgIGRpdiggbjAsIGQwLCBlLCBST1VORElOR19NT0RFICkubWludXMoeCkuYWJzKCkgKSA8IDFcclxuICAgICAgICAgICAgICAgICAgICA/IFsgbjEudG9TdHJpbmcoKSwgZDEudG9TdHJpbmcoKSBdXHJcbiAgICAgICAgICAgICAgICAgICAgOiBbIG4wLnRvU3RyaW5nKCksIGQwLnRvU3RyaW5nKCkgXTtcclxuXHJcbiAgICAgICAgICAgIE1BWF9FWFAgPSBleHA7XHJcbiAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBjb252ZXJ0ZWQgdG8gYSBudW1iZXIgcHJpbWl0aXZlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudG9OdW1iZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiArdGhpcztcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJhaXNlZCB0byB0aGUgcG93ZXIgbi5cclxuICAgICAgICAgKiBJZiBtIGlzIHByZXNlbnQsIHJldHVybiB0aGUgcmVzdWx0IG1vZHVsbyBtLlxyXG4gICAgICAgICAqIElmIG4gaXMgbmVnYXRpdmUgcm91bmQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZCBST1VORElOR19NT0RFLlxyXG4gICAgICAgICAqIElmIFBPV19QUkVDSVNJT04gaXMgbm9uLXplcm8gYW5kIG0gaXMgbm90IHByZXNlbnQsIHJvdW5kIHRvIFBPV19QUkVDSVNJT04gdXNpbmdcclxuICAgICAgICAgKiBST1VORElOR19NT0RFLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogVGhlIG1vZHVsYXIgcG93ZXIgb3BlcmF0aW9uIHdvcmtzIGVmZmljaWVudGx5IHdoZW4geCwgbiwgYW5kIG0gYXJlIHBvc2l0aXZlIGludGVnZXJzLFxyXG4gICAgICAgICAqIG90aGVyd2lzZSBpdCBpcyBlcXVpdmFsZW50IHRvIGNhbGN1bGF0aW5nIHgudG9Qb3dlcihuKS5tb2R1bG8obSkgKHdpdGggUE9XX1BSRUNJU0lPTiAwKS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIG4ge251bWJlcn0gSW50ZWdlciwgLU1BWF9TQUZFX0lOVEVHRVIgdG8gTUFYX1NBRkVfSU5URUdFUiBpbmNsdXNpdmUuXHJcbiAgICAgICAgICogW21dIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gVGhlIG1vZHVsdXMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAncG93KCkgZXhwb25lbnQgbm90IGFuIGludGVnZXI6IHtufSdcclxuICAgICAgICAgKiAncG93KCkgZXhwb25lbnQgb3V0IG9mIHJhbmdlOiB7bn0nXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBQZXJmb3JtcyA1NCBsb29wIGl0ZXJhdGlvbnMgZm9yIG4gb2YgOTAwNzE5OTI1NDc0MDk5MS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRvUG93ZXIgPSBQLnBvdyA9IGZ1bmN0aW9uICggbiwgbSApIHtcclxuICAgICAgICAgICAgdmFyIGssIHksIHosXHJcbiAgICAgICAgICAgICAgICBpID0gbWF0aGZsb29yKCBuIDwgMCA/IC1uIDogK24gKSxcclxuICAgICAgICAgICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBtICE9IG51bGwgKSB7XHJcbiAgICAgICAgICAgICAgICBpZCA9IDIzO1xyXG4gICAgICAgICAgICAgICAgbSA9IG5ldyBCaWdOdW1iZXIobSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFBhc3MgwrFJbmZpbml0eSB0byBNYXRoLnBvdyBpZiBleHBvbmVudCBpcyBvdXQgb2YgcmFuZ2UuXHJcbiAgICAgICAgICAgIGlmICggIWlzVmFsaWRJbnQoIG4sIC1NQVhfU0FGRV9JTlRFR0VSLCBNQVhfU0FGRV9JTlRFR0VSLCAyMywgJ2V4cG9uZW50JyApICYmXHJcbiAgICAgICAgICAgICAgKCAhaXNGaW5pdGUobikgfHwgaSA+IE1BWF9TQUZFX0lOVEVHRVIgJiYgKCBuIC89IDAgKSB8fFxyXG4gICAgICAgICAgICAgICAgcGFyc2VGbG9hdChuKSAhPSBuICYmICEoIG4gPSBOYU4gKSApIHx8IG4gPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGsgPSBNYXRoLnBvdyggK3gsIG4gKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKCBtID8gayAlIG0gOiBrICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIG4gPiAxICYmIHguZ3QoT05FKSAmJiB4LmlzSW50KCkgJiYgbS5ndChPTkUpICYmIG0uaXNJbnQoKSApIHtcclxuICAgICAgICAgICAgICAgICAgICB4ID0geC5tb2QobSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHogPSBtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBOdWxsaWZ5IG0gc28gb25seSBhIHNpbmdsZSBtb2Qgb3BlcmF0aW9uIGlzIHBlcmZvcm1lZCBhdCB0aGUgZW5kLlxyXG4gICAgICAgICAgICAgICAgICAgIG0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKFBPV19QUkVDSVNJT04pIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcnVuY2F0aW5nIGVhY2ggY29lZmZpY2llbnQgYXJyYXkgdG8gYSBsZW5ndGggb2YgayBhZnRlciBlYWNoIG11bHRpcGxpY2F0aW9uXHJcbiAgICAgICAgICAgICAgICAvLyBlcXVhdGVzIHRvIHRydW5jYXRpbmcgc2lnbmlmaWNhbnQgZGlnaXRzIHRvIFBPV19QUkVDSVNJT04gKyBbMjgsIDQxXSxcclxuICAgICAgICAgICAgICAgIC8vIGkuZS4gdGhlcmUgd2lsbCBiZSBhIG1pbmltdW0gb2YgMjggZ3VhcmQgZGlnaXRzIHJldGFpbmVkLlxyXG4gICAgICAgICAgICAgICAgLy8gKFVzaW5nICsgMS41IHdvdWxkIGdpdmUgWzksIDIxXSBndWFyZCBkaWdpdHMuKVxyXG4gICAgICAgICAgICAgICAgayA9IG1hdGhjZWlsKCBQT1dfUFJFQ0lTSU9OIC8gTE9HX0JBU0UgKyAyICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCA7IDsgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGkgJSAyICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHkgPSB5LnRpbWVzKHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXkuYyApIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggeS5jLmxlbmd0aCA+IGsgKSB5LmMubGVuZ3RoID0gaztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHkubW9kKG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpID0gbWF0aGZsb29yKCBpIC8gMiApO1xyXG4gICAgICAgICAgICAgICAgaWYgKCAhaSApIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgeCA9IHgudGltZXMoeCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggeC5jICYmIHguYy5sZW5ndGggPiBrICkgeC5jLmxlbmd0aCA9IGs7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0pIHtcclxuICAgICAgICAgICAgICAgICAgICB4ID0geC5tb2QobSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtKSByZXR1cm4geTtcclxuICAgICAgICAgICAgaWYgKCBuIDwgMCApIHkgPSBPTkUuZGl2KHkpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHogPyB5Lm1vZCh6KSA6IGsgPyByb3VuZCggeSwgUE9XX1BSRUNJU0lPTiwgUk9VTkRJTkdfTU9ERSApIDogeTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0c1xyXG4gICAgICAgICAqIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0gb3IgUk9VTkRJTkdfTU9ERS4gSWYgc2QgaXMgbGVzcyB0aGFuIHRoZSBudW1iZXIgb2YgZGlnaXRzXHJcbiAgICAgICAgICogbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiwgdGhlbiB1c2VcclxuICAgICAgICAgKiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFtzZF0ge251bWJlcn0gU2lnbmlmaWNhbnQgZGlnaXRzLiBJbnRlZ2VyLCAxIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogJ3RvUHJlY2lzaW9uKCkgcHJlY2lzaW9uIG5vdCBhbiBpbnRlZ2VyOiB7c2R9J1xyXG4gICAgICAgICAqICd0b1ByZWNpc2lvbigpIHByZWNpc2lvbiBvdXQgb2YgcmFuZ2U6IHtzZH0nXHJcbiAgICAgICAgICogJ3RvUHJlY2lzaW9uKCkgcm91bmRpbmcgbW9kZSBub3QgYW4gaW50ZWdlcjoge3JtfSdcclxuICAgICAgICAgKiAndG9QcmVjaXNpb24oKSByb3VuZGluZyBtb2RlIG91dCBvZiByYW5nZToge3JtfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRvUHJlY2lzaW9uID0gZnVuY3Rpb24gKCBzZCwgcm0gKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXQoIHRoaXMsIHNkICE9IG51bGwgJiYgaXNWYWxpZEludCggc2QsIDEsIE1BWCwgMjQsICdwcmVjaXNpb24nIClcclxuICAgICAgICAgICAgICA/IHNkIHwgMCA6IG51bGwsIHJtLCAyNCApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGJhc2UgYiwgb3IgYmFzZSAxMCBpZiBiIGlzXHJcbiAgICAgICAgICogb21pdHRlZC4gSWYgYSBiYXNlIGlzIHNwZWNpZmllZCwgaW5jbHVkaW5nIGJhc2UgMTAsIHJvdW5kIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmRcclxuICAgICAgICAgKiBST1VORElOR19NT0RFLiBJZiBhIGJhc2UgaXMgbm90IHNwZWNpZmllZCwgYW5kIHRoaXMgQmlnTnVtYmVyIGhhcyBhIHBvc2l0aXZlIGV4cG9uZW50XHJcbiAgICAgICAgICogdGhhdCBpcyBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gVE9fRVhQX1BPUywgb3IgYSBuZWdhdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBsZXNzIHRoYW5cclxuICAgICAgICAgKiBUT19FWFBfTkVHLCByZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbYl0ge251bWJlcn0gSW50ZWdlciwgMiB0byA2NCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAndG9TdHJpbmcoKSBiYXNlIG5vdCBhbiBpbnRlZ2VyOiB7Yn0nXHJcbiAgICAgICAgICogJ3RvU3RyaW5nKCkgYmFzZSBvdXQgb2YgcmFuZ2U6IHtifSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRvU3RyaW5nID0gZnVuY3Rpb24gKGIpIHtcclxuICAgICAgICAgICAgdmFyIHN0cixcclxuICAgICAgICAgICAgICAgIG4gPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgcyA9IG4ucyxcclxuICAgICAgICAgICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICAgICAgICAvLyBJbmZpbml0eSBvciBOYU4/XHJcbiAgICAgICAgICAgIGlmICggZSA9PT0gbnVsbCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ciA9ICdJbmZpbml0eSc7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzIDwgMCApIHN0ciA9ICctJyArIHN0cjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gJ05hTic7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKCBuLmMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGIgPT0gbnVsbCB8fCAhaXNWYWxpZEludCggYiwgMiwgNjQsIDI1LCAnYmFzZScgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSBlIDw9IFRPX0VYUF9ORUcgfHwgZSA+PSBUT19FWFBfUE9TXHJcbiAgICAgICAgICAgICAgICAgICAgICA/IHRvRXhwb25lbnRpYWwoIHN0ciwgZSApXHJcbiAgICAgICAgICAgICAgICAgICAgICA6IHRvRml4ZWRQb2ludCggc3RyLCBlICk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IGNvbnZlcnRCYXNlKCB0b0ZpeGVkUG9pbnQoIHN0ciwgZSApLCBiIHwgMCwgMTAsIHMgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHMgPCAwICYmIG4uY1swXSApIHN0ciA9ICctJyArIHN0cjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciB0cnVuY2F0ZWQgdG8gYSB3aG9sZVxyXG4gICAgICAgICAqIG51bWJlci5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRydW5jYXRlZCA9IFAudHJ1bmMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByb3VuZCggbmV3IEJpZ051bWJlcih0aGlzKSwgdGhpcy5lICsgMSwgMSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhcyB0b1N0cmluZywgYnV0IGRvIG5vdCBhY2NlcHQgYSBiYXNlIGFyZ3VtZW50LCBhbmQgaW5jbHVkZSB0aGUgbWludXMgc2lnbiBmb3JcclxuICAgICAgICAgKiBuZWdhdGl2ZSB6ZXJvLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudmFsdWVPZiA9IFAudG9KU09OID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgc3RyLFxyXG4gICAgICAgICAgICAgICAgbiA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBlID0gbi5lO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBlID09PSBudWxsICkgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcoIG4uYyApO1xyXG5cclxuICAgICAgICAgICAgc3RyID0gZSA8PSBUT19FWFBfTkVHIHx8IGUgPj0gVE9fRVhQX1BPU1xyXG4gICAgICAgICAgICAgICAgPyB0b0V4cG9uZW50aWFsKCBzdHIsIGUgKVxyXG4gICAgICAgICAgICAgICAgOiB0b0ZpeGVkUG9pbnQoIHN0ciwgZSApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG4ucyA8IDAgPyAnLScgKyBzdHIgOiBzdHI7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIFAuaXNCaWdOdW1iZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAoIGNvbmZpZyAhPSBudWxsICkgQmlnTnVtYmVyLmNvbmZpZyhjb25maWcpO1xyXG5cclxuICAgICAgICByZXR1cm4gQmlnTnVtYmVyO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBQUklWQVRFIEhFTFBFUiBGVU5DVElPTlNcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gYml0Rmxvb3Iobikge1xyXG4gICAgICAgIHZhciBpID0gbiB8IDA7XHJcbiAgICAgICAgcmV0dXJuIG4gPiAwIHx8IG4gPT09IGkgPyBpIDogaSAtIDE7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIFJldHVybiBhIGNvZWZmaWNpZW50IGFycmF5IGFzIGEgc3RyaW5nIG9mIGJhc2UgMTAgZGlnaXRzLlxyXG4gICAgZnVuY3Rpb24gY29lZmZUb1N0cmluZyhhKSB7XHJcbiAgICAgICAgdmFyIHMsIHosXHJcbiAgICAgICAgICAgIGkgPSAxLFxyXG4gICAgICAgICAgICBqID0gYS5sZW5ndGgsXHJcbiAgICAgICAgICAgIHIgPSBhWzBdICsgJyc7XHJcblxyXG4gICAgICAgIGZvciAoIDsgaSA8IGo7ICkge1xyXG4gICAgICAgICAgICBzID0gYVtpKytdICsgJyc7XHJcbiAgICAgICAgICAgIHogPSBMT0dfQkFTRSAtIHMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKCA7IHotLTsgcyA9ICcwJyArIHMgKTtcclxuICAgICAgICAgICAgciArPSBzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoIGogPSByLmxlbmd0aDsgci5jaGFyQ29kZUF0KC0taikgPT09IDQ4OyApO1xyXG4gICAgICAgIHJldHVybiByLnNsaWNlKCAwLCBqICsgMSB8fCAxICk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIENvbXBhcmUgdGhlIHZhbHVlIG9mIEJpZ051bWJlcnMgeCBhbmQgeS5cclxuICAgIGZ1bmN0aW9uIGNvbXBhcmUoIHgsIHkgKSB7XHJcbiAgICAgICAgdmFyIGEsIGIsXHJcbiAgICAgICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgICAgICB5YyA9IHkuYyxcclxuICAgICAgICAgICAgaSA9IHgucyxcclxuICAgICAgICAgICAgaiA9IHkucyxcclxuICAgICAgICAgICAgayA9IHguZSxcclxuICAgICAgICAgICAgbCA9IHkuZTtcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIE5hTj9cclxuICAgICAgICBpZiAoICFpIHx8ICFqICkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGEgPSB4YyAmJiAheGNbMF07XHJcbiAgICAgICAgYiA9IHljICYmICF5Y1swXTtcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICAgICAgaWYgKCBhIHx8IGIgKSByZXR1cm4gYSA/IGIgPyAwIDogLWogOiBpO1xyXG5cclxuICAgICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICAgaWYgKCBpICE9IGogKSByZXR1cm4gaTtcclxuXHJcbiAgICAgICAgYSA9IGkgPCAwO1xyXG4gICAgICAgIGIgPSBrID09IGw7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciBJbmZpbml0eT9cclxuICAgICAgICBpZiAoICF4YyB8fCAheWMgKSByZXR1cm4gYiA/IDAgOiAheGMgXiBhID8gMSA6IC0xO1xyXG5cclxuICAgICAgICAvLyBDb21wYXJlIGV4cG9uZW50cy5cclxuICAgICAgICBpZiAoICFiICkgcmV0dXJuIGsgPiBsIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICAgICAgaiA9ICggayA9IHhjLmxlbmd0aCApIDwgKCBsID0geWMubGVuZ3RoICkgPyBrIDogbDtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICBmb3IgKCBpID0gMDsgaSA8IGo7IGkrKyApIGlmICggeGNbaV0gIT0geWNbaV0gKSByZXR1cm4geGNbaV0gPiB5Y1tpXSBeIGEgPyAxIDogLTE7XHJcblxyXG4gICAgICAgIC8vIENvbXBhcmUgbGVuZ3Rocy5cclxuICAgICAgICByZXR1cm4gayA9PSBsID8gMCA6IGsgPiBsIF4gYSA/IDEgOiAtMTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIG4gaXMgYSB2YWxpZCBudW1iZXIgaW4gcmFuZ2UsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqIFVzZSBmb3IgYXJndW1lbnQgdmFsaWRhdGlvbiB3aGVuIEVSUk9SUyBpcyBmYWxzZS5cclxuICAgICAqIE5vdGU6IHBhcnNlSW50KCcxZSsxJykgPT0gMSBidXQgcGFyc2VGbG9hdCgnMWUrMScpID09IDEwLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBpbnRWYWxpZGF0b3JOb0Vycm9ycyggbiwgbWluLCBtYXggKSB7XHJcbiAgICAgICAgcmV0dXJuICggbiA9IHRydW5jYXRlKG4pICkgPj0gbWluICYmIG4gPD0gbWF4O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBpc0FycmF5KG9iaikge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ29udmVydCBzdHJpbmcgb2YgYmFzZUluIHRvIGFuIGFycmF5IG9mIG51bWJlcnMgb2YgYmFzZU91dC5cclxuICAgICAqIEVnLiBjb252ZXJ0QmFzZSgnMjU1JywgMTAsIDE2KSByZXR1cm5zIFsxNSwgMTVdLlxyXG4gICAgICogRWcuIGNvbnZlcnRCYXNlKCdmZicsIDE2LCAxMCkgcmV0dXJucyBbMiwgNSwgNV0uXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHRvQmFzZU91dCggc3RyLCBiYXNlSW4sIGJhc2VPdXQgKSB7XHJcbiAgICAgICAgdmFyIGosXHJcbiAgICAgICAgICAgIGFyciA9IFswXSxcclxuICAgICAgICAgICAgYXJyTCxcclxuICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgIGZvciAoIDsgaSA8IGxlbjsgKSB7XHJcbiAgICAgICAgICAgIGZvciAoIGFyckwgPSBhcnIubGVuZ3RoOyBhcnJMLS07IGFyclthcnJMXSAqPSBiYXNlSW4gKTtcclxuICAgICAgICAgICAgYXJyWyBqID0gMCBdICs9IEFMUEhBQkVULmluZGV4T2YoIHN0ci5jaGFyQXQoIGkrKyApICk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCA7IGogPCBhcnIubGVuZ3RoOyBqKysgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBhcnJbal0gPiBiYXNlT3V0IC0gMSApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGFycltqICsgMV0gPT0gbnVsbCApIGFycltqICsgMV0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGFycltqICsgMV0gKz0gYXJyW2pdIC8gYmFzZU91dCB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyW2pdICU9IGJhc2VPdXQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiB0b0V4cG9uZW50aWFsKCBzdHIsIGUgKSB7XHJcbiAgICAgICAgcmV0dXJuICggc3RyLmxlbmd0aCA+IDEgPyBzdHIuY2hhckF0KDApICsgJy4nICsgc3RyLnNsaWNlKDEpIDogc3RyICkgK1xyXG4gICAgICAgICAgKCBlIDwgMCA/ICdlJyA6ICdlKycgKSArIGU7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHRvRml4ZWRQb2ludCggc3RyLCBlICkge1xyXG4gICAgICAgIHZhciBsZW4sIHo7XHJcblxyXG4gICAgICAgIC8vIE5lZ2F0aXZlIGV4cG9uZW50P1xyXG4gICAgICAgIGlmICggZSA8IDAgKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVwZW5kIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKCB6ID0gJzAuJzsgKytlOyB6ICs9ICcwJyApO1xyXG4gICAgICAgICAgICBzdHIgPSB6ICsgc3RyO1xyXG5cclxuICAgICAgICAvLyBQb3NpdGl2ZSBleHBvbmVudFxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAvLyBBcHBlbmQgemVyb3MuXHJcbiAgICAgICAgICAgIGlmICggKytlID4gbGVuICkge1xyXG4gICAgICAgICAgICAgICAgZm9yICggeiA9ICcwJywgZSAtPSBsZW47IC0tZTsgeiArPSAnMCcgKTtcclxuICAgICAgICAgICAgICAgIHN0ciArPSB6O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBlIDwgbGVuICkge1xyXG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnNsaWNlKCAwLCBlICkgKyAnLicgKyBzdHIuc2xpY2UoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHRydW5jYXRlKG4pIHtcclxuICAgICAgICBuID0gcGFyc2VGbG9hdChuKTtcclxuICAgICAgICByZXR1cm4gbiA8IDAgPyBtYXRoY2VpbChuKSA6IG1hdGhmbG9vcihuKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gRVhQT1JUXHJcblxyXG5cclxuICAgIEJpZ051bWJlciA9IGNvbnN0cnVjdG9yRmFjdG9yeSgpO1xyXG4gICAgQmlnTnVtYmVyWydkZWZhdWx0J10gPSBCaWdOdW1iZXIuQmlnTnVtYmVyID0gQmlnTnVtYmVyO1xyXG5cclxuXHJcbiAgICAvLyBBTUQuXHJcbiAgICBpZiAoIHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xyXG4gICAgICAgIGRlZmluZSggZnVuY3Rpb24gKCkgeyByZXR1cm4gQmlnTnVtYmVyOyB9ICk7XHJcblxyXG4gICAgLy8gTm9kZS5qcyBhbmQgb3RoZXIgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cy5cclxuICAgIH0gZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMgKSB7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBCaWdOdW1iZXI7XHJcblxyXG4gICAgLy8gQnJvd3Nlci5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCAhZ2xvYmFsT2JqICkgZ2xvYmFsT2JqID0gdHlwZW9mIHNlbGYgIT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcclxuICAgICAgICBnbG9iYWxPYmouQmlnTnVtYmVyID0gQmlnTnVtYmVyO1xyXG4gICAgfVxyXG59KSh0aGlzKTtcclxuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxhbmd1YWdlVGFnOiBcImVuLVVTXCIsXG4gICAgZGVsaW1pdGVyczoge1xuICAgICAgICB0aG91c2FuZHM6IFwiLFwiLFxuICAgICAgICBkZWNpbWFsOiBcIi5cIlxuICAgIH0sXG4gICAgYWJicmV2aWF0aW9uczoge1xuICAgICAgICB0aG91c2FuZDogXCJrXCIsXG4gICAgICAgIG1pbGxpb246IFwibVwiLFxuICAgICAgICBiaWxsaW9uOiBcImJcIixcbiAgICAgICAgdHJpbGxpb246IFwidFwiXG4gICAgfSxcbiAgICBzcGFjZVNlcGFyYXRlZDogZmFsc2UsXG4gICAgb3JkaW5hbDogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgIGxldCBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgIHJldHVybiAofn4obnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/IFwidGhcIiA6IChiID09PSAxKSA/IFwic3RcIiA6IChiID09PSAyKSA/IFwibmRcIiA6IChiID09PSAzKSA/IFwicmRcIiA6IFwidGhcIjtcbiAgICB9LFxuICAgIGN1cnJlbmN5OiB7XG4gICAgICAgIHN5bWJvbDogXCIkXCIsXG4gICAgICAgIHBvc2l0aW9uOiBcInByZWZpeFwiLFxuICAgICAgICBjb2RlOiBcIlVTRFwiXG4gICAgfSxcbiAgICBjdXJyZW5jeUZvcm1hdDoge1xuICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgdG90YWxMZW5ndGg6IDQsXG4gICAgICAgIHNwYWNlU2VwYXJhdGVkOiB0cnVlXG4gICAgfSxcbiAgICBmb3JtYXRzOiB7XG4gICAgICAgIGZvdXJEaWdpdHM6IHtcbiAgICAgICAgICAgIHRvdGFsTGVuZ3RoOiA0LFxuICAgICAgICAgICAgc3BhY2VTZXBhcmF0ZWQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsczoge1xuICAgICAgICAgICAgb3V0cHV0OiBcImN1cnJlbmN5XCIsXG4gICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIG1hbnRpc3NhOiAyXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bGxXaXRoVHdvRGVjaW1hbHNOb0N1cnJlbmN5OiB7XG4gICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIG1hbnRpc3NhOiAyXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bGxXaXRoTm9EZWNpbWFsczoge1xuICAgICAgICAgICAgb3V0cHV0OiBcImN1cnJlbmN5XCIsXG4gICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIG1hbnRpc3NhOiAwXG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5jb25zdCB2YWxpZGF0aW5nID0gcmVxdWlyZShcIi4vdmFsaWRhdGluZ1wiKTtcbmNvbnN0IHBhcnNpbmcgPSByZXF1aXJlKFwiLi9wYXJzaW5nXCIpO1xuXG5jb25zdCBiaW5hcnlTdWZmaXhlcyA9IFtcIkJcIiwgXCJLaUJcIiwgXCJNaUJcIiwgXCJHaUJcIiwgXCJUaUJcIiwgXCJQaUJcIiwgXCJFaUJcIiwgXCJaaUJcIiwgXCJZaUJcIl07XG5jb25zdCBkZWNpbWFsU3VmZml4ZXMgPSBbXCJCXCIsIFwiS0JcIiwgXCJNQlwiLCBcIkdCXCIsIFwiVEJcIiwgXCJQQlwiLCBcIkVCXCIsIFwiWkJcIiwgXCJZQlwiXTtcbmNvbnN0IGJ5dGVzID0ge1xuICAgIGdlbmVyYWw6IHtzY2FsZTogMTAyNCwgc3VmZml4ZXM6IGRlY2ltYWxTdWZmaXhlcywgbWFya2VyOiBcImJkXCJ9LFxuICAgIGJpbmFyeToge3NjYWxlOiAxMDI0LCBzdWZmaXhlczogYmluYXJ5U3VmZml4ZXMsIG1hcmtlcjogXCJiXCJ9LFxuICAgIGRlY2ltYWw6IHtzY2FsZTogMTAwMCwgc3VmZml4ZXM6IGRlY2ltYWxTdWZmaXhlcywgbWFya2VyOiBcImRcIn1cbn07XG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgIHRvdGFsTGVuZ3RoOiAwLFxuICAgIGNoYXJhY3RlcmlzdGljOiAwLFxuICAgIGZvcmNlQXZlcmFnZTogZmFsc2UsXG4gICAgYXZlcmFnZTogZmFsc2UsXG4gICAgbWFudGlzc2E6IC0xLFxuICAgIG9wdGlvbmFsTWFudGlzc2E6IHRydWUsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IGZhbHNlLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBmYWxzZSxcbiAgICBuZWdhdGl2ZTogXCJzaWduXCIsXG4gICAgZm9yY2VTaWduOiBmYWxzZVxufTtcblxuLyoqXG4gKiBFbnRyeSBwb2ludC4gRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhY2NvcmRpbmcgdG8gdGhlIFBST1ZJREVERk9STUFULlxuICogVGhpcyBtZXRob2QgZW5zdXJlIHRoZSBwcmVmaXggYW5kIHBvc3RmaXggYXJlIGFkZGVkIGFzIHRoZSBsYXN0IHN0ZXAuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR8c3RyaW5nfSBbcHJvdmlkZWRGb3JtYXRdIC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQgPSB7fSwgbnVtYnJvKSB7XG4gICAgaWYgKHR5cGVvZiBwcm92aWRlZEZvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBwcm92aWRlZEZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQocHJvdmlkZWRGb3JtYXQpO1xuICAgIH1cblxuICAgIGxldCB2YWxpZCA9IHZhbGlkYXRpbmcudmFsaWRhdGVGb3JtYXQocHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgaWYgKCF2YWxpZCkge1xuICAgICAgICByZXR1cm4gXCJFUlJPUjogaW52YWxpZCBmb3JtYXRcIjtcbiAgICB9XG5cbiAgICBsZXQgcHJlZml4ID0gcHJvdmlkZWRGb3JtYXQucHJlZml4IHx8IFwiXCI7XG4gICAgbGV0IHBvc3RmaXggPSBwcm92aWRlZEZvcm1hdC5wb3N0Zml4IHx8IFwiXCI7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYnJvKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgbnVtYnJvKTtcbiAgICBvdXRwdXQgPSBpbnNlcnRQcmVmaXgob3V0cHV0LCBwcmVmaXgpO1xuICAgIG91dHB1dCA9IGluc2VydFBvc3RmaXgob3V0cHV0LCBwb3N0Zml4KTtcbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYWNjb3JkaW5nIHRvIHRoZSBQUk9WSURFREZPUk1BVC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXROdW1icm8oaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBudW1icm8pIHtcbiAgICBzd2l0Y2ggKHByb3ZpZGVkRm9ybWF0Lm91dHB1dCkge1xuICAgICAgICBjYXNlIFwiY3VycmVuY3lcIjoge1xuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0Q3VycmVuY3koaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwicGVyY2VudFwiOiB7XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudFBlcmNlbnRhZ2VEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFBlcmNlbnRhZ2UoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYnl0ZVwiOlxuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRCeXRlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIGNhc2UgXCJ0aW1lXCI6XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudFRpbWVEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFRpbWUoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgY2FzZSBcIm9yZGluYWxcIjpcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50T3JkaW5hbERlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0T3JkaW5hbChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgICAgICAgICBudW1icm9cbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIGRlY2ltYWwgYnl0ZSB1bml0IChNQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDAwKS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXREZWNpbWFsQnl0ZVVuaXQoaW5zdGFuY2UpIHtcbiAgICBsZXQgZGF0YSA9IGJ5dGVzLmRlY2ltYWw7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGJpbmFyeSBieXRlIHVuaXQgKE1pQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDI0KS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXRCaW5hcnlCeXRlVW5pdChpbnN0YW5jZSkge1xuICAgIGxldCBkYXRhID0gYnl0ZXMuYmluYXJ5O1xuICAgIHJldHVybiBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBkYXRhLnN1ZmZpeGVzLCBkYXRhLnNjYWxlKS5zdWZmaXg7XG59XG5cbi8qKlxuICogR2V0IHRoZSBkZWNpbWFsIGJ5dGUgdW5pdCAoTUIpIGZvciB0aGUgcHJvdmlkZWQgbnVtYnJvIElOU1RBTkNFLlxuICogV2UgZ28gZnJvbSBvbmUgdW5pdCB0byBhbm90aGVyIHVzaW5nIHRoZSBkZWNpbWFsIHN5c3RlbSAoMTAyNCkuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGNvbXB1dGVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0Qnl0ZVVuaXQoaW5zdGFuY2UpIHtcbiAgICBsZXQgZGF0YSA9IGJ5dGVzLmdlbmVyYWw7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHZhbHVlIGFuZCB0aGUgc3VmZml4IGNvbXB1dGVkIGluIGJ5dGUuXG4gKiBJdCB1c2VzIHRoZSBTVUZGSVhFUyBhbmQgdGhlIFNDQUxFIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIE51bWJlciB0byBmb3JtYXRcbiAqIEBwYXJhbSB7W1N0cmluZ119IHN1ZmZpeGVzIC0gTGlzdCBvZiBzdWZmaXhlc1xuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIC0gTnVtYmVyIGluLWJldHdlZW4gdHdvIHVuaXRzXG4gKiBAcmV0dXJuIHt7dmFsdWU6IE51bWJlciwgc3VmZml4OiBTdHJpbmd9fVxuICovXG5mdW5jdGlvbiBnZXRGb3JtYXRCeXRlVW5pdHModmFsdWUsIHN1ZmZpeGVzLCBzY2FsZSkge1xuICAgIGxldCBzdWZmaXggPSBzdWZmaXhlc1swXTtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuXG4gICAgaWYgKGFicyA+PSBzY2FsZSkge1xuICAgICAgICBmb3IgKGxldCBwb3dlciA9IDE7IHBvd2VyIDwgc3VmZml4ZXMubGVuZ3RoOyArK3Bvd2VyKSB7XG4gICAgICAgICAgICBsZXQgbWluID0gTWF0aC5wb3coc2NhbGUsIHBvd2VyKTtcbiAgICAgICAgICAgIGxldCBtYXggPSBNYXRoLnBvdyhzY2FsZSwgcG93ZXIgKyAxKTtcblxuICAgICAgICAgICAgaWYgKGFicyA+PSBtaW4gJiYgYWJzIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgc3VmZml4ID0gc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBtaW47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWx1ZXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIFtzY2FsZV0gWUIgbmV2ZXIgc2V0IHRoZSBzdWZmaXhcbiAgICAgICAgaWYgKHN1ZmZpeCA9PT0gc3VmZml4ZXNbMF0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdyhzY2FsZSwgc3VmZml4ZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICBzdWZmaXggPSBzdWZmaXhlc1tzdWZmaXhlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7dmFsdWUsIHN1ZmZpeH07XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBieXRlcyB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsIGFuZCBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0Qnl0ZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlLCBudW1icm8pIHtcbiAgICBsZXQgYmFzZSA9IHByb3ZpZGVkRm9ybWF0LmJhc2UgfHwgXCJiaW5hcnlcIjtcbiAgICBsZXQgYmFzZUluZm8gPSBieXRlc1tiYXNlXTtcblxuICAgIGxldCB7dmFsdWUsIHN1ZmZpeH0gPSBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBiYXNlSW5mby5zdWZmaXhlcywgYmFzZUluZm8uc2NhbGUpO1xuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1iZXIoe1xuICAgICAgICBpbnN0YW5jZTogbnVtYnJvKHZhbHVlKSxcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBkZWZhdWx0czogc3RhdGUuY3VycmVudEJ5dGVEZWZhdWx0Rm9ybWF0KClcbiAgICB9KTtcbiAgICBsZXQgYWJicmV2aWF0aW9ucyA9IHN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCk7XG4gICAgcmV0dXJuIGAke291dHB1dH0ke2FiYnJldmlhdGlvbnMuc3BhY2VkID8gXCIgXCIgOiBcIlwifSR7c3VmZml4fWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhbiBvcmRpbmFsIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRPcmRpbmFsKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUpIHtcbiAgICBsZXQgb3JkaW5hbEZuID0gc3RhdGUuY3VycmVudE9yZGluYWwoKTtcbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwcm92aWRlZEZvcm1hdCk7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICBzdGF0ZVxuICAgIH0pO1xuICAgIGxldCBvcmRpbmFsID0gb3JkaW5hbEZuKGluc3RhbmNlLl92YWx1ZSk7XG5cbiAgICByZXR1cm4gYCR7b3V0cHV0fSR7b3B0aW9ucy5zcGFjZVNlcGFyYXRlZCA/IFwiIFwiIDogXCJcIn0ke29yZGluYWx9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgdGltZSBISDpNTTpTUy5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFRpbWUoaW5zdGFuY2UpIHtcbiAgICBsZXQgaG91cnMgPSBNYXRoLmZsb29yKGluc3RhbmNlLl92YWx1ZSAvIDYwIC8gNjApO1xuICAgIGxldCBtaW51dGVzID0gTWF0aC5mbG9vcigoaW5zdGFuY2UuX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkpIC8gNjApO1xuICAgIGxldCBzZWNvbmRzID0gTWF0aC5yb3VuZChpbnN0YW5jZS5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSAtIChtaW51dGVzICogNjApKTtcbiAgICByZXR1cm4gYCR7aG91cnN9OiR7KG1pbnV0ZXMgPCAxMCkgPyBcIjBcIiA6IFwiXCJ9JHttaW51dGVzfTokeyhzZWNvbmRzIDwgMTApID8gXCIwXCIgOiBcIlwifSR7c2Vjb25kc31gO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYSBwZXJjZW50YWdlIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFBlcmNlbnRhZ2UoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSwgbnVtYnJvKSB7XG4gICAgbGV0IHByZWZpeFN5bWJvbCA9IHByb3ZpZGVkRm9ybWF0LnByZWZpeFN5bWJvbDtcblxuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1iZXIoe1xuICAgICAgICBpbnN0YW5jZTogbnVtYnJvKGluc3RhbmNlLl92YWx1ZSAqIDEwMCksXG4gICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICBzdGF0ZVxuICAgIH0pO1xuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGlmIChwcmVmaXhTeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIGAlJHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSR7b3V0cHV0fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAke291dHB1dH0ke29wdGlvbnMuc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCJ9JWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIHBlcmNlbnRhZ2UgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULFxuICogYW5kIHRoZSBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5KGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUpIHtcbiAgICBjb25zdCBjdXJyZW50Q3VycmVuY3kgPSBzdGF0ZS5jdXJyZW50Q3VycmVuY3koKTtcbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwcm92aWRlZEZvcm1hdCk7XG4gICAgbGV0IGRlY2ltYWxTZXBhcmF0b3IgPSB1bmRlZmluZWQ7XG4gICAgbGV0IHNwYWNlID0gXCJcIjtcbiAgICBsZXQgYXZlcmFnZSA9ICEhb3B0aW9ucy50b3RhbExlbmd0aCB8fCAhIW9wdGlvbnMuZm9yY2VBdmVyYWdlIHx8IG9wdGlvbnMuYXZlcmFnZTtcbiAgICBsZXQgcG9zaXRpb24gPSBwcm92aWRlZEZvcm1hdC5jdXJyZW5jeVBvc2l0aW9uIHx8IGN1cnJlbnRDdXJyZW5jeS5wb3NpdGlvbjtcbiAgICBsZXQgc3ltYm9sID0gcHJvdmlkZWRGb3JtYXQuY3VycmVuY3lTeW1ib2wgfHwgY3VycmVudEN1cnJlbmN5LnN5bWJvbDtcblxuICAgIGlmIChvcHRpb25zLnNwYWNlU2VwYXJhdGVkKSB7XG4gICAgICAgIHNwYWNlID0gXCIgXCI7XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uID09PSBcImluZml4XCIpIHtcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvciA9IHNwYWNlICsgc3ltYm9sICsgc3BhY2U7XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIGRlY2ltYWxTZXBhcmF0b3JcbiAgICB9KTtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gXCJwcmVmaXhcIikge1xuICAgICAgICBpZiAoaW5zdGFuY2UuX3ZhbHVlIDwgMCAmJiBvcHRpb25zLm5lZ2F0aXZlID09PSBcInNpZ25cIikge1xuICAgICAgICAgICAgb3V0cHV0ID0gYC0ke3NwYWNlfSR7c3ltYm9sfSR7b3V0cHV0LnNsaWNlKDEpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBzeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcG9zaXRpb24gfHwgcG9zaXRpb24gPT09IFwicG9zdGZpeFwiKSB7XG4gICAgICAgIHNwYWNlID0gYXZlcmFnZSA/IFwiXCIgOiBzcGFjZTtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyBzeW1ib2w7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBhdmVyYWdlIHZhbHVlIG91dCBvZiBWQUxVRS5cbiAqIFRoZSBvdGhlciBwYXJhbWV0ZXJzIGFyZSBjb21wdXRhdGlvbiBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIHZhbHVlIHRvIGNvbXB1dGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZm9yY2VBdmVyYWdlXSAtIGZvcmNlZCB1bml0IHVzZWQgdG8gY29tcHV0ZVxuICogQHBhcmFtIHt7fX0gYWJicmV2aWF0aW9ucyAtIHBhcnQgb2YgdGhlIGxhbmd1YWdlIHNwZWNpZmljYXRpb25cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc3BhY2VTZXBhcmF0ZWQgLSBgdHJ1ZWAgaWYgYSBzcGFjZSBtdXN0IGJlIGluc2VydGVkIGJldHdlZW4gdGhlIHZhbHVlIGFuZCB0aGUgYWJicmV2aWF0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gW3RvdGFsTGVuZ3RoXSAtIHRvdGFsIGxlbmd0aCBvZiB0aGUgb3V0cHV0IGluY2x1ZGluZyB0aGUgY2hhcmFjdGVyaXN0aWMgYW5kIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nLCBtYW50aXNzYVByZWNpc2lvbjogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUF2ZXJhZ2Uoe3ZhbHVlLCBmb3JjZUF2ZXJhZ2UsIGFiYnJldmlhdGlvbnMsIHNwYWNlU2VwYXJhdGVkID0gZmFsc2UsIHRvdGFsTGVuZ3RoID0gMH0pIHtcbiAgICBsZXQgYWJicmV2aWF0aW9uID0gXCJcIjtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IC0xO1xuXG4gICAgaWYgKChhYnMgPj0gTWF0aC5wb3coMTAsIDEyKSAmJiAhZm9yY2VBdmVyYWdlKSB8fCAoZm9yY2VBdmVyYWdlID09PSBcInRyaWxsaW9uXCIpKSB7XG4gICAgICAgIC8vIHRyaWxsaW9uXG4gICAgICAgIGFiYnJldmlhdGlvbiA9IGFiYnJldmlhdGlvbnMudHJpbGxpb247XG4gICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMTIpO1xuICAgIH0gZWxzZSBpZiAoKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhZm9yY2VBdmVyYWdlKSB8fCAoZm9yY2VBdmVyYWdlID09PSBcImJpbGxpb25cIikpIHtcbiAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICBhYmJyZXZpYXRpb24gPSBhYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgfSBlbHNlIGlmICgoYWJzIDwgTWF0aC5wb3coMTAsIDkpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgNikgJiYgIWZvcmNlQXZlcmFnZSkgfHwgKGZvcmNlQXZlcmFnZSA9PT0gXCJtaWxsaW9uXCIpKSB7XG4gICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy5taWxsaW9uO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDYpO1xuICAgIH0gZWxzZSBpZiAoKGFicyA8IE1hdGgucG93KDEwLCA2KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDMpICYmICFmb3JjZUF2ZXJhZ2UpIHx8IChmb3JjZUF2ZXJhZ2UgPT09IFwidGhvdXNhbmRcIikpIHtcbiAgICAgICAgLy8gdGhvdXNhbmRcbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9uYWxTcGFjZSA9IHNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwiO1xuXG4gICAgaWYgKGFiYnJldmlhdGlvbikge1xuICAgICAgICBhYmJyZXZpYXRpb24gPSBvcHRpb25hbFNwYWNlICsgYWJicmV2aWF0aW9uO1xuICAgIH1cblxuICAgIGlmICh0b3RhbExlbmd0aCkge1xuICAgICAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSB2YWx1ZS50b1N0cmluZygpLnNwbGl0KFwiLlwiKVswXTtcbiAgICAgICAgbWFudGlzc2FQcmVjaXNpb24gPSBNYXRoLm1heCh0b3RhbExlbmd0aCAtIGNoYXJhY3RlcmlzdGljLmxlbmd0aCwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHt2YWx1ZSwgYWJicmV2aWF0aW9uLCBtYW50aXNzYVByZWNpc2lvbn07XG59XG5cbi8qKlxuICogQ29tcHV0ZSBhbiBleHBvbmVudGlhbCBmb3JtIGZvciBWQUxVRSwgdGFraW5nIGludG8gYWNjb3VudCBDSEFSQUNURVJJU1RJQ1xuICogaWYgcHJvdmlkZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSB2YWx1ZSB0byBjb21wdXRlXG4gKiBAcGFyYW0ge251bWJlcn0gW2NoYXJhY3RlcmlzdGljUHJlY2lzaW9uXSAtIG9wdGlvbmFsIGNoYXJhY3RlcmlzdGljIGxlbmd0aFxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUV4cG9uZW50aWFsKHt2YWx1ZSwgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gPSAwfSkge1xuICAgIGxldCBbbnVtYmVyU3RyaW5nLCBleHBvbmVudGlhbF0gPSB2YWx1ZS50b0V4cG9uZW50aWFsKCkuc3BsaXQoXCJlXCIpO1xuICAgIGxldCBudW1iZXIgPSArbnVtYmVyU3RyaW5nO1xuXG4gICAgaWYgKCFjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IG51bWJlcixcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbjogYGUke2V4cG9uZW50aWFsfWBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgY2hhcmFjdGVyaXN0aWNMZW5ndGggPSAxOyAvLyBzZWUgYHRvRXhwb25lbnRpYWxgXG5cbiAgICBpZiAoY2hhcmFjdGVyaXN0aWNMZW5ndGggPCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbikge1xuICAgICAgICBudW1iZXIgPSBudW1iZXIgKiBNYXRoLnBvdygxMCwgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gLSBjaGFyYWN0ZXJpc3RpY0xlbmd0aCk7XG4gICAgICAgIGV4cG9uZW50aWFsID0gK2V4cG9uZW50aWFsIC0gKGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uIC0gY2hhcmFjdGVyaXN0aWNMZW5ndGgpO1xuICAgICAgICBleHBvbmVudGlhbCA9IGV4cG9uZW50aWFsID49IDAgPyBgKyR7ZXhwb25lbnRpYWx9YCA6IGV4cG9uZW50aWFsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiBudW1iZXIsXG4gICAgICAgIGFiYnJldmlhdGlvbjogYGUke2V4cG9uZW50aWFsfWBcbiAgICB9O1xufVxuXG4vKipcbiAqIFJldHVybiBhIHN0cmluZyBvZiBOVU1CRVIgemVyby5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gTGVuZ3RoIG9mIHRoZSBvdXRwdXRcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gemVyb2VzKG51bWJlcikge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyOyBpKyspIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiMFwiO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyBWQUxVRSB3aXRoIGEgUFJFQ0lTSU9OLWxvbmcgbWFudGlzc2EuXG4gKiBUaGlzIG1ldGhvZCBpcyBmb3IgbGFyZ2Uvc21hbGwgbnVtYmVycyBvbmx5IChhLmsuYS4gaW5jbHVkaW5nIGEgXCJlXCIpLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciB0byBwcmVjaXNlXG4gKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIC0gZGVzaXJlZCBsZW5ndGggZm9yIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB0b0ZpeGVkTGFyZ2UodmFsdWUsIHByZWNpc2lvbikge1xuICAgIGxldCByZXN1bHQgPSB2YWx1ZS50b1N0cmluZygpO1xuXG4gICAgbGV0IFtiYXNlLCBleHBdID0gcmVzdWx0LnNwbGl0KFwiZVwiKTtcblxuICAgIGxldCBbY2hhcmFjdGVyaXN0aWMsIG1hbnRpc3NhID0gXCJcIl0gPSBiYXNlLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmICgrZXhwID4gMCkge1xuICAgICAgICByZXN1bHQgPSBjaGFyYWN0ZXJpc3RpYyArIG1hbnRpc3NhICsgemVyb2VzKGV4cCAtIG1hbnRpc3NhLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByZWZpeCA9IFwiLlwiO1xuXG4gICAgICAgIGlmICgrY2hhcmFjdGVyaXN0aWMgPCAwKSB7XG4gICAgICAgICAgICBwcmVmaXggPSBgLTAke3ByZWZpeH1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJlZml4ID0gYDAke3ByZWZpeH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN1ZmZpeCA9ICh6ZXJvZXMoLWV4cCAtIDEpICsgTWF0aC5hYnMoY2hhcmFjdGVyaXN0aWMpICsgbWFudGlzc2EpLnN1YnN0cigwLCBwcmVjaXNpb24pO1xuICAgICAgICBpZiAoc3VmZml4Lmxlbmd0aCA8IHByZWNpc2lvbikge1xuICAgICAgICAgICAgc3VmZml4ICs9IHplcm9lcyhwcmVjaXNpb24gLSBzdWZmaXgubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBwcmVmaXggKyBzdWZmaXg7XG4gICAgfVxuXG4gICAgaWYgKCtleHAgPiAwICYmIHByZWNpc2lvbiA+IDApIHtcbiAgICAgICAgcmVzdWx0ICs9IGAuJHt6ZXJvZXMocHJlY2lzaW9uKX1gO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyBWQUxVRSB3aXRoIGEgUFJFQ0lTSU9OLWxvbmcgbWFudGlzc2EuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHByZWNpc2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIGxlbmd0aCBmb3IgdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbikge1xuICAgIGlmICh2YWx1ZS50b1N0cmluZygpLmluZGV4T2YoXCJlXCIpICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gdG9GaXhlZExhcmdlKHZhbHVlLCBwcmVjaXNpb24pO1xuICAgIH1cblxuICAgIHJldHVybiAoTWF0aC5yb3VuZCgrYCR7dmFsdWV9ZSske3ByZWNpc2lvbn1gKSAvIChNYXRoLnBvdygxMCwgcHJlY2lzaW9uKSkpLnRvRml4ZWQocHJlY2lzaW9uKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgT1VUUFVUIHdpdGggYSBtYW50aXNzYSBwcmVjaXNpb24gb2YgUFJFQ0lTSU9OLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIGJlaW5nIGN1cnJlbnRseSBmb3JtYXR0ZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9uYWxNYW50aXNzYSAtIGB0cnVlYCBpZiB0aGUgbWFudGlzc2EgaXMgb21pdHRlZCB3aGVuIGl0J3Mgb25seSB6ZXJvZXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIHByZWNpc2lvbiBvZiB0aGUgbWFudGlzc2FcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdHJpbSAtIGRlc2lyZWQgcHJlY2lzaW9uIG9mIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzZXRNYW50aXNzYVByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbE1hbnRpc3NhLCBwcmVjaXNpb24sIHRyaW0pIHtcbiAgICBpZiAocHJlY2lzaW9uID09PSAtMSkge1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSB0b0ZpeGVkKHZhbHVlLCBwcmVjaXNpb24pO1xuICAgIGxldCBbY3VycmVudENoYXJhY3RlcmlzdGljLCBjdXJyZW50TWFudGlzc2EgPSBcIlwiXSA9IHJlc3VsdC50b1N0cmluZygpLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmIChjdXJyZW50TWFudGlzc2EubWF0Y2goL14wKyQvKSAmJiAob3B0aW9uYWxNYW50aXNzYSB8fCB0cmltKSkge1xuICAgICAgICByZXR1cm4gY3VycmVudENoYXJhY3RlcmlzdGljO1xuICAgIH1cblxuICAgIGxldCBoYXNMZWFkaW5nWmVyb2VzID0gcmVzdWx0Lm1hdGNoKC8wKyQvKTtcbiAgICBpZiAodHJpbSAmJiBoYXNMZWFkaW5nWmVyb2VzKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKS5zbGljZSgwLCBoYXNMZWFkaW5nWmVyb2VzLmluZGV4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0LnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IE9VVFBVVCB3aXRoIGEgY2hhcmFjdGVyaXN0aWMgcHJlY2lzaW9uIG9mIFBSRUNJU0lPTi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMgLSBgdHJ1ZWAgaWYgdGhlIGNoYXJhY3RlcmlzdGljIGlzIG9taXR0ZWQgd2hlbiBpdCdzIG9ubHkgemVyb2VzXG4gKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIC0gZGVzaXJlZCBwcmVjaXNpb24gb2YgdGhlIGNoYXJhY3RlcmlzdGljXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHNldENoYXJhY3RlcmlzdGljUHJlY2lzaW9uKG91dHB1dCwgdmFsdWUsIG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMsIHByZWNpc2lvbikge1xuICAgIGxldCByZXN1bHQgPSBvdXRwdXQ7XG4gICAgbGV0IFtjdXJyZW50Q2hhcmFjdGVyaXN0aWMsIGN1cnJlbnRNYW50aXNzYV0gPSByZXN1bHQudG9TdHJpbmcoKS5zcGxpdChcIi5cIik7XG5cbiAgICBpZiAoY3VycmVudENoYXJhY3RlcmlzdGljLm1hdGNoKC9eLT8wJC8pICYmIG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMpIHtcbiAgICAgICAgaWYgKCFjdXJyZW50TWFudGlzc2EpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q2hhcmFjdGVyaXN0aWMucmVwbGFjZShcIjBcIiwgXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYCR7Y3VycmVudENoYXJhY3RlcmlzdGljLnJlcGxhY2UoXCIwXCIsIFwiXCIpfS4ke2N1cnJlbnRNYW50aXNzYX1gO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoIDwgcHJlY2lzaW9uKSB7XG4gICAgICAgIGxldCBtaXNzaW5nWmVyb3MgPSBwcmVjaXNpb24gLSBjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pc3NpbmdaZXJvczsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBgMCR7cmVzdWx0fWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0LnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBpbmRleGVzIHdoZXJlIGFyZSB0aGUgZ3JvdXAgc2VwYXJhdGlvbnMgYWZ0ZXIgc3BsaXR0aW5nXG4gKiBgdG90YWxMZW5ndGhgIGluIGdyb3VwIG9mIGBncm91cFNpemVgIHNpemUuXG4gKiBJbXBvcnRhbnQ6IHdlIHN0YXJ0IGdyb3VwaW5nIGZyb20gdGhlIHJpZ2h0IGhhbmQgc2lkZS5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdG90YWxMZW5ndGggLSB0b3RhbCBsZW5ndGggb2YgdGhlIGNoYXJhY3RlcmlzdGljIHRvIHNwbGl0XG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBTaXplIC0gbGVuZ3RoIG9mIGVhY2ggZ3JvdXBcbiAqIEByZXR1cm4ge1tudW1iZXJdfVxuICovXG5mdW5jdGlvbiBpbmRleGVzT2ZHcm91cFNwYWNlcyh0b3RhbExlbmd0aCwgZ3JvdXBTaXplKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBjb3VudGVyID0gMDtcbiAgICBmb3IgKGxldCBpID0gdG90YWxMZW5ndGg7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaWYgKGNvdW50ZXIgPT09IGdyb3VwU2l6ZSkge1xuICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQoaSk7XG4gICAgICAgICAgICBjb3VudGVyID0gMDtcbiAgICAgICAgfVxuICAgICAgICBjb3VudGVyKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXBsYWNlIHRoZSBkZWNpbWFsIHNlcGFyYXRvciB3aXRoIERFQ0lNQUxTRVBBUkFUT1IgYW5kIGluc2VydCB0aG91c2FuZFxuICogc2VwYXJhdG9ycy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHRob3VzYW5kU2VwYXJhdGVkIC0gYHRydWVgIGlmIHRoZSBjaGFyYWN0ZXJpc3RpYyBtdXN0IGJlIHNlcGFyYXRlZFxuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZWNpbWFsU2VwYXJhdG9yIC0gc3RyaW5nIHRvIHVzZSBhcyBkZWNpbWFsIHNlcGFyYXRvclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiByZXBsYWNlRGVsaW1pdGVycyhvdXRwdXQsIHZhbHVlLCB0aG91c2FuZFNlcGFyYXRlZCwgc3RhdGUsIGRlY2ltYWxTZXBhcmF0b3IpIHtcbiAgICBsZXQgZGVsaW1pdGVycyA9IHN0YXRlLmN1cnJlbnREZWxpbWl0ZXJzKCk7XG4gICAgbGV0IHRob3VzYW5kU2VwYXJhdG9yID0gZGVsaW1pdGVycy50aG91c2FuZHM7XG4gICAgZGVjaW1hbFNlcGFyYXRvciA9IGRlY2ltYWxTZXBhcmF0b3IgfHwgZGVsaW1pdGVycy5kZWNpbWFsO1xuICAgIGxldCB0aG91c2FuZHNTaXplID0gZGVsaW1pdGVycy50aG91c2FuZHNTaXplIHx8IDM7XG5cbiAgICBsZXQgcmVzdWx0ID0gb3V0cHV0LnRvU3RyaW5nKCk7XG4gICAgbGV0IGNoYXJhY3RlcmlzdGljID0gcmVzdWx0LnNwbGl0KFwiLlwiKVswXTtcbiAgICBsZXQgbWFudGlzc2EgPSByZXN1bHQuc3BsaXQoXCIuXCIpWzFdO1xuXG4gICAgaWYgKHRob3VzYW5kU2VwYXJhdGVkKSB7XG4gICAgICAgIGlmICh2YWx1ZSA8IDApIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbWludXMgc2lnblxuICAgICAgICAgICAgY2hhcmFjdGVyaXN0aWMgPSBjaGFyYWN0ZXJpc3RpYy5zbGljZSgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbmRleGVzVG9JbnNlcnRUaG91c2FuZERlbGltaXRlcnMgPSBpbmRleGVzT2ZHcm91cFNwYWNlcyhjaGFyYWN0ZXJpc3RpYy5sZW5ndGgsIHRob3VzYW5kc1NpemUpO1xuICAgICAgICBpbmRleGVzVG9JbnNlcnRUaG91c2FuZERlbGltaXRlcnMuZm9yRWFjaCgocG9zaXRpb24sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLnNsaWNlKDAsIHBvc2l0aW9uICsgaW5kZXgpICsgdGhvdXNhbmRTZXBhcmF0b3IgKyBjaGFyYWN0ZXJpc3RpYy5zbGljZShwb3NpdGlvbiArIGluZGV4KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHZhbHVlIDwgMCkge1xuICAgICAgICAgICAgLy8gQWRkIGJhY2sgdGhlIG1pbnVzIHNpZ25cbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljID0gYC0ke2NoYXJhY3RlcmlzdGljfWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW1hbnRpc3NhKSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljICsgZGVjaW1hbFNlcGFyYXRvciArIG1hbnRpc3NhO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgcHJvdmlkZWQgQUJCUkVWSUFUSU9OIGF0IHRoZSBlbmQgb2YgT1VUUFVULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtzdHJpbmd9IGFiYnJldmlhdGlvbiAtIGFiYnJldmlhdGlvbiB0byBhcHBlbmRcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbikge1xuICAgIHJldHVybiBvdXRwdXQgKyBhYmJyZXZpYXRpb247XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwb3NpdGl2ZS9uZWdhdGl2ZSBzaWduIGFjY29yZGluZyB0byB0aGUgTkVHQVRJVkUgZmxhZy5cbiAqIElmIHRoZSB2YWx1ZSBpcyBuZWdhdGl2ZSBidXQgc3RpbGwgb3V0cHV0IGFzIDAsIHRoZSBuZWdhdGl2ZSBzaWduIGlzIHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtzdHJpbmd9IG5lZ2F0aXZlIC0gZmxhZyBmb3IgdGhlIG5lZ2F0aXZlIGZvcm0gKFwic2lnblwiIG9yIFwicGFyZW50aGVzaXNcIilcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydFNpZ24ob3V0cHV0LCB2YWx1ZSwgbmVnYXRpdmUpIHtcbiAgICBpZiAodmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBpZiAoK291dHB1dCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb3V0cHV0LnJlcGxhY2UoXCItXCIsIFwiXCIpO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSA+IDApIHtcbiAgICAgICAgcmV0dXJuIGArJHtvdXRwdXR9YDtcbiAgICB9XG5cbiAgICBpZiAobmVnYXRpdmUgPT09IFwic2lnblwiKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAoJHtvdXRwdXQucmVwbGFjZShcIi1cIiwgXCJcIil9KWA7XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwcm92aWRlZCBQUkVGSVggYXQgdGhlIHN0YXJ0IG9mIE9VVFBVVC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBhYmJyZXZpYXRpb24gdG8gcHJlcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0UHJlZml4KG91dHB1dCwgcHJlZml4KSB7XG4gICAgcmV0dXJuIHByZWZpeCArIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHByb3ZpZGVkIFBPU1RGSVggYXQgdGhlIGVuZCBvZiBPVVRQVVQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gcG9zdGZpeCAtIGFiYnJldmlhdGlvbiB0byBhcHBlbmRcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydFBvc3RmaXgob3V0cHV0LCBwb3N0Zml4KSB7XG4gICAgcmV0dXJuIG91dHB1dCArIHBvc3RmaXg7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIG51bWJlciB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICogVGhpcyBpcyB0aGUga2V5IG1ldGhvZCBvZiB0aGUgZnJhbWV3b3JrIVxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IFtwcm92aWRlZEZvcm1hdF0gLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IGRlY2ltYWxTZXBhcmF0b3IgLSBzdHJpbmcgdG8gdXNlIGFzIGRlY2ltYWwgc2VwYXJhdG9yXG4gKiBAcGFyYW0ge3t9fSBkZWZhdWx0cyAtIFNldCBvZiBkZWZhdWx0IHZhbHVlcyB1c2VkIGZvciBmb3JtYXR0aW5nXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE51bWJlcih7aW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSA9IGdsb2JhbFN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yLCBkZWZhdWx0cyA9IHN0YXRlLmN1cnJlbnREZWZhdWx0cygpfSkge1xuICAgIGxldCB2YWx1ZSA9IGluc3RhbmNlLl92YWx1ZTtcblxuICAgIGlmICh2YWx1ZSA9PT0gMCAmJiBzdGF0ZS5oYXNaZXJvRm9ybWF0KCkpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmdldFplcm9Gb3JtYXQoKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBkZWZhdWx0cywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgbGV0IHRvdGFsTGVuZ3RoID0gb3B0aW9ucy50b3RhbExlbmd0aDtcbiAgICBsZXQgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gPSB0b3RhbExlbmd0aCA/IDAgOiBvcHRpb25zLmNoYXJhY3RlcmlzdGljO1xuICAgIGxldCBvcHRpb25hbENoYXJhY3RlcmlzdGljID0gb3B0aW9ucy5vcHRpb25hbENoYXJhY3RlcmlzdGljO1xuICAgIGxldCBmb3JjZUF2ZXJhZ2UgPSBvcHRpb25zLmZvcmNlQXZlcmFnZTtcbiAgICBsZXQgYXZlcmFnZSA9ICEhdG90YWxMZW5ndGggfHwgISFmb3JjZUF2ZXJhZ2UgfHwgb3B0aW9ucy5hdmVyYWdlO1xuXG4gICAgLy8gZGVmYXVsdCB3aGVuIGF2ZXJhZ2luZyBpcyB0byBjaG9wIG9mZiBkZWNpbWFsc1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IHRvdGFsTGVuZ3RoID8gLTEgOiAoYXZlcmFnZSAmJiBwcm92aWRlZEZvcm1hdC5tYW50aXNzYSA9PT0gdW5kZWZpbmVkID8gMCA6IG9wdGlvbnMubWFudGlzc2EpO1xuICAgIGxldCBvcHRpb25hbE1hbnRpc3NhID0gdG90YWxMZW5ndGggPyBmYWxzZSA6IChwcm92aWRlZEZvcm1hdC5vcHRpb25hbE1hbnRpc3NhID09PSB1bmRlZmluZWQgPyBtYW50aXNzYVByZWNpc2lvbiA9PT0gLTEgOiBvcHRpb25zLm9wdGlvbmFsTWFudGlzc2EpO1xuICAgIGxldCB0cmltTWFudGlzc2EgPSBvcHRpb25zLnRyaW1NYW50aXNzYTtcbiAgICBsZXQgdGhvdXNhbmRTZXBhcmF0ZWQgPSBvcHRpb25zLnRob3VzYW5kU2VwYXJhdGVkO1xuICAgIGxldCBzcGFjZVNlcGFyYXRlZCA9IG9wdGlvbnMuc3BhY2VTZXBhcmF0ZWQ7XG4gICAgbGV0IG5lZ2F0aXZlID0gb3B0aW9ucy5uZWdhdGl2ZTtcbiAgICBsZXQgZm9yY2VTaWduID0gb3B0aW9ucy5mb3JjZVNpZ247XG4gICAgbGV0IGV4cG9uZW50aWFsID0gb3B0aW9ucy5leHBvbmVudGlhbDtcblxuICAgIGxldCBhYmJyZXZpYXRpb24gPSBcIlwiO1xuXG4gICAgaWYgKGF2ZXJhZ2UpIHtcbiAgICAgICAgbGV0IGRhdGEgPSBjb21wdXRlQXZlcmFnZSh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGZvcmNlQXZlcmFnZSxcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbnM6IHN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCksXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZDogc3BhY2VTZXBhcmF0ZWQsXG4gICAgICAgICAgICB0b3RhbExlbmd0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YWx1ZSA9IGRhdGEudmFsdWU7XG4gICAgICAgIGFiYnJldmlhdGlvbiArPSBkYXRhLmFiYnJldmlhdGlvbjtcblxuICAgICAgICBpZiAodG90YWxMZW5ndGgpIHtcbiAgICAgICAgICAgIG1hbnRpc3NhUHJlY2lzaW9uID0gZGF0YS5tYW50aXNzYVByZWNpc2lvbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHBvbmVudGlhbCkge1xuICAgICAgICBsZXQgZGF0YSA9IGNvbXB1dGVFeHBvbmVudGlhbCh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhbHVlID0gZGF0YS52YWx1ZTtcbiAgICAgICAgYWJicmV2aWF0aW9uID0gZGF0YS5hYmJyZXZpYXRpb24gKyBhYmJyZXZpYXRpb247XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IHNldE1hbnRpc3NhUHJlY2lzaW9uKHZhbHVlLnRvU3RyaW5nKCksIHZhbHVlLCBvcHRpb25hbE1hbnRpc3NhLCBtYW50aXNzYVByZWNpc2lvbiwgdHJpbU1hbnRpc3NhKTtcbiAgICBvdXRwdXQgPSBzZXRDaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbENoYXJhY3RlcmlzdGljLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbik7XG4gICAgb3V0cHV0ID0gcmVwbGFjZURlbGltaXRlcnMob3V0cHV0LCB2YWx1ZSwgdGhvdXNhbmRTZXBhcmF0ZWQsIHN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yKTtcblxuICAgIGlmIChhdmVyYWdlIHx8IGV4cG9uZW50aWFsKSB7XG4gICAgICAgIG91dHB1dCA9IGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKGZvcmNlU2lnbiB8fCB2YWx1ZSA8IDApIHtcbiAgICAgICAgb3V0cHV0ID0gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJZiBGT1JNQVQgaXMgbm9uLW51bGwgYW5kIG5vdCBqdXN0IGFuIG91dHB1dCwgcmV0dXJuIEZPUk1BVC5cbiAqIFJldHVybiBERUZBVUxURk9STUFUIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZWRGb3JtYXRcbiAqIEBwYXJhbSBkZWZhdWx0Rm9ybWF0XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZGVmYXVsdEZvcm1hdCkge1xuICAgIGlmICghcHJvdmlkZWRGb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwcm92aWRlZEZvcm1hdCk7XG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFwib3V0cHV0XCIpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3ZpZGVkRm9ybWF0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChudW1icm8pID0+ICh7XG4gICAgZm9ybWF0OiAoLi4uYXJncykgPT4gZm9ybWF0KC4uLmFyZ3MsIG51bWJybyksXG4gICAgZ2V0Qnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXRCeXRlVW5pdCguLi5hcmdzLCBudW1icm8pLFxuICAgIGdldEJpbmFyeUJ5dGVVbml0OiAoLi4uYXJncykgPT4gZ2V0QmluYXJ5Qnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBnZXREZWNpbWFsQnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXREZWNpbWFsQnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBmb3JtYXRPckRlZmF1bHRcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGVuVVMgPSByZXF1aXJlKFwiLi9lbi1VU1wiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmxldCBzdGF0ZSA9IHt9O1xuXG5sZXQgY3VycmVudExhbmd1YWdlVGFnID0gdW5kZWZpbmVkO1xubGV0IGxhbmd1YWdlcyA9IHt9O1xuXG5sZXQgemVyb0Zvcm1hdCA9IG51bGw7XG5cbmxldCBnbG9iYWxEZWZhdWx0cyA9IHt9O1xuXG5mdW5jdGlvbiBjaG9vc2VMYW5ndWFnZSh0YWcpIHsgY3VycmVudExhbmd1YWdlVGFnID0gdGFnOyB9XG5cbmZ1bmN0aW9uIGN1cnJlbnRMYW5ndWFnZURhdGEoKSB7IHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlVGFnXTsgfVxuXG4vKipcbiAqIFJldHVybiBhbGwgdGhlIHJlZ2lzdGVyIGxhbmd1YWdlc1xuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5sYW5ndWFnZXMgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBsYW5ndWFnZXMpO1xuXG4vL1xuLy8gQ3VycmVudCBsYW5ndWFnZSBhY2Nlc3NvcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIHRhZ1xuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuc3RhdGUuY3VycmVudExhbmd1YWdlID0gKCkgPT4gY3VycmVudExhbmd1YWdlVGFnO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRDdXJyZW5jeSA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgYWJicmV2aWF0aW9ucyBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLmFiYnJldmlhdGlvbnM7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRlbGltaXRlcnMgZGF0YVxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50RGVsaW1pdGVycyA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5kZWxpbWl0ZXJzO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBvcmRpbmFsIGZ1bmN0aW9uXG4gKlxuICogQHJldHVybiB7ZnVuY3Rpb259XG4gKi9cbnN0YXRlLmN1cnJlbnRPcmRpbmFsID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLm9yZGluYWw7XG5cbi8vXG4vLyBEZWZhdWx0c1xuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgZm9ybWF0dGluZyBkZWZhdWx0cy5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIGdsb2JhbGx5IGRlZmluZWQgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnREZWZhdWx0cyA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5kZWZhdWx0cywgZ2xvYmFsRGVmYXVsdHMpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgb3JkaW5hbCBkZWZhdWx0LWZvcm1hdC5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIG9yZGluYWwgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudE9yZGluYWxEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5vcmRpbmFsRm9ybWF0KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGJ5dGUgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBieXRlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuYnl0ZUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwZXJjZW50YWdlIGRlZmF1bHQtZm9ybWF0LlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgcGVyY2VudGFnZSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50UGVyY2VudGFnZURlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLnBlcmNlbnRhZ2VGb3JtYXQpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVuY3kgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0aW1lIGRlZmF1bHQtZm9ybWF0LlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgY3VycmVuY3kgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudFRpbWVEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS50aW1lRm9ybWF0KTtcblxuLyoqXG4gKiBTZXQgdGhlIGdsb2JhbCBmb3JtYXR0aW5nIGRlZmF1bHRzLlxuICpcbiAqIEBwYXJhbSB7e318c3RyaW5nfSBmb3JtYXQgLSBmb3JtYXR0aW5nIG9wdGlvbnMgdG8gdXNlIGFzIGRlZmF1bHRzXG4gKi9cbnN0YXRlLnNldERlZmF1bHRzID0gKGZvcm1hdCkgPT4ge1xuICAgIGZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQoZm9ybWF0KTtcbiAgICBpZiAodmFsaWRhdGluZy52YWxpZGF0ZUZvcm1hdChmb3JtYXQpKSB7XG4gICAgICAgIGdsb2JhbERlZmF1bHRzID0gZm9ybWF0O1xuICAgIH1cbn07XG5cbi8vXG4vLyBaZXJvIGZvcm1hdFxuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGZvcm1hdCBzdHJpbmcgZm9yIDAuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5zdGF0ZS5nZXRaZXJvRm9ybWF0ID0gKCkgPT4gemVyb0Zvcm1hdDtcblxuLyoqXG4gKiBTZXQgYSBTVFJJTkcgdG8gb3V0cHV0IHdoZW4gdGhlIHZhbHVlIGlzIDAuXG4gKlxuICogQHBhcmFtIHt7fXxzdHJpbmd9IHN0cmluZyAtIHN0cmluZyB0byBzZXRcbiAqL1xuc3RhdGUuc2V0WmVyb0Zvcm1hdCA9IChzdHJpbmcpID0+IHplcm9Gb3JtYXQgPSB0eXBlb2Yoc3RyaW5nKSA9PT0gXCJzdHJpbmdcIiA/IHN0cmluZyA6IG51bGw7XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgYSBmb3JtYXQgZm9yIDAgaGFzIGJlZW4gc2V0IGFscmVhZHkuXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuc3RhdGUuaGFzWmVyb0Zvcm1hdCA9ICgpID0+IHplcm9Gb3JtYXQgIT09IG51bGw7XG5cbi8vXG4vLyBHZXR0ZXJzL1NldHRlcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYW5ndWFnZSBkYXRhIGZvciB0aGUgcHJvdmlkZWQgVEFHLlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRhdGEgaWYgbm8gdGFnIGlzIHByb3ZpZGVkLlxuICpcbiAqIFRocm93IGFuIGVycm9yIGlmIHRoZSB0YWcgZG9lc24ndCBtYXRjaCBhbnkgcmVnaXN0ZXJlZCBsYW5ndWFnZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW3RhZ10gLSBsYW5ndWFnZSB0YWcgb2YgYSByZWdpc3RlcmVkIGxhbmd1YWdlXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUubGFuZ3VhZ2VEYXRhID0gKHRhZykgPT4ge1xuICAgIGlmICh0YWcpIHtcbiAgICAgICAgaWYgKGxhbmd1YWdlc1t0YWddKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW3RhZ107XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRhZyBcIiR7dGFnfVwiYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZURhdGEoKTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIHByb3ZpZGVkIERBVEEgYXMgYSBsYW5ndWFnZSBpZiBhbmQgb25seSBpZiB0aGUgZGF0YSBpcyB2YWxpZC5cbiAqIElmIHRoZSBkYXRhIGlzIG5vdCB2YWxpZCwgYW4gZXJyb3IgaXMgdGhyb3duLlxuICpcbiAqIFdoZW4gVVNFTEFOR1VBR0UgaXMgdHJ1ZSwgdGhlIHJlZ2lzdGVyZWQgbGFuZ3VhZ2UgaXMgdGhlbiB1c2VkLlxuICpcbiAqIEBwYXJhbSB7e319IGRhdGEgLSBsYW5ndWFnZSBkYXRhIHRvIHJlZ2lzdGVyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1c2VMYW5ndWFnZV0gLSBgdHJ1ZWAgaWYgdGhlIHByb3ZpZGVkIGRhdGEgc2hvdWxkIGJlY29tZSB0aGUgY3VycmVudCBsYW5ndWFnZVxuICovXG5zdGF0ZS5yZWdpc3Rlckxhbmd1YWdlID0gKGRhdGEsIHVzZUxhbmd1YWdlID0gZmFsc2UpID0+IHtcbiAgICBpZiAoIXZhbGlkYXRpbmcudmFsaWRhdGVMYW5ndWFnZShkYXRhKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGxhbmd1YWdlIGRhdGFcIik7XG4gICAgfVxuXG4gICAgbGFuZ3VhZ2VzW2RhdGEubGFuZ3VhZ2VUYWddID0gZGF0YTtcblxuICAgIGlmICh1c2VMYW5ndWFnZSkge1xuICAgICAgICBjaG9vc2VMYW5ndWFnZShkYXRhLmxhbmd1YWdlVGFnKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY3VycmVudCBsYW5ndWFnZSBhY2NvcmRpbmcgdG8gVEFHLlxuICogSWYgVEFHIGRvZXNuJ3QgbWF0Y2ggYSByZWdpc3RlcmVkIGxhbmd1YWdlLCBhbm90aGVyIGxhbmd1YWdlIG1hdGNoaW5nXG4gKiB0aGUgXCJsYW5ndWFnZVwiIHBhcnQgb2YgdGhlIHRhZyAoYWNjb3JkaW5nIHRvIEJDUDQ3OiBodHRwczovL3Rvb2xzLmlldGYub3JnL3JmYy9iY3AvYmNwNDcudHh0KS5cbiAqIElmIG5vbmUsIHRoZSBGQUxMQkFDS1RBRyBpcyB1c2VkLiBJZiB0aGUgRkFMTEJBQ0tUQUcgZG9lc24ndCBtYXRjaCBhIHJlZ2lzdGVyIGxhbmd1YWdlLFxuICogYGVuLVVTYCBpcyBmaW5hbGx5IHVzZWQuXG4gKlxuICogQHBhcmFtIHRhZ1xuICogQHBhcmFtIGZhbGxiYWNrVGFnXG4gKi9cbnN0YXRlLnNldExhbmd1YWdlID0gKHRhZywgZmFsbGJhY2tUYWcgPSBlblVTLmxhbmd1YWdlVGFnKSA9PiB7XG4gICAgaWYgKCFsYW5ndWFnZXNbdGFnXSkge1xuICAgICAgICBsZXQgc3VmZml4ID0gdGFnLnNwbGl0KFwiLVwiKVswXTtcblxuICAgICAgICBsZXQgbWF0Y2hpbmdMYW5ndWFnZVRhZyA9IE9iamVjdC5rZXlzKGxhbmd1YWdlcykuZmluZChlYWNoID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlYWNoLnNwbGl0KFwiLVwiKVswXSA9PT0gc3VmZml4O1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWxhbmd1YWdlc1ttYXRjaGluZ0xhbmd1YWdlVGFnXSkge1xuICAgICAgICAgICAgY2hvb3NlTGFuZ3VhZ2UoZmFsbGJhY2tUYWcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hvb3NlTGFuZ3VhZ2UobWF0Y2hpbmdMYW5ndWFnZVRhZyk7XG4gICAgfVxuXG4gICAgY2hvb3NlTGFuZ3VhZ2UodGFnKTtcbn07XG5cbnN0YXRlLnJlZ2lzdGVyTGFuZ3VhZ2UoZW5VUyk7XG5jdXJyZW50TGFuZ3VhZ2VUYWcgPSBlblVTLmxhbmd1YWdlVGFnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogTG9hZCBsYW5ndWFnZXMgbWF0Y2hpbmcgVEFHUy4gU2lsZW50bHkgcGFzcyBvdmVyIHRoZSBmYWlsaW5nIGxvYWQuXG4gKlxuICogV2UgYXNzdW1lIGhlcmUgdGhhdCB3ZSBhcmUgaW4gYSBub2RlIGVudmlyb25tZW50LCBzbyB3ZSBkb24ndCBjaGVjayBmb3IgaXQuXG4gKiBAcGFyYW0ge1tTdHJpbmddfSB0YWdzIC0gbGlzdCBvZiB0YWdzIHRvIGxvYWRcbiAqIEBwYXJhbSB7TnVtYnJvfSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICovXG5mdW5jdGlvbiBsb2FkTGFuZ3VhZ2VzSW5Ob2RlKHRhZ3MsIG51bWJybykge1xuICAgIHRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgIGxldCBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGF0YSA9IHJlcXVpcmUoYC4uL2xhbmd1YWdlcy8ke3RhZ31gKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hYmxlIHRvIGxvYWQgXCIke3RhZ31cIi4gTm8gbWF0Y2hpbmcgbGFuZ3VhZ2UgZmlsZSBmb3VuZC5gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgbnVtYnJvLnJlZ2lzdGVyTGFuZ3VhZ2UoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAobnVtYnJvKSA9PiAoe1xuICAgIGxvYWRMYW5ndWFnZXNJbk5vZGU6ICh0YWdzKSA9PiBsb2FkTGFuZ3VhZ2VzSW5Ob2RlKHRhZ3MsIG51bWJybylcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IEJpZ051bWJlciA9IHJlcXVpcmUoXCJiaWdudW1iZXIuanNcIik7XG5cbi8qKlxuICogQWRkIGEgbnVtYmVyIG9yIGEgbnVtYnJvIHRvIE4uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBhdWdlbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBhZGRlbmRcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gYWRkKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUuYWRkKG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogU3VidHJhY3QgYSBudW1iZXIgb3IgYSBudW1icm8gZnJvbSBOLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbWludWVuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIHN1YnRyYWhlbmRcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gc3VidHJhY3Qobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5taW51cyhvdGhlclZhbHVlKS50b051bWJlcigpO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIE11bHRpcGx5IE4gYnkgYSBudW1iZXIgb3IgYSBudW1icm8uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBtdWx0aXBsaWNhbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBtdWx0aXBsaWVyXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7TnVtYnJvfSBuXG4gKi9cbmZ1bmN0aW9uIG11bHRpcGx5KG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUudGltZXMob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBEaXZpZGUgTiBieSBhIG51bWJlciBvciBhIG51bWJyby5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIGRpdmlkZW5kXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyIC0gZGl2aXNvclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBkaXZpZGUobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5kaXZpZGVkQnkob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBTZXQgTiB0byB0aGUgT1RIRVIgKG9yIHRoZSB2YWx1ZSBvZiBPVEhFUiB3aGVuIGl0J3MgYSBudW1icm8gaW5zdGFuY2UpLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbnVtYnJvIGluc3RhbmNlIHRvIG11dGF0ZVxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIG5ldyB2YWx1ZSB0byBhc3NpZ24gdG8gTlxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBzZXQgKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBvdGhlcjtcblxuICAgIGlmIChudW1icm8uaXNOdW1icm8ob3RoZXIpKSB7XG4gICAgICAgIHZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG4uX3ZhbHVlID0gdmFsdWU7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIE4gYW5kIE9USEVSLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBkaWZmZXJlbmNlKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgY2xvbmUgPSBudW1icm8obi5fdmFsdWUpO1xuICAgIHN1YnRyYWN0KGNsb25lLCBvdGhlciwgbnVtYnJvKTtcblxuICAgIHJldHVybiBNYXRoLmFicyhjbG9uZS5fdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG51bWJybyA9PiAoe1xuICAgIGFkZDogKG4sIG90aGVyKSA9PiBhZGQobiwgb3RoZXIsIG51bWJybyksXG4gICAgc3VidHJhY3Q6IChuLCBvdGhlcikgPT4gc3VidHJhY3Qobiwgb3RoZXIsIG51bWJybyksXG4gICAgbXVsdGlwbHk6IChuLCBvdGhlcikgPT4gbXVsdGlwbHkobiwgb3RoZXIsIG51bWJybyksXG4gICAgZGl2aWRlOiAobiwgb3RoZXIpID0+IGRpdmlkZShuLCBvdGhlciwgbnVtYnJvKSxcbiAgICBzZXQ6IChuLCBvdGhlcikgPT4gc2V0KG4sIG90aGVyLCBudW1icm8pLFxuICAgIGRpZmZlcmVuY2U6IChuLCBvdGhlcikgPT4gZGlmZmVyZW5jZShuLCBvdGhlciwgbnVtYnJvKVxufSk7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgVkVSU0lPTiA9IFwiMi4xLjBcIjtcblxuY29uc3QgZ2xvYmFsU3RhdGUgPSByZXF1aXJlKFwiLi9nbG9iYWxTdGF0ZVwiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRpbmdcIik7XG5jb25zdCBsb2FkZXIgPSByZXF1aXJlKFwiLi9sb2FkaW5nXCIpKG51bWJybyk7XG5jb25zdCB1bmZvcm1hdHRlciA9IHJlcXVpcmUoXCIuL3VuZm9ybWF0dGluZ1wiKTtcbmxldCBmb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi9mb3JtYXR0aW5nXCIpKG51bWJybyk7XG5sZXQgbWFuaXB1bGF0ZSA9IHJlcXVpcmUoXCIuL21hbmlwdWxhdGluZ1wiKShudW1icm8pO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmNsYXNzIE51bWJybyB7XG4gICAgY29uc3RydWN0b3IobnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVtYmVyO1xuICAgIH1cblxuICAgIGNsb25lKCkgeyByZXR1cm4gbnVtYnJvKHRoaXMuX3ZhbHVlKTsgfVxuXG4gICAgZm9ybWF0KGZvcm1hdCA9IHt9KSB7IHJldHVybiBmb3JtYXR0ZXIuZm9ybWF0KHRoaXMsIGZvcm1hdCk7IH1cblxuICAgIGZvcm1hdEN1cnJlbmN5KGZvcm1hdCkge1xuICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZm9ybWF0ID0gcGFyc2luZy5wYXJzZUZvcm1hdChmb3JtYXQpO1xuICAgICAgICB9XG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdHRlci5mb3JtYXRPckRlZmF1bHQoZm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICBmb3JtYXQub3V0cHV0ID0gXCJjdXJyZW5jeVwiO1xuICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIGZvcm1hdFRpbWUoZm9ybWF0ID0ge30pIHtcbiAgICAgICAgZm9ybWF0Lm91dHB1dCA9IFwidGltZVwiO1xuICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIGJpbmFyeUJ5dGVVbml0cygpIHsgcmV0dXJuIGZvcm1hdHRlci5nZXRCaW5hcnlCeXRlVW5pdCh0aGlzKTt9XG5cbiAgICBkZWNpbWFsQnl0ZVVuaXRzKCkgeyByZXR1cm4gZm9ybWF0dGVyLmdldERlY2ltYWxCeXRlVW5pdCh0aGlzKTt9XG5cbiAgICBieXRlVW5pdHMoKSB7IHJldHVybiBmb3JtYXR0ZXIuZ2V0Qnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgZGlmZmVyZW5jZShvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5kaWZmZXJlbmNlKHRoaXMsIG90aGVyKTsgfVxuXG4gICAgYWRkKG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLmFkZCh0aGlzLCBvdGhlcik7IH1cblxuICAgIHN1YnRyYWN0KG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLnN1YnRyYWN0KHRoaXMsIG90aGVyKTsgfVxuXG4gICAgbXVsdGlwbHkob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUubXVsdGlwbHkodGhpcywgb3RoZXIpOyB9XG5cbiAgICBkaXZpZGUob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUuZGl2aWRlKHRoaXMsIG90aGVyKTsgfVxuXG4gICAgc2V0KGlucHV0KSB7IHJldHVybiBtYW5pcHVsYXRlLnNldCh0aGlzLCBub3JtYWxpemVJbnB1dChpbnB1dCkpOyB9XG5cbiAgICB2YWx1ZSgpIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG5cbiAgICB2YWx1ZU9mKCkgeyByZXR1cm4gdGhpcy5fdmFsdWU7IH1cbn1cblxuLyoqXG4gKiBNYWtlIGl0cyBiZXN0IHRvIGNvbnZlcnQgaW5wdXQgaW50byBhIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge251bWJyb3xzdHJpbmd8bnVtYmVyfSBpbnB1dCAtIElucHV0IHRvIGNvbnZlcnRcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplSW5wdXQoaW5wdXQpIHtcbiAgICBsZXQgcmVzdWx0ID0gaW5wdXQ7XG4gICAgaWYgKG51bWJyby5pc051bWJybyhpbnB1dCkpIHtcbiAgICAgICAgcmVzdWx0ID0gaW5wdXQuX3ZhbHVlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJlc3VsdCA9IG51bWJyby51bmZvcm1hdChpbnB1dCk7XG4gICAgfSBlbHNlIGlmIChpc05hTihpbnB1dCkpIHtcbiAgICAgICAgcmVzdWx0ID0gTmFOO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIG51bWJybyhpbnB1dCkge1xuICAgIHJldHVybiBuZXcgTnVtYnJvKG5vcm1hbGl6ZUlucHV0KGlucHV0KSk7XG59XG5cbm51bWJyby52ZXJzaW9uID0gVkVSU0lPTjtcblxubnVtYnJvLmlzTnVtYnJvID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIE51bWJybztcbn07XG5cbi8vXG4vLyBgbnVtYnJvYCBzdGF0aWMgbWV0aG9kc1xuLy9cblxubnVtYnJvLmxhbmd1YWdlID0gZ2xvYmFsU3RhdGUuY3VycmVudExhbmd1YWdlO1xubnVtYnJvLnJlZ2lzdGVyTGFuZ3VhZ2UgPSBnbG9iYWxTdGF0ZS5yZWdpc3Rlckxhbmd1YWdlO1xubnVtYnJvLnNldExhbmd1YWdlID0gZ2xvYmFsU3RhdGUuc2V0TGFuZ3VhZ2U7XG5udW1icm8ubGFuZ3VhZ2VzID0gZ2xvYmFsU3RhdGUubGFuZ3VhZ2VzO1xubnVtYnJvLmxhbmd1YWdlRGF0YSA9IGdsb2JhbFN0YXRlLmxhbmd1YWdlRGF0YTtcbm51bWJyby56ZXJvRm9ybWF0ID0gZ2xvYmFsU3RhdGUuc2V0WmVyb0Zvcm1hdDtcbm51bWJyby5kZWZhdWx0Rm9ybWF0ID0gZ2xvYmFsU3RhdGUuY3VycmVudERlZmF1bHRzO1xubnVtYnJvLnNldERlZmF1bHRzID0gZ2xvYmFsU3RhdGUuc2V0RGVmYXVsdHM7XG5udW1icm8uZGVmYXVsdEN1cnJlbmN5Rm9ybWF0ID0gZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdDtcbm51bWJyby52YWxpZGF0ZSA9IHZhbGlkYXRvci52YWxpZGF0ZTtcbm51bWJyby5sb2FkTGFuZ3VhZ2VzSW5Ob2RlID0gbG9hZGVyLmxvYWRMYW5ndWFnZXNJbk5vZGU7XG5udW1icm8udW5mb3JtYXQgPSB1bmZvcm1hdHRlci51bmZvcm1hdDtcblxubW9kdWxlLmV4cG9ydHMgPSBudW1icm87XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIHByZWZpeC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VQcmVmaXgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL157KFtefV0qKX0vKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnByZWZpeCA9IG1hdGNoWzFdO1xuICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIHBvc3RmaXguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlUG9zdGZpeChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYXRjaCA9IHN0cmluZy5tYXRjaCgveyhbXn1dKil9JC8pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXN1bHQucG9zdGZpeCA9IG1hdGNoWzFdO1xuXG4gICAgICAgIHJldHVybiBzdHJpbmcuc2xpY2UoMCwgLW1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgb3V0cHV0IHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICovXG5mdW5jdGlvbiBwYXJzZU91dHB1dChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIiRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImN1cnJlbmN5XCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIlXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJwZXJjZW50XCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJiZFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwiYnl0ZVwiO1xuICAgICAgICByZXN1bHQuYmFzZSA9IFwiZ2VuZXJhbFwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwiYnl0ZVwiO1xuICAgICAgICByZXN1bHQuYmFzZSA9IFwiYmluYXJ5XCI7XG4gICAgICAgIHJldHVybjtcblxuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcImRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImRlY2ltYWxcIjtcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiOlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwidGltZVwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwib1wiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwib3JkaW5hbFwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgdGhvdXNhbmQgc2VwYXJhdGVkIHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZVRob3VzYW5kU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiLFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LnRob3VzYW5kU2VwYXJhdGVkID0gdHJ1ZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHNwYWNlIHNlcGFyYXRlZCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VTcGFjZVNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIiBcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5zcGFjZVNlcGFyYXRlZCA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSB0b3RhbCBsZW5ndGguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlVG90YWxMZW5ndGgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL1sxLTldK1swLTldKi8pO1xuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC50b3RhbExlbmd0aCA9ICttYXRjaFswXTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIGNoYXJhY3RlcmlzdGljIGxlbmd0aC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHN0cmluZy5zcGxpdChcIi5cIilbMF07XG4gICAgbGV0IG1hdGNoID0gY2hhcmFjdGVyaXN0aWMubWF0Y2goLzArLyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC5jaGFyYWN0ZXJpc3RpYyA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIG1hbnRpc3NhIGxlbmd0aC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VNYW50aXNzYShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYW50aXNzYSA9IHN0cmluZy5zcGxpdChcIi5cIilbMV07XG4gICAgaWYgKG1hbnRpc3NhKSB7XG4gICAgICAgIGxldCBtYXRjaCA9IG1hbnRpc3NhLm1hdGNoKC8wKy8pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHJlc3VsdC5tYW50aXNzYSA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgYXZlcmFnZSB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmF2ZXJhZ2UgPSB0cnVlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIGZvcmNlZCBhdmVyYWdlIHByZWNpc2lvbi4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VGb3JjZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJLXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJ0aG91c2FuZFwiO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nLmluZGV4T2YoXCJNXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJtaWxsaW9uXCI7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcuaW5kZXhPZihcIkJcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcImJpbGxpb25cIjtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5pbmRleE9mKFwiVFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlQXZlcmFnZSA9IFwidHJpbGxpb25cIjtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgZmluZGluZyBpZiB0aGUgbWFudGlzc2EgaXMgb3B0aW9uYWwuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlT3B0aW9uYWxNYW50aXNzYShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcubWF0Y2goL1xcW1xcLl0vKSkge1xuICAgICAgICByZXN1bHQub3B0aW9uYWxNYW50aXNzYSA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcubWF0Y2goL1xcLi8pKSB7XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbE1hbnRpc3NhID0gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGZpbmRpbmcgaWYgdGhlIGNoYXJhY3RlcmlzdGljIGlzIG9wdGlvbmFsLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIuXCIpICE9PSAtMSkge1xuICAgICAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSBzdHJpbmcuc3BsaXQoXCIuXCIpWzBdO1xuICAgICAgICByZXN1bHQub3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLmluZGV4T2YoXCIwXCIpID09PSAtMTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIG5lZ2F0aXZlIGZvcm1hdC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VOZWdhdGl2ZShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcubWF0Y2goL15cXCs/XFwoW14pXSpcXCkkLykpIHtcbiAgICAgICAgcmVzdWx0Lm5lZ2F0aXZlID0gXCJwYXJlbnRoZXNpc1wiO1xuICAgIH1cbiAgICBpZiAoc3RyaW5nLm1hdGNoKC9eXFwrPy0vKSkge1xuICAgICAgICByZXN1bHQubmVnYXRpdmUgPSBcInNpZ25cIjtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgZmluZGluZyBpZiB0aGUgc2lnbiBpcyBtYW5kYXRvcnkuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKi9cbmZ1bmN0aW9uIHBhcnNlRm9yY2VTaWduKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXlxcKy8pKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZVNpZ24gPSB0cnVlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBhbmQgYWNjdW11bGF0aW5nIHRoZSB2YWx1ZXMgaWUgUkVTVUxULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge051bWJyb0Zvcm1hdH0gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VGb3JtYXQoc3RyaW5nLCByZXN1bHQgPSB7fSkge1xuICAgIGlmICh0eXBlb2Ygc3RyaW5nICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuXG4gICAgc3RyaW5nID0gcGFyc2VQcmVmaXgoc3RyaW5nLCByZXN1bHQpO1xuICAgIHN0cmluZyA9IHBhcnNlUG9zdGZpeChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VPdXRwdXQoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlVG90YWxMZW5ndGgoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlQ2hhcmFjdGVyaXN0aWMoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlT3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUZvcmNlQXZlcmFnZShzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VNYW50aXNzYShzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VPcHRpb25hbE1hbnRpc3NhKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVRob3VzYW5kU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVNwYWNlU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU5lZ2F0aXZlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUZvcmNlU2lnbihzdHJpbmcsIHJlc3VsdCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZUZvcm1hdFxufTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5jb25zdCBhbGxTdWZmaXhlcyA9IFtcbiAgICB7a2V5OiBcIlppQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDcpfSxcbiAgICB7a2V5OiBcIlpCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNyl9LFxuICAgIHtrZXk6IFwiWWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgOCl9LFxuICAgIHtrZXk6IFwiWUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA4KX0sXG4gICAge2tleTogXCJUaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA0KX0sXG4gICAge2tleTogXCJUQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDQpfSxcbiAgICB7a2V5OiBcIlBpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDUpfSxcbiAgICB7a2V5OiBcIlBCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNSl9LFxuICAgIHtrZXk6IFwiTWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgMil9LFxuICAgIHtrZXk6IFwiTUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCAyKX0sXG4gICAge2tleTogXCJLaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCAxKX0sXG4gICAge2tleTogXCJLQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDEpfSxcbiAgICB7a2V5OiBcIkdpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDMpfSxcbiAgICB7a2V5OiBcIkdCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgMyl9LFxuICAgIHtrZXk6IFwiRWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgNil9LFxuICAgIHtrZXk6IFwiRUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA2KX0sXG4gICAge2tleTogXCJCXCIsIGZhY3RvcjogMX1cbl07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBSZWdFeHAgd2hlcmUgUyBnZXQgYWxsIFJlZ0V4cCBzcGVjaWZpYyBjaGFyYWN0ZXJzIGVzY2FwZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHMgLSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgUmVnRXhwXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWy0vXFxcXF4kKis/LigpfFtcXF17fV0vZywgXCJcXFxcJCZcIik7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgY29tcHV0ZSB0aGUgdW5mb3JtYXR0ZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gb3JkaW5hbCAtIGZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgYW4gb3JkaW5hbCBvdXQgb2YgYSBudW1iZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6ZXJvRm9ybWF0IC0gc3RyaW5nIHJlcHJlc2VudGluZyB6ZXJvXG4gKiBAcGFyYW0geyp9IGFiYnJldmlhdGlvbnMgLSBhYmJyZXZpYXRpb25zIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sID0gXCJcIiwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSB7XG4gICAgaWYgKCFpc05hTigraW5wdXRTdHJpbmcpKSB7XG4gICAgICAgIHJldHVybiAraW5wdXRTdHJpbmc7XG4gICAgfVxuXG4gICAgbGV0IHN0cmlwcGVkID0gXCJcIjtcbiAgICAvLyBOZWdhdGl2ZVxuXG4gICAgbGV0IG5ld0lucHV0ID0gaW5wdXRTdHJpbmcucmVwbGFjZSgvKF5bXihdKilcXCgoLiopXFwpKFteKV0qJCkvLCBcIiQxJDIkM1wiKTtcblxuICAgIGlmIChuZXdJbnB1dCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIC0xICogY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUobmV3SW5wdXQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIC8vIEJ5dGVcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsU3VmZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IGFsbFN1ZmZpeGVzW2ldO1xuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2Uoc3VmZml4LmtleSwgXCJcIik7XG5cbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHN0cmlwcGVkLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSAqIHN1ZmZpeC5mYWN0b3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQZXJjZW50XG5cbiAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UoXCIlXCIsIFwiXCIpO1xuXG4gICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpIC8gMTAwO1xuICAgIH1cblxuICAgIC8vIE9yZGluYWxcblxuICAgIGxldCBwb3NzaWJsZU9yZGluYWxWYWx1ZSA9IHBhcnNlRmxvYXQoaW5wdXRTdHJpbmcpO1xuXG4gICAgaWYgKGlzTmFOKHBvc3NpYmxlT3JkaW5hbFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGxldCBvcmRpbmFsU3RyaW5nID0gb3JkaW5hbChwb3NzaWJsZU9yZGluYWxWYWx1ZSk7XG4gICAgaWYgKG9yZGluYWxTdHJpbmcgJiYgb3JkaW5hbFN0cmluZyAhPT0gXCIuXCIpIHsgLy8gaWYgb3JkaW5hbCBpcyBcIi5cIiBpdCB3aWxsIGJlIGNhdWdodCBuZXh0IHJvdW5kIGluIHRoZSAraW5wdXRTdHJpbmdcbiAgICAgICAgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKG5ldyBSZWdFeHAoYCR7ZXNjYXBlUmVnRXhwKG9yZGluYWxTdHJpbmcpfSRgKSwgXCJcIik7XG5cbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHN0cmlwcGVkLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEF2ZXJhZ2VcblxuICAgIGxldCBpbnZlcnNlZEFiYnJldmlhdGlvbnMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhhYmJyZXZpYXRpb25zKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgaW52ZXJzZWRBYmJyZXZpYXRpb25zW2FiYnJldmlhdGlvbnNba2V5XV0gPSBrZXk7XG4gICAgfSk7XG5cbiAgICBsZXQgYWJicmV2aWF0aW9uVmFsdWVzID0gT2JqZWN0LmtleXMoaW52ZXJzZWRBYmJyZXZpYXRpb25zKS5zb3J0KCkucmV2ZXJzZSgpO1xuICAgIGxldCBudW1iZXJPZkFiYnJldmlhdGlvbnMgPSBhYmJyZXZpYXRpb25WYWx1ZXMubGVuZ3RoO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZkFiYnJldmlhdGlvbnM7IGkrKykge1xuICAgICAgICBsZXQgdmFsdWUgPSBhYmJyZXZpYXRpb25WYWx1ZXNbaV07XG4gICAgICAgIGxldCBrZXkgPSBpbnZlcnNlZEFiYnJldmlhdGlvbnNbdmFsdWVdO1xuXG4gICAgICAgIHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZSh2YWx1ZSwgXCJcIik7XG4gICAgICAgIGlmIChzdHJpcHBlZCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGxldCBmYWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBzd2l0Y2ggKGtleSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGRlZmF1bHQtY2FzZVxuICAgICAgICAgICAgICAgIGNhc2UgXCJ0aG91c2FuZFwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgMyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJtaWxsaW9uXCI6XG4gICAgICAgICAgICAgICAgICAgIGZhY3RvciA9IE1hdGgucG93KDEwLCA2KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImJpbGxpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwidHJpbGxpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDEyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpICogZmFjdG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGluIG9uZSBwYXNzIGFsbCBmb3JtYXR0aW5nIHN5bWJvbHMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nU3ltYm9scyhpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wgPSBcIlwiKSB7XG4gICAgLy8gQ3VycmVuY3lcblxuICAgIGxldCBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UoY3VycmVuY3lTeW1ib2wsIFwiXCIpO1xuXG4gICAgLy8gVGhvdXNhbmQgc2VwYXJhdG9yc1xuXG4gICAgc3RyaXBwZWQgPSBzdHJpcHBlZC5yZXBsYWNlKG5ldyBSZWdFeHAoYChbMC05XSkke2VzY2FwZVJlZ0V4cChkZWxpbWl0ZXJzLnRob3VzYW5kcyl9KFswLTldKWAsIFwiZ1wiKSwgXCIkMSQyXCIpO1xuXG4gICAgLy8gRGVjaW1hbFxuXG4gICAgc3RyaXBwZWQgPSBzdHJpcHBlZC5yZXBsYWNlKGRlbGltaXRlcnMuZGVjaW1hbCwgXCIuXCIpO1xuXG4gICAgcmV0dXJuIHN0cmlwcGVkO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHBhcmFtIHsqfSBkZWxpbWl0ZXJzIC0gRGVsaW1pdGVycyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtjdXJyZW5jeVN5bWJvbF0gLSBzeW1ib2wgdXNlZCBmb3IgY3VycmVuY3kgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9yZGluYWwgLSBmdW5jdGlvbiB1c2VkIHRvIGdlbmVyYXRlIGFuIG9yZGluYWwgb3V0IG9mIGEgbnVtYmVyXG4gKiBAcGFyYW0ge3N0cmluZ30gemVyb0Zvcm1hdCAtIHN0cmluZyByZXByZXNlbnRpbmcgemVyb1xuICogQHBhcmFtIHsqfSBhYmJyZXZpYXRpb25zIC0gYWJicmV2aWF0aW9ucyB1c2VkIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9XG4gKi9cbmZ1bmN0aW9uIHVuZm9ybWF0VmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sID0gXCJcIiwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSB7XG4gICAgaWYgKGlucHV0U3RyaW5nID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKCFpc05hTigraW5wdXRTdHJpbmcpKSB7XG4gICAgICAgIHJldHVybiAraW5wdXRTdHJpbmc7XG4gICAgfVxuXG4gICAgLy8gWmVybyBGb3JtYXRcblxuICAgIGlmIChpbnB1dFN0cmluZyA9PT0gemVyb0Zvcm1hdCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBsZXQgdmFsdWUgPSByZW1vdmVGb3JtYXR0aW5nU3ltYm9scyhpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wpO1xuICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZSh2YWx1ZSwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCk7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIElOUFVUU1RSSU5HIHJlcHJlc2VudHMgYSB0aW1lLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byBjaGVja1xuICogQHBhcmFtIHsqfSBkZWxpbWl0ZXJzIC0gRGVsaW1pdGVycyB1c2VkIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBtYXRjaGVzVGltZShpbnB1dFN0cmluZywgZGVsaW1pdGVycykge1xuICAgIGxldCBzZXBhcmF0b3JzID0gaW5wdXRTdHJpbmcuaW5kZXhPZihcIjpcIikgJiYgZGVsaW1pdGVycy50aG91c2FuZHMgIT09IFwiOlwiO1xuXG4gICAgaWYgKCFzZXBhcmF0b3JzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgc2VnbWVudHMgPSBpbnB1dFN0cmluZy5zcGxpdChcIjpcIik7XG4gICAgaWYgKHNlZ21lbnRzLmxlbmd0aCAhPT0gMykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGhvdXJzID0gK3NlZ21lbnRzWzBdO1xuICAgIGxldCBtaW51dGVzID0gK3NlZ21lbnRzWzFdO1xuICAgIGxldCBzZWNvbmRzID0gK3NlZ21lbnRzWzJdO1xuXG4gICAgcmV0dXJuICFpc05hTihob3VycykgJiYgIWlzTmFOKG1pbnV0ZXMpICYmICFpc05hTihzZWNvbmRzKTtcbn1cblxuLyoqXG4gKiBVbmZvcm1hdCBhIG51bWJyby1nZW5lcmF0ZWQgc3RyaW5nIHJlcHJlc2VudGluZyBhIHRpbWUgdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiB1bmZvcm1hdFRpbWUoaW5wdXRTdHJpbmcpIHtcbiAgICBsZXQgc2VnbWVudHMgPSBpbnB1dFN0cmluZy5zcGxpdChcIjpcIik7XG5cbiAgICBsZXQgaG91cnMgPSArc2VnbWVudHNbMF07XG4gICAgbGV0IG1pbnV0ZXMgPSArc2VnbWVudHNbMV07XG4gICAgbGV0IHNlY29uZHMgPSArc2VnbWVudHNbMl07XG5cbiAgICByZXR1cm4gc2Vjb25kcyArIDYwICogbWludXRlcyArIDM2MDAgKiBob3Vycztcbn1cblxuLyoqXG4gKiBVbmZvcm1hdCBhIG51bWJyby1nZW5lcmF0ZWQgc3RyaW5nIHRvIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCAgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gdW5mb3JtYXQoaW5wdXRTdHJpbmcsIGZvcm1hdCkge1xuICAgIC8vIEF2b2lkIGNpcmN1bGFyIHJlZmVyZW5jZXNcbiAgICBjb25zdCBnbG9iYWxTdGF0ZSA9IHJlcXVpcmUoXCIuL2dsb2JhbFN0YXRlXCIpO1xuXG4gICAgbGV0IGRlbGltaXRlcnMgPSBnbG9iYWxTdGF0ZS5jdXJyZW50RGVsaW1pdGVycygpO1xuICAgIGxldCBjdXJyZW5jeVN5bWJvbCA9IGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeSgpLnN5bWJvbDtcbiAgICBsZXQgb3JkaW5hbCA9IGdsb2JhbFN0YXRlLmN1cnJlbnRPcmRpbmFsKCk7XG4gICAgbGV0IHplcm9Gb3JtYXQgPSBnbG9iYWxTdGF0ZS5nZXRaZXJvRm9ybWF0KCk7XG4gICAgbGV0IGFiYnJldmlhdGlvbnMgPSBnbG9iYWxTdGF0ZS5jdXJyZW50QWJicmV2aWF0aW9ucygpO1xuXG4gICAgbGV0IHZhbHVlID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKHR5cGVvZiBpbnB1dFN0cmluZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAobWF0Y2hlc1RpbWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHVuZm9ybWF0VGltZShpbnB1dFN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHVuZm9ybWF0VmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXRTdHJpbmcgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdmFsdWUgPSBpbnB1dFN0cmluZztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB1bmZvcm1hdFxufTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5sZXQgdW5mb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi91bmZvcm1hdHRpbmdcIik7XG5cbi8vIFNpbXBsaWZpZWQgcmVnZXhwIHN1cHBvcnRpbmcgb25seSBgbGFuZ3VhZ2VgLCBgc2NyaXB0YCwgYW5kIGByZWdpb25gXG5jb25zdCBiY3A0N1JlZ0V4cCA9IC9eW2Etel17MiwzfSgtW2EtekEtWl17NH0pPygtKFtBLVpdezJ9fFswLTldezN9KSk/JC87XG5cbmNvbnN0IHZhbGlkT3V0cHV0VmFsdWVzID0gW1xuICAgIFwiY3VycmVuY3lcIixcbiAgICBcInBlcmNlbnRcIixcbiAgICBcImJ5dGVcIixcbiAgICBcInRpbWVcIixcbiAgICBcIm9yZGluYWxcIixcbiAgICBcIm51bWJlclwiXG5dO1xuXG5jb25zdCB2YWxpZEZvcmNlQXZlcmFnZVZhbHVlcyA9IFtcbiAgICBcInRyaWxsaW9uXCIsXG4gICAgXCJiaWxsaW9uXCIsXG4gICAgXCJtaWxsaW9uXCIsXG4gICAgXCJ0aG91c2FuZFwiXG5dO1xuXG5jb25zdCB2YWxpZEN1cnJlbmN5UG9zaXRpb24gPSBbXG4gICAgXCJwcmVmaXhcIixcbiAgICBcImluZml4XCIsXG4gICAgXCJwb3N0Zml4XCJcbl07XG5cbmNvbnN0IHZhbGlkTmVnYXRpdmVWYWx1ZXMgPSBbXG4gICAgXCJzaWduXCIsXG4gICAgXCJwYXJlbnRoZXNpc1wiXG5dO1xuXG5jb25zdCB2YWxpZE1hbmRhdG9yeUFiYnJldmlhdGlvbnMgPSB7XG4gICAgdHlwZTogXCJvYmplY3RcIixcbiAgICBjaGlsZHJlbjoge1xuICAgICAgICB0aG91c2FuZDoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBtaWxsaW9uOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGJpbGxpb246IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgdHJpbGxpb246IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWFuZGF0b3J5OiB0cnVlXG59O1xuXG5jb25zdCB2YWxpZEFiYnJldmlhdGlvbnMgPSB7XG4gICAgdHlwZTogXCJvYmplY3RcIixcbiAgICBjaGlsZHJlbjoge1xuICAgICAgICB0aG91c2FuZDogXCJzdHJpbmdcIixcbiAgICAgICAgbWlsbGlvbjogXCJzdHJpbmdcIixcbiAgICAgICAgYmlsbGlvbjogXCJzdHJpbmdcIixcbiAgICAgICAgdHJpbGxpb246IFwic3RyaW5nXCJcbiAgICB9XG59O1xuXG5jb25zdCB2YWxpZEJhc2VWYWx1ZXMgPSBbXG4gICAgXCJkZWNpbWFsXCIsXG4gICAgXCJiaW5hcnlcIixcbiAgICBcImdlbmVyYWxcIlxuXTtcblxuY29uc3QgdmFsaWRGb3JtYXQgPSB7XG4gICAgb3V0cHV0OiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZE91dHB1dFZhbHVlc1xuICAgIH0sXG4gICAgYmFzZToge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICB2YWxpZFZhbHVlczogdmFsaWRCYXNlVmFsdWVzLFxuICAgICAgICByZXN0cmljdGlvbjogKG51bWJlciwgZm9ybWF0KSA9PiBmb3JtYXQub3V0cHV0ID09PSBcImJ5dGVcIixcbiAgICAgICAgbWVzc2FnZTogXCJgYmFzZWAgbXVzdCBiZSBwcm92aWRlZCBvbmx5IHdoZW4gdGhlIG91dHB1dCBpcyBgYnl0ZWBcIixcbiAgICAgICAgbWFuZGF0b3J5OiAoZm9ybWF0KSA9PiBmb3JtYXQub3V0cHV0ID09PSBcImJ5dGVcIlxuICAgIH0sXG4gICAgY2hhcmFjdGVyaXN0aWM6IHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIpID0+IG51bWJlciA+PSAwLFxuICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgIH0sXG4gICAgcHJlZml4OiBcInN0cmluZ1wiLFxuICAgIHBvc3RmaXg6IFwic3RyaW5nXCIsXG4gICAgZm9yY2VBdmVyYWdlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEZvcmNlQXZlcmFnZVZhbHVlc1xuICAgIH0sXG4gICAgYXZlcmFnZTogXCJib29sZWFuXCIsXG4gICAgY3VycmVuY3lQb3NpdGlvbjoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICB2YWxpZFZhbHVlczogdmFsaWRDdXJyZW5jeVBvc2l0aW9uXG4gICAgfSxcbiAgICBjdXJyZW5jeVN5bWJvbDogXCJzdHJpbmdcIixcbiAgICB0b3RhbExlbmd0aDoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICByZXN0cmljdGlvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbjogKG51bWJlcikgPT4gbnVtYmVyID49IDAsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJ2YWx1ZSBtdXN0IGJlIHBvc2l0aXZlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIsIGZvcm1hdCkgPT4gIWZvcm1hdC5leHBvbmVudGlhbCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcImB0b3RhbExlbmd0aGAgaXMgaW5jb21wYXRpYmxlIHdpdGggYGV4cG9uZW50aWFsYFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIG1hbnRpc3NhOiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyKSA9PiBudW1iZXIgPj0gMCxcbiAgICAgICAgbWVzc2FnZTogXCJ2YWx1ZSBtdXN0IGJlIHBvc2l0aXZlXCJcbiAgICB9LFxuICAgIG9wdGlvbmFsTWFudGlzc2E6IFwiYm9vbGVhblwiLFxuICAgIHRyaW1NYW50aXNzYTogXCJib29sZWFuXCIsXG4gICAgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYzogXCJib29sZWFuXCIsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBhYmJyZXZpYXRpb25zOiB2YWxpZEFiYnJldmlhdGlvbnMsXG4gICAgbmVnYXRpdmU6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkTmVnYXRpdmVWYWx1ZXNcbiAgICB9LFxuICAgIGZvcmNlU2lnbjogXCJib29sZWFuXCIsXG4gICAgZXhwb25lbnRpYWw6IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICB9LFxuICAgIHByZWZpeFN5bWJvbDoge1xuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIsIGZvcm1hdCkgPT4gZm9ybWF0Lm91dHB1dCA9PT0gXCJwZXJjZW50XCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiYHByZWZpeFN5bWJvbGAgY2FuIGJlIHByb3ZpZGVkIG9ubHkgd2hlbiB0aGUgb3V0cHV0IGlzIGBwZXJjZW50YFwiXG4gICAgfVxufTtcblxuY29uc3QgdmFsaWRMYW5ndWFnZSA9IHtcbiAgICBsYW5ndWFnZVRhZzoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICBtYW5kYXRvcnk6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAodGFnKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGFnLm1hdGNoKGJjcDQ3UmVnRXhwKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZTogXCJ0aGUgbGFuZ3VhZ2UgdGFnIG11c3QgZm9sbG93IHRoZSBCQ1AgNDcgc3BlY2lmaWNhdGlvbiAoc2VlIGh0dHBzOi8vdG9vbHMuaWVmdC5vcmcvaHRtbC9iY3A0NylcIlxuICAgIH0sXG4gICAgZGVsaW1pdGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgdGhvdXNhbmRzOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVjaW1hbDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIHRob3VzYW5kc1NpemU6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBhYmJyZXZpYXRpb25zOiB2YWxpZE1hbmRhdG9yeUFiYnJldmlhdGlvbnMsXG4gICAgc3BhY2VTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIG9yZGluYWw6IHtcbiAgICAgICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICB9LFxuICAgIGN1cnJlbmN5OiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICBzeW1ib2w6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGNvZGU6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBkZWZhdWx0czogXCJmb3JtYXRcIixcbiAgICBvcmRpbmFsRm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIGJ5dGVGb3JtYXQ6IFwiZm9ybWF0XCIsXG4gICAgcGVyY2VudGFnZUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICBjdXJyZW5jeUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICB0aW1lRGVmYXVsdHM6IFwiZm9ybWF0XCIsXG4gICAgZm9ybWF0czoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgZm91ckRpZ2l0czoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsczoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsc05vQ3VycmVuY3k6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZvcm1hdFwiLFxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bGxXaXRoTm9EZWNpbWFsczoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIENoZWNrIHRoZSB2YWxpZGl0eSBvZiB0aGUgcHJvdmlkZWQgaW5wdXQgYW5kIGZvcm1hdC5cbiAqIFRoZSBjaGVjayBpcyBOT1QgbGF6eS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8TnVtYnJvfSBpbnB1dCAtIGlucHV0IHRvIGNoZWNrXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIHdoZW4gZXZlcnl0aGluZyBpcyBjb3JyZWN0XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlKGlucHV0LCBmb3JtYXQpIHtcbiAgICBsZXQgdmFsaWRJbnB1dCA9IHZhbGlkYXRlSW5wdXQoaW5wdXQpO1xuICAgIGxldCBpc0Zvcm1hdFZhbGlkID0gdmFsaWRhdGVGb3JtYXQoZm9ybWF0KTtcblxuICAgIHJldHVybiB2YWxpZElucHV0ICYmIGlzRm9ybWF0VmFsaWQ7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBudW1icm8gaW5wdXQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfE51bWJyb30gaW5wdXQgLSBpbnB1dCB0byBjaGVja1xuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSB3aGVuIGV2ZXJ5dGhpbmcgaXMgY29ycmVjdFxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUlucHV0KGlucHV0KSB7XG4gICAgbGV0IHZhbHVlID0gdW5mb3JtYXR0ZXIudW5mb3JtYXQoaW5wdXQpO1xuXG4gICAgcmV0dXJuICEhdmFsdWU7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBwcm92aWRlZCBmb3JtYXQgVE9WQUxJREFURSBhZ2FpbnN0IFNQRUMuXG4gKlxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHRvVmFsaWRhdGUgLSBmb3JtYXQgdG8gY2hlY2tcbiAqIEBwYXJhbSB7Kn0gc3BlYyAtIHNwZWNpZmljYXRpb24gYWdhaW5zdCB3aGljaCB0byBjaGVja1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIHByZWZpeCB1c2UgZm9yIGVycm9yIG1lc3NhZ2VzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBNYW5kYXRvcnlDaGVjayAtIGB0cnVlYCB3aGVuIHRoZSBjaGVjayBmb3IgbWFuZGF0b3J5IGtleSBtdXN0IGJlIHNraXBwZWRcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgd2hlbiBldmVyeXRoaW5nIGlzIGNvcnJlY3RcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTcGVjKHRvVmFsaWRhdGUsIHNwZWMsIHByZWZpeCwgc2tpcE1hbmRhdG9yeUNoZWNrID0gZmFsc2UpIHtcbiAgICBsZXQgcmVzdWx0cyA9IE9iamVjdC5rZXlzKHRvVmFsaWRhdGUpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICghc3BlY1trZXldKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gSW52YWxpZCBrZXk6ICR7a2V5fWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB2YWx1ZSA9IHRvVmFsaWRhdGVba2V5XTtcbiAgICAgICAgbGV0IGRhdGEgPSBzcGVjW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBkYXRhID0ge3R5cGU6IGRhdGF9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gXCJmb3JtYXRcIikgeyAvLyBhbGwgZm9ybWF0cyBhcmUgcGFydGlhbCAoYS5rLmEgd2lsbCBiZSBtZXJnZWQgd2l0aCBzb21lIGRlZmF1bHQgdmFsdWVzKSB0aHVzIG5vIG5lZWQgdG8gY2hlY2sgbWFuZGF0b3J5IHZhbHVlc1xuICAgICAgICAgICAgbGV0IHZhbGlkID0gdmFsaWRhdGVTcGVjKHZhbHVlLCB2YWxpZEZvcm1hdCwgYFtWYWxpZGF0ZSAke2tleX1dYCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICghdmFsaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gdHlwZSBtaXNtYXRjaGVkOiBcIiR7ZGF0YS50eXBlfVwiIGV4cGVjdGVkLCBcIiR7dHlwZW9mIHZhbHVlfVwiIHByb3ZpZGVkYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucmVzdHJpY3Rpb25zICYmIGRhdGEucmVzdHJpY3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgbGV0IGxlbmd0aCA9IGRhdGEucmVzdHJpY3Rpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQge3Jlc3RyaWN0aW9uLCBtZXNzYWdlfSA9IGRhdGEucmVzdHJpY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmICghcmVzdHJpY3Rpb24odmFsdWUsIHRvVmFsaWRhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gaW52YWxpZCB2YWx1ZTogJHttZXNzYWdlfWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnJlc3RyaWN0aW9uICYmICFkYXRhLnJlc3RyaWN0aW9uKHZhbHVlLCB0b1ZhbGlkYXRlKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiAke2RhdGEubWVzc2FnZX1gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS52YWxpZFZhbHVlcyAmJiBkYXRhLnZhbGlkVmFsdWVzLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiBtdXN0IGJlIGFtb25nICR7SlNPTi5zdHJpbmdpZnkoZGF0YS52YWxpZFZhbHVlcyl9LCBcIiR7dmFsdWV9XCIgcHJvdmlkZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgICAgICAgICAgbGV0IHZhbGlkID0gdmFsaWRhdGVTcGVjKHZhbHVlLCBkYXRhLmNoaWxkcmVuLCBgW1ZhbGlkYXRlICR7a2V5fV1gKTtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgaWYgKCFza2lwTWFuZGF0b3J5Q2hlY2spIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKC4uLk9iamVjdC5rZXlzKHNwZWMpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgZGF0YSA9IHNwZWNba2V5XTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGRhdGEgPSB7dHlwZTogZGF0YX07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkYXRhLm1hbmRhdG9yeSkge1xuICAgICAgICAgICAgICAgIGxldCBtYW5kYXRvcnkgPSBkYXRhLm1hbmRhdG9yeTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hbmRhdG9yeSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hbmRhdG9yeSA9IG1hbmRhdG9yeSh0b1ZhbGlkYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobWFuZGF0b3J5ICYmIHRvVmFsaWRhdGVba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSBNaXNzaW5nIG1hbmRhdG9yeSBrZXkgXCIke2tleX1cImApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cy5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4ge1xuICAgICAgICByZXR1cm4gYWNjICYmIGN1cnJlbnQ7XG4gICAgfSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHByb3ZpZGVkIEZPUk1BVC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpIHtcbiAgICByZXR1cm4gdmFsaWRhdGVTcGVjKGZvcm1hdCwgdmFsaWRGb3JtYXQsIFwiW1ZhbGlkYXRlIGZvcm1hdF1cIik7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHByb3ZpZGVkIExBTkdVQUdFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvTGFuZ3VhZ2V9IGxhbmd1YWdlIC0gbGFuZ3VhZ2UgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgICByZXR1cm4gdmFsaWRhdGVTcGVjKGxhbmd1YWdlLCB2YWxpZExhbmd1YWdlLCBcIltWYWxpZGF0ZSBsYW5ndWFnZV1cIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHZhbGlkYXRlLFxuICAgIHZhbGlkYXRlRm9ybWF0LFxuICAgIHZhbGlkYXRlSW5wdXQsXG4gICAgdmFsaWRhdGVMYW5ndWFnZVxufTtcbiJdfQ==
