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

    var hasTrailingZeroes = currentMantissa.match(/0+$/);
    if (trim && hasTrailingZeroes) {
        return currentCharacteristic + "." + currentMantissa.toString().slice(0, hasTrailingZeroes.index);
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
    return;
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

var VERSION = "2.1.1";

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnbnVtYmVyLmpzL2JpZ251bWJlci5qcyIsInNyYy9lbi1VUy5qcyIsInNyYy9mb3JtYXR0aW5nLmpzIiwic3JjL2dsb2JhbFN0YXRlLmpzIiwic3JjL2xvYWRpbmcuanMiLCJzcmMvbWFuaXB1bGF0aW5nLmpzIiwic3JjL251bWJyby5qcyIsInNyYy9wYXJzaW5nLmpzIiwic3JjL3VuZm9ybWF0dGluZy5qcyIsInNyYy92YWxpZGF0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDakMsZ0NBQVksVUFBVSxVQUFWLENBQVo7QUFDSDs7QUFFRCxvQkFBSSxhQUFhLFdBQVcsR0FBWCxNQUFvQixTQUFyQyxFQUFnRDtBQUM1Qyw0QkFBUSxLQUFSLENBQWlCLE1BQWpCLGlDQUFrRCxHQUFsRCxTQUQ0QyxDQUNlO0FBQzNELDJCQUFPLEtBQVA7QUFDSDtBQUNKOztBQUVELG1CQUFPLElBQVA7QUFDSCxTQW5CZSxDQUFoQjtBQW9CSDs7QUFFRCxXQUFPLFFBQVEsTUFBUixDQUFlLFVBQUMsR0FBRCxFQUFNLE9BQU4sRUFBa0I7QUFDcEMsZUFBTyxPQUFPLE9BQWQ7QUFDSCxLQUZNLEVBRUosSUFGSSxDQUFQO0FBR0g7O0FBRUQ7Ozs7OztBQU1BLFNBQVMsY0FBVCxDQUF3QixNQUF4QixFQUFnQztBQUM1QixXQUFPLGFBQWEsTUFBYixFQUFxQixXQUFyQixFQUFrQyxtQkFBbEMsQ0FBUDtBQUNIOztBQUVEOzs7Ozs7QUFNQSxTQUFTLGdCQUFULENBQTBCLFFBQTFCLEVBQW9DO0FBQ2hDLFdBQU8sYUFBYSxRQUFiLEVBQXVCLGFBQXZCLEVBQXNDLHFCQUF0QyxDQUFQO0FBQ0g7O0FBRUQsT0FBTyxPQUFQLEdBQWlCO0FBQ2Isc0JBRGE7QUFFYixrQ0FGYTtBQUdiLGdDQUhhO0FBSWI7QUFKYSxDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiEgYmlnbnVtYmVyLmpzIHY0LjAuNCBodHRwczovL2dpdGh1Yi5jb20vTWlrZU1jbC9iaWdudW1iZXIuanMvTElDRU5DRSAqL1xyXG5cclxuOyhmdW5jdGlvbiAoZ2xvYmFsT2JqKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgLypcclxuICAgICAgYmlnbnVtYmVyLmpzIHY0LjAuNFxyXG4gICAgICBBIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgYXJiaXRyYXJ5LXByZWNpc2lvbiBhcml0aG1ldGljLlxyXG4gICAgICBodHRwczovL2dpdGh1Yi5jb20vTWlrZU1jbC9iaWdudW1iZXIuanNcclxuICAgICAgQ29weXJpZ2h0IChjKSAyMDE3IE1pY2hhZWwgTWNsYXVnaGxpbiA8TThjaDg4bEBnbWFpbC5jb20+XHJcbiAgICAgIE1JVCBFeHBhdCBMaWNlbmNlXHJcbiAgICAqL1xyXG5cclxuXHJcbiAgICB2YXIgQmlnTnVtYmVyLFxyXG4gICAgICAgIGlzTnVtZXJpYyA9IC9eLT8oXFxkKyhcXC5cXGQqKT98XFwuXFxkKykoZVsrLV0/XFxkKyk/JC9pLFxyXG4gICAgICAgIG1hdGhjZWlsID0gTWF0aC5jZWlsLFxyXG4gICAgICAgIG1hdGhmbG9vciA9IE1hdGguZmxvb3IsXHJcbiAgICAgICAgbm90Qm9vbCA9ICcgbm90IGEgYm9vbGVhbiBvciBiaW5hcnkgZGlnaXQnLFxyXG4gICAgICAgIHJvdW5kaW5nTW9kZSA9ICdyb3VuZGluZyBtb2RlJyxcclxuICAgICAgICB0b29NYW55RGlnaXRzID0gJ251bWJlciB0eXBlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzJyxcclxuICAgICAgICBBTFBIQUJFVCA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWiRfJyxcclxuICAgICAgICBCQVNFID0gMWUxNCxcclxuICAgICAgICBMT0dfQkFTRSA9IDE0LFxyXG4gICAgICAgIE1BWF9TQUZFX0lOVEVHRVIgPSAweDFmZmZmZmZmZmZmZmZmLCAgICAgICAgIC8vIDJeNTMgLSAxXHJcbiAgICAgICAgLy8gTUFYX0lOVDMyID0gMHg3ZmZmZmZmZiwgICAgICAgICAgICAgICAgICAgLy8gMl4zMSAtIDFcclxuICAgICAgICBQT1dTX1RFTiA9IFsxLCAxMCwgMTAwLCAxZTMsIDFlNCwgMWU1LCAxZTYsIDFlNywgMWU4LCAxZTksIDFlMTAsIDFlMTEsIDFlMTIsIDFlMTNdLFxyXG4gICAgICAgIFNRUlRfQkFTRSA9IDFlNyxcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBUaGUgbGltaXQgb24gdGhlIHZhbHVlIG9mIERFQ0lNQUxfUExBQ0VTLCBUT19FWFBfTkVHLCBUT19FWFBfUE9TLCBNSU5fRVhQLCBNQVhfRVhQLCBhbmRcclxuICAgICAgICAgKiB0aGUgYXJndW1lbnRzIHRvIHRvRXhwb25lbnRpYWwsIHRvRml4ZWQsIHRvRm9ybWF0LCBhbmQgdG9QcmVjaXNpb24sIGJleW9uZCB3aGljaCBhblxyXG4gICAgICAgICAqIGV4Y2VwdGlvbiBpcyB0aHJvd24gKGlmIEVSUk9SUyBpcyB0cnVlKS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBNQVggPSAxRTk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWF9JTlQzMlxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBCaWdOdW1iZXIgY29uc3RydWN0b3IuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNvbnN0cnVjdG9yRmFjdG9yeShjb25maWcpIHtcclxuICAgICAgICB2YXIgZGl2LCBwYXJzZU51bWVyaWMsXHJcblxyXG4gICAgICAgICAgICAvLyBpZCB0cmFja3MgdGhlIGNhbGxlciBmdW5jdGlvbiwgc28gaXRzIG5hbWUgY2FuIGJlIGluY2x1ZGVkIGluIGVycm9yIG1lc3NhZ2VzLlxyXG4gICAgICAgICAgICBpZCA9IDAsXHJcbiAgICAgICAgICAgIFAgPSBCaWdOdW1iZXIucHJvdG90eXBlLFxyXG4gICAgICAgICAgICBPTkUgPSBuZXcgQmlnTnVtYmVyKDEpLFxyXG5cclxuXHJcbiAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogRURJVEFCTEUgREVGQVVMVFMgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgKiBUaGUgZGVmYXVsdCB2YWx1ZXMgYmVsb3cgbXVzdCBiZSBpbnRlZ2VycyB3aXRoaW4gdGhlIGluY2x1c2l2ZSByYW5nZXMgc3RhdGVkLlxyXG4gICAgICAgICAgICAgKiBUaGUgdmFsdWVzIGNhbiBhbHNvIGJlIGNoYW5nZWQgYXQgcnVuLXRpbWUgdXNpbmcgQmlnTnVtYmVyLmNvbmZpZy5cclxuICAgICAgICAgICAgICovXHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgZm9yIG9wZXJhdGlvbnMgaW52b2x2aW5nIGRpdmlzaW9uLlxyXG4gICAgICAgICAgICBERUNJTUFMX1BMQUNFUyA9IDIwLCAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgKiBUaGUgcm91bmRpbmcgbW9kZSB1c2VkIHdoZW4gcm91bmRpbmcgdG8gdGhlIGFib3ZlIGRlY2ltYWwgcGxhY2VzLCBhbmQgd2hlbiB1c2luZ1xyXG4gICAgICAgICAgICAgKiB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCBhbmQgdG9QcmVjaXNpb24sIGFuZCByb3VuZCAoZGVmYXVsdCB2YWx1ZSkuXHJcbiAgICAgICAgICAgICAqIFVQICAgICAgICAgMCBBd2F5IGZyb20gemVyby5cclxuICAgICAgICAgICAgICogRE9XTiAgICAgICAxIFRvd2FyZHMgemVyby5cclxuICAgICAgICAgICAgICogQ0VJTCAgICAgICAyIFRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAgICAgICAgKiBGTE9PUiAgICAgIDMgVG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgICAgICAgICAqIEhBTEZfVVAgICAgNCBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdXAuXHJcbiAgICAgICAgICAgICAqIEhBTEZfRE9XTiAgNSBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgZG93bi5cclxuICAgICAgICAgICAgICogSEFMRl9FVkVOICA2IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzIGV2ZW4gbmVpZ2hib3VyLlxyXG4gICAgICAgICAgICAgKiBIQUxGX0NFSUwgIDcgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAgICAgICAgKiBIQUxGX0ZMT09SIDggVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgLUluZmluaXR5LlxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgUk9VTkRJTkdfTU9ERSA9IDQsICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIDhcclxuXHJcbiAgICAgICAgICAgIC8vIEVYUE9ORU5USUFMX0FUIDogW1RPX0VYUF9ORUcgLCBUT19FWFBfUE9TXVxyXG5cclxuICAgICAgICAgICAgLy8gVGhlIGV4cG9uZW50IHZhbHVlIGF0IGFuZCBiZW5lYXRoIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgICAgICAgIC8vIE51bWJlciB0eXBlOiAtN1xyXG4gICAgICAgICAgICBUT19FWFBfTkVHID0gLTcsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gLU1BWFxyXG5cclxuICAgICAgICAgICAgLy8gVGhlIGV4cG9uZW50IHZhbHVlIGF0IGFuZCBhYm92ZSB3aGljaCB0b1N0cmluZyByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgICAgICAvLyBOdW1iZXIgdHlwZTogMjFcclxuICAgICAgICAgICAgVE9fRVhQX1BPUyA9IDIxLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWFxyXG5cclxuICAgICAgICAgICAgLy8gUkFOR0UgOiBbTUlOX0VYUCwgTUFYX0VYUF1cclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBtaW5pbXVtIGV4cG9uZW50IHZhbHVlLCBiZW5lYXRoIHdoaWNoIHVuZGVyZmxvdyB0byB6ZXJvIG9jY3Vycy5cclxuICAgICAgICAgICAgLy8gTnVtYmVyIHR5cGU6IC0zMjQgICg1ZS0zMjQpXHJcbiAgICAgICAgICAgIE1JTl9FWFAgPSAtMWU3LCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLTEgdG8gLU1BWFxyXG5cclxuICAgICAgICAgICAgLy8gVGhlIG1heGltdW0gZXhwb25lbnQgdmFsdWUsIGFib3ZlIHdoaWNoIG92ZXJmbG93IHRvIEluZmluaXR5IG9jY3Vycy5cclxuICAgICAgICAgICAgLy8gTnVtYmVyIHR5cGU6ICAzMDggICgxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOClcclxuICAgICAgICAgICAgLy8gRm9yIE1BWF9FWFAgPiAxZTcsIGUuZy4gbmV3IEJpZ051bWJlcignMWUxMDAwMDAwMDAnKS5wbHVzKDEpIG1heSBiZSBzbG93LlxyXG4gICAgICAgICAgICBNQVhfRVhQID0gMWU3LCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDEgdG8gTUFYXHJcblxyXG4gICAgICAgICAgICAvLyBXaGV0aGVyIEJpZ051bWJlciBFcnJvcnMgYXJlIGV2ZXIgdGhyb3duLlxyXG4gICAgICAgICAgICBFUlJPUlMgPSB0cnVlLCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRydWUgb3IgZmFsc2VcclxuXHJcbiAgICAgICAgICAgIC8vIENoYW5nZSB0byBpbnRWYWxpZGF0b3JOb0Vycm9ycyBpZiBFUlJPUlMgaXMgZmFsc2UuXHJcbiAgICAgICAgICAgIGlzVmFsaWRJbnQgPSBpbnRWYWxpZGF0b3JXaXRoRXJyb3JzLCAgICAgLy8gaW50VmFsaWRhdG9yV2l0aEVycm9ycy9pbnRWYWxpZGF0b3JOb0Vycm9yc1xyXG5cclxuICAgICAgICAgICAgLy8gV2hldGhlciB0byB1c2UgY3J5cHRvZ3JhcGhpY2FsbHktc2VjdXJlIHJhbmRvbSBudW1iZXIgZ2VuZXJhdGlvbiwgaWYgYXZhaWxhYmxlLlxyXG4gICAgICAgICAgICBDUllQVE8gPSBmYWxzZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRydWUgb3IgZmFsc2VcclxuXHJcbiAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAqIFRoZSBtb2R1bG8gbW9kZSB1c2VkIHdoZW4gY2FsY3VsYXRpbmcgdGhlIG1vZHVsdXM6IGEgbW9kIG4uXHJcbiAgICAgICAgICAgICAqIFRoZSBxdW90aWVudCAocSA9IGEgLyBuKSBpcyBjYWxjdWxhdGVkIGFjY29yZGluZyB0byB0aGUgY29ycmVzcG9uZGluZyByb3VuZGluZyBtb2RlLlxyXG4gICAgICAgICAgICAgKiBUaGUgcmVtYWluZGVyIChyKSBpcyBjYWxjdWxhdGVkIGFzOiByID0gYSAtIG4gKiBxLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBVUCAgICAgICAgMCBUaGUgcmVtYWluZGVyIGlzIHBvc2l0aXZlIGlmIHRoZSBkaXZpZGVuZCBpcyBuZWdhdGl2ZSwgZWxzZSBpcyBuZWdhdGl2ZS5cclxuICAgICAgICAgICAgICogRE9XTiAgICAgIDEgVGhlIHJlbWFpbmRlciBoYXMgdGhlIHNhbWUgc2lnbiBhcyB0aGUgZGl2aWRlbmQuXHJcbiAgICAgICAgICAgICAqICAgICAgICAgICAgIFRoaXMgbW9kdWxvIG1vZGUgaXMgY29tbW9ubHkga25vd24gYXMgJ3RydW5jYXRlZCBkaXZpc2lvbicgYW5kIGlzXHJcbiAgICAgICAgICAgICAqICAgICAgICAgICAgIGVxdWl2YWxlbnQgdG8gKGEgJSBuKSBpbiBKYXZhU2NyaXB0LlxyXG4gICAgICAgICAgICAgKiBGTE9PUiAgICAgMyBUaGUgcmVtYWluZGVyIGhhcyB0aGUgc2FtZSBzaWduIGFzIHRoZSBkaXZpc29yIChQeXRob24gJSkuXHJcbiAgICAgICAgICAgICAqIEhBTEZfRVZFTiA2IFRoaXMgbW9kdWxvIG1vZGUgaW1wbGVtZW50cyB0aGUgSUVFRSA3NTQgcmVtYWluZGVyIGZ1bmN0aW9uLlxyXG4gICAgICAgICAgICAgKiBFVUNMSUQgICAgOSBFdWNsaWRpYW4gZGl2aXNpb24uIHEgPSBzaWduKG4pICogZmxvb3IoYSAvIGFicyhuKSkuXHJcbiAgICAgICAgICAgICAqICAgICAgICAgICAgIFRoZSByZW1haW5kZXIgaXMgYWx3YXlzIHBvc2l0aXZlLlxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBUaGUgdHJ1bmNhdGVkIGRpdmlzaW9uLCBmbG9vcmVkIGRpdmlzaW9uLCBFdWNsaWRpYW4gZGl2aXNpb24gYW5kIElFRUUgNzU0IHJlbWFpbmRlclxyXG4gICAgICAgICAgICAgKiBtb2RlcyBhcmUgY29tbW9ubHkgdXNlZCBmb3IgdGhlIG1vZHVsdXMgb3BlcmF0aW9uLlxyXG4gICAgICAgICAgICAgKiBBbHRob3VnaCB0aGUgb3RoZXIgcm91bmRpbmcgbW9kZXMgY2FuIGFsc28gYmUgdXNlZCwgdGhleSBtYXkgbm90IGdpdmUgdXNlZnVsIHJlc3VsdHMuXHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBNT0RVTE9fTU9ERSA9IDEsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gOVxyXG5cclxuICAgICAgICAgICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0cyBvZiB0aGUgcmVzdWx0IG9mIHRoZSB0b1Bvd2VyIG9wZXJhdGlvbi5cclxuICAgICAgICAgICAgLy8gSWYgUE9XX1BSRUNJU0lPTiBpcyAwLCB0aGVyZSB3aWxsIGJlIHVubGltaXRlZCBzaWduaWZpY2FudCBkaWdpdHMuXHJcbiAgICAgICAgICAgIFBPV19QUkVDSVNJT04gPSAwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBmb3JtYXQgc3BlY2lmaWNhdGlvbiB1c2VkIGJ5IHRoZSBCaWdOdW1iZXIucHJvdG90eXBlLnRvRm9ybWF0IG1ldGhvZC5cclxuICAgICAgICAgICAgRk9STUFUID0ge1xyXG4gICAgICAgICAgICAgICAgZGVjaW1hbFNlcGFyYXRvcjogJy4nLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXBhcmF0b3I6ICcsJyxcclxuICAgICAgICAgICAgICAgIGdyb3VwU2l6ZTogMyxcclxuICAgICAgICAgICAgICAgIHNlY29uZGFyeUdyb3VwU2l6ZTogMCxcclxuICAgICAgICAgICAgICAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3I6ICdcXHhBMCcsICAgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgICAgICAgICAgICBmcmFjdGlvbkdyb3VwU2l6ZTogMFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcblxyXG4gICAgICAgIC8vIENPTlNUUlVDVE9SXHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFRoZSBCaWdOdW1iZXIgY29uc3RydWN0b3IgYW5kIGV4cG9ydGVkIGZ1bmN0aW9uLlxyXG4gICAgICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGluc3RhbmNlIG9mIGEgQmlnTnVtYmVyIG9iamVjdC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIG4ge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfSBBIG51bWVyaWMgdmFsdWUuXHJcbiAgICAgICAgICogW2JdIHtudW1iZXJ9IFRoZSBiYXNlIG9mIG4uIEludGVnZXIsIDIgdG8gNjQgaW5jbHVzaXZlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIEJpZ051bWJlciggbiwgYiApIHtcclxuICAgICAgICAgICAgdmFyIGMsIGUsIGksIG51bSwgbGVuLCBzdHIsXHJcbiAgICAgICAgICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIC8vIEVuYWJsZSBjb25zdHJ1Y3RvciB1c2FnZSB3aXRob3V0IG5ldy5cclxuICAgICAgICAgICAgaWYgKCAhKCB4IGluc3RhbmNlb2YgQmlnTnVtYmVyICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gJ0JpZ051bWJlcigpIGNvbnN0cnVjdG9yIGNhbGwgd2l0aG91dCBuZXc6IHtufSdcclxuICAgICAgICAgICAgICAgIGlmIChFUlJPUlMpIHJhaXNlKCAyNiwgJ2NvbnN0cnVjdG9yIGNhbGwgd2l0aG91dCBuZXcnLCBuICk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlciggbiwgYiApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAnbmV3IEJpZ051bWJlcigpIGJhc2Ugbm90IGFuIGludGVnZXI6IHtifSdcclxuICAgICAgICAgICAgLy8gJ25ldyBCaWdOdW1iZXIoKSBiYXNlIG91dCBvZiByYW5nZToge2J9J1xyXG4gICAgICAgICAgICBpZiAoIGIgPT0gbnVsbCB8fCAhaXNWYWxpZEludCggYiwgMiwgNjQsIGlkLCAnYmFzZScgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEdXBsaWNhdGUuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG4gaW5zdGFuY2VvZiBCaWdOdW1iZXIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zID0gbi5zO1xyXG4gICAgICAgICAgICAgICAgICAgIHguZSA9IG4uZTtcclxuICAgICAgICAgICAgICAgICAgICB4LmMgPSAoIG4gPSBuLmMgKSA/IG4uc2xpY2UoKSA6IG47XHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICggbnVtID0gdHlwZW9mIG4gPT0gJ251bWJlcicgKSAmJiBuICogMCA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHgucyA9IDEgLyBuIDwgMCA/ICggbiA9IC1uLCAtMSApIDogMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRmFzdCBwYXRoIGZvciBpbnRlZ2Vycy5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIG4gPT09IH5+biApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggZSA9IDAsIGkgPSBuOyBpID49IDEwOyBpIC89IDEwLCBlKysgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeC5lID0gZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeC5jID0gW25dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IG4gKyAnJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhaXNOdW1lcmljLnRlc3QoIHN0ciA9IG4gKyAnJyApICkgcmV0dXJuIHBhcnNlTnVtZXJpYyggeCwgc3RyLCBudW0gKTtcclxuICAgICAgICAgICAgICAgICAgICB4LnMgPSBzdHIuY2hhckNvZGVBdCgwKSA9PT0gNDUgPyAoIHN0ciA9IHN0ci5zbGljZSgxKSwgLTEgKSA6IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBiID0gYiB8IDA7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBuICsgJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHJldHVybiB2YWx1ZSBpcyByb3VuZGVkIHRvIERFQ0lNQUxfUExBQ0VTIGFzIHdpdGggb3RoZXIgYmFzZXMuXHJcbiAgICAgICAgICAgICAgICAvLyBBbGxvdyBleHBvbmVudGlhbCBub3RhdGlvbiB0byBiZSB1c2VkIHdpdGggYmFzZSAxMCBhcmd1bWVudC5cclxuICAgICAgICAgICAgICAgIGlmICggYiA9PSAxMCApIHtcclxuICAgICAgICAgICAgICAgICAgICB4ID0gbmV3IEJpZ051bWJlciggbiBpbnN0YW5jZW9mIEJpZ051bWJlciA/IG4gOiBzdHIgKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm91bmQoIHgsIERFQ0lNQUxfUExBQ0VTICsgeC5lICsgMSwgUk9VTkRJTkdfTU9ERSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEF2b2lkIHBvdGVudGlhbCBpbnRlcnByZXRhdGlvbiBvZiBJbmZpbml0eSBhbmQgTmFOIGFzIGJhc2UgNDQrIHZhbHVlcy5cclxuICAgICAgICAgICAgICAgIC8vIEFueSBudW1iZXIgaW4gZXhwb25lbnRpYWwgZm9ybSB3aWxsIGZhaWwgZHVlIHRvIHRoZSBbRWVdWystXS5cclxuICAgICAgICAgICAgICAgIGlmICggKCBudW0gPSB0eXBlb2YgbiA9PSAnbnVtYmVyJyApICYmIG4gKiAwICE9IDAgfHxcclxuICAgICAgICAgICAgICAgICAgISggbmV3IFJlZ0V4cCggJ14tPycgKyAoIGMgPSAnWycgKyBBTFBIQUJFVC5zbGljZSggMCwgYiApICsgJ10rJyApICtcclxuICAgICAgICAgICAgICAgICAgICAnKD86XFxcXC4nICsgYyArICcpPyQnLGIgPCAzNyA/ICdpJyA6ICcnICkgKS50ZXN0KHN0cikgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlTnVtZXJpYyggeCwgc3RyLCBudW0sIGIgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobnVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zID0gMSAvIG4gPCAwID8gKCBzdHIgPSBzdHIuc2xpY2UoMSksIC0xICkgOiAxO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIEVSUk9SUyAmJiBzdHIucmVwbGFjZSggL14wXFwuMCp8XFwuLywgJycgKS5sZW5ndGggPiAxNSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICduZXcgQmlnTnVtYmVyKCkgbnVtYmVyIHR5cGUgaGFzIG1vcmUgdGhhbiAxNSBzaWduaWZpY2FudCBkaWdpdHM6IHtufSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmFpc2UoIGlkLCB0b29NYW55RGlnaXRzLCBuICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IGxhdGVyIGNoZWNrIGZvciBsZW5ndGggb24gY29udmVydGVkIG51bWJlci5cclxuICAgICAgICAgICAgICAgICAgICBudW0gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT09IDQ1ID8gKCBzdHIgPSBzdHIuc2xpY2UoMSksIC0xICkgOiAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHN0ciA9IGNvbnZlcnRCYXNlKCBzdHIsIDEwLCBiLCB4LnMgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGVjaW1hbCBwb2ludD9cclxuICAgICAgICAgICAgaWYgKCAoIGUgPSBzdHIuaW5kZXhPZignLicpICkgPiAtMSApIHN0ciA9IHN0ci5yZXBsYWNlKCAnLicsICcnICk7XHJcblxyXG4gICAgICAgICAgICAvLyBFeHBvbmVudGlhbCBmb3JtP1xyXG4gICAgICAgICAgICBpZiAoICggaSA9IHN0ci5zZWFyY2goIC9lL2kgKSApID4gMCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgZXhwb25lbnQuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGUgPCAwICkgZSA9IGk7XHJcbiAgICAgICAgICAgICAgICBlICs9ICtzdHIuc2xpY2UoIGkgKyAxICk7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKCAwLCBpICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGUgPCAwICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEludGVnZXIuXHJcbiAgICAgICAgICAgICAgICBlID0gc3RyLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwOyBzdHIuY2hhckNvZGVBdChpKSA9PT0gNDg7IGkrKyApO1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKCBsZW4gPSBzdHIubGVuZ3RoOyBzdHIuY2hhckNvZGVBdCgtLWxlbikgPT09IDQ4OyApO1xyXG4gICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoIGksIGxlbiArIDEgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdHIpIHtcclxuICAgICAgICAgICAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRGlzYWxsb3cgbnVtYmVycyB3aXRoIG92ZXIgMTUgc2lnbmlmaWNhbnQgZGlnaXRzIGlmIG51bWJlciB0eXBlLlxyXG4gICAgICAgICAgICAgICAgLy8gJ25ldyBCaWdOdW1iZXIoKSBudW1iZXIgdHlwZSBoYXMgbW9yZSB0aGFuIDE1IHNpZ25pZmljYW50IGRpZ2l0czoge259J1xyXG4gICAgICAgICAgICAgICAgaWYgKCBudW0gJiYgRVJST1JTICYmIGxlbiA+IDE1ICYmICggbiA+IE1BWF9TQUZFX0lOVEVHRVIgfHwgbiAhPT0gbWF0aGZsb29yKG4pICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFpc2UoIGlkLCB0b29NYW55RGlnaXRzLCB4LnMgKiBuICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZSA9IGUgLSBpIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgLy8gT3ZlcmZsb3c/XHJcbiAgICAgICAgICAgICAgICBpZiAoIGUgPiBNQVhfRVhQICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJbmZpbml0eS5cclxuICAgICAgICAgICAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFVuZGVyZmxvdz9cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGUgPCBNSU5fRVhQICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgICAgICAgICAgIHguYyA9IFsgeC5lID0gMCBdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB4LmUgPSBlO1xyXG4gICAgICAgICAgICAgICAgICAgIHguYyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2Zvcm0gYmFzZVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBlIGlzIHRoZSBiYXNlIDEwIGV4cG9uZW50LlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGkgaXMgd2hlcmUgdG8gc2xpY2Ugc3RyIHRvIGdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgY29lZmZpY2llbnQgYXJyYXkuXHJcbiAgICAgICAgICAgICAgICAgICAgaSA9ICggZSArIDEgKSAlIExPR19CQVNFO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZSA8IDAgKSBpICs9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPCBsZW4gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpKSB4LmMucHVzaCggK3N0ci5zbGljZSggMCwgaSApICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZW4gLT0gTE9HX0JBU0U7IGkgPCBsZW47ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeC5jLnB1c2goICtzdHIuc2xpY2UoIGksIGkgKz0gTE9HX0JBU0UgKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBMT0dfQkFTRSAtIHN0ci5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaSAtPSBsZW47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IGktLTsgc3RyICs9ICcwJyApO1xyXG4gICAgICAgICAgICAgICAgICAgIHguYy5wdXNoKCArc3RyICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gWmVyby5cclxuICAgICAgICAgICAgICAgIHguYyA9IFsgeC5lID0gMCBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZCA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLy8gQ09OU1RSVUNUT1IgUFJPUEVSVElFU1xyXG5cclxuXHJcbiAgICAgICAgQmlnTnVtYmVyLmFub3RoZXIgPSBjb25zdHJ1Y3RvckZhY3Rvcnk7XHJcblxyXG4gICAgICAgIEJpZ051bWJlci5ST1VORF9VUCA9IDA7XHJcbiAgICAgICAgQmlnTnVtYmVyLlJPVU5EX0RPV04gPSAxO1xyXG4gICAgICAgIEJpZ051bWJlci5ST1VORF9DRUlMID0gMjtcclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfRkxPT1IgPSAzO1xyXG4gICAgICAgIEJpZ051bWJlci5ST1VORF9IQUxGX1VQID0gNDtcclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9ET1dOID0gNTtcclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9FVkVOID0gNjtcclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9DRUlMID0gNztcclxuICAgICAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9GTE9PUiA9IDg7XHJcbiAgICAgICAgQmlnTnVtYmVyLkVVQ0xJRCA9IDk7XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIENvbmZpZ3VyZSBpbmZyZXF1ZW50bHktY2hhbmdpbmcgbGlicmFyeS13aWRlIHNldHRpbmdzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQWNjZXB0IGFuIG9iamVjdCBvciBhbiBhcmd1bWVudCBsaXN0LCB3aXRoIG9uZSBvciBtYW55IG9mIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllcyBvclxyXG4gICAgICAgICAqIHBhcmFtZXRlcnMgcmVzcGVjdGl2ZWx5OlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogICBERUNJTUFMX1BMQUNFUyAge251bWJlcn0gIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZVxyXG4gICAgICAgICAqICAgUk9VTkRJTkdfTU9ERSAgIHtudW1iZXJ9ICBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlXHJcbiAgICAgICAgICogICBFWFBPTkVOVElBTF9BVCAge251bWJlcnxudW1iZXJbXX0gIEludGVnZXIsIC1NQVggdG8gTUFYIGluY2x1c2l2ZSBvclxyXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbaW50ZWdlciAtTUFYIHRvIDAgaW5jbC4sIDAgdG8gTUFYIGluY2wuXVxyXG4gICAgICAgICAqICAgUkFOR0UgICAgICAgICAgIHtudW1iZXJ8bnVtYmVyW119ICBOb24temVybyBpbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2ludGVnZXIgLU1BWCB0byAtMSBpbmNsLiwgaW50ZWdlciAxIHRvIE1BWCBpbmNsLl1cclxuICAgICAgICAgKiAgIEVSUk9SUyAgICAgICAgICB7Ym9vbGVhbnxudW1iZXJ9ICAgdHJ1ZSwgZmFsc2UsIDEgb3IgMFxyXG4gICAgICAgICAqICAgQ1JZUFRPICAgICAgICAgIHtib29sZWFufG51bWJlcn0gICB0cnVlLCBmYWxzZSwgMSBvciAwXHJcbiAgICAgICAgICogICBNT0RVTE9fTU9ERSAgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gOSBpbmNsdXNpdmVcclxuICAgICAgICAgKiAgIFBPV19QUkVDSVNJT04gICB7bnVtYmVyfSAgICAgICAgICAgMCB0byBNQVggaW5jbHVzaXZlXHJcbiAgICAgICAgICogICBGT1JNQVQgICAgICAgICAge29iamVjdH0gICAgICAgICAgIFNlZSBCaWdOdW1iZXIucHJvdG90eXBlLnRvRm9ybWF0XHJcbiAgICAgICAgICogICAgICBkZWNpbWFsU2VwYXJhdG9yICAgICAgIHtzdHJpbmd9XHJcbiAgICAgICAgICogICAgICBncm91cFNlcGFyYXRvciAgICAgICAgIHtzdHJpbmd9XHJcbiAgICAgICAgICogICAgICBncm91cFNpemUgICAgICAgICAgICAgIHtudW1iZXJ9XHJcbiAgICAgICAgICogICAgICBzZWNvbmRhcnlHcm91cFNpemUgICAgIHtudW1iZXJ9XHJcbiAgICAgICAgICogICAgICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yIHtzdHJpbmd9XHJcbiAgICAgICAgICogICAgICBmcmFjdGlvbkdyb3VwU2l6ZSAgICAgIHtudW1iZXJ9XHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAoVGhlIHZhbHVlcyBhc3NpZ25lZCB0byB0aGUgYWJvdmUgRk9STUFUIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3QgY2hlY2tlZCBmb3IgdmFsaWRpdHkuKVxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogRS5nLlxyXG4gICAgICAgICAqIEJpZ051bWJlci5jb25maWcoMjAsIDQpIGlzIGVxdWl2YWxlbnQgdG9cclxuICAgICAgICAgKiBCaWdOdW1iZXIuY29uZmlnKHsgREVDSU1BTF9QTEFDRVMgOiAyMCwgUk9VTkRJTkdfTU9ERSA6IDQgfSlcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIElnbm9yZSBwcm9wZXJ0aWVzL3BhcmFtZXRlcnMgc2V0IHRvIG51bGwgb3IgdW5kZWZpbmVkLlxyXG4gICAgICAgICAqIFJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBjdXJyZW50IHZhbHVlcy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBCaWdOdW1iZXIuY29uZmlnID0gQmlnTnVtYmVyLnNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHYsIHAsXHJcbiAgICAgICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgICAgIHIgPSB7fSxcclxuICAgICAgICAgICAgICAgIGEgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgICAgICBvID0gYVswXSxcclxuICAgICAgICAgICAgICAgIGhhcyA9IG8gJiYgdHlwZW9mIG8gPT0gJ29iamVjdCdcclxuICAgICAgICAgICAgICAgICAgPyBmdW5jdGlvbiAoKSB7IGlmICggby5oYXNPd25Qcm9wZXJ0eShwKSApIHJldHVybiAoIHYgPSBvW3BdICkgIT0gbnVsbDsgfVxyXG4gICAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uICgpIHsgaWYgKCBhLmxlbmd0aCA+IGkgKSByZXR1cm4gKCB2ID0gYVtpKytdICkgIT0gbnVsbDsgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIERFQ0lNQUxfUExBQ0VTIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIERFQ0lNQUxfUExBQ0VTIG5vdCBhbiBpbnRlZ2VyOiB7dn0nXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBERUNJTUFMX1BMQUNFUyBvdXQgb2YgcmFuZ2U6IHt2fSdcclxuICAgICAgICAgICAgaWYgKCBoYXMoIHAgPSAnREVDSU1BTF9QTEFDRVMnICkgJiYgaXNWYWxpZEludCggdiwgMCwgTUFYLCAyLCBwICkgKSB7XHJcbiAgICAgICAgICAgICAgICBERUNJTUFMX1BMQUNFUyA9IHYgfCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBERUNJTUFMX1BMQUNFUztcclxuXHJcbiAgICAgICAgICAgIC8vIFJPVU5ESU5HX01PREUge251bWJlcn0gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIFJPVU5ESU5HX01PREUgbm90IGFuIGludGVnZXI6IHt2fSdcclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIFJPVU5ESU5HX01PREUgb3V0IG9mIHJhbmdlOiB7dn0nXHJcbiAgICAgICAgICAgIGlmICggaGFzKCBwID0gJ1JPVU5ESU5HX01PREUnICkgJiYgaXNWYWxpZEludCggdiwgMCwgOCwgMiwgcCApICkge1xyXG4gICAgICAgICAgICAgICAgUk9VTkRJTkdfTU9ERSA9IHYgfCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBST1VORElOR19NT0RFO1xyXG5cclxuICAgICAgICAgICAgLy8gRVhQT05FTlRJQUxfQVQge251bWJlcnxudW1iZXJbXX1cclxuICAgICAgICAgICAgLy8gSW50ZWdlciwgLU1BWCB0byBNQVggaW5jbHVzaXZlIG9yIFtpbnRlZ2VyIC1NQVggdG8gMCBpbmNsdXNpdmUsIDAgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBFWFBPTkVOVElBTF9BVCBub3QgYW4gaW50ZWdlcjoge3Z9J1xyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgRVhQT05FTlRJQUxfQVQgb3V0IG9mIHJhbmdlOiB7dn0nXHJcbiAgICAgICAgICAgIGlmICggaGFzKCBwID0gJ0VYUE9ORU5USUFMX0FUJyApICkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaXNBcnJheSh2KSApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGlzVmFsaWRJbnQoIHZbMF0sIC1NQVgsIDAsIDIsIHAgKSAmJiBpc1ZhbGlkSW50KCB2WzFdLCAwLCBNQVgsIDIsIHAgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgVE9fRVhQX05FRyA9IHZbMF0gfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBUT19FWFBfUE9TID0gdlsxXSB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggaXNWYWxpZEludCggdiwgLU1BWCwgTUFYLCAyLCBwICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgVE9fRVhQX05FRyA9IC0oIFRPX0VYUF9QT1MgPSAoIHYgPCAwID8gLXYgOiB2ICkgfCAwICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcltwXSA9IFsgVE9fRVhQX05FRywgVE9fRVhQX1BPUyBdO1xyXG5cclxuICAgICAgICAgICAgLy8gUkFOR0Uge251bWJlcnxudW1iZXJbXX0gTm9uLXplcm8gaW50ZWdlciwgLU1BWCB0byBNQVggaW5jbHVzaXZlIG9yXHJcbiAgICAgICAgICAgIC8vIFtpbnRlZ2VyIC1NQVggdG8gLTEgaW5jbHVzaXZlLCBpbnRlZ2VyIDEgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBSQU5HRSBub3QgYW4gaW50ZWdlcjoge3Z9J1xyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgUkFOR0UgY2Fubm90IGJlIHplcm86IHt2fSdcclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIFJBTkdFIG91dCBvZiByYW5nZToge3Z9J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdSQU5HRScgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGlzQXJyYXkodikgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpc1ZhbGlkSW50KCB2WzBdLCAtTUFYLCAtMSwgMiwgcCApICYmIGlzVmFsaWRJbnQoIHZbMV0sIDEsIE1BWCwgMiwgcCApICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBNSU5fRVhQID0gdlswXSB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE1BWF9FWFAgPSB2WzFdIHwgMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBpc1ZhbGlkSW50KCB2LCAtTUFYLCBNQVgsIDIsIHAgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHYgfCAwICkgTUlOX0VYUCA9IC0oIE1BWF9FWFAgPSAoIHYgPCAwID8gLXYgOiB2ICkgfCAwICk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoRVJST1JTKSByYWlzZSggMiwgcCArICcgY2Fubm90IGJlIHplcm8nLCB2ICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcltwXSA9IFsgTUlOX0VYUCwgTUFYX0VYUCBdO1xyXG5cclxuICAgICAgICAgICAgLy8gRVJST1JTIHtib29sZWFufG51bWJlcn0gdHJ1ZSwgZmFsc2UsIDEgb3IgMC5cclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIEVSUk9SUyBub3QgYSBib29sZWFuIG9yIGJpbmFyeSBkaWdpdDoge3Z9J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdFUlJPUlMnICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB2ID09PSAhIXYgfHwgdiA9PT0gMSB8fCB2ID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkSW50ID0gKCBFUlJPUlMgPSAhIXYgKSA/IGludFZhbGlkYXRvcldpdGhFcnJvcnMgOiBpbnRWYWxpZGF0b3JOb0Vycm9ycztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoRVJST1JTKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFpc2UoIDIsIHAgKyBub3RCb29sLCB2ICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcltwXSA9IEVSUk9SUztcclxuXHJcbiAgICAgICAgICAgIC8vIENSWVBUTyB7Ym9vbGVhbnxudW1iZXJ9IHRydWUsIGZhbHNlLCAxIG9yIDAuXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBDUllQVE8gbm90IGEgYm9vbGVhbiBvciBiaW5hcnkgZGlnaXQ6IHt2fSdcclxuICAgICAgICAgICAgLy8gJ2NvbmZpZygpIGNyeXB0byB1bmF2YWlsYWJsZToge2NyeXB0b30nXHJcbiAgICAgICAgICAgIGlmICggaGFzKCBwID0gJ0NSWVBUTycgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHYgPT09IHRydWUgfHwgdiA9PT0gZmFsc2UgfHwgdiA9PT0gMSB8fCB2ID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSB0eXBlb2YgY3J5cHRvID09ICd1bmRlZmluZWQnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICF2ICYmIGNyeXB0byAmJiAoY3J5cHRvLmdldFJhbmRvbVZhbHVlcyB8fCBjcnlwdG8ucmFuZG9tQnl0ZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDUllQVE8gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEVSUk9SUykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFpc2UoIDIsICdjcnlwdG8gdW5hdmFpbGFibGUnLCB2ID8gdm9pZCAwIDogY3J5cHRvICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDUllQVE8gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIENSWVBUTyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoRVJST1JTKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFpc2UoIDIsIHAgKyBub3RCb29sLCB2ICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcltwXSA9IENSWVBUTztcclxuXHJcbiAgICAgICAgICAgIC8vIE1PRFVMT19NT0RFIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gOSBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBNT0RVTE9fTU9ERSBub3QgYW4gaW50ZWdlcjoge3Z9J1xyXG4gICAgICAgICAgICAvLyAnY29uZmlnKCkgTU9EVUxPX01PREUgb3V0IG9mIHJhbmdlOiB7dn0nXHJcbiAgICAgICAgICAgIGlmICggaGFzKCBwID0gJ01PRFVMT19NT0RFJyApICYmIGlzVmFsaWRJbnQoIHYsIDAsIDksIDIsIHAgKSApIHtcclxuICAgICAgICAgICAgICAgIE1PRFVMT19NT0RFID0gdiB8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcltwXSA9IE1PRFVMT19NT0RFO1xyXG5cclxuICAgICAgICAgICAgLy8gUE9XX1BSRUNJU0lPTiB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBQT1dfUFJFQ0lTSU9OIG5vdCBhbiBpbnRlZ2VyOiB7dn0nXHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBQT1dfUFJFQ0lTSU9OIG91dCBvZiByYW5nZToge3Z9J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdQT1dfUFJFQ0lTSU9OJyApICYmIGlzVmFsaWRJbnQoIHYsIDAsIE1BWCwgMiwgcCApICkge1xyXG4gICAgICAgICAgICAgICAgUE9XX1BSRUNJU0lPTiA9IHYgfCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJbcF0gPSBQT1dfUFJFQ0lTSU9OO1xyXG5cclxuICAgICAgICAgICAgLy8gRk9STUFUIHtvYmplY3R9XHJcbiAgICAgICAgICAgIC8vICdjb25maWcoKSBGT1JNQVQgbm90IGFuIG9iamVjdDoge3Z9J1xyXG4gICAgICAgICAgICBpZiAoIGhhcyggcCA9ICdGT1JNQVQnICkgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgdiA9PSAnb2JqZWN0JyApIHtcclxuICAgICAgICAgICAgICAgICAgICBGT1JNQVQgPSB2O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChFUlJPUlMpIHtcclxuICAgICAgICAgICAgICAgICAgICByYWlzZSggMiwgcCArICcgbm90IGFuIG9iamVjdCcsIHYgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByW3BdID0gRk9STUFUO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHI7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgbWF4aW11bSBvZiB0aGUgYXJndW1lbnRzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBCaWdOdW1iZXIubWF4ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbWF4T3JNaW4oIGFyZ3VtZW50cywgUC5sdCApOyB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBtaW5pbXVtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJpZ051bWJlci5taW4gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBtYXhPck1pbiggYXJndW1lbnRzLCBQLmd0ICk7IH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2l0aCBhIHJhbmRvbSB2YWx1ZSBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gMCBhbmQgbGVzcyB0aGFuIDEsXHJcbiAgICAgICAgICogYW5kIHdpdGggZHAsIG9yIERFQ0lNQUxfUExBQ0VTIGlmIGRwIGlzIG9taXR0ZWQsIGRlY2ltYWwgcGxhY2VzIChvciBsZXNzIGlmIHRyYWlsaW5nXHJcbiAgICAgICAgICogemVyb3MgYXJlIHByb2R1Y2VkKS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICdyYW5kb20oKSBkZWNpbWFsIHBsYWNlcyBub3QgYW4gaW50ZWdlcjoge2RwfSdcclxuICAgICAgICAgKiAncmFuZG9tKCkgZGVjaW1hbCBwbGFjZXMgb3V0IG9mIHJhbmdlOiB7ZHB9J1xyXG4gICAgICAgICAqICdyYW5kb20oKSBjcnlwdG8gdW5hdmFpbGFibGU6IHtjcnlwdG99J1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEJpZ051bWJlci5yYW5kb20gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgcG93Ml81MyA9IDB4MjAwMDAwMDAwMDAwMDA7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gYSA1MyBiaXQgaW50ZWdlciBuLCB3aGVyZSAwIDw9IG4gPCA5MDA3MTk5MjU0NzQwOTkyLlxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBNYXRoLnJhbmRvbSgpIHByb2R1Y2VzIG1vcmUgdGhhbiAzMiBiaXRzIG9mIHJhbmRvbW5lc3MuXHJcbiAgICAgICAgICAgIC8vIElmIGl0IGRvZXMsIGFzc3VtZSBhdCBsZWFzdCA1MyBiaXRzIGFyZSBwcm9kdWNlZCwgb3RoZXJ3aXNlIGFzc3VtZSBhdCBsZWFzdCAzMCBiaXRzLlxyXG4gICAgICAgICAgICAvLyAweDQwMDAwMDAwIGlzIDJeMzAsIDB4ODAwMDAwIGlzIDJeMjMsIDB4MWZmZmZmIGlzIDJeMjEgLSAxLlxyXG4gICAgICAgICAgICB2YXIgcmFuZG9tNTNiaXRJbnQgPSAoTWF0aC5yYW5kb20oKSAqIHBvdzJfNTMpICYgMHgxZmZmZmZcclxuICAgICAgICAgICAgICA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1hdGhmbG9vciggTWF0aC5yYW5kb20oKSAqIHBvdzJfNTMgKTsgfVxyXG4gICAgICAgICAgICAgIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gKChNYXRoLnJhbmRvbSgpICogMHg0MDAwMDAwMCB8IDApICogMHg4MDAwMDApICtcclxuICAgICAgICAgICAgICAgICAgKE1hdGgucmFuZG9tKCkgKiAweDgwMDAwMCB8IDApOyB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkcCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGEsIGIsIGUsIGssIHYsXHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgYyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmQgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZHAgPSBkcCA9PSBudWxsIHx8ICFpc1ZhbGlkSW50KCBkcCwgMCwgTUFYLCAxNCApID8gREVDSU1BTF9QTEFDRVMgOiBkcCB8IDA7XHJcbiAgICAgICAgICAgICAgICBrID0gbWF0aGNlaWwoIGRwIC8gTE9HX0JBU0UgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoQ1JZUFRPKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEJyb3dzZXJzIHN1cHBvcnRpbmcgY3J5cHRvLmdldFJhbmRvbVZhbHVlcy5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYSA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoIG5ldyBVaW50MzJBcnJheSggayAqPSAyICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGs7ICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDUzIGJpdHM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoKE1hdGgucG93KDIsIDMyKSAtIDEpICogTWF0aC5wb3coMiwgMjEpKS50b1N0cmluZygyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICgoTWF0aC5wb3coMiwgMzIpIC0gMSkgPj4+IDExKS50b1N0cmluZygyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMTExMTEgMTExMTExMTEgMTExMTExMTFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDB4MjAwMDAgaXMgMl4yMS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBhW2ldICogMHgyMDAwMCArIChhW2kgKyAxXSA+Pj4gMTEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlamVjdGlvbiBzYW1wbGluZzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgPD0gdiA8IDkwMDcxOTkyNTQ3NDA5OTJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByb2JhYmlsaXR5IHRoYXQgdiA+PSA5ZTE1LCBpc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gNzE5OTI1NDc0MDk5MiAvIDkwMDcxOTkyNTQ3NDA5OTIgfj0gMC4wMDA4LCBpLmUuIDEgaW4gMTI1MVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB2ID49IDllMTUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYiA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoIG5ldyBVaW50MzJBcnJheSgyKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFbaV0gPSBiWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFbaSArIDFdID0gYlsxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgPD0gdiA8PSA4OTk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYy5wdXNoKCB2ICUgMWUxNCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpID0gayAvIDI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vZGUuanMgc3VwcG9ydGluZyBjcnlwdG8ucmFuZG9tQnl0ZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjcnlwdG8ucmFuZG9tQnl0ZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhID0gY3J5cHRvLnJhbmRvbUJ5dGVzKCBrICo9IDcgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGs7ICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDB4MTAwMDAwMDAwMDAwMCBpcyAyXjQ4LCAweDEwMDAwMDAwMDAwIGlzIDJeNDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDB4MTAwMDAwMDAwIGlzIDJeMzIsIDB4MTAwMDAwMCBpcyAyXjI0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAxMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCA8PSB2IDwgOTAwNzE5OTI1NDc0MDk5MlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdiA9ICggKCBhW2ldICYgMzEgKSAqIDB4MTAwMDAwMDAwMDAwMCApICsgKCBhW2kgKyAxXSAqIDB4MTAwMDAwMDAwMDAgKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoIGFbaSArIDJdICogMHgxMDAwMDAwMDAgKSArICggYVtpICsgM10gKiAweDEwMDAwMDAgKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoIGFbaSArIDRdIDw8IDE2ICkgKyAoIGFbaSArIDVdIDw8IDggKSArIGFbaSArIDZdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdiA+PSA5ZTE1ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyeXB0by5yYW5kb21CeXRlcyg3KS5jb3B5KCBhLCBpICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIDw9ICh2ICUgMWUxNCkgPD0gOTk5OTk5OTk5OTk5OTlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjLnB1c2goIHYgJSAxZTE0ICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSArPSA3O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBrIC8gNztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBDUllQVE8gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEVSUk9SUykgcmFpc2UoIDE0LCAnY3J5cHRvIHVuYXZhaWxhYmxlJywgY3J5cHRvICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFVzZSBNYXRoLnJhbmRvbS5cclxuICAgICAgICAgICAgICAgIGlmICghQ1JZUFRPKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGs7ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gcmFuZG9tNTNiaXRJbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB2IDwgOWUxNSApIGNbaSsrXSA9IHYgJSAxZTE0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBrID0gY1stLWldO1xyXG4gICAgICAgICAgICAgICAgZHAgJT0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29udmVydCB0cmFpbGluZyBkaWdpdHMgdG8gemVyb3MgYWNjb3JkaW5nIHRvIGRwLlxyXG4gICAgICAgICAgICAgICAgaWYgKCBrICYmIGRwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHYgPSBQT1dTX1RFTltMT0dfQkFTRSAtIGRwXTtcclxuICAgICAgICAgICAgICAgICAgICBjW2ldID0gbWF0aGZsb29yKCBrIC8gdiApICogdjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgZWxlbWVudHMgd2hpY2ggYXJlIHplcm8uXHJcbiAgICAgICAgICAgICAgICBmb3IgKCA7IGNbaV0gPT09IDA7IGMucG9wKCksIGktLSApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFplcm8/XHJcbiAgICAgICAgICAgICAgICBpZiAoIGkgPCAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGMgPSBbIGUgPSAwIF07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgbGVhZGluZyBlbGVtZW50cyB3aGljaCBhcmUgemVybyBhbmQgYWRqdXN0IGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGUgPSAtMSA7IGNbMF0gPT09IDA7IGMuc3BsaWNlKDAsIDEpLCBlIC09IExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ291bnQgdGhlIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiBjIHRvIGRldGVybWluZSBsZWFkaW5nIHplcm9zLCBhbmQuLi5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMSwgdiA9IGNbMF07IHYgPj0gMTA7IHYgLz0gMTAsIGkrKyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFkanVzdCB0aGUgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpIDwgTE9HX0JBU0UgKSBlIC09IExPR19CQVNFIC0gaTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByYW5kLmUgPSBlO1xyXG4gICAgICAgICAgICAgICAgcmFuZC5jID0gYztcclxuICAgICAgICAgICAgICAgIHJldHVybiByYW5kO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pKCk7XHJcblxyXG5cclxuICAgICAgICAvLyBQUklWQVRFIEZVTkNUSU9OU1xyXG5cclxuXHJcbiAgICAgICAgLy8gQ29udmVydCBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VJbiB0byBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VPdXQuXHJcbiAgICAgICAgZnVuY3Rpb24gY29udmVydEJhc2UoIHN0ciwgYmFzZU91dCwgYmFzZUluLCBzaWduICkge1xyXG4gICAgICAgICAgICB2YXIgZCwgZSwgaywgciwgeCwgeGMsIHksXHJcbiAgICAgICAgICAgICAgICBpID0gc3RyLmluZGV4T2YoICcuJyApLFxyXG4gICAgICAgICAgICAgICAgZHAgPSBERUNJTUFMX1BMQUNFUyxcclxuICAgICAgICAgICAgICAgIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuXHJcbiAgICAgICAgICAgIGlmICggYmFzZUluIDwgMzcgKSBzdHIgPSBzdHIudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE5vbi1pbnRlZ2VyLlxyXG4gICAgICAgICAgICBpZiAoIGkgPj0gMCApIHtcclxuICAgICAgICAgICAgICAgIGsgPSBQT1dfUFJFQ0lTSU9OO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFVubGltaXRlZCBwcmVjaXNpb24uXHJcbiAgICAgICAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gMDtcclxuICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKCAnLicsICcnICk7XHJcbiAgICAgICAgICAgICAgICB5ID0gbmV3IEJpZ051bWJlcihiYXNlSW4pO1xyXG4gICAgICAgICAgICAgICAgeCA9IHkucG93KCBzdHIubGVuZ3RoIC0gaSApO1xyXG4gICAgICAgICAgICAgICAgUE9XX1BSRUNJU0lPTiA9IGs7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29udmVydCBzdHIgYXMgaWYgYW4gaW50ZWdlciwgdGhlbiByZXN0b3JlIHRoZSBmcmFjdGlvbiBwYXJ0IGJ5IGRpdmlkaW5nIHRoZVxyXG4gICAgICAgICAgICAgICAgLy8gcmVzdWx0IGJ5IGl0cyBiYXNlIHJhaXNlZCB0byBhIHBvd2VyLlxyXG4gICAgICAgICAgICAgICAgeS5jID0gdG9CYXNlT3V0KCB0b0ZpeGVkUG9pbnQoIGNvZWZmVG9TdHJpbmcoIHguYyApLCB4LmUgKSwgMTAsIGJhc2VPdXQgKTtcclxuICAgICAgICAgICAgICAgIHkuZSA9IHkuYy5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIG51bWJlciBhcyBpbnRlZ2VyLlxyXG4gICAgICAgICAgICB4YyA9IHRvQmFzZU91dCggc3RyLCBiYXNlSW4sIGJhc2VPdXQgKTtcclxuICAgICAgICAgICAgZSA9IGsgPSB4Yy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoIDsgeGNbLS1rXSA9PSAwOyB4Yy5wb3AoKSApO1xyXG4gICAgICAgICAgICBpZiAoICF4Y1swXSApIHJldHVybiAnMCc7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGkgPCAwICkge1xyXG4gICAgICAgICAgICAgICAgLS1lO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgeC5jID0geGM7XHJcbiAgICAgICAgICAgICAgICB4LmUgPSBlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHNpZ24gaXMgbmVlZGVkIGZvciBjb3JyZWN0IHJvdW5kaW5nLlxyXG4gICAgICAgICAgICAgICAgeC5zID0gc2lnbjtcclxuICAgICAgICAgICAgICAgIHggPSBkaXYoIHgsIHksIGRwLCBybSwgYmFzZU91dCApO1xyXG4gICAgICAgICAgICAgICAgeGMgPSB4LmM7XHJcbiAgICAgICAgICAgICAgICByID0geC5yO1xyXG4gICAgICAgICAgICAgICAgZSA9IHguZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZCA9IGUgKyBkcCArIDE7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgcm91bmRpbmcgZGlnaXQsIGkuZS4gdGhlIGRpZ2l0IHRvIHRoZSByaWdodCBvZiB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAgICAgaSA9IHhjW2RdO1xyXG4gICAgICAgICAgICBrID0gYmFzZU91dCAvIDI7XHJcbiAgICAgICAgICAgIHIgPSByIHx8IGQgPCAwIHx8IHhjW2QgKyAxXSAhPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgciA9IHJtIDwgNCA/ICggaSAhPSBudWxsIHx8IHIgKSAmJiAoIHJtID09IDAgfHwgcm0gPT0gKCB4LnMgPCAwID8gMyA6IDIgKSApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgOiBpID4gayB8fCBpID09IGsgJiYoIHJtID09IDQgfHwgciB8fCBybSA9PSA2ICYmIHhjW2QgLSAxXSAmIDEgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIHJtID09ICggeC5zIDwgMCA/IDggOiA3ICkgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZCA8IDEgfHwgIXhjWzBdICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIDFeLWRwIG9yIDAuXHJcbiAgICAgICAgICAgICAgICBzdHIgPSByID8gdG9GaXhlZFBvaW50KCAnMScsIC1kcCApIDogJzAnO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgeGMubGVuZ3RoID0gZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSb3VuZGluZyB1cCBtYXkgbWVhbiB0aGUgcHJldmlvdXMgZGlnaXQgaGFzIHRvIGJlIHJvdW5kZWQgdXAgYW5kIHNvIG9uLlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIC0tYmFzZU91dDsgKyt4Y1stLWRdID4gYmFzZU91dDsgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhjW2RdID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4YyA9IFsxXS5jb25jYXQoeGMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIERldGVybWluZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgICAgIGZvciAoIGsgPSB4Yy5sZW5ndGg7ICF4Y1stLWtdOyApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEUuZy4gWzQsIDExLCAxNV0gYmVjb21lcyA0YmYuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgc3RyID0gJyc7IGkgPD0gazsgc3RyICs9IEFMUEhBQkVULmNoYXJBdCggeGNbaSsrXSApICk7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSB0b0ZpeGVkUG9pbnQoIHN0ciwgZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgY2FsbGVyIHdpbGwgYWRkIHRoZSBzaWduLlxyXG4gICAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIFBlcmZvcm0gZGl2aXNpb24gaW4gdGhlIHNwZWNpZmllZCBiYXNlLiBDYWxsZWQgYnkgZGl2IGFuZCBjb252ZXJ0QmFzZS5cclxuICAgICAgICBkaXYgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgLy8gQXNzdW1lIG5vbi16ZXJvIHggYW5kIGsuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIG11bHRpcGx5KCB4LCBrLCBiYXNlICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG0sIHRlbXAsIHhsbywgeGhpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhcnJ5ID0gMCxcclxuICAgICAgICAgICAgICAgICAgICBpID0geC5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAga2xvID0gayAlIFNRUlRfQkFTRSxcclxuICAgICAgICAgICAgICAgICAgICBraGkgPSBrIC8gU1FSVF9CQVNFIHwgMDtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCB4ID0geC5zbGljZSgpOyBpLS07ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHhsbyA9IHhbaV0gJSBTUVJUX0JBU0U7XHJcbiAgICAgICAgICAgICAgICAgICAgeGhpID0geFtpXSAvIFNRUlRfQkFTRSB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgbSA9IGtoaSAqIHhsbyArIHhoaSAqIGtsbztcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wID0ga2xvICogeGxvICsgKCAoIG0gJSBTUVJUX0JBU0UgKSAqIFNRUlRfQkFTRSApICsgY2Fycnk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FycnkgPSAoIHRlbXAgLyBiYXNlIHwgMCApICsgKCBtIC8gU1FSVF9CQVNFIHwgMCApICsga2hpICogeGhpO1xyXG4gICAgICAgICAgICAgICAgICAgIHhbaV0gPSB0ZW1wICUgYmFzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2FycnkpIHggPSBbY2FycnldLmNvbmNhdCh4KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gY29tcGFyZSggYSwgYiwgYUwsIGJMICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGksIGNtcDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGFMICE9IGJMICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNtcCA9IGFMID4gYkwgPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gY21wID0gMDsgaSA8IGFMOyBpKysgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGFbaV0gIT0gYltpXSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtcCA9IGFbaV0gPiBiW2ldID8gMSA6IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY21wO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBzdWJ0cmFjdCggYSwgYiwgYUwsIGJhc2UgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgYiBmcm9tIGEuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCA7IGFMLS07ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFbYUxdIC09IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IGFbYUxdIDwgYlthTF0gPyAxIDogMDtcclxuICAgICAgICAgICAgICAgICAgICBhW2FMXSA9IGkgKiBiYXNlICsgYVthTF0gLSBiW2FMXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgICAgIGZvciAoIDsgIWFbMF0gJiYgYS5sZW5ndGggPiAxOyBhLnNwbGljZSgwLCAxKSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB4OiBkaXZpZGVuZCwgeTogZGl2aXNvci5cclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICggeCwgeSwgZHAsIHJtLCBiYXNlICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNtcCwgZSwgaSwgbW9yZSwgbiwgcHJvZCwgcHJvZEwsIHEsIHFjLCByZW0sIHJlbUwsIHJlbTAsIHhpLCB4TCwgeWMwLFxyXG4gICAgICAgICAgICAgICAgICAgIHlMLCB5eixcclxuICAgICAgICAgICAgICAgICAgICBzID0geC5zID09IHkucyA/IDEgOiAtMSxcclxuICAgICAgICAgICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFaXRoZXIgTmFOLCBJbmZpbml0eSBvciAwP1xyXG4gICAgICAgICAgICAgICAgaWYgKCAheGMgfHwgIXhjWzBdIHx8ICF5YyB8fCAheWNbMF0gKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiBOYU4gaWYgZWl0aGVyIE5hTiwgb3IgYm90aCBJbmZpbml0eSBvciAwLlxyXG4gICAgICAgICAgICAgICAgICAgICAgIXgucyB8fCAheS5zIHx8ICggeGMgPyB5YyAmJiB4Y1swXSA9PSB5Y1swXSA6ICF5YyApID8gTmFOIDpcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiDCsTAgaWYgeCBpcyDCsTAgb3IgeSBpcyDCsUluZmluaXR5LCBvciByZXR1cm4gwrFJbmZpbml0eSBhcyB5IGlzIMKxMC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgeGMgJiYgeGNbMF0gPT0gMCB8fCAheWMgPyBzICogMCA6IHMgLyAwXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBxID0gbmV3IEJpZ051bWJlcihzKTtcclxuICAgICAgICAgICAgICAgIHFjID0gcS5jID0gW107XHJcbiAgICAgICAgICAgICAgICBlID0geC5lIC0geS5lO1xyXG4gICAgICAgICAgICAgICAgcyA9IGRwICsgZSArIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhYmFzZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBiYXNlID0gQkFTRTtcclxuICAgICAgICAgICAgICAgICAgICBlID0gYml0Rmxvb3IoIHguZSAvIExPR19CQVNFICkgLSBiaXRGbG9vciggeS5lIC8gTE9HX0JBU0UgKTtcclxuICAgICAgICAgICAgICAgICAgICBzID0gcyAvIExPR19CQVNFIHwgMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZXN1bHQgZXhwb25lbnQgbWF5IGJlIG9uZSBsZXNzIHRoZW4gdGhlIGN1cnJlbnQgdmFsdWUgb2YgZS5cclxuICAgICAgICAgICAgICAgIC8vIFRoZSBjb2VmZmljaWVudHMgb2YgdGhlIEJpZ051bWJlcnMgZnJvbSBjb252ZXJ0QmFzZSBtYXkgaGF2ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwOyB5Y1tpXSA9PSAoIHhjW2ldIHx8IDAgKTsgaSsrICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHljW2ldID4gKCB4Y1tpXSB8fCAwICkgKSBlLS07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzIDwgMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBxYy5wdXNoKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vcmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB4TCA9IHhjLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB5TCA9IHljLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBpID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBzICs9IDI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vcm1hbGlzZSB4YyBhbmQgeWMgc28gaGlnaGVzdCBvcmRlciBkaWdpdCBvZiB5YyBpcyA+PSBiYXNlIC8gMi5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbiA9IG1hdGhmbG9vciggYmFzZSAvICggeWNbMF0gKyAxICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm90IG5lY2Vzc2FyeSwgYnV0IHRvIGhhbmRsZSBvZGQgYmFzZXMgd2hlcmUgeWNbMF0gPT0gKCBiYXNlIC8gMiApIC0gMS5cclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoIG4gPiAxIHx8IG4rKyA9PSAxICYmIHljWzBdIDwgYmFzZSAvIDIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBuID4gMSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWMgPSBtdWx0aXBseSggeWMsIG4sIGJhc2UgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeGMgPSBtdWx0aXBseSggeGMsIG4sIGJhc2UgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeUwgPSB5Yy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhMID0geGMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgeGkgPSB5TDtcclxuICAgICAgICAgICAgICAgICAgICByZW0gPSB4Yy5zbGljZSggMCwgeUwgKTtcclxuICAgICAgICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHplcm9zIHRvIG1ha2UgcmVtYWluZGVyIGFzIGxvbmcgYXMgZGl2aXNvci5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IHJlbUwgPCB5TDsgcmVtW3JlbUwrK10gPSAwICk7XHJcbiAgICAgICAgICAgICAgICAgICAgeXogPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHl6ID0gWzBdLmNvbmNhdCh5eik7XHJcbiAgICAgICAgICAgICAgICAgICAgeWMwID0geWNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB5Y1sxXSA+PSBiYXNlIC8gMiApIHljMCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdCBuZWNlc3NhcnksIGJ1dCB0byBwcmV2ZW50IHRyaWFsIGRpZ2l0IG4gPiBiYXNlLCB3aGVuIHVzaW5nIGJhc2UgMy5cclxuICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIGlmICggYmFzZSA9PSAzICYmIHljMCA9PSAxICkgeWMwID0gMSArIDFlLTE1O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNtcCA9IGNvbXBhcmUoIHljLCByZW0sIHlMLCByZW1MICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGNtcCA8IDAgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRyaWFsIGRpZ2l0LCBuLlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbTAgPSByZW1bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHlMICE9IHJlbUwgKSByZW0wID0gcmVtMCAqIGJhc2UgKyAoIHJlbVsxXSB8fCAwICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbiBpcyBob3cgbWFueSB0aW1lcyB0aGUgZGl2aXNvciBnb2VzIGludG8gdGhlIGN1cnJlbnQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbiA9IG1hdGhmbG9vciggcmVtMCAvIHljMCApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICBBbGdvcml0aG06XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgMS4gcHJvZHVjdCA9IGRpdmlzb3IgKiB0cmlhbCBkaWdpdCAobilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAyLiBpZiBwcm9kdWN0ID4gcmVtYWluZGVyOiBwcm9kdWN0IC09IGRpdmlzb3IsIG4tLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIDMuIHJlbWFpbmRlciAtPSBwcm9kdWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgNC4gaWYgcHJvZHVjdCB3YXMgPCByZW1haW5kZXIgYXQgMjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIDUuIGNvbXBhcmUgbmV3IHJlbWFpbmRlciBhbmQgZGl2aXNvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgNi4gSWYgcmVtYWluZGVyID4gZGl2aXNvcjogcmVtYWluZGVyIC09IGRpdmlzb3IsIG4rK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbiA+IDEgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG4gbWF5IGJlID4gYmFzZSBvbmx5IHdoZW4gYmFzZSBpcyAzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuID49IGJhc2UpIG4gPSBiYXNlIC0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3IgKiB0cmlhbCBkaWdpdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kID0gbXVsdGlwbHkoIHljLCBuLCBiYXNlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZEwgPSBwcm9kLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBwcm9kdWN0IGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgcHJvZHVjdCA+IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmlhbCBkaWdpdCBuIHRvbyBoaWdoLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG4gaXMgMSB0b28gaGlnaCBhYm91dCA1JSBvZiB0aGUgdGltZSwgYW5kIGlzIG5vdCBrbm93biB0byBoYXZlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXZlciBiZWVuIG1vcmUgdGhhbiAxIHRvbyBoaWdoLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICggY29tcGFyZSggcHJvZCwgcmVtLCBwcm9kTCwgcmVtTCApID09IDEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4tLTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSBwcm9kdWN0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJ0cmFjdCggcHJvZCwgeUwgPCBwcm9kTCA/IHl6IDogeWMsIHByb2RMLCBiYXNlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtcCA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbiBpcyAwIG9yIDEsIGNtcCBpcyAtMS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuIGlzIDAsIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29tcGFyZSB5YyBhbmQgcmVtIGFnYWluIGJlbG93LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvIGNoYW5nZSBjbXAgdG8gMSB0byBhdm9pZCBpdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuIGlzIDEsIGxlYXZlIGNtcCBhcyAtMSwgc28geWMgYW5kIHJlbSBhcmUgY29tcGFyZWQgYWdhaW4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBuID09IDAgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaXZpc29yIDwgcmVtYWluZGVyLCBzbyBuIG11c3QgYmUgYXQgbGVhc3QgMS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY21wID0gbiA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwcm9kdWN0ID0gZGl2aXNvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2QgPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBwcm9kTCA8IHJlbUwgKSBwcm9kID0gWzBdLmNvbmNhdChwcm9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBwcm9kdWN0IGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VidHJhY3QoIHJlbSwgcHJvZCwgcmVtTCwgYmFzZSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHByb2R1Y3Qgd2FzIDwgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBjbXAgPT0gLTEgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbXBhcmUgZGl2aXNvciBhbmQgbmV3IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgbmV3IHJlbWFpbmRlciwgc3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmlhbCBkaWdpdCBuIHRvbyBsb3cuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbiBpcyAxIHRvbyBsb3cgYWJvdXQgNSUgb2YgdGhlIHRpbWUsIGFuZCB2ZXJ5IHJhcmVseSAyIHRvbyBsb3cuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCBjb21wYXJlKCB5YywgcmVtLCB5TCwgcmVtTCApIDwgMSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbisrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VidHJhY3QoIHJlbSwgeUwgPCByZW1MID8geXogOiB5YywgcmVtTCwgYmFzZSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIGNtcCA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4rKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbSA9IFswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAvLyBlbHNlIGNtcCA9PT0gMSBhbmQgbiB3aWxsIGJlIDBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbmV4dCBkaWdpdCwgbiwgdG8gdGhlIHJlc3VsdCBhcnJheS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcWNbaSsrXSA9IG47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZW1bMF0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1bcmVtTCsrXSA9IHhjW3hpXSB8fCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtID0gWyB4Y1t4aV0gXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbUwgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSB3aGlsZSAoICggeGkrKyA8IHhMIHx8IHJlbVswXSAhPSBudWxsICkgJiYgcy0tICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1vcmUgPSByZW1bMF0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTGVhZGluZyB6ZXJvP1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXFjWzBdICkgcWMuc3BsaWNlKDAsIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggYmFzZSA9PSBCQVNFICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUbyBjYWxjdWxhdGUgcS5lLCBmaXJzdCBnZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2YgcWNbMF0uXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDEsIHMgPSBxY1swXTsgcyA+PSAxMDsgcyAvPSAxMCwgaSsrICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcm91bmQoIHEsIGRwICsgKCBxLmUgPSBpICsgZSAqIExPR19CQVNFIC0gMSApICsgMSwgcm0sIG1vcmUgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDYWxsZXIgaXMgY29udmVydEJhc2UuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHEuZSA9IGU7XHJcbiAgICAgICAgICAgICAgICAgICAgcS5yID0gK21vcmU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHE7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSkoKTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyIG4gaW4gZml4ZWQtcG9pbnQgb3IgZXhwb25lbnRpYWxcclxuICAgICAgICAgKiBub3RhdGlvbiByb3VuZGVkIHRvIHRoZSBzcGVjaWZpZWQgZGVjaW1hbCBwbGFjZXMgb3Igc2lnbmlmaWNhbnQgZGlnaXRzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogbiBpcyBhIEJpZ051bWJlci5cclxuICAgICAgICAgKiBpIGlzIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBkaWdpdCByZXF1aXJlZCAoaS5lLiB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cCkuXHJcbiAgICAgICAgICogcm0gaXMgdGhlIHJvdW5kaW5nIG1vZGUuXHJcbiAgICAgICAgICogY2FsbGVyIGlzIGNhbGxlciBpZDogdG9FeHBvbmVudGlhbCAxOSwgdG9GaXhlZCAyMCwgdG9Gb3JtYXQgMjEsIHRvUHJlY2lzaW9uIDI0LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGZvcm1hdCggbiwgaSwgcm0sIGNhbGxlciApIHtcclxuICAgICAgICAgICAgdmFyIGMwLCBlLCBuZSwgbGVuLCBzdHI7XHJcblxyXG4gICAgICAgICAgICBybSA9IHJtICE9IG51bGwgJiYgaXNWYWxpZEludCggcm0sIDAsIDgsIGNhbGxlciwgcm91bmRpbmdNb2RlIClcclxuICAgICAgICAgICAgICA/IHJtIHwgMCA6IFJPVU5ESU5HX01PREU7XHJcblxyXG4gICAgICAgICAgICBpZiAoICFuLmMgKSByZXR1cm4gbi50b1N0cmluZygpO1xyXG4gICAgICAgICAgICBjMCA9IG4uY1swXTtcclxuICAgICAgICAgICAgbmUgPSBuLmU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGkgPT0gbnVsbCApIHtcclxuICAgICAgICAgICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcoIG4uYyApO1xyXG4gICAgICAgICAgICAgICAgc3RyID0gY2FsbGVyID09IDE5IHx8IGNhbGxlciA9PSAyNCAmJiBuZSA8PSBUT19FWFBfTkVHXHJcbiAgICAgICAgICAgICAgICAgID8gdG9FeHBvbmVudGlhbCggc3RyLCBuZSApXHJcbiAgICAgICAgICAgICAgICAgIDogdG9GaXhlZFBvaW50KCBzdHIsIG5lICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuID0gcm91bmQoIG5ldyBCaWdOdW1iZXIobiksIGksIHJtICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbi5lIG1heSBoYXZlIGNoYW5nZWQgaWYgdGhlIHZhbHVlIHdhcyByb3VuZGVkIHVwLlxyXG4gICAgICAgICAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgICAgICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKCBuLmMgKTtcclxuICAgICAgICAgICAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdG9QcmVjaXNpb24gcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbiBpZiB0aGUgbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0c1xyXG4gICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBpbnRlZ2VyXHJcbiAgICAgICAgICAgICAgICAvLyBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBmaXhlZC1wb2ludCBub3RhdGlvbi5cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFeHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICAgICAgICAgIGlmICggY2FsbGVyID09IDE5IHx8IGNhbGxlciA9PSAyNCAmJiAoIGkgPD0gZSB8fCBlIDw9IFRPX0VYUF9ORUcgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIDsgbGVuIDwgaTsgc3RyICs9ICcwJywgbGVuKysgKTtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSB0b0V4cG9uZW50aWFsKCBzdHIsIGUgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGaXhlZC1wb2ludCBub3RhdGlvbi5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaSAtPSBuZTtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSB0b0ZpeGVkUG9pbnQoIHN0ciwgZSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgemVyb3M/XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlICsgMSA+IGxlbiApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAtLWkgPiAwICkgZm9yICggc3RyICs9ICcuJzsgaS0tOyBzdHIgKz0gJzAnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaSArPSBlIC0gbGVuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPiAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBlICsgMSA9PSBsZW4gKSBzdHIgKz0gJy4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggOyBpLS07IHN0ciArPSAnMCcgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG4ucyA8IDAgJiYgYzAgPyAnLScgKyBzdHIgOiBzdHI7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIEJpZ051bWJlci5tYXggYW5kIEJpZ051bWJlci5taW4uXHJcbiAgICAgICAgZnVuY3Rpb24gbWF4T3JNaW4oIGFyZ3MsIG1ldGhvZCApIHtcclxuICAgICAgICAgICAgdmFyIG0sIG4sXHJcbiAgICAgICAgICAgICAgICBpID0gMDtcclxuXHJcbiAgICAgICAgICAgIGlmICggaXNBcnJheSggYXJnc1swXSApICkgYXJncyA9IGFyZ3NbMF07XHJcbiAgICAgICAgICAgIG0gPSBuZXcgQmlnTnVtYmVyKCBhcmdzWzBdICk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCA7ICsraSA8IGFyZ3MubGVuZ3RoOyApIHtcclxuICAgICAgICAgICAgICAgIG4gPSBuZXcgQmlnTnVtYmVyKCBhcmdzW2ldICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgYW55IG51bWJlciBpcyBOYU4sIHJldHVybiBOYU4uXHJcbiAgICAgICAgICAgICAgICBpZiAoICFuLnMgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbSA9IG47XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBtZXRob2QuY2FsbCggbSwgbiApICkge1xyXG4gICAgICAgICAgICAgICAgICAgIG0gPSBuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIG4gaXMgYW4gaW50ZWdlciBpbiByYW5nZSwgb3RoZXJ3aXNlIHRocm93LlxyXG4gICAgICAgICAqIFVzZSBmb3IgYXJndW1lbnQgdmFsaWRhdGlvbiB3aGVuIEVSUk9SUyBpcyB0cnVlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGludFZhbGlkYXRvcldpdGhFcnJvcnMoIG4sIG1pbiwgbWF4LCBjYWxsZXIsIG5hbWUgKSB7XHJcbiAgICAgICAgICAgIGlmICggbiA8IG1pbiB8fCBuID4gbWF4IHx8IG4gIT0gdHJ1bmNhdGUobikgKSB7XHJcbiAgICAgICAgICAgICAgICByYWlzZSggY2FsbGVyLCAoIG5hbWUgfHwgJ2RlY2ltYWwgcGxhY2VzJyApICtcclxuICAgICAgICAgICAgICAgICAgKCBuIDwgbWluIHx8IG4gPiBtYXggPyAnIG91dCBvZiByYW5nZScgOiAnIG5vdCBhbiBpbnRlZ2VyJyApLCBuICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogU3RyaXAgdHJhaWxpbmcgemVyb3MsIGNhbGN1bGF0ZSBiYXNlIDEwIGV4cG9uZW50IGFuZCBjaGVjayBhZ2FpbnN0IE1JTl9FWFAgYW5kIE1BWF9FWFAuXHJcbiAgICAgICAgICogQ2FsbGVkIGJ5IG1pbnVzLCBwbHVzIGFuZCB0aW1lcy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBub3JtYWxpc2UoIG4sIGMsIGUgKSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gMSxcclxuICAgICAgICAgICAgICAgIGogPSBjLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoIDsgIWNbLS1qXTsgYy5wb3AoKSApO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBiYXNlIDEwIGV4cG9uZW50LiBGaXJzdCBnZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2YgY1swXS5cclxuICAgICAgICAgICAgZm9yICggaiA9IGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyApO1xyXG5cclxuICAgICAgICAgICAgLy8gT3ZlcmZsb3c/XHJcbiAgICAgICAgICAgIGlmICggKCBlID0gaSArIGUgKiBMT0dfQkFTRSAtIDEgKSA+IE1BWF9FWFAgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSW5maW5pdHkuXHJcbiAgICAgICAgICAgICAgICBuLmMgPSBuLmUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gVW5kZXJmbG93P1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBlIDwgTUlOX0VYUCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgICAgICAgbi5jID0gWyBuLmUgPSAwIF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuLmUgPSBlO1xyXG4gICAgICAgICAgICAgICAgbi5jID0gYztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLy8gSGFuZGxlIHZhbHVlcyB0aGF0IGZhaWwgdGhlIHZhbGlkaXR5IHRlc3QgaW4gQmlnTnVtYmVyLlxyXG4gICAgICAgIHBhcnNlTnVtZXJpYyA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaSxcclxuICAgICAgICAgICAgICAgIGRvdEFmdGVyID0gL14oW14uXSspXFwuJC8sXHJcbiAgICAgICAgICAgICAgICBkb3RCZWZvcmUgPSAvXlxcLihbXi5dKykkLyxcclxuICAgICAgICAgICAgICAgIGlzSW5maW5pdHlPck5hTiA9IC9eLT8oSW5maW5pdHl8TmFOKSQvLFxyXG4gICAgICAgICAgICAgICAgd2hpdGVzcGFjZU9yUGx1cyA9IC9eXFxzKlxcKyg/PVtcXHcuXSl8Xlxccyt8XFxzKyQvZztcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoIHgsIHN0ciwgbnVtLCBiICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJhc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgcyA9IG51bSA/IHN0ciA6IHN0ci5yZXBsYWNlKCB3aGl0ZXNwYWNlT3JQbHVzLCAnJyApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5vIGV4Y2VwdGlvbiBvbiDCsUluZmluaXR5IG9yIE5hTi5cclxuICAgICAgICAgICAgICAgIGlmICggaXNJbmZpbml0eU9yTmFOLnRlc3QocykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zID0gaXNOYU4ocykgPyBudWxsIDogcyA8IDAgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIW51bSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJhc2VQcmVmaXggPSAvXigtPykwKFt4Ym9dKSg/PVxcd1tcXHcuXSokKS9pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoIGJhc2VQcmVmaXgsIGZ1bmN0aW9uICggbSwgcDEsIHAyICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzZSA9ICggcDIgPSBwMi50b0xvd2VyQ2FzZSgpICkgPT0gJ3gnID8gMTYgOiBwMiA9PSAnYicgPyAyIDogODtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhYiB8fCBiID09IGJhc2UgPyBwMSA6IG07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2UgPSBiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEUuZy4gJzEuJyB0byAnMScsICcuMScgdG8gJzAuMSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoIGRvdEFmdGVyLCAnJDEnICkucmVwbGFjZSggZG90QmVmb3JlLCAnMC4kMScgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzdHIgIT0gcyApIHJldHVybiBuZXcgQmlnTnVtYmVyKCBzLCBiYXNlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyAnbmV3IEJpZ051bWJlcigpIG5vdCBhIG51bWJlcjoge259J1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICduZXcgQmlnTnVtYmVyKCkgbm90IGEgYmFzZSB7Yn0gbnVtYmVyOiB7bn0nXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEVSUk9SUykgcmFpc2UoIGlkLCAnbm90IGEnICsgKCBiID8gJyBiYXNlICcgKyBiIDogJycgKSArICcgbnVtYmVyJywgc3RyICk7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWQgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkoKTtcclxuXHJcblxyXG4gICAgICAgIC8vIFRocm93IGEgQmlnTnVtYmVyIEVycm9yLlxyXG4gICAgICAgIGZ1bmN0aW9uIHJhaXNlKCBjYWxsZXIsIG1zZywgdmFsICkge1xyXG4gICAgICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoIFtcclxuICAgICAgICAgICAgICAgICduZXcgQmlnTnVtYmVyJywgICAgIC8vIDBcclxuICAgICAgICAgICAgICAgICdjbXAnLCAgICAgICAgICAgICAgIC8vIDFcclxuICAgICAgICAgICAgICAgICdjb25maWcnLCAgICAgICAgICAgIC8vIDJcclxuICAgICAgICAgICAgICAgICdkaXYnLCAgICAgICAgICAgICAgIC8vIDNcclxuICAgICAgICAgICAgICAgICdkaXZUb0ludCcsICAgICAgICAgIC8vIDRcclxuICAgICAgICAgICAgICAgICdlcScsICAgICAgICAgICAgICAgIC8vIDVcclxuICAgICAgICAgICAgICAgICdndCcsICAgICAgICAgICAgICAgIC8vIDZcclxuICAgICAgICAgICAgICAgICdndGUnLCAgICAgICAgICAgICAgIC8vIDdcclxuICAgICAgICAgICAgICAgICdsdCcsICAgICAgICAgICAgICAgIC8vIDhcclxuICAgICAgICAgICAgICAgICdsdGUnLCAgICAgICAgICAgICAgIC8vIDlcclxuICAgICAgICAgICAgICAgICdtaW51cycsICAgICAgICAgICAgIC8vIDEwXHJcbiAgICAgICAgICAgICAgICAnbW9kJywgICAgICAgICAgICAgICAvLyAxMVxyXG4gICAgICAgICAgICAgICAgJ3BsdXMnLCAgICAgICAgICAgICAgLy8gMTJcclxuICAgICAgICAgICAgICAgICdwcmVjaXNpb24nLCAgICAgICAgIC8vIDEzXHJcbiAgICAgICAgICAgICAgICAncmFuZG9tJywgICAgICAgICAgICAvLyAxNFxyXG4gICAgICAgICAgICAgICAgJ3JvdW5kJywgICAgICAgICAgICAgLy8gMTVcclxuICAgICAgICAgICAgICAgICdzaGlmdCcsICAgICAgICAgICAgIC8vIDE2XHJcbiAgICAgICAgICAgICAgICAndGltZXMnLCAgICAgICAgICAgICAvLyAxN1xyXG4gICAgICAgICAgICAgICAgJ3RvRGlnaXRzJywgICAgICAgICAgLy8gMThcclxuICAgICAgICAgICAgICAgICd0b0V4cG9uZW50aWFsJywgICAgIC8vIDE5XHJcbiAgICAgICAgICAgICAgICAndG9GaXhlZCcsICAgICAgICAgICAvLyAyMFxyXG4gICAgICAgICAgICAgICAgJ3RvRm9ybWF0JywgICAgICAgICAgLy8gMjFcclxuICAgICAgICAgICAgICAgICd0b0ZyYWN0aW9uJywgICAgICAgIC8vIDIyXHJcbiAgICAgICAgICAgICAgICAncG93JywgICAgICAgICAgICAgICAvLyAyM1xyXG4gICAgICAgICAgICAgICAgJ3RvUHJlY2lzaW9uJywgICAgICAgLy8gMjRcclxuICAgICAgICAgICAgICAgICd0b1N0cmluZycsICAgICAgICAgIC8vIDI1XHJcbiAgICAgICAgICAgICAgICAnQmlnTnVtYmVyJyAgICAgICAgICAvLyAyNlxyXG4gICAgICAgICAgICBdW2NhbGxlcl0gKyAnKCkgJyArIG1zZyArICc6ICcgKyB2YWwgKTtcclxuXHJcbiAgICAgICAgICAgIGVycm9yLm5hbWUgPSAnQmlnTnVtYmVyIEVycm9yJztcclxuICAgICAgICAgICAgaWQgPSAwO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJvdW5kIHggdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0uIENoZWNrIGZvciBvdmVyL3VuZGVyLWZsb3cuXHJcbiAgICAgICAgICogSWYgciBpcyB0cnV0aHksIGl0IGlzIGtub3duIHRoYXQgdGhlcmUgYXJlIG1vcmUgZGlnaXRzIGFmdGVyIHRoZSByb3VuZGluZyBkaWdpdC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiByb3VuZCggeCwgc2QsIHJtLCByICkge1xyXG4gICAgICAgICAgICB2YXIgZCwgaSwgaiwgaywgbiwgbmksIHJkLFxyXG4gICAgICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgICAgICBwb3dzMTAgPSBQT1dTX1RFTjtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIHggaXMgbm90IEluZmluaXR5IG9yIE5hTi4uLlxyXG4gICAgICAgICAgICBpZiAoeGMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZCBpcyB0aGUgcm91bmRpbmcgZGlnaXQsIGkuZS4gdGhlIGRpZ2l0IGFmdGVyIHRoZSBkaWdpdCB0aGF0IG1heSBiZSByb3VuZGVkIHVwLlxyXG4gICAgICAgICAgICAgICAgLy8gbiBpcyBhIGJhc2UgMWUxNCBudW1iZXIsIHRoZSB2YWx1ZSBvZiB0aGUgZWxlbWVudCBvZiBhcnJheSB4LmMgY29udGFpbmluZyByZC5cclxuICAgICAgICAgICAgICAgIC8vIG5pIGlzIHRoZSBpbmRleCBvZiBuIHdpdGhpbiB4LmMuXHJcbiAgICAgICAgICAgICAgICAvLyBkIGlzIHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIG4uXHJcbiAgICAgICAgICAgICAgICAvLyBpIGlzIHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiBpbmNsdWRpbmcgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgICAgIC8vIGogaXMgdGhlIGFjdHVhbCBpbmRleCBvZiByZCB3aXRoaW4gbiAoaWYgPCAwLCByZCBpcyBhIGxlYWRpbmcgemVybykuXHJcbiAgICAgICAgICAgICAgICBvdXQ6IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGQgPSAxLCBrID0geGNbMF07IGsgPj0gMTA7IGsgLz0gMTAsIGQrKyApO1xyXG4gICAgICAgICAgICAgICAgICAgIGkgPSBzZCAtIGQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSByb3VuZGluZyBkaWdpdCBpcyBpbiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy4uLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaSA8IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgKz0gTE9HX0JBU0U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGogPSBzZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbiA9IHhjWyBuaSA9IDAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgcm91bmRpbmcgZGlnaXQgYXQgaW5kZXggaiBvZiBuLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZCA9IG4gLyBwb3dzMTBbIGQgLSBqIC0gMSBdICUgMTAgfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pID0gbWF0aGNlaWwoICggaSArIDEgKSAvIExPR19CQVNFICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG5pID49IHhjLmxlbmd0aCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOZWVkZWQgYnkgc3FydC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IHhjLmxlbmd0aCA8PSBuaTsgeGMucHVzaCgwKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4gPSByZCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZCA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSAlPSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqID0gaSAtIExPR19CQVNFICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWsgb3V0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbiA9IGsgPSB4Y1tuaV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIG4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBkID0gMTsgayA+PSAxMDsgayAvPSAxMCwgZCsrICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgJT0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiwgYWRqdXN0ZWQgZm9yIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbnVtYmVyIG9mIGxlYWRpbmcgemVyb3Mgb2YgbiBpcyBnaXZlbiBieSBMT0dfQkFTRSAtIGQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqID0gaSAtIExPR19CQVNFICsgZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHJvdW5kaW5nIGRpZ2l0IGF0IGluZGV4IGogb2Ygbi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJkID0gaiA8IDAgPyAwIDogbiAvIHBvd3MxMFsgZCAtIGogLSAxIF0gJSAxMCB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHIgPSByIHx8IHNkIDwgMCB8fFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBBcmUgdGhlcmUgYW55IG5vbi16ZXJvIGRpZ2l0cyBhZnRlciB0aGUgcm91bmRpbmcgZGlnaXQ/XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGV4cHJlc3Npb24gIG4gJSBwb3dzMTBbIGQgLSBqIC0gMSBdICByZXR1cm5zIGFsbCBkaWdpdHMgb2YgbiB0byB0aGUgcmlnaHRcclxuICAgICAgICAgICAgICAgICAgICAvLyBvZiB0aGUgZGlnaXQgYXQgaiwgZS5nLiBpZiBuIGlzIDkwODcxNCBhbmQgaiBpcyAyLCB0aGUgZXhwcmVzc2lvbiBnaXZlcyA3MTQuXHJcbiAgICAgICAgICAgICAgICAgICAgICB4Y1tuaSArIDFdICE9IG51bGwgfHwgKCBqIDwgMCA/IG4gOiBuICUgcG93czEwWyBkIC0gaiAtIDEgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByID0gcm0gPCA0XHJcbiAgICAgICAgICAgICAgICAgICAgICA/ICggcmQgfHwgciApICYmICggcm0gPT0gMCB8fCBybSA9PSAoIHgucyA8IDAgPyAzIDogMiApIClcclxuICAgICAgICAgICAgICAgICAgICAgIDogcmQgPiA1IHx8IHJkID09IDUgJiYgKCBybSA9PSA0IHx8IHIgfHwgcm0gPT0gNiAmJlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgZGlnaXQgdG8gdGhlIGxlZnQgb2YgdGhlIHJvdW5kaW5nIGRpZ2l0IGlzIG9kZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgKCAoIGkgPiAwID8gaiA+IDAgPyBuIC8gcG93czEwWyBkIC0gaiBdIDogMCA6IHhjW25pIC0gMV0gKSAlIDEwICkgJiAxIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcm0gPT0gKCB4LnMgPCAwID8gOCA6IDcgKSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNkIDwgMSB8fCAheGNbMF0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhjLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgc2QgdG8gZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZCAtPSB4LmUgKyAxO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4Y1swXSA9IHBvd3MxMFsgKCBMT0dfQkFTRSAtIHNkICUgTE9HX0JBU0UgKSAlIExPR19CQVNFIF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4LmUgPSAtc2QgfHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGNbMF0gPSB4LmUgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBleGNlc3MgZGlnaXRzLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaSA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4Yy5sZW5ndGggPSBuaTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgayA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pLS07XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeGMubGVuZ3RoID0gbmkgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrID0gcG93czEwWyBMT0dfQkFTRSAtIGkgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEUuZy4gNTY3MDAgYmVjb21lcyA1NjAwMCBpZiA3IGlzIHRoZSByb3VuZGluZyBkaWdpdC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaiA+IDAgbWVhbnMgaSA+IG51bWJlciBvZiBsZWFkaW5nIHplcm9zIG9mIG4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhjW25pXSA9IGogPiAwID8gbWF0aGZsb29yKCBuIC8gcG93czEwWyBkIC0gaiBdICUgcG93czEwW2pdICkgKiBrIDogMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJvdW5kIHVwP1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCA7IDsgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGRpZ2l0IHRvIGJlIHJvdW5kZWQgdXAgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbmkgPT0gMCApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaSB3aWxsIGJlIHRoZSBsZW5ndGggb2YgeGNbMF0gYmVmb3JlIGsgaXMgYWRkZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDEsIGogPSB4Y1swXTsgaiA+PSAxMDsgaiAvPSAxMCwgaSsrICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaiA9IHhjWzBdICs9IGs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggayA9IDE7IGogPj0gMTA7IGogLz0gMTAsIGsrKyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiBpICE9IGsgdGhlIGxlbmd0aCBoYXMgaW5jcmVhc2VkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggaSAhPSBrICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4LmUrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB4Y1swXSA9PSBCQVNFICkgeGNbMF0gPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhjW25pXSArPSBrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggeGNbbmldICE9IEJBU0UgKSBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4Y1tuaS0tXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgayA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0geGMubGVuZ3RoOyB4Y1stLWldID09PSAwOyB4Yy5wb3AoKSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIE92ZXJmbG93PyBJbmZpbml0eS5cclxuICAgICAgICAgICAgICAgIGlmICggeC5lID4gTUFYX0VYUCApIHtcclxuICAgICAgICAgICAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFVuZGVyZmxvdz8gWmVyby5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHguZSA8IE1JTl9FWFAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeC5jID0gWyB4LmUgPSAwIF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB4O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIFBST1RPVFlQRS9JTlNUQU5DRSBNRVRIT0RTXHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIGFic29sdXRlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuYWJzb2x1dGVWYWx1ZSA9IFAuYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgICAgICAgIGlmICggeC5zIDwgMCApIHgucyA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiB4O1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSB3aG9sZVxyXG4gICAgICAgICAqIG51bWJlciBpbiB0aGUgZGlyZWN0aW9uIG9mIEluZmluaXR5LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuY2VpbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJvdW5kKCBuZXcgQmlnTnVtYmVyKHRoaXMpLCB0aGlzLmUgKyAxLCAyICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuXHJcbiAgICAgICAgICogMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgICAgICogLTEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICAgICAqIDAgaWYgdGhleSBoYXZlIHRoZSBzYW1lIHZhbHVlLFxyXG4gICAgICAgICAqIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIGVpdGhlciBpcyBOYU4uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5jb21wYXJlZFRvID0gUC5jbXAgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIGlkID0gMTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmUoIHRoaXMsIG5ldyBCaWdOdW1iZXIoIHksIGIgKSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0aGUgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIG9mIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciwgb3IgbnVsbCBpZiB0aGUgdmFsdWVcclxuICAgICAgICAgKiBvZiB0aGlzIEJpZ051bWJlciBpcyDCsUluZmluaXR5IG9yIE5hTi5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmRlY2ltYWxQbGFjZXMgPSBQLmRwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbiwgdixcclxuICAgICAgICAgICAgICAgIGMgPSB0aGlzLmM7XHJcblxyXG4gICAgICAgICAgICBpZiAoICFjICkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIG4gPSAoICggdiA9IGMubGVuZ3RoIC0gMSApIC0gYml0Rmxvb3IoIHRoaXMuZSAvIExPR19CQVNFICkgKSAqIExPR19CQVNFO1xyXG5cclxuICAgICAgICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvcyBvZiB0aGUgbGFzdCBudW1iZXIuXHJcbiAgICAgICAgICAgIGlmICggdiA9IGNbdl0gKSBmb3IgKCA7IHYgJSAxMCA9PSAwOyB2IC89IDEwLCBuLS0gKTtcclxuICAgICAgICAgICAgaWYgKCBuIDwgMCApIG4gPSAwO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG47XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogIG4gLyAwID0gSVxyXG4gICAgICAgICAqICBuIC8gTiA9IE5cclxuICAgICAgICAgKiAgbiAvIEkgPSAwXHJcbiAgICAgICAgICogIDAgLyBuID0gMFxyXG4gICAgICAgICAqICAwIC8gMCA9IE5cclxuICAgICAgICAgKiAgMCAvIE4gPSBOXHJcbiAgICAgICAgICogIDAgLyBJID0gMFxyXG4gICAgICAgICAqICBOIC8gbiA9IE5cclxuICAgICAgICAgKiAgTiAvIDAgPSBOXHJcbiAgICAgICAgICogIE4gLyBOID0gTlxyXG4gICAgICAgICAqICBOIC8gSSA9IE5cclxuICAgICAgICAgKiAgSSAvIG4gPSBJXHJcbiAgICAgICAgICogIEkgLyAwID0gSVxyXG4gICAgICAgICAqICBJIC8gTiA9IE5cclxuICAgICAgICAgKiAgSSAvIEkgPSBOXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBkaXZpZGVkIGJ5IHRoZSB2YWx1ZSBvZlxyXG4gICAgICAgICAqIEJpZ051bWJlcih5LCBiKSwgcm91bmRlZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5kaXZpZGVkQnkgPSBQLmRpdiA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgaWQgPSAzO1xyXG4gICAgICAgICAgICByZXR1cm4gZGl2KCB0aGlzLCBuZXcgQmlnTnVtYmVyKCB5LCBiICksIERFQ0lNQUxfUExBQ0VTLCBST1VORElOR19NT0RFICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgaW50ZWdlciBwYXJ0IG9mIGRpdmlkaW5nIHRoZSB2YWx1ZSBvZiB0aGlzXHJcbiAgICAgICAgICogQmlnTnVtYmVyIGJ5IHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5kaXZpZGVkVG9JbnRlZ2VyQnkgPSBQLmRpdlRvSW50ID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICBpZCA9IDQ7XHJcbiAgICAgICAgICAgIHJldHVybiBkaXYoIHRoaXMsIG5ldyBCaWdOdW1iZXIoIHksIGIgKSwgMCwgMSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBlcXVhbCB0byB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICAgICAqIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuZXF1YWxzID0gUC5lcSA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgaWQgPSA1O1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcGFyZSggdGhpcywgbmV3IEJpZ051bWJlciggeSwgYiApICkgPT09IDA7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgcm91bmRlZCB0byBhIHdob2xlXHJcbiAgICAgICAgICogbnVtYmVyIGluIHRoZSBkaXJlY3Rpb24gb2YgLUluZmluaXR5LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuZmxvb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByb3VuZCggbmV3IEJpZ051bWJlcih0aGlzKSwgdGhpcy5lICsgMSwgMyApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAgICAgKiBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmdyZWF0ZXJUaGFuID0gUC5ndCA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgaWQgPSA2O1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcGFyZSggdGhpcywgbmV3IEJpZ051bWJlciggeSwgYiApICkgPiAwO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mXHJcbiAgICAgICAgICogQmlnTnVtYmVyKHksIGIpLCBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmdyZWF0ZXJUaGFuT3JFcXVhbFRvID0gUC5ndGUgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIGlkID0gNztcclxuICAgICAgICAgICAgcmV0dXJuICggYiA9IGNvbXBhcmUoIHRoaXMsIG5ldyBCaWdOdW1iZXIoIHksIGIgKSApICkgPT09IDEgfHwgYiA9PT0gMDtcclxuXHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGEgZmluaXRlIG51bWJlciwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5pc0Zpbml0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICEhdGhpcy5jO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhbiBpbnRlZ2VyLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuaXNJbnRlZ2VyID0gUC5pc0ludCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICEhdGhpcy5jICYmIGJpdEZsb29yKCB0aGlzLmUgLyBMT0dfQkFTRSApID4gdGhpcy5jLmxlbmd0aCAtIDI7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIE5hTiwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5pc05hTiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICF0aGlzLnM7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIG5lZ2F0aXZlLCBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLmlzTmVnYXRpdmUgPSBQLmlzTmVnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zIDwgMDtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgMCBvciAtMCwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5pc1plcm8gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhIXRoaXMuYyAmJiB0aGlzLmNbMF0gPT0gMDtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbGVzcyB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgICAgICogb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5sZXNzVGhhbiA9IFAubHQgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIGlkID0gODtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmUoIHRoaXMsIG5ldyBCaWdOdW1iZXIoIHksIGIgKSApIDwgMDtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICAgICAqIEJpZ051bWJlcih5LCBiKSwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5sZXNzVGhhbk9yRXF1YWxUbyA9IFAubHRlID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICBpZCA9IDk7XHJcbiAgICAgICAgICAgIHJldHVybiAoIGIgPSBjb21wYXJlKCB0aGlzLCBuZXcgQmlnTnVtYmVyKCB5LCBiICkgKSApID09PSAtMSB8fCBiID09PSAwO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqICBuIC0gMCA9IG5cclxuICAgICAgICAgKiAgbiAtIE4gPSBOXHJcbiAgICAgICAgICogIG4gLSBJID0gLUlcclxuICAgICAgICAgKiAgMCAtIG4gPSAtblxyXG4gICAgICAgICAqICAwIC0gMCA9IDBcclxuICAgICAgICAgKiAgMCAtIE4gPSBOXHJcbiAgICAgICAgICogIDAgLSBJID0gLUlcclxuICAgICAgICAgKiAgTiAtIG4gPSBOXHJcbiAgICAgICAgICogIE4gLSAwID0gTlxyXG4gICAgICAgICAqICBOIC0gTiA9IE5cclxuICAgICAgICAgKiAgTiAtIEkgPSBOXHJcbiAgICAgICAgICogIEkgLSBuID0gSVxyXG4gICAgICAgICAqICBJIC0gMCA9IElcclxuICAgICAgICAgKiAgSSAtIE4gPSBOXHJcbiAgICAgICAgICogIEkgLSBJID0gTlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbWludXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAubWludXMgPSBQLnN1YiA9IGZ1bmN0aW9uICggeSwgYiApIHtcclxuICAgICAgICAgICAgdmFyIGksIGosIHQsIHhMVHksXHJcbiAgICAgICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICAgICAgICBpZCA9IDEwO1xyXG4gICAgICAgICAgICB5ID0gbmV3IEJpZ051bWJlciggeSwgYiApO1xyXG4gICAgICAgICAgICBiID0geS5zO1xyXG5cclxuICAgICAgICAgICAgLy8gRWl0aGVyIE5hTj9cclxuICAgICAgICAgICAgaWYgKCAhYSB8fCAhYiApIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAgICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICAgICAgIGlmICggYSAhPSBiICkge1xyXG4gICAgICAgICAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geC5wbHVzKHkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgeGUgPSB4LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICAgICAgICAgIHllID0geS5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgICAgIHljID0geS5jO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAheGUgfHwgIXllICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEVpdGhlciBJbmZpbml0eT9cclxuICAgICAgICAgICAgICAgIGlmICggIXhjIHx8ICF5YyApIHJldHVybiB4YyA/ICggeS5zID0gLWIsIHkgKSA6IG5ldyBCaWdOdW1iZXIoIHljID8geCA6IE5hTiApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgICAgICAgICAgaWYgKCAheGNbMF0gfHwgIXljWzBdICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4geSBpZiB5IGlzIG5vbi16ZXJvLCB4IGlmIHggaXMgbm9uLXplcm8sIG9yIHplcm8gaWYgYm90aCBhcmUgemVyby5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geWNbMF0gPyAoIHkucyA9IC1iLCB5ICkgOiBuZXcgQmlnTnVtYmVyKCB4Y1swXSA/IHggOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgIC8vIElFRUUgNzU0ICgyMDA4KSA2LjM6IG4gLSBuID0gLTAgd2hlbiByb3VuZGluZyB0byAtSW5maW5pdHlcclxuICAgICAgICAgICAgICAgICAgICAgIFJPVU5ESU5HX01PREUgPT0gMyA/IC0wIDogMCApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB4ZSA9IGJpdEZsb29yKHhlKTtcclxuICAgICAgICAgICAgeWUgPSBiaXRGbG9vcih5ZSk7XHJcbiAgICAgICAgICAgIHhjID0geGMuc2xpY2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSB3aGljaCBpcyB0aGUgYmlnZ2VyIG51bWJlci5cclxuICAgICAgICAgICAgaWYgKCBhID0geGUgLSB5ZSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHhMVHkgPSBhIDwgMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICAgICAgdCA9IHhjO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgICAgICAgICAgIHQgPSB5YztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVwZW5kIHplcm9zIHRvIGVxdWFsaXNlIGV4cG9uZW50cy5cclxuICAgICAgICAgICAgICAgIGZvciAoIGIgPSBhOyBiLS07IHQucHVzaCgwKSApO1xyXG4gICAgICAgICAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRXhwb25lbnRzIGVxdWFsLiBDaGVjayBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICAgICAgICAgIGogPSAoIHhMVHkgPSAoIGEgPSB4Yy5sZW5ndGggKSA8ICggYiA9IHljLmxlbmd0aCApICkgPyBhIDogYjtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCBhID0gYiA9IDA7IGIgPCBqOyBiKysgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggeGNbYl0gIT0geWNbYl0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhMVHkgPSB4Y1tiXSA8IHljW2JdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHggPCB5PyBQb2ludCB4YyB0byB0aGUgYXJyYXkgb2YgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgICAgICAgIGlmICh4TFR5KSB0ID0geGMsIHhjID0geWMsIHljID0gdCwgeS5zID0gLXkucztcclxuXHJcbiAgICAgICAgICAgIGIgPSAoIGogPSB5Yy5sZW5ndGggKSAtICggaSA9IHhjLmxlbmd0aCApO1xyXG5cclxuICAgICAgICAgICAgLy8gQXBwZW5kIHplcm9zIHRvIHhjIGlmIHNob3J0ZXIuXHJcbiAgICAgICAgICAgIC8vIE5vIG5lZWQgdG8gYWRkIHplcm9zIHRvIHljIGlmIHNob3J0ZXIgYXMgc3VidHJhY3Qgb25seSBuZWVkcyB0byBzdGFydCBhdCB5Yy5sZW5ndGguXHJcbiAgICAgICAgICAgIGlmICggYiA+IDAgKSBmb3IgKCA7IGItLTsgeGNbaSsrXSA9IDAgKTtcclxuICAgICAgICAgICAgYiA9IEJBU0UgLSAxO1xyXG5cclxuICAgICAgICAgICAgLy8gU3VidHJhY3QgeWMgZnJvbSB4Yy5cclxuICAgICAgICAgICAgZm9yICggOyBqID4gYTsgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB4Y1stLWpdIDwgeWNbal0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IGo7IGkgJiYgIXhjWy0taV07IHhjW2ldID0gYiApO1xyXG4gICAgICAgICAgICAgICAgICAgIC0teGNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgeGNbal0gKz0gQkFTRTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB4Y1tqXSAtPSB5Y1tqXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgemVyb3MgYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgICAgICAgZm9yICggOyB4Y1swXSA9PSAwOyB4Yy5zcGxpY2UoMCwgMSksIC0teWUgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFplcm8/XHJcbiAgICAgICAgICAgIGlmICggIXhjWzBdICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZvbGxvd2luZyBJRUVFIDc1NCAoMjAwOCkgNi4zLFxyXG4gICAgICAgICAgICAgICAgLy8gbiAtIG4gPSArMCAgYnV0ICBuIC0gbiA9IC0wICB3aGVuIHJvdW5kaW5nIHRvd2FyZHMgLUluZmluaXR5LlxyXG4gICAgICAgICAgICAgICAgeS5zID0gUk9VTkRJTkdfTU9ERSA9PSAzID8gLTEgOiAxO1xyXG4gICAgICAgICAgICAgICAgeS5jID0gWyB5LmUgPSAwIF07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgSW5maW5pdHkgYXMgK3ggLSAreSAhPSBJbmZpbml0eSAmJiAteCAtIC15ICE9IEluZmluaXR5XHJcbiAgICAgICAgICAgIC8vIGZvciBmaW5pdGUgeCBhbmQgeS5cclxuICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGlzZSggeSwgeGMsIHllICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogICBuICUgMCA9ICBOXHJcbiAgICAgICAgICogICBuICUgTiA9ICBOXHJcbiAgICAgICAgICogICBuICUgSSA9ICBuXHJcbiAgICAgICAgICogICAwICUgbiA9ICAwXHJcbiAgICAgICAgICogIC0wICUgbiA9IC0wXHJcbiAgICAgICAgICogICAwICUgMCA9ICBOXHJcbiAgICAgICAgICogICAwICUgTiA9ICBOXHJcbiAgICAgICAgICogICAwICUgSSA9ICAwXHJcbiAgICAgICAgICogICBOICUgbiA9ICBOXHJcbiAgICAgICAgICogICBOICUgMCA9ICBOXHJcbiAgICAgICAgICogICBOICUgTiA9ICBOXHJcbiAgICAgICAgICogICBOICUgSSA9ICBOXHJcbiAgICAgICAgICogICBJICUgbiA9ICBOXHJcbiAgICAgICAgICogICBJICUgMCA9ICBOXHJcbiAgICAgICAgICogICBJICUgTiA9ICBOXHJcbiAgICAgICAgICogICBJICUgSSA9ICBOXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBtb2R1bG8gdGhlIHZhbHVlIG9mXHJcbiAgICAgICAgICogQmlnTnVtYmVyKHksIGIpLiBUaGUgcmVzdWx0IGRlcGVuZHMgb24gdGhlIHZhbHVlIG9mIE1PRFVMT19NT0RFLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAubW9kdWxvID0gUC5tb2QgPSBmdW5jdGlvbiAoIHksIGIgKSB7XHJcbiAgICAgICAgICAgIHZhciBxLCBzLFxyXG4gICAgICAgICAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZCA9IDExO1xyXG4gICAgICAgICAgICB5ID0gbmV3IEJpZ051bWJlciggeSwgYiApO1xyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiB4IGlzIEluZmluaXR5IG9yIE5hTiwgb3IgeSBpcyBOYU4gb3IgemVyby5cclxuICAgICAgICAgICAgaWYgKCAheC5jIHx8ICF5LnMgfHwgeS5jICYmICF5LmNbMF0gKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIHggaWYgeSBpcyBJbmZpbml0eSBvciB4IGlzIHplcm8uXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoICF5LmMgfHwgeC5jICYmICF4LmNbMF0gKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcih4KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBNT0RVTE9fTU9ERSA9PSA5ICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEV1Y2xpZGlhbiBkaXZpc2lvbjogcSA9IHNpZ24oeSkgKiBmbG9vcih4IC8gYWJzKHkpKVxyXG4gICAgICAgICAgICAgICAgLy8gciA9IHggLSBxeSAgICB3aGVyZSAgMCA8PSByIDwgYWJzKHkpXHJcbiAgICAgICAgICAgICAgICBzID0geS5zO1xyXG4gICAgICAgICAgICAgICAgeS5zID0gMTtcclxuICAgICAgICAgICAgICAgIHEgPSBkaXYoIHgsIHksIDAsIDMgKTtcclxuICAgICAgICAgICAgICAgIHkucyA9IHM7XHJcbiAgICAgICAgICAgICAgICBxLnMgKj0gcztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHEgPSBkaXYoIHgsIHksIDAsIE1PRFVMT19NT0RFICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB4Lm1pbnVzKCBxLnRpbWVzKHkpICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbmVnYXRlZCxcclxuICAgICAgICAgKiBpLmUuIG11bHRpcGxpZWQgYnkgLTEuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC5uZWdhdGVkID0gUC5uZWcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgICAgICAgeC5zID0gLXgucyB8fCBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiAgbiArIDAgPSBuXHJcbiAgICAgICAgICogIG4gKyBOID0gTlxyXG4gICAgICAgICAqICBuICsgSSA9IElcclxuICAgICAgICAgKiAgMCArIG4gPSBuXHJcbiAgICAgICAgICogIDAgKyAwID0gMFxyXG4gICAgICAgICAqICAwICsgTiA9IE5cclxuICAgICAgICAgKiAgMCArIEkgPSBJXHJcbiAgICAgICAgICogIE4gKyBuID0gTlxyXG4gICAgICAgICAqICBOICsgMCA9IE5cclxuICAgICAgICAgKiAgTiArIE4gPSBOXHJcbiAgICAgICAgICogIE4gKyBJID0gTlxyXG4gICAgICAgICAqICBJICsgbiA9IElcclxuICAgICAgICAgKiAgSSArIDAgPSBJXHJcbiAgICAgICAgICogIEkgKyBOID0gTlxyXG4gICAgICAgICAqICBJICsgSSA9IElcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHBsdXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAucGx1cyA9IFAuYWRkID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICB2YXIgdCxcclxuICAgICAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgYSA9IHgucztcclxuXHJcbiAgICAgICAgICAgIGlkID0gMTI7XHJcbiAgICAgICAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKCB5LCBiICk7XHJcbiAgICAgICAgICAgIGIgPSB5LnM7XHJcblxyXG4gICAgICAgICAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgICAgICAgICBpZiAoICFhIHx8ICFiICkgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgICAgICAgIGlmICggYSAhPSBiICkge1xyXG4gICAgICAgICAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geC5taW51cyh5KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgICAgICAgICB5ZSA9IHkuZSAvIExPR19CQVNFLFxyXG4gICAgICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgICAgICAgIGlmICggIXhlIHx8ICF5ZSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgwrFJbmZpbml0eS5cclxuICAgICAgICAgICAgICAgIGlmICggIXhjIHx8ICF5YyApIHJldHVybiBuZXcgQmlnTnVtYmVyKCBhIC8gMCApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIHkgaWYgeSBpcyBub24temVybywgeCBpZiB4IGlzIG5vbi16ZXJvLCBvciB6ZXJvIGlmIGJvdGggYXJlIHplcm8uXHJcbiAgICAgICAgICAgICAgICBpZiAoICF4Y1swXSB8fCAheWNbMF0gKSByZXR1cm4geWNbMF0gPyB5IDogbmV3IEJpZ051bWJlciggeGNbMF0gPyB4IDogYSAqIDAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgeGUgPSBiaXRGbG9vcih4ZSk7XHJcbiAgICAgICAgICAgIHllID0gYml0Rmxvb3IoeWUpO1xyXG4gICAgICAgICAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVwZW5kIHplcm9zIHRvIGVxdWFsaXNlIGV4cG9uZW50cy4gRmFzdGVyIHRvIHVzZSByZXZlcnNlIHRoZW4gZG8gdW5zaGlmdHMuXHJcbiAgICAgICAgICAgIGlmICggYSA9IHhlIC0geWUgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGEgPiAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICAgICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICAgICAgICAgICAgdCA9IHhjO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICAgICAgZm9yICggOyBhLS07IHQucHVzaCgwKSApO1xyXG4gICAgICAgICAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGEgPSB4Yy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGIgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAvLyBQb2ludCB4YyB0byB0aGUgbG9uZ2VyIGFycmF5LCBhbmQgYiB0byB0aGUgc2hvcnRlciBsZW5ndGguXHJcbiAgICAgICAgICAgIGlmICggYSAtIGIgPCAwICkgdCA9IHljLCB5YyA9IHhjLCB4YyA9IHQsIGIgPSBhO1xyXG5cclxuICAgICAgICAgICAgLy8gT25seSBzdGFydCBhZGRpbmcgYXQgeWMubGVuZ3RoIC0gMSBhcyB0aGUgZnVydGhlciBkaWdpdHMgb2YgeGMgY2FuIGJlIGlnbm9yZWQuXHJcbiAgICAgICAgICAgIGZvciAoIGEgPSAwOyBiOyApIHtcclxuICAgICAgICAgICAgICAgIGEgPSAoIHhjWy0tYl0gPSB4Y1tiXSArIHljW2JdICsgYSApIC8gQkFTRSB8IDA7XHJcbiAgICAgICAgICAgICAgICB4Y1tiXSA9IEJBU0UgPT09IHhjW2JdID8gMCA6IHhjW2JdICUgQkFTRTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGEpIHtcclxuICAgICAgICAgICAgICAgIHhjID0gW2FdLmNvbmNhdCh4Yyk7XHJcbiAgICAgICAgICAgICAgICArK3llO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBObyBuZWVkIHRvIGNoZWNrIGZvciB6ZXJvLCBhcyAreCArICt5ICE9IDAgJiYgLXggKyAteSAhPSAwXHJcbiAgICAgICAgICAgIC8vIHllID0gTUFYX0VYUCArIDEgcG9zc2libGVcclxuICAgICAgICAgICAgcmV0dXJuIG5vcm1hbGlzZSggeSwgeGMsIHllICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzIG9mIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlci5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFt6XSB7Ym9vbGVhbnxudW1iZXJ9IFdoZXRoZXIgdG8gY291bnQgaW50ZWdlci1wYXJ0IHRyYWlsaW5nIHplcm9zOiB0cnVlLCBmYWxzZSwgMSBvciAwLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAucHJlY2lzaW9uID0gUC5zZCA9IGZ1bmN0aW9uICh6KSB7XHJcbiAgICAgICAgICAgIHZhciBuLCB2LFxyXG4gICAgICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBjID0geC5jO1xyXG5cclxuICAgICAgICAgICAgLy8gJ3ByZWNpc2lvbigpIGFyZ3VtZW50IG5vdCBhIGJvb2xlYW4gb3IgYmluYXJ5IGRpZ2l0OiB7en0nXHJcbiAgICAgICAgICAgIGlmICggeiAhPSBudWxsICYmIHogIT09ICEheiAmJiB6ICE9PSAxICYmIHogIT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoRVJST1JTKSByYWlzZSggMTMsICdhcmd1bWVudCcgKyBub3RCb29sLCB6ICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHogIT0gISF6ICkgeiA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggIWMgKSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgdiA9IGMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgbiA9IHYgKiBMT0dfQkFTRSArIDE7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHYgPSBjW3ZdICkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgZWxlbWVudC5cclxuICAgICAgICAgICAgICAgIGZvciAoIDsgdiAlIDEwID09IDA7IHYgLz0gMTAsIG4tLSApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudC5cclxuICAgICAgICAgICAgICAgIGZvciAoIHYgPSBjWzBdOyB2ID49IDEwOyB2IC89IDEwLCBuKysgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB6ICYmIHguZSArIDEgPiBuICkgbiA9IHguZSArIDE7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbjtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIGEgbWF4aW11bSBvZlxyXG4gICAgICAgICAqIGRwIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIHRvIDAgYW5kIFJPVU5ESU5HX01PREUgcmVzcGVjdGl2ZWx5IGlmXHJcbiAgICAgICAgICogb21pdHRlZC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAncm91bmQoKSBkZWNpbWFsIHBsYWNlcyBvdXQgb2YgcmFuZ2U6IHtkcH0nXHJcbiAgICAgICAgICogJ3JvdW5kKCkgZGVjaW1hbCBwbGFjZXMgbm90IGFuIGludGVnZXI6IHtkcH0nXHJcbiAgICAgICAgICogJ3JvdW5kKCkgcm91bmRpbmcgbW9kZSBub3QgYW4gaW50ZWdlcjoge3JtfSdcclxuICAgICAgICAgKiAncm91bmQoKSByb3VuZGluZyBtb2RlIG91dCBvZiByYW5nZToge3JtfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnJvdW5kID0gZnVuY3Rpb24gKCBkcCwgcm0gKSB7XHJcbiAgICAgICAgICAgIHZhciBuID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZHAgPT0gbnVsbCB8fCBpc1ZhbGlkSW50KCBkcCwgMCwgTUFYLCAxNSApICkge1xyXG4gICAgICAgICAgICAgICAgcm91bmQoIG4sIH5+ZHAgKyB0aGlzLmUgKyAxLCBybSA9PSBudWxsIHx8XHJcbiAgICAgICAgICAgICAgICAgICFpc1ZhbGlkSW50KCBybSwgMCwgOCwgMTUsIHJvdW5kaW5nTW9kZSApID8gUk9VTkRJTkdfTU9ERSA6IHJtIHwgMCApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbjtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBzaGlmdGVkIGJ5IGsgcGxhY2VzXHJcbiAgICAgICAgICogKHBvd2VycyBvZiAxMCkuIFNoaWZ0IHRvIHRoZSByaWdodCBpZiBuID4gMCwgYW5kIHRvIHRoZSBsZWZ0IGlmIG4gPCAwLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogayB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1NBRkVfSU5URUdFUiB0byBNQVhfU0FGRV9JTlRFR0VSIGluY2x1c2l2ZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIElmIGsgaXMgb3V0IG9mIHJhbmdlIGFuZCBFUlJPUlMgaXMgZmFsc2UsIHRoZSByZXN1bHQgd2lsbCBiZSDCsTAgaWYgayA8IDAsIG9yIMKxSW5maW5pdHlcclxuICAgICAgICAgKiBvdGhlcndpc2UuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAnc2hpZnQoKSBhcmd1bWVudCBub3QgYW4gaW50ZWdlcjoge2t9J1xyXG4gICAgICAgICAqICdzaGlmdCgpIGFyZ3VtZW50IG91dCBvZiByYW5nZToge2t9J1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAuc2hpZnQgPSBmdW5jdGlvbiAoaykge1xyXG4gICAgICAgICAgICB2YXIgbiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHJldHVybiBpc1ZhbGlkSW50KCBrLCAtTUFYX1NBRkVfSU5URUdFUiwgTUFYX1NBRkVfSU5URUdFUiwgMTYsICdhcmd1bWVudCcgKVxyXG5cclxuICAgICAgICAgICAgICAvLyBrIDwgMWUrMjEsIG9yIHRydW5jYXRlKGspIHdpbGwgcHJvZHVjZSBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICAgICAgICA/IG4udGltZXMoICcxZScgKyB0cnVuY2F0ZShrKSApXHJcbiAgICAgICAgICAgICAgOiBuZXcgQmlnTnVtYmVyKCBuLmMgJiYgbi5jWzBdICYmICggayA8IC1NQVhfU0FGRV9JTlRFR0VSIHx8IGsgPiBNQVhfU0FGRV9JTlRFR0VSIClcclxuICAgICAgICAgICAgICAgID8gbi5zICogKCBrIDwgMCA/IDAgOiAxIC8gMCApXHJcbiAgICAgICAgICAgICAgICA6IG4gKTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiAgc3FydCgtbikgPSAgTlxyXG4gICAgICAgICAqICBzcXJ0KCBOKSA9ICBOXHJcbiAgICAgICAgICogIHNxcnQoLUkpID0gIE5cclxuICAgICAgICAgKiAgc3FydCggSSkgPSAgSVxyXG4gICAgICAgICAqICBzcXJ0KCAwKSA9ICAwXHJcbiAgICAgICAgICogIHNxcnQoLTApID0gLTBcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHNxdWFyZSByb290IG9mIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlcixcclxuICAgICAgICAgKiByb3VuZGVkIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnNxdWFyZVJvb3QgPSBQLnNxcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBtLCBuLCByLCByZXAsIHQsXHJcbiAgICAgICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGMgPSB4LmMsXHJcbiAgICAgICAgICAgICAgICBzID0geC5zLFxyXG4gICAgICAgICAgICAgICAgZSA9IHguZSxcclxuICAgICAgICAgICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMgKyA0LFxyXG4gICAgICAgICAgICAgICAgaGFsZiA9IG5ldyBCaWdOdW1iZXIoJzAuNScpO1xyXG5cclxuICAgICAgICAgICAgLy8gTmVnYXRpdmUvTmFOL0luZmluaXR5L3plcm8/XHJcbiAgICAgICAgICAgIGlmICggcyAhPT0gMSB8fCAhYyB8fCAhY1swXSApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKCAhcyB8fCBzIDwgMCAmJiAoICFjIHx8IGNbMF0gKSA/IE5hTiA6IGMgPyB4IDogMSAvIDAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbCBlc3RpbWF0ZS5cclxuICAgICAgICAgICAgcyA9IE1hdGguc3FydCggK3ggKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hdGguc3FydCB1bmRlcmZsb3cvb3ZlcmZsb3c/XHJcbiAgICAgICAgICAgIC8vIFBhc3MgeCB0byBNYXRoLnNxcnQgYXMgaW50ZWdlciwgdGhlbiBhZGp1c3QgdGhlIGV4cG9uZW50IG9mIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICAgIGlmICggcyA9PSAwIHx8IHMgPT0gMSAvIDAgKSB7XHJcbiAgICAgICAgICAgICAgICBuID0gY29lZmZUb1N0cmluZyhjKTtcclxuICAgICAgICAgICAgICAgIGlmICggKCBuLmxlbmd0aCArIGUgKSAlIDIgPT0gMCApIG4gKz0gJzAnO1xyXG4gICAgICAgICAgICAgICAgcyA9IE1hdGguc3FydChuKTtcclxuICAgICAgICAgICAgICAgIGUgPSBiaXRGbG9vciggKCBlICsgMSApIC8gMiApIC0gKCBlIDwgMCB8fCBlICUgMiApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggcyA9PSAxIC8gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBuID0gJzFlJyArIGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG4gPSBzLnRvRXhwb25lbnRpYWwoKTtcclxuICAgICAgICAgICAgICAgICAgICBuID0gbi5zbGljZSggMCwgbi5pbmRleE9mKCdlJykgKyAxICkgKyBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKG4pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgciA9IG5ldyBCaWdOdW1iZXIoIHMgKyAnJyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgemVyby5cclxuICAgICAgICAgICAgLy8gciBjb3VsZCBiZSB6ZXJvIGlmIE1JTl9FWFAgaXMgY2hhbmdlZCBhZnRlciB0aGUgdGhpcyB2YWx1ZSB3YXMgY3JlYXRlZC5cclxuICAgICAgICAgICAgLy8gVGhpcyB3b3VsZCBjYXVzZSBhIGRpdmlzaW9uIGJ5IHplcm8gKHgvdCkgYW5kIGhlbmNlIEluZmluaXR5IGJlbG93LCB3aGljaCB3b3VsZCBjYXVzZVxyXG4gICAgICAgICAgICAvLyBjb2VmZlRvU3RyaW5nIHRvIHRocm93LlxyXG4gICAgICAgICAgICBpZiAoIHIuY1swXSApIHtcclxuICAgICAgICAgICAgICAgIGUgPSByLmU7XHJcbiAgICAgICAgICAgICAgICBzID0gZSArIGRwO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzIDwgMyApIHMgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5ld3Rvbi1SYXBoc29uIGl0ZXJhdGlvbi5cclxuICAgICAgICAgICAgICAgIGZvciAoIDsgOyApIHtcclxuICAgICAgICAgICAgICAgICAgICB0ID0gcjtcclxuICAgICAgICAgICAgICAgICAgICByID0gaGFsZi50aW1lcyggdC5wbHVzKCBkaXYoIHgsIHQsIGRwLCAxICkgKSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNvZWZmVG9TdHJpbmcoIHQuYyAgICkuc2xpY2UoIDAsIHMgKSA9PT0gKCBuID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgIGNvZWZmVG9TdHJpbmcoIHIuYyApICkuc2xpY2UoIDAsIHMgKSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBleHBvbmVudCBvZiByIG1heSBoZXJlIGJlIG9uZSBsZXNzIHRoYW4gdGhlIGZpbmFsIHJlc3VsdCBleHBvbmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZS5nIDAuMDAwOTk5OSAoZS00KSAtLT4gMC4wMDEgKGUtMyksIHNvIGFkanVzdCBzIHNvIHRoZSByb3VuZGluZyBkaWdpdHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXJlIGluZGV4ZWQgY29ycmVjdGx5LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHIuZSA8IGUgKSAtLXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gPSBuLnNsaWNlKCBzIC0gMywgcyArIDEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSA0dGggcm91bmRpbmcgZGlnaXQgbWF5IGJlIGluIGVycm9yIGJ5IC0xIHNvIGlmIHRoZSA0IHJvdW5kaW5nIGRpZ2l0c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcmUgOTk5OSBvciA0OTk5IChpLmUuIGFwcHJvYWNoaW5nIGEgcm91bmRpbmcgYm91bmRhcnkpIGNvbnRpbnVlIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbiA9PSAnOTk5OScgfHwgIXJlcCAmJiBuID09ICc0OTk5JyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbiB0aGUgZmlyc3QgaXRlcmF0aW9uIG9ubHksIGNoZWNrIHRvIHNlZSBpZiByb3VuZGluZyB1cCBnaXZlcyB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4YWN0IHJlc3VsdCBhcyB0aGUgbmluZXMgbWF5IGluZmluaXRlbHkgcmVwZWF0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhcmVwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdW5kKCB0LCB0LmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0LnRpbWVzKHQpLmVxKHgpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRwICs9IDQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzICs9IDQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXAgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHJvdW5kaW5nIGRpZ2l0cyBhcmUgbnVsbCwgMHswLDR9IG9yIDUwezAsM30sIGNoZWNrIGZvciBleGFjdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzdWx0LiBJZiBub3QsIHRoZW4gdGhlcmUgYXJlIGZ1cnRoZXIgZGlnaXRzIGFuZCBtIHdpbGwgYmUgdHJ1dGh5LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhK24gfHwgIStuLnNsaWNlKDEpICYmIG4uY2hhckF0KDApID09ICc1JyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJ1bmNhdGUgdG8gdGhlIGZpcnN0IHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdW5kKCByLCByLmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDEgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtID0gIXIudGltZXMocikuZXEoeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByb3VuZCggciwgci5lICsgREVDSU1BTF9QTEFDRVMgKyAxLCBST1VORElOR19NT0RFLCBtICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogIG4gKiAwID0gMFxyXG4gICAgICAgICAqICBuICogTiA9IE5cclxuICAgICAgICAgKiAgbiAqIEkgPSBJXHJcbiAgICAgICAgICogIDAgKiBuID0gMFxyXG4gICAgICAgICAqICAwICogMCA9IDBcclxuICAgICAgICAgKiAgMCAqIE4gPSBOXHJcbiAgICAgICAgICogIDAgKiBJID0gTlxyXG4gICAgICAgICAqICBOICogbiA9IE5cclxuICAgICAgICAgKiAgTiAqIDAgPSBOXHJcbiAgICAgICAgICogIE4gKiBOID0gTlxyXG4gICAgICAgICAqICBOICogSSA9IE5cclxuICAgICAgICAgKiAgSSAqIG4gPSBJXHJcbiAgICAgICAgICogIEkgKiAwID0gTlxyXG4gICAgICAgICAqICBJICogTiA9IE5cclxuICAgICAgICAgKiAgSSAqIEkgPSBJXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciB0aW1lcyB0aGUgdmFsdWUgb2ZcclxuICAgICAgICAgKiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC50aW1lcyA9IFAubXVsID0gZnVuY3Rpb24gKCB5LCBiICkge1xyXG4gICAgICAgICAgICB2YXIgYywgZSwgaSwgaiwgaywgbSwgeGNMLCB4bG8sIHhoaSwgeWNMLCB5bG8sIHloaSwgemMsXHJcbiAgICAgICAgICAgICAgICBiYXNlLCBzcXJ0QmFzZSxcclxuICAgICAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgICAgICB5YyA9ICggaWQgPSAxNywgeSA9IG5ldyBCaWdOdW1iZXIoIHksIGIgKSApLmM7XHJcblxyXG4gICAgICAgICAgICAvLyBFaXRoZXIgTmFOLCDCsUluZmluaXR5IG9yIMKxMD9cclxuICAgICAgICAgICAgaWYgKCAheGMgfHwgIXljIHx8ICF4Y1swXSB8fCAheWNbMF0gKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiBlaXRoZXIgaXMgTmFOLCBvciBvbmUgaXMgMCBhbmQgdGhlIG90aGVyIGlzIEluZmluaXR5LlxyXG4gICAgICAgICAgICAgICAgaWYgKCAheC5zIHx8ICF5LnMgfHwgeGMgJiYgIXhjWzBdICYmICF5YyB8fCB5YyAmJiAheWNbMF0gJiYgIXhjICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHkuYyA9IHkuZSA9IHkucyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHkucyAqPSB4LnM7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiDCsUluZmluaXR5IGlmIGVpdGhlciBpcyDCsUluZmluaXR5LlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXhjIHx8ICF5YyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeS5jID0geS5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIMKxMCBpZiBlaXRoZXIgaXMgwrEwLlxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHkuYyA9IFswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeS5lID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGUgPSBiaXRGbG9vciggeC5lIC8gTE9HX0JBU0UgKSArIGJpdEZsb29yKCB5LmUgLyBMT0dfQkFTRSApO1xyXG4gICAgICAgICAgICB5LnMgKj0geC5zO1xyXG4gICAgICAgICAgICB4Y0wgPSB4Yy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHljTCA9IHljLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIC8vIEVuc3VyZSB4YyBwb2ludHMgdG8gbG9uZ2VyIGFycmF5IGFuZCB4Y0wgdG8gaXRzIGxlbmd0aC5cclxuICAgICAgICAgICAgaWYgKCB4Y0wgPCB5Y0wgKSB6YyA9IHhjLCB4YyA9IHljLCB5YyA9IHpjLCBpID0geGNMLCB4Y0wgPSB5Y0wsIHljTCA9IGk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXNlIHRoZSByZXN1bHQgYXJyYXkgd2l0aCB6ZXJvcy5cclxuICAgICAgICAgICAgZm9yICggaSA9IHhjTCArIHljTCwgemMgPSBbXTsgaS0tOyB6Yy5wdXNoKDApICk7XHJcblxyXG4gICAgICAgICAgICBiYXNlID0gQkFTRTtcclxuICAgICAgICAgICAgc3FydEJhc2UgPSBTUVJUX0JBU0U7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCBpID0geWNMOyAtLWkgPj0gMDsgKSB7XHJcbiAgICAgICAgICAgICAgICBjID0gMDtcclxuICAgICAgICAgICAgICAgIHlsbyA9IHljW2ldICUgc3FydEJhc2U7XHJcbiAgICAgICAgICAgICAgICB5aGkgPSB5Y1tpXSAvIHNxcnRCYXNlIHwgMDtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCBrID0geGNMLCBqID0gaSArIGs7IGogPiBpOyApIHtcclxuICAgICAgICAgICAgICAgICAgICB4bG8gPSB4Y1stLWtdICUgc3FydEJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgeGhpID0geGNba10gLyBzcXJ0QmFzZSB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgbSA9IHloaSAqIHhsbyArIHhoaSAqIHlsbztcclxuICAgICAgICAgICAgICAgICAgICB4bG8gPSB5bG8gKiB4bG8gKyAoICggbSAlIHNxcnRCYXNlICkgKiBzcXJ0QmFzZSApICsgemNbal0gKyBjO1xyXG4gICAgICAgICAgICAgICAgICAgIGMgPSAoIHhsbyAvIGJhc2UgfCAwICkgKyAoIG0gLyBzcXJ0QmFzZSB8IDAgKSArIHloaSAqIHhoaTtcclxuICAgICAgICAgICAgICAgICAgICB6Y1tqLS1dID0geGxvICUgYmFzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB6Y1tqXSA9IGM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjKSB7XHJcbiAgICAgICAgICAgICAgICArK2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB6Yy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpc2UoIHksIHpjLCBlICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgcm91bmRlZCB0byBhIG1heGltdW0gb2ZcclxuICAgICAgICAgKiBzZCBzaWduaWZpY2FudCBkaWdpdHMgdXNpbmcgcm91bmRpbmcgbW9kZSBybSwgb3IgUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogW3NkXSB7bnVtYmVyfSBTaWduaWZpY2FudCBkaWdpdHMuIEludGVnZXIsIDEgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAndG9EaWdpdHMoKSBwcmVjaXNpb24gb3V0IG9mIHJhbmdlOiB7c2R9J1xyXG4gICAgICAgICAqICd0b0RpZ2l0cygpIHByZWNpc2lvbiBub3QgYW4gaW50ZWdlcjoge3NkfSdcclxuICAgICAgICAgKiAndG9EaWdpdHMoKSByb3VuZGluZyBtb2RlIG5vdCBhbiBpbnRlZ2VyOiB7cm19J1xyXG4gICAgICAgICAqICd0b0RpZ2l0cygpIHJvdW5kaW5nIG1vZGUgb3V0IG9mIHJhbmdlOiB7cm19J1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudG9EaWdpdHMgPSBmdW5jdGlvbiAoIHNkLCBybSApIHtcclxuICAgICAgICAgICAgdmFyIG4gPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICAgICAgICBzZCA9IHNkID09IG51bGwgfHwgIWlzVmFsaWRJbnQoIHNkLCAxLCBNQVgsIDE4LCAncHJlY2lzaW9uJyApID8gbnVsbCA6IHNkIHwgMDtcclxuICAgICAgICAgICAgcm0gPSBybSA9PSBudWxsIHx8ICFpc1ZhbGlkSW50KCBybSwgMCwgOCwgMTgsIHJvdW5kaW5nTW9kZSApID8gUk9VTkRJTkdfTU9ERSA6IHJtIHwgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHNkID8gcm91bmQoIG4sIHNkLCBybSApIDogbjtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBleHBvbmVudGlhbCBub3RhdGlvbiBhbmRcclxuICAgICAgICAgKiByb3VuZGVkIHVzaW5nIFJPVU5ESU5HX01PREUgdG8gZHAgZml4ZWQgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogJ3RvRXhwb25lbnRpYWwoKSBkZWNpbWFsIHBsYWNlcyBub3QgYW4gaW50ZWdlcjoge2RwfSdcclxuICAgICAgICAgKiAndG9FeHBvbmVudGlhbCgpIGRlY2ltYWwgcGxhY2VzIG91dCBvZiByYW5nZToge2RwfSdcclxuICAgICAgICAgKiAndG9FeHBvbmVudGlhbCgpIHJvdW5kaW5nIG1vZGUgbm90IGFuIGludGVnZXI6IHtybX0nXHJcbiAgICAgICAgICogJ3RvRXhwb25lbnRpYWwoKSByb3VuZGluZyBtb2RlIG91dCBvZiByYW5nZToge3JtfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRvRXhwb25lbnRpYWwgPSBmdW5jdGlvbiAoIGRwLCBybSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdCggdGhpcyxcclxuICAgICAgICAgICAgICBkcCAhPSBudWxsICYmIGlzVmFsaWRJbnQoIGRwLCAwLCBNQVgsIDE5ICkgPyB+fmRwICsgMSA6IG51bGwsIHJtLCAxOSApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uIHJvdW5kaW5nXHJcbiAgICAgICAgICogdG8gZHAgZml4ZWQgZGVjaW1hbCBwbGFjZXMgdXNpbmcgcm91bmRpbmcgbW9kZSBybSwgb3IgUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogTm90ZTogYXMgd2l0aCBKYXZhU2NyaXB0J3MgbnVtYmVyIHR5cGUsICgtMCkudG9GaXhlZCgwKSBpcyAnMCcsXHJcbiAgICAgICAgICogYnV0IGUuZy4gKC0wLjAwMDAxKS50b0ZpeGVkKDApIGlzICctMCcuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogJ3RvRml4ZWQoKSBkZWNpbWFsIHBsYWNlcyBub3QgYW4gaW50ZWdlcjoge2RwfSdcclxuICAgICAgICAgKiAndG9GaXhlZCgpIGRlY2ltYWwgcGxhY2VzIG91dCBvZiByYW5nZToge2RwfSdcclxuICAgICAgICAgKiAndG9GaXhlZCgpIHJvdW5kaW5nIG1vZGUgbm90IGFuIGludGVnZXI6IHtybX0nXHJcbiAgICAgICAgICogJ3RvRml4ZWQoKSByb3VuZGluZyBtb2RlIG91dCBvZiByYW5nZToge3JtfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRvRml4ZWQgPSBmdW5jdGlvbiAoIGRwLCBybSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdCggdGhpcywgZHAgIT0gbnVsbCAmJiBpc1ZhbGlkSW50KCBkcCwgMCwgTUFYLCAyMCApXHJcbiAgICAgICAgICAgICAgPyB+fmRwICsgdGhpcy5lICsgMSA6IG51bGwsIHJtLCAyMCApO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uIHJvdW5kZWRcclxuICAgICAgICAgKiB1c2luZyBybSBvciBST1VORElOR19NT0RFIHRvIGRwIGRlY2ltYWwgcGxhY2VzLCBhbmQgZm9ybWF0dGVkIGFjY29yZGluZyB0byB0aGUgcHJvcGVydGllc1xyXG4gICAgICAgICAqIG9mIHRoZSBGT1JNQVQgb2JqZWN0IChzZWUgQmlnTnVtYmVyLmNvbmZpZykuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBGT1JNQVQgPSB7XHJcbiAgICAgICAgICogICAgICBkZWNpbWFsU2VwYXJhdG9yIDogJy4nLFxyXG4gICAgICAgICAqICAgICAgZ3JvdXBTZXBhcmF0b3IgOiAnLCcsXHJcbiAgICAgICAgICogICAgICBncm91cFNpemUgOiAzLFxyXG4gICAgICAgICAqICAgICAgc2Vjb25kYXJ5R3JvdXBTaXplIDogMCxcclxuICAgICAgICAgKiAgICAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3IgOiAnXFx4QTAnLCAgICAvLyBub24tYnJlYWtpbmcgc3BhY2VcclxuICAgICAgICAgKiAgICAgIGZyYWN0aW9uR3JvdXBTaXplIDogMFxyXG4gICAgICAgICAqIH07XHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogJ3RvRm9ybWF0KCkgZGVjaW1hbCBwbGFjZXMgbm90IGFuIGludGVnZXI6IHtkcH0nXHJcbiAgICAgICAgICogJ3RvRm9ybWF0KCkgZGVjaW1hbCBwbGFjZXMgb3V0IG9mIHJhbmdlOiB7ZHB9J1xyXG4gICAgICAgICAqICd0b0Zvcm1hdCgpIHJvdW5kaW5nIG1vZGUgbm90IGFuIGludGVnZXI6IHtybX0nXHJcbiAgICAgICAgICogJ3RvRm9ybWF0KCkgcm91bmRpbmcgbW9kZSBvdXQgb2YgcmFuZ2U6IHtybX0nXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC50b0Zvcm1hdCA9IGZ1bmN0aW9uICggZHAsIHJtICkge1xyXG4gICAgICAgICAgICB2YXIgc3RyID0gZm9ybWF0KCB0aGlzLCBkcCAhPSBudWxsICYmIGlzVmFsaWRJbnQoIGRwLCAwLCBNQVgsIDIxIClcclxuICAgICAgICAgICAgICA/IH5+ZHAgKyB0aGlzLmUgKyAxIDogbnVsbCwgcm0sIDIxICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYyApIHtcclxuICAgICAgICAgICAgICAgIHZhciBpLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyciA9IHN0ci5zcGxpdCgnLicpLFxyXG4gICAgICAgICAgICAgICAgICAgIGcxID0gK0ZPUk1BVC5ncm91cFNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgZzIgPSArRk9STUFULnNlY29uZGFyeUdyb3VwU2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICBncm91cFNlcGFyYXRvciA9IEZPUk1BVC5ncm91cFNlcGFyYXRvcixcclxuICAgICAgICAgICAgICAgICAgICBpbnRQYXJ0ID0gYXJyWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGZyYWN0aW9uUGFydCA9IGFyclsxXSxcclxuICAgICAgICAgICAgICAgICAgICBpc05lZyA9IHRoaXMucyA8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgaW50RGlnaXRzID0gaXNOZWcgPyBpbnRQYXJ0LnNsaWNlKDEpIDogaW50UGFydCxcclxuICAgICAgICAgICAgICAgICAgICBsZW4gPSBpbnREaWdpdHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChnMikgaSA9IGcxLCBnMSA9IGcyLCBnMiA9IGksIGxlbiAtPSBpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggZzEgPiAwICYmIGxlbiA+IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IGxlbiAlIGcxIHx8IGcxO1xyXG4gICAgICAgICAgICAgICAgICAgIGludFBhcnQgPSBpbnREaWdpdHMuc3Vic3RyKCAwLCBpICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIDsgaSA8IGxlbjsgaSArPSBnMSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW50UGFydCArPSBncm91cFNlcGFyYXRvciArIGludERpZ2l0cy5zdWJzdHIoIGksIGcxICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGcyID4gMCApIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc2xpY2UoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzTmVnKSBpbnRQYXJ0ID0gJy0nICsgaW50UGFydDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzdHIgPSBmcmFjdGlvblBhcnRcclxuICAgICAgICAgICAgICAgICAgPyBpbnRQYXJ0ICsgRk9STUFULmRlY2ltYWxTZXBhcmF0b3IgKyAoICggZzIgPSArRk9STUFULmZyYWN0aW9uR3JvdXBTaXplIClcclxuICAgICAgICAgICAgICAgICAgICA/IGZyYWN0aW9uUGFydC5yZXBsYWNlKCBuZXcgUmVnRXhwKCAnXFxcXGR7JyArIGcyICsgJ31cXFxcQicsICdnJyApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJyQmJyArIEZPUk1BVC5mcmFjdGlvbkdyb3VwU2VwYXJhdG9yIClcclxuICAgICAgICAgICAgICAgICAgICA6IGZyYWN0aW9uUGFydCApXHJcbiAgICAgICAgICAgICAgICAgIDogaW50UGFydDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gYSBzdHJpbmcgYXJyYXkgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBhcyBhIHNpbXBsZSBmcmFjdGlvbiB3aXRoXHJcbiAgICAgICAgICogYW4gaW50ZWdlciBudW1lcmF0b3IgYW5kIGFuIGludGVnZXIgZGVub21pbmF0b3IuIFRoZSBkZW5vbWluYXRvciB3aWxsIGJlIGEgcG9zaXRpdmVcclxuICAgICAgICAgKiBub24temVybyB2YWx1ZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHNwZWNpZmllZCBtYXhpbXVtIGRlbm9taW5hdG9yLiBJZiBhIG1heGltdW1cclxuICAgICAgICAgKiBkZW5vbWluYXRvciBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgZGVub21pbmF0b3Igd2lsbCBiZSB0aGUgbG93ZXN0IHZhbHVlIG5lY2Vzc2FyeSB0b1xyXG4gICAgICAgICAqIHJlcHJlc2VudCB0aGUgbnVtYmVyIGV4YWN0bHkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBbbWRdIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gSW50ZWdlciA+PSAxIGFuZCA8IEluZmluaXR5LiBUaGUgbWF4aW11bSBkZW5vbWluYXRvci5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICd0b0ZyYWN0aW9uKCkgbWF4IGRlbm9taW5hdG9yIG5vdCBhbiBpbnRlZ2VyOiB7bWR9J1xyXG4gICAgICAgICAqICd0b0ZyYWN0aW9uKCkgbWF4IGRlbm9taW5hdG9yIG91dCBvZiByYW5nZToge21kfSdcclxuICAgICAgICAgKi9cclxuICAgICAgICBQLnRvRnJhY3Rpb24gPSBmdW5jdGlvbiAobWQpIHtcclxuICAgICAgICAgICAgdmFyIGFyciwgZDAsIGQyLCBlLCBleHAsIG4sIG4wLCBxLCBzLFxyXG4gICAgICAgICAgICAgICAgayA9IEVSUk9SUyxcclxuICAgICAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgICAgICBkID0gbmV3IEJpZ051bWJlcihPTkUpLFxyXG4gICAgICAgICAgICAgICAgbjEgPSBkMCA9IG5ldyBCaWdOdW1iZXIoT05FKSxcclxuICAgICAgICAgICAgICAgIGQxID0gbjAgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG1kICE9IG51bGwgKSB7XHJcbiAgICAgICAgICAgICAgICBFUlJPUlMgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIG4gPSBuZXcgQmlnTnVtYmVyKG1kKTtcclxuICAgICAgICAgICAgICAgIEVSUk9SUyA9IGs7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhKCBrID0gbi5pc0ludCgpICkgfHwgbi5sdChPTkUpICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoRVJST1JTKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhaXNlKCAyMixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAnbWF4IGRlbm9taW5hdG9yICcgKyAoIGsgPyAnb3V0IG9mIHJhbmdlJyA6ICdub3QgYW4gaW50ZWdlcicgKSwgbWQgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVSUk9SUyBpcyBmYWxzZTpcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBtZCBpcyBhIGZpbml0ZSBub24taW50ZWdlciA+PSAxLCByb3VuZCBpdCB0byBhbiBpbnRlZ2VyIGFuZCB1c2UgaXQuXHJcbiAgICAgICAgICAgICAgICAgICAgbWQgPSAhayAmJiBuLmMgJiYgcm91bmQoIG4sIG4uZSArIDEsIDEgKS5ndGUoT05FKSA/IG4gOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoICF4YyApIHJldHVybiB4LnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIHMgPSBjb2VmZlRvU3RyaW5nKHhjKTtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSBpbml0aWFsIGRlbm9taW5hdG9yLlxyXG4gICAgICAgICAgICAvLyBkIGlzIGEgcG93ZXIgb2YgMTAgYW5kIHRoZSBtaW5pbXVtIG1heCBkZW5vbWluYXRvciB0aGF0IHNwZWNpZmllcyB0aGUgdmFsdWUgZXhhY3RseS5cclxuICAgICAgICAgICAgZSA9IGQuZSA9IHMubGVuZ3RoIC0geC5lIC0gMTtcclxuICAgICAgICAgICAgZC5jWzBdID0gUE9XU19URU5bICggZXhwID0gZSAlIExPR19CQVNFICkgPCAwID8gTE9HX0JBU0UgKyBleHAgOiBleHAgXTtcclxuICAgICAgICAgICAgbWQgPSAhbWQgfHwgbi5jbXAoZCkgPiAwID8gKCBlID4gMCA/IGQgOiBuMSApIDogbjtcclxuXHJcbiAgICAgICAgICAgIGV4cCA9IE1BWF9FWFA7XHJcbiAgICAgICAgICAgIE1BWF9FWFAgPSAxIC8gMDtcclxuICAgICAgICAgICAgbiA9IG5ldyBCaWdOdW1iZXIocyk7XHJcblxyXG4gICAgICAgICAgICAvLyBuMCA9IGQxID0gMFxyXG4gICAgICAgICAgICBuMC5jWzBdID0gMDtcclxuXHJcbiAgICAgICAgICAgIGZvciAoIDsgOyApICB7XHJcbiAgICAgICAgICAgICAgICBxID0gZGl2KCBuLCBkLCAwLCAxICk7XHJcbiAgICAgICAgICAgICAgICBkMiA9IGQwLnBsdXMoIHEudGltZXMoZDEpICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGQyLmNtcChtZCkgPT0gMSApIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZDAgPSBkMTtcclxuICAgICAgICAgICAgICAgIGQxID0gZDI7XHJcbiAgICAgICAgICAgICAgICBuMSA9IG4wLnBsdXMoIHEudGltZXMoIGQyID0gbjEgKSApO1xyXG4gICAgICAgICAgICAgICAgbjAgPSBkMjtcclxuICAgICAgICAgICAgICAgIGQgPSBuLm1pbnVzKCBxLnRpbWVzKCBkMiA9IGQgKSApO1xyXG4gICAgICAgICAgICAgICAgbiA9IGQyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkMiA9IGRpdiggbWQubWludXMoZDApLCBkMSwgMCwgMSApO1xyXG4gICAgICAgICAgICBuMCA9IG4wLnBsdXMoIGQyLnRpbWVzKG4xKSApO1xyXG4gICAgICAgICAgICBkMCA9IGQwLnBsdXMoIGQyLnRpbWVzKGQxKSApO1xyXG4gICAgICAgICAgICBuMC5zID0gbjEucyA9IHgucztcclxuICAgICAgICAgICAgZSAqPSAyO1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGZyYWN0aW9uIGlzIGNsb3NlciB0byB4LCBuMC9kMCBvciBuMS9kMVxyXG4gICAgICAgICAgICBhcnIgPSBkaXYoIG4xLCBkMSwgZSwgUk9VTkRJTkdfTU9ERSApLm1pbnVzKHgpLmFicygpLmNtcChcclxuICAgICAgICAgICAgICAgICAgZGl2KCBuMCwgZDAsIGUsIFJPVU5ESU5HX01PREUgKS5taW51cyh4KS5hYnMoKSApIDwgMVxyXG4gICAgICAgICAgICAgICAgICAgID8gWyBuMS50b1N0cmluZygpLCBkMS50b1N0cmluZygpIF1cclxuICAgICAgICAgICAgICAgICAgICA6IFsgbjAudG9TdHJpbmcoKSwgZDAudG9TdHJpbmcoKSBdO1xyXG5cclxuICAgICAgICAgICAgTUFYX0VYUCA9IGV4cDtcclxuICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGNvbnZlcnRlZCB0byBhIG51bWJlciBwcmltaXRpdmUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC50b051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICt0aGlzO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgcmFpc2VkIHRvIHRoZSBwb3dlciBuLlxyXG4gICAgICAgICAqIElmIG0gaXMgcHJlc2VudCwgcmV0dXJuIHRoZSByZXN1bHQgbW9kdWxvIG0uXHJcbiAgICAgICAgICogSWYgbiBpcyBuZWdhdGl2ZSByb3VuZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgICAgICogSWYgUE9XX1BSRUNJU0lPTiBpcyBub24temVybyBhbmQgbSBpcyBub3QgcHJlc2VudCwgcm91bmQgdG8gUE9XX1BSRUNJU0lPTiB1c2luZ1xyXG4gICAgICAgICAqIFJPVU5ESU5HX01PREUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBUaGUgbW9kdWxhciBwb3dlciBvcGVyYXRpb24gd29ya3MgZWZmaWNpZW50bHkgd2hlbiB4LCBuLCBhbmQgbSBhcmUgcG9zaXRpdmUgaW50ZWdlcnMsXHJcbiAgICAgICAgICogb3RoZXJ3aXNlIGl0IGlzIGVxdWl2YWxlbnQgdG8gY2FsY3VsYXRpbmcgeC50b1Bvd2VyKG4pLm1vZHVsbyhtKSAod2l0aCBQT1dfUFJFQ0lTSU9OIDApLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogbiB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1NBRkVfSU5URUdFUiB0byBNQVhfU0FGRV9JTlRFR0VSIGluY2x1c2l2ZS5cclxuICAgICAgICAgKiBbbV0ge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfSBUaGUgbW9kdWx1cy5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICdwb3coKSBleHBvbmVudCBub3QgYW4gaW50ZWdlcjoge259J1xyXG4gICAgICAgICAqICdwb3coKSBleHBvbmVudCBvdXQgb2YgcmFuZ2U6IHtufSdcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFBlcmZvcm1zIDU0IGxvb3AgaXRlcmF0aW9ucyBmb3IgbiBvZiA5MDA3MTk5MjU0NzQwOTkxLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudG9Qb3dlciA9IFAucG93ID0gZnVuY3Rpb24gKCBuLCBtICkge1xyXG4gICAgICAgICAgICB2YXIgaywgeSwgeixcclxuICAgICAgICAgICAgICAgIGkgPSBtYXRoZmxvb3IoIG4gPCAwID8gLW4gOiArbiApLFxyXG4gICAgICAgICAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG0gIT0gbnVsbCApIHtcclxuICAgICAgICAgICAgICAgIGlkID0gMjM7XHJcbiAgICAgICAgICAgICAgICBtID0gbmV3IEJpZ051bWJlcihtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUGFzcyDCsUluZmluaXR5IHRvIE1hdGgucG93IGlmIGV4cG9uZW50IGlzIG91dCBvZiByYW5nZS5cclxuICAgICAgICAgICAgaWYgKCAhaXNWYWxpZEludCggbiwgLU1BWF9TQUZFX0lOVEVHRVIsIE1BWF9TQUZFX0lOVEVHRVIsIDIzLCAnZXhwb25lbnQnICkgJiZcclxuICAgICAgICAgICAgICAoICFpc0Zpbml0ZShuKSB8fCBpID4gTUFYX1NBRkVfSU5URUdFUiAmJiAoIG4gLz0gMCApIHx8XHJcbiAgICAgICAgICAgICAgICBwYXJzZUZsb2F0KG4pICE9IG4gJiYgISggbiA9IE5hTiApICkgfHwgbiA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgayA9IE1hdGgucG93KCAreCwgbiApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoIG0gPyBrICUgbSA6IGsgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG0pIHtcclxuICAgICAgICAgICAgICAgIGlmICggbiA+IDEgJiYgeC5ndChPTkUpICYmIHguaXNJbnQoKSAmJiBtLmd0KE9ORSkgJiYgbS5pc0ludCgpICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHggPSB4Lm1vZChtKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeiA9IG07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE51bGxpZnkgbSBzbyBvbmx5IGEgc2luZ2xlIG1vZCBvcGVyYXRpb24gaXMgcGVyZm9ybWVkIGF0IHRoZSBlbmQuXHJcbiAgICAgICAgICAgICAgICAgICAgbSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoUE9XX1BSRUNJU0lPTikge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRydW5jYXRpbmcgZWFjaCBjb2VmZmljaWVudCBhcnJheSB0byBhIGxlbmd0aCBvZiBrIGFmdGVyIGVhY2ggbXVsdGlwbGljYXRpb25cclxuICAgICAgICAgICAgICAgIC8vIGVxdWF0ZXMgdG8gdHJ1bmNhdGluZyBzaWduaWZpY2FudCBkaWdpdHMgdG8gUE9XX1BSRUNJU0lPTiArIFsyOCwgNDFdLFxyXG4gICAgICAgICAgICAgICAgLy8gaS5lLiB0aGVyZSB3aWxsIGJlIGEgbWluaW11bSBvZiAyOCBndWFyZCBkaWdpdHMgcmV0YWluZWQuXHJcbiAgICAgICAgICAgICAgICAvLyAoVXNpbmcgKyAxLjUgd291bGQgZ2l2ZSBbOSwgMjFdIGd1YXJkIGRpZ2l0cy4pXHJcbiAgICAgICAgICAgICAgICBrID0gbWF0aGNlaWwoIFBPV19QUkVDSVNJT04gLyBMT0dfQkFTRSArIDIgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoIDsgOyApIHtcclxuICAgICAgICAgICAgICAgIGlmICggaSAlIDIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeSA9IHkudGltZXMoeCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAheS5jICkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB5LmMubGVuZ3RoID4gayApIHkuYy5sZW5ndGggPSBrO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5ID0geS5tb2QobSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGkgPSBtYXRoZmxvb3IoIGkgLyAyICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoICFpICkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB4ID0geC50aW1lcyh4KTtcclxuICAgICAgICAgICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB4LmMgJiYgeC5jLmxlbmd0aCA+IGsgKSB4LmMubGVuZ3RoID0gaztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHggPSB4Lm1vZChtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG0pIHJldHVybiB5O1xyXG4gICAgICAgICAgICBpZiAoIG4gPCAwICkgeSA9IE9ORS5kaXYoeSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geiA/IHkubW9kKHopIDogayA/IHJvdW5kKCB5LCBQT1dfUFJFQ0lTSU9OLCBST1VORElOR19NT0RFICkgOiB5O1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzXHJcbiAgICAgICAgICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSBvciBST1VORElOR19NT0RFLiBJZiBzZCBpcyBsZXNzIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHNcclxuICAgICAgICAgKiBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBpbnRlZ2VyIHBhcnQgb2YgdGhlIHZhbHVlIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uLCB0aGVuIHVzZVxyXG4gICAgICAgICAqIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogW3NkXSB7bnVtYmVyfSBTaWduaWZpY2FudCBkaWdpdHMuIEludGVnZXIsIDEgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAndG9QcmVjaXNpb24oKSBwcmVjaXNpb24gbm90IGFuIGludGVnZXI6IHtzZH0nXHJcbiAgICAgICAgICogJ3RvUHJlY2lzaW9uKCkgcHJlY2lzaW9uIG91dCBvZiByYW5nZToge3NkfSdcclxuICAgICAgICAgKiAndG9QcmVjaXNpb24oKSByb3VuZGluZyBtb2RlIG5vdCBhbiBpbnRlZ2VyOiB7cm19J1xyXG4gICAgICAgICAqICd0b1ByZWNpc2lvbigpIHJvdW5kaW5nIG1vZGUgb3V0IG9mIHJhbmdlOiB7cm19J1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudG9QcmVjaXNpb24gPSBmdW5jdGlvbiAoIHNkLCBybSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdCggdGhpcywgc2QgIT0gbnVsbCAmJiBpc1ZhbGlkSW50KCBzZCwgMSwgTUFYLCAyNCwgJ3ByZWNpc2lvbicgKVxyXG4gICAgICAgICAgICAgID8gc2QgfCAwIDogbnVsbCwgcm0sIDI0ICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gYmFzZSBiLCBvciBiYXNlIDEwIGlmIGIgaXNcclxuICAgICAgICAgKiBvbWl0dGVkLiBJZiBhIGJhc2UgaXMgc3BlY2lmaWVkLCBpbmNsdWRpbmcgYmFzZSAxMCwgcm91bmQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZFxyXG4gICAgICAgICAqIFJPVU5ESU5HX01PREUuIElmIGEgYmFzZSBpcyBub3Qgc3BlY2lmaWVkLCBhbmQgdGhpcyBCaWdOdW1iZXIgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnRcclxuICAgICAgICAgKiB0aGF0IGlzIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiBUT19FWFBfUE9TLCBvciBhIG5lZ2F0aXZlIGV4cG9uZW50IGVxdWFsIHRvIG9yIGxlc3MgdGhhblxyXG4gICAgICAgICAqIFRPX0VYUF9ORUcsIHJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFtiXSB7bnVtYmVyfSBJbnRlZ2VyLCAyIHRvIDY0IGluY2x1c2l2ZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICd0b1N0cmluZygpIGJhc2Ugbm90IGFuIGludGVnZXI6IHtifSdcclxuICAgICAgICAgKiAndG9TdHJpbmcoKSBiYXNlIG91dCBvZiByYW5nZToge2J9J1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudG9TdHJpbmcgPSBmdW5jdGlvbiAoYikge1xyXG4gICAgICAgICAgICB2YXIgc3RyLFxyXG4gICAgICAgICAgICAgICAgbiA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBzID0gbi5zLFxyXG4gICAgICAgICAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgICAgICAgIC8vIEluZmluaXR5IG9yIE5hTj9cclxuICAgICAgICAgICAgaWYgKCBlID09PSBudWxsICkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gJ0luZmluaXR5JztcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHMgPCAwICkgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHIgPSAnTmFOJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcoIG4uYyApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggYiA9PSBudWxsIHx8ICFpc1ZhbGlkSW50KCBiLCAyLCA2NCwgMjUsICdiYXNlJyApICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IGUgPD0gVE9fRVhQX05FRyB8fCBlID49IFRPX0VYUF9QT1NcclxuICAgICAgICAgICAgICAgICAgICAgID8gdG9FeHBvbmVudGlhbCggc3RyLCBlIClcclxuICAgICAgICAgICAgICAgICAgICAgIDogdG9GaXhlZFBvaW50KCBzdHIsIGUgKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gY29udmVydEJhc2UoIHRvRml4ZWRQb2ludCggc3RyLCBlICksIGIgfCAwLCAxMCwgcyApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggcyA8IDAgJiYgbi5jWzBdICkgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHRydW5jYXRlZCB0byBhIHdob2xlXHJcbiAgICAgICAgICogbnVtYmVyLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIFAudHJ1bmNhdGVkID0gUC50cnVuYyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJvdW5kKCBuZXcgQmlnTnVtYmVyKHRoaXMpLCB0aGlzLmUgKyAxLCAxICk7XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV0dXJuIGFzIHRvU3RyaW5nLCBidXQgZG8gbm90IGFjY2VwdCBhIGJhc2UgYXJndW1lbnQsIGFuZCBpbmNsdWRlIHRoZSBtaW51cyBzaWduIGZvclxyXG4gICAgICAgICAqIG5lZ2F0aXZlIHplcm8uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUC52YWx1ZU9mID0gUC50b0pTT04gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgICAgICAgICBuID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGUgPT09IG51bGwgKSByZXR1cm4gbi50b1N0cmluZygpO1xyXG5cclxuICAgICAgICAgICAgc3RyID0gY29lZmZUb1N0cmluZyggbi5jICk7XHJcblxyXG4gICAgICAgICAgICBzdHIgPSBlIDw9IFRPX0VYUF9ORUcgfHwgZSA+PSBUT19FWFBfUE9TXHJcbiAgICAgICAgICAgICAgICA/IHRvRXhwb25lbnRpYWwoIHN0ciwgZSApXHJcbiAgICAgICAgICAgICAgICA6IHRvRml4ZWRQb2ludCggc3RyLCBlICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbi5zIDwgMCA/ICctJyArIHN0ciA6IHN0cjtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgUC5pc0JpZ051bWJlciA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICggY29uZmlnICE9IG51bGwgKSBCaWdOdW1iZXIuY29uZmlnKGNvbmZpZyk7XHJcblxyXG4gICAgICAgIHJldHVybiBCaWdOdW1iZXI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIFBSSVZBVEUgSEVMUEVSIEZVTkNUSU9OU1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBiaXRGbG9vcihuKSB7XHJcbiAgICAgICAgdmFyIGkgPSBuIHwgMDtcclxuICAgICAgICByZXR1cm4gbiA+IDAgfHwgbiA9PT0gaSA/IGkgOiBpIC0gMTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gUmV0dXJuIGEgY29lZmZpY2llbnQgYXJyYXkgYXMgYSBzdHJpbmcgb2YgYmFzZSAxMCBkaWdpdHMuXHJcbiAgICBmdW5jdGlvbiBjb2VmZlRvU3RyaW5nKGEpIHtcclxuICAgICAgICB2YXIgcywgeixcclxuICAgICAgICAgICAgaSA9IDEsXHJcbiAgICAgICAgICAgIGogPSBhLmxlbmd0aCxcclxuICAgICAgICAgICAgciA9IGFbMF0gKyAnJztcclxuXHJcbiAgICAgICAgZm9yICggOyBpIDwgajsgKSB7XHJcbiAgICAgICAgICAgIHMgPSBhW2krK10gKyAnJztcclxuICAgICAgICAgICAgeiA9IExPR19CQVNFIC0gcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoIDsgei0tOyBzID0gJzAnICsgcyApO1xyXG4gICAgICAgICAgICByICs9IHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yICggaiA9IHIubGVuZ3RoOyByLmNoYXJDb2RlQXQoLS1qKSA9PT0gNDg7ICk7XHJcbiAgICAgICAgcmV0dXJuIHIuc2xpY2UoIDAsIGogKyAxIHx8IDEgKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgb2YgQmlnTnVtYmVycyB4IGFuZCB5LlxyXG4gICAgZnVuY3Rpb24gY29tcGFyZSggeCwgeSApIHtcclxuICAgICAgICB2YXIgYSwgYixcclxuICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgIHljID0geS5jLFxyXG4gICAgICAgICAgICBpID0geC5zLFxyXG4gICAgICAgICAgICBqID0geS5zLFxyXG4gICAgICAgICAgICBrID0geC5lLFxyXG4gICAgICAgICAgICBsID0geS5lO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgICAgIGlmICggIWkgfHwgIWogKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgYSA9IHhjICYmICF4Y1swXTtcclxuICAgICAgICBiID0geWMgJiYgIXljWzBdO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICBpZiAoIGEgfHwgYiApIHJldHVybiBhID8gYiA/IDAgOiAtaiA6IGk7XHJcblxyXG4gICAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgICBpZiAoIGkgIT0gaiApIHJldHVybiBpO1xyXG5cclxuICAgICAgICBhID0gaSA8IDA7XHJcbiAgICAgICAgYiA9IGsgPT0gbDtcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIEluZmluaXR5P1xyXG4gICAgICAgIGlmICggIXhjIHx8ICF5YyApIHJldHVybiBiID8gMCA6ICF4YyBeIGEgPyAxIDogLTE7XHJcblxyXG4gICAgICAgIC8vIENvbXBhcmUgZXhwb25lbnRzLlxyXG4gICAgICAgIGlmICggIWIgKSByZXR1cm4gayA+IGwgXiBhID8gMSA6IC0xO1xyXG5cclxuICAgICAgICBqID0gKCBrID0geGMubGVuZ3RoICkgPCAoIGwgPSB5Yy5sZW5ndGggKSA/IGsgOiBsO1xyXG5cclxuICAgICAgICAvLyBDb21wYXJlIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgICAgIGZvciAoIGkgPSAwOyBpIDwgajsgaSsrICkgaWYgKCB4Y1tpXSAhPSB5Y1tpXSApIHJldHVybiB4Y1tpXSA+IHljW2ldIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBsZW5ndGhzLlxyXG4gICAgICAgIHJldHVybiBrID09IGwgPyAwIDogayA+IGwgXiBhID8gMSA6IC0xO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgbiBpcyBhIHZhbGlkIG51bWJlciBpbiByYW5nZSwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICogVXNlIGZvciBhcmd1bWVudCB2YWxpZGF0aW9uIHdoZW4gRVJST1JTIGlzIGZhbHNlLlxyXG4gICAgICogTm90ZTogcGFyc2VJbnQoJzFlKzEnKSA9PSAxIGJ1dCBwYXJzZUZsb2F0KCcxZSsxJykgPT0gMTAuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGludFZhbGlkYXRvck5vRXJyb3JzKCBuLCBtaW4sIG1heCApIHtcclxuICAgICAgICByZXR1cm4gKCBuID0gdHJ1bmNhdGUobikgKSA+PSBtaW4gJiYgbiA8PSBtYXg7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFycmF5XSc7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBDb252ZXJ0IHN0cmluZyBvZiBiYXNlSW4gdG8gYW4gYXJyYXkgb2YgbnVtYmVycyBvZiBiYXNlT3V0LlxyXG4gICAgICogRWcuIGNvbnZlcnRCYXNlKCcyNTUnLCAxMCwgMTYpIHJldHVybnMgWzE1LCAxNV0uXHJcbiAgICAgKiBFZy4gY29udmVydEJhc2UoJ2ZmJywgMTYsIDEwKSByZXR1cm5zIFsyLCA1LCA1XS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdG9CYXNlT3V0KCBzdHIsIGJhc2VJbiwgYmFzZU91dCApIHtcclxuICAgICAgICB2YXIgaixcclxuICAgICAgICAgICAgYXJyID0gWzBdLFxyXG4gICAgICAgICAgICBhcnJMLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgbGVuID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgICAgZm9yICggOyBpIDwgbGVuOyApIHtcclxuICAgICAgICAgICAgZm9yICggYXJyTCA9IGFyci5sZW5ndGg7IGFyckwtLTsgYXJyW2FyckxdICo9IGJhc2VJbiApO1xyXG4gICAgICAgICAgICBhcnJbIGogPSAwIF0gKz0gQUxQSEFCRVQuaW5kZXhPZiggc3RyLmNoYXJBdCggaSsrICkgKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoIDsgaiA8IGFyci5sZW5ndGg7IGorKyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGFycltqXSA+IGJhc2VPdXQgLSAxICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggYXJyW2ogKyAxXSA9PSBudWxsICkgYXJyW2ogKyAxXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyW2ogKyAxXSArPSBhcnJbal0gLyBiYXNlT3V0IHwgMDtcclxuICAgICAgICAgICAgICAgICAgICBhcnJbal0gJT0gYmFzZU91dDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFyci5yZXZlcnNlKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHRvRXhwb25lbnRpYWwoIHN0ciwgZSApIHtcclxuICAgICAgICByZXR1cm4gKCBzdHIubGVuZ3RoID4gMSA/IHN0ci5jaGFyQXQoMCkgKyAnLicgKyBzdHIuc2xpY2UoMSkgOiBzdHIgKSArXHJcbiAgICAgICAgICAoIGUgPCAwID8gJ2UnIDogJ2UrJyApICsgZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gdG9GaXhlZFBvaW50KCBzdHIsIGUgKSB7XHJcbiAgICAgICAgdmFyIGxlbiwgejtcclxuXHJcbiAgICAgICAgLy8gTmVnYXRpdmUgZXhwb25lbnQ/XHJcbiAgICAgICAgaWYgKCBlIDwgMCApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXBlbmQgemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoIHogPSAnMC4nOyArK2U7IHogKz0gJzAnICk7XHJcbiAgICAgICAgICAgIHN0ciA9IHogKyBzdHI7XHJcblxyXG4gICAgICAgIC8vIFBvc2l0aXZlIGV4cG9uZW50XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGVuID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcy5cclxuICAgICAgICAgICAgaWYgKCArK2UgPiBsZW4gKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB6ID0gJzAnLCBlIC09IGxlbjsgLS1lOyB6ICs9ICcwJyApO1xyXG4gICAgICAgICAgICAgICAgc3RyICs9IHo7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGUgPCBsZW4gKSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoIDAsIGUgKSArICcuJyArIHN0ci5zbGljZShlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gdHJ1bmNhdGUobikge1xyXG4gICAgICAgIG4gPSBwYXJzZUZsb2F0KG4pO1xyXG4gICAgICAgIHJldHVybiBuIDwgMCA/IG1hdGhjZWlsKG4pIDogbWF0aGZsb29yKG4pO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBFWFBPUlRcclxuXHJcblxyXG4gICAgQmlnTnVtYmVyID0gY29uc3RydWN0b3JGYWN0b3J5KCk7XHJcbiAgICBCaWdOdW1iZXJbJ2RlZmF1bHQnXSA9IEJpZ051bWJlci5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcblxyXG5cclxuICAgIC8vIEFNRC5cclxuICAgIGlmICggdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XHJcbiAgICAgICAgZGVmaW5lKCBmdW5jdGlvbiAoKSB7IHJldHVybiBCaWdOdW1iZXI7IH0gKTtcclxuXHJcbiAgICAvLyBOb2RlLmpzIGFuZCBvdGhlciBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLlxyXG4gICAgfSBlbHNlIGlmICggdHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyApIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEJpZ051bWJlcjtcclxuXHJcbiAgICAvLyBCcm93c2VyLlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoICFnbG9iYWxPYmogKSBnbG9iYWxPYmogPSB0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJyA/IHNlbGYgOiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xyXG4gICAgICAgIGdsb2JhbE9iai5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcbiAgICB9XHJcbn0pKHRoaXMpO1xyXG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbGFuZ3VhZ2VUYWc6IFwiZW4tVVNcIixcbiAgICBkZWxpbWl0ZXJzOiB7XG4gICAgICAgIHRob3VzYW5kczogXCIsXCIsXG4gICAgICAgIGRlY2ltYWw6IFwiLlwiXG4gICAgfSxcbiAgICBhYmJyZXZpYXRpb25zOiB7XG4gICAgICAgIHRob3VzYW5kOiBcImtcIixcbiAgICAgICAgbWlsbGlvbjogXCJtXCIsXG4gICAgICAgIGJpbGxpb246IFwiYlwiLFxuICAgICAgICB0cmlsbGlvbjogXCJ0XCJcbiAgICB9LFxuICAgIHNwYWNlU2VwYXJhdGVkOiBmYWxzZSxcbiAgICBvcmRpbmFsOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgbGV0IGIgPSBudW1iZXIgJSAxMDtcbiAgICAgICAgcmV0dXJuICh+fihudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gXCJ0aFwiIDogKGIgPT09IDEpID8gXCJzdFwiIDogKGIgPT09IDIpID8gXCJuZFwiIDogKGIgPT09IDMpID8gXCJyZFwiIDogXCJ0aFwiO1xuICAgIH0sXG4gICAgY3VycmVuY3k6IHtcbiAgICAgICAgc3ltYm9sOiBcIiRcIixcbiAgICAgICAgcG9zaXRpb246IFwicHJlZml4XCIsXG4gICAgICAgIGNvZGU6IFwiVVNEXCJcbiAgICB9LFxuICAgIGN1cnJlbmN5Rm9ybWF0OiB7XG4gICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICB0b3RhbExlbmd0aDogNCxcbiAgICAgICAgc3BhY2VTZXBhcmF0ZWQ6IHRydWVcbiAgICB9LFxuICAgIGZvcm1hdHM6IHtcbiAgICAgICAgZm91ckRpZ2l0czoge1xuICAgICAgICAgICAgdG90YWxMZW5ndGg6IDQsXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IFwiY3VycmVuY3lcIixcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDJcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsc05vQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDJcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhOb0RlY2ltYWxzOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IFwiY3VycmVuY3lcIixcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDBcbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgZ2xvYmFsU3RhdGUgPSByZXF1aXJlKFwiLi9nbG9iYWxTdGF0ZVwiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmNvbnN0IGJpbmFyeVN1ZmZpeGVzID0gW1wiQlwiLCBcIktpQlwiLCBcIk1pQlwiLCBcIkdpQlwiLCBcIlRpQlwiLCBcIlBpQlwiLCBcIkVpQlwiLCBcIlppQlwiLCBcIllpQlwiXTtcbmNvbnN0IGRlY2ltYWxTdWZmaXhlcyA9IFtcIkJcIiwgXCJLQlwiLCBcIk1CXCIsIFwiR0JcIiwgXCJUQlwiLCBcIlBCXCIsIFwiRUJcIiwgXCJaQlwiLCBcIllCXCJdO1xuY29uc3QgYnl0ZXMgPSB7XG4gICAgZ2VuZXJhbDoge3NjYWxlOiAxMDI0LCBzdWZmaXhlczogZGVjaW1hbFN1ZmZpeGVzLCBtYXJrZXI6IFwiYmRcIn0sXG4gICAgYmluYXJ5OiB7c2NhbGU6IDEwMjQsIHN1ZmZpeGVzOiBiaW5hcnlTdWZmaXhlcywgbWFya2VyOiBcImJcIn0sXG4gICAgZGVjaW1hbDoge3NjYWxlOiAxMDAwLCBzdWZmaXhlczogZGVjaW1hbFN1ZmZpeGVzLCBtYXJrZXI6IFwiZFwifVxufTtcblxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgdG90YWxMZW5ndGg6IDAsXG4gICAgY2hhcmFjdGVyaXN0aWM6IDAsXG4gICAgZm9yY2VBdmVyYWdlOiBmYWxzZSxcbiAgICBhdmVyYWdlOiBmYWxzZSxcbiAgICBtYW50aXNzYTogLTEsXG4gICAgb3B0aW9uYWxNYW50aXNzYTogdHJ1ZSxcbiAgICB0aG91c2FuZFNlcGFyYXRlZDogZmFsc2UsXG4gICAgc3BhY2VTZXBhcmF0ZWQ6IGZhbHNlLFxuICAgIG5lZ2F0aXZlOiBcInNpZ25cIixcbiAgICBmb3JjZVNpZ246IGZhbHNlXG59O1xuXG4vKipcbiAqIEVudHJ5IHBvaW50LiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFjY29yZGluZyB0byB0aGUgUFJPVklERURGT1JNQVQuXG4gKiBUaGlzIG1ldGhvZCBlbnN1cmUgdGhlIHByZWZpeCBhbmQgcG9zdGZpeCBhcmUgYWRkZWQgYXMgdGhlIGxhc3Qgc3RlcC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdHxzdHJpbmd9IFtwcm92aWRlZEZvcm1hdF0gLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0KGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCA9IHt9LCBudW1icm8pIHtcbiAgICBpZiAodHlwZW9mIHByb3ZpZGVkRm9ybWF0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gcGFyc2luZy5wYXJzZUZvcm1hdChwcm92aWRlZEZvcm1hdCk7XG4gICAgfVxuXG4gICAgbGV0IHZhbGlkID0gdmFsaWRhdGluZy52YWxpZGF0ZUZvcm1hdChwcm92aWRlZEZvcm1hdCk7XG5cbiAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgIHJldHVybiBcIkVSUk9SOiBpbnZhbGlkIGZvcm1hdFwiO1xuICAgIH1cblxuICAgIGxldCBwcmVmaXggPSBwcm92aWRlZEZvcm1hdC5wcmVmaXggfHwgXCJcIjtcbiAgICBsZXQgcG9zdGZpeCA9IHByb3ZpZGVkRm9ybWF0LnBvc3RmaXggfHwgXCJcIjtcblxuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1icm8oaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBudW1icm8pO1xuICAgIG91dHB1dCA9IGluc2VydFByZWZpeChvdXRwdXQsIHByZWZpeCk7XG4gICAgb3V0cHV0ID0gaW5zZXJ0UG9zdGZpeChvdXRwdXQsIHBvc3RmaXgpO1xuICAgIHJldHVybiBvdXRwdXQ7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhY2NvcmRpbmcgdG8gdGhlIFBST1ZJREVERk9STUFULlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE51bWJybyhpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIG51bWJybykge1xuICAgIHN3aXRjaCAocHJvdmlkZWRGb3JtYXQub3V0cHV0KSB7XG4gICAgICAgIGNhc2UgXCJjdXJyZW5jeVwiOiB7XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRDdXJyZW5jeShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJwZXJjZW50XCI6IHtcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50UGVyY2VudGFnZURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0UGVyY2VudGFnZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJieXRlXCI6XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudEJ5dGVEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdEJ5dGUoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgY2FzZSBcInRpbWVcIjpcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50VGltZURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0VGltZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICBjYXNlIFwib3JkaW5hbFwiOlxuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRPcmRpbmFsRGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRPcmRpbmFsKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXROdW1iZXIoe1xuICAgICAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICAgICAgICAgIG51bWJyb1xuICAgICAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgZGVjaW1hbCBieXRlIHVuaXQgKE1CKSBmb3IgdGhlIHByb3ZpZGVkIG51bWJybyBJTlNUQU5DRS5cbiAqIFdlIGdvIGZyb20gb25lIHVuaXQgdG8gYW5vdGhlciB1c2luZyB0aGUgZGVjaW1hbCBzeXN0ZW0gKDEwMDApLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBjb21wdXRlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldERlY2ltYWxCeXRlVW5pdChpbnN0YW5jZSkge1xuICAgIGxldCBkYXRhID0gYnl0ZXMuZGVjaW1hbDtcbiAgICByZXR1cm4gZ2V0Rm9ybWF0Qnl0ZVVuaXRzKGluc3RhbmNlLl92YWx1ZSwgZGF0YS5zdWZmaXhlcywgZGF0YS5zY2FsZSkuc3VmZml4O1xufVxuXG4vKipcbiAqIEdldCB0aGUgYmluYXJ5IGJ5dGUgdW5pdCAoTWlCKSBmb3IgdGhlIHByb3ZpZGVkIG51bWJybyBJTlNUQU5DRS5cbiAqIFdlIGdvIGZyb20gb25lIHVuaXQgdG8gYW5vdGhlciB1c2luZyB0aGUgZGVjaW1hbCBzeXN0ZW0gKDEwMjQpLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBjb21wdXRlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldEJpbmFyeUJ5dGVVbml0KGluc3RhbmNlKSB7XG4gICAgbGV0IGRhdGEgPSBieXRlcy5iaW5hcnk7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGRlY2ltYWwgYnl0ZSB1bml0IChNQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDI0KS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXRCeXRlVW5pdChpbnN0YW5jZSkge1xuICAgIGxldCBkYXRhID0gYnl0ZXMuZ2VuZXJhbDtcbiAgICByZXR1cm4gZ2V0Rm9ybWF0Qnl0ZVVuaXRzKGluc3RhbmNlLl92YWx1ZSwgZGF0YS5zdWZmaXhlcywgZGF0YS5zY2FsZSkuc3VmZml4O1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgdmFsdWUgYW5kIHRoZSBzdWZmaXggY29tcHV0ZWQgaW4gYnl0ZS5cbiAqIEl0IHVzZXMgdGhlIFNVRkZJWEVTIGFuZCB0aGUgU0NBTEUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gTnVtYmVyIHRvIGZvcm1hdFxuICogQHBhcmFtIHtbU3RyaW5nXX0gc3VmZml4ZXMgLSBMaXN0IG9mIHN1ZmZpeGVzXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgLSBOdW1iZXIgaW4tYmV0d2VlbiB0d28gdW5pdHNcbiAqIEByZXR1cm4ge3t2YWx1ZTogTnVtYmVyLCBzdWZmaXg6IFN0cmluZ319XG4gKi9cbmZ1bmN0aW9uIGdldEZvcm1hdEJ5dGVVbml0cyh2YWx1ZSwgc3VmZml4ZXMsIHNjYWxlKSB7XG4gICAgbGV0IHN1ZmZpeCA9IHN1ZmZpeGVzWzBdO1xuICAgIGxldCBhYnMgPSBNYXRoLmFicyh2YWx1ZSk7XG5cbiAgICBpZiAoYWJzID49IHNjYWxlKSB7XG4gICAgICAgIGZvciAobGV0IHBvd2VyID0gMTsgcG93ZXIgPCBzdWZmaXhlcy5sZW5ndGg7ICsrcG93ZXIpIHtcbiAgICAgICAgICAgIGxldCBtaW4gPSBNYXRoLnBvdyhzY2FsZSwgcG93ZXIpO1xuICAgICAgICAgICAgbGV0IG1heCA9IE1hdGgucG93KHNjYWxlLCBwb3dlciArIDEpO1xuXG4gICAgICAgICAgICBpZiAoYWJzID49IG1pbiAmJiBhYnMgPCBtYXgpIHtcbiAgICAgICAgICAgICAgICBzdWZmaXggPSBzdWZmaXhlc1twb3dlcl07XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIG1pbjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbHVlcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gW3NjYWxlXSBZQiBuZXZlciBzZXQgdGhlIHN1ZmZpeFxuICAgICAgICBpZiAoc3VmZml4ID09PSBzdWZmaXhlc1swXSkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KHNjYWxlLCBzdWZmaXhlcy5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIHN1ZmZpeCA9IHN1ZmZpeGVzW3N1ZmZpeGVzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHt2YWx1ZSwgc3VmZml4fTtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGJ5dGVzIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCwgYW5kIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRCeXRlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUsIG51bWJybykge1xuICAgIGxldCBiYXNlID0gcHJvdmlkZWRGb3JtYXQuYmFzZSB8fCBcImJpbmFyeVwiO1xuICAgIGxldCBiYXNlSW5mbyA9IGJ5dGVzW2Jhc2VdO1xuXG4gICAgbGV0IHt2YWx1ZSwgc3VmZml4fSA9IGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGJhc2VJbmZvLnN1ZmZpeGVzLCBiYXNlSW5mby5zY2FsZSk7XG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlOiBudW1icm8odmFsdWUpLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIGRlZmF1bHRzOiBzdGF0ZS5jdXJyZW50Qnl0ZURlZmF1bHRGb3JtYXQoKVxuICAgIH0pO1xuICAgIGxldCBhYmJyZXZpYXRpb25zID0gc3RhdGUuY3VycmVudEFiYnJldmlhdGlvbnMoKTtcbiAgICByZXR1cm4gYCR7b3V0cHV0fSR7YWJicmV2aWF0aW9ucy5zcGFjZWQgPyBcIiBcIiA6IFwiXCJ9JHtzdWZmaXh9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGFuIG9yZGluYWwgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULFxuICogYW5kIHRoZSBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE9yZGluYWwoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSkge1xuICAgIGxldCBvcmRpbmFsRm4gPSBzdGF0ZS5jdXJyZW50T3JkaW5hbCgpO1xuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1iZXIoe1xuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgIHN0YXRlXG4gICAgfSk7XG4gICAgbGV0IG9yZGluYWwgPSBvcmRpbmFsRm4oaW5zdGFuY2UuX3ZhbHVlKTtcblxuICAgIHJldHVybiBgJHtvdXRwdXR9JHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSR7b3JkaW5hbH1gO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYSB0aW1lIEhIOk1NOlNTLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0VGltZShpbnN0YW5jZSkge1xuICAgIGxldCBob3VycyA9IE1hdGguZmxvb3IoaW5zdGFuY2UuX3ZhbHVlIC8gNjAgLyA2MCk7XG4gICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKChpbnN0YW5jZS5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSkgLyA2MCk7XG4gICAgbGV0IHNlY29uZHMgPSBNYXRoLnJvdW5kKGluc3RhbmNlLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApIC0gKG1pbnV0ZXMgKiA2MCkpO1xuICAgIHJldHVybiBgJHtob3Vyc306JHsobWludXRlcyA8IDEwKSA/IFwiMFwiIDogXCJcIn0ke21pbnV0ZXN9OiR7KHNlY29uZHMgPCAxMCkgPyBcIjBcIiA6IFwiXCJ9JHtzZWNvbmRzfWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIHBlcmNlbnRhZ2UgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULFxuICogYW5kIHRoZSBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0UGVyY2VudGFnZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlLCBudW1icm8pIHtcbiAgICBsZXQgcHJlZml4U3ltYm9sID0gcHJvdmlkZWRGb3JtYXQucHJlZml4U3ltYm9sO1xuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlOiBudW1icm8oaW5zdGFuY2UuX3ZhbHVlICogMTAwKSxcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgIHN0YXRlXG4gICAgfSk7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgaWYgKHByZWZpeFN5bWJvbCkge1xuICAgICAgICByZXR1cm4gYCUke29wdGlvbnMuc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCJ9JHtvdXRwdXR9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCR7b3V0cHV0fSR7b3B0aW9ucy5zcGFjZVNlcGFyYXRlZCA/IFwiIFwiIDogXCJcIn0lYDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgcGVyY2VudGFnZSB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0Q3VycmVuY3koaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSkge1xuICAgIGNvbnN0IGN1cnJlbnRDdXJyZW5jeSA9IHN0YXRlLmN1cnJlbnRDdXJyZW5jeSgpO1xuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHByb3ZpZGVkRm9ybWF0KTtcbiAgICBsZXQgZGVjaW1hbFNlcGFyYXRvciA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3BhY2UgPSBcIlwiO1xuICAgIGxldCBhdmVyYWdlID0gISFvcHRpb25zLnRvdGFsTGVuZ3RoIHx8ICEhb3B0aW9ucy5mb3JjZUF2ZXJhZ2UgfHwgb3B0aW9ucy5hdmVyYWdlO1xuICAgIGxldCBwb3NpdGlvbiA9IHByb3ZpZGVkRm9ybWF0LmN1cnJlbmN5UG9zaXRpb24gfHwgY3VycmVudEN1cnJlbmN5LnBvc2l0aW9uO1xuICAgIGxldCBzeW1ib2wgPSBwcm92aWRlZEZvcm1hdC5jdXJyZW5jeVN5bWJvbCB8fCBjdXJyZW50Q3VycmVuY3kuc3ltYm9sO1xuXG4gICAgaWYgKG9wdGlvbnMuc3BhY2VTZXBhcmF0ZWQpIHtcbiAgICAgICAgc3BhY2UgPSBcIiBcIjtcbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPT09IFwiaW5maXhcIikge1xuICAgICAgICBkZWNpbWFsU2VwYXJhdG9yID0gc3BhY2UgKyBzeW1ib2wgKyBzcGFjZTtcbiAgICB9XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvclxuICAgIH0pO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSBcInByZWZpeFwiKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5fdmFsdWUgPCAwICYmIG9wdGlvbnMubmVnYXRpdmUgPT09IFwic2lnblwiKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBgLSR7c3BhY2V9JHtzeW1ib2x9JHtvdXRwdXQuc2xpY2UoMSl9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCA9IHN5bWJvbCArIHNwYWNlICsgb3V0cHV0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFwb3NpdGlvbiB8fCBwb3NpdGlvbiA9PT0gXCJwb3N0Zml4XCIpIHtcbiAgICAgICAgc3BhY2UgPSBhdmVyYWdlID8gXCJcIiA6IHNwYWNlO1xuICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArIHN5bWJvbDtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIGF2ZXJhZ2UgdmFsdWUgb3V0IG9mIFZBTFVFLlxuICogVGhlIG90aGVyIHBhcmFtZXRlcnMgYXJlIGNvbXB1dGF0aW9uIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gdmFsdWUgdG8gY29tcHV0ZVxuICogQHBhcmFtIHtzdHJpbmd9IFtmb3JjZUF2ZXJhZ2VdIC0gZm9yY2VkIHVuaXQgdXNlZCB0byBjb21wdXRlXG4gKiBAcGFyYW0ge3t9fSBhYmJyZXZpYXRpb25zIC0gcGFydCBvZiB0aGUgbGFuZ3VhZ2Ugc3BlY2lmaWNhdGlvblxuICogQHBhcmFtIHtib29sZWFufSBzcGFjZVNlcGFyYXRlZCAtIGB0cnVlYCBpZiBhIHNwYWNlIG11c3QgYmUgaW5zZXJ0ZWQgYmV0d2VlbiB0aGUgdmFsdWUgYW5kIHRoZSBhYmJyZXZpYXRpb25cbiAqIEBwYXJhbSB7bnVtYmVyfSBbdG90YWxMZW5ndGhdIC0gdG90YWwgbGVuZ3RoIG9mIHRoZSBvdXRwdXQgaW5jbHVkaW5nIHRoZSBjaGFyYWN0ZXJpc3RpYyBhbmQgdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHt7dmFsdWU6IG51bWJlciwgYWJicmV2aWF0aW9uOiBzdHJpbmcsIG1hbnRpc3NhUHJlY2lzaW9uOiBudW1iZXJ9fVxuICovXG5mdW5jdGlvbiBjb21wdXRlQXZlcmFnZSh7dmFsdWUsIGZvcmNlQXZlcmFnZSwgYWJicmV2aWF0aW9ucywgc3BhY2VTZXBhcmF0ZWQgPSBmYWxzZSwgdG90YWxMZW5ndGggPSAwfSkge1xuICAgIGxldCBhYmJyZXZpYXRpb24gPSBcIlwiO1xuICAgIGxldCBhYnMgPSBNYXRoLmFicyh2YWx1ZSk7XG4gICAgbGV0IG1hbnRpc3NhUHJlY2lzaW9uID0gLTE7XG5cbiAgICBpZiAoKGFicyA+PSBNYXRoLnBvdygxMCwgMTIpICYmICFmb3JjZUF2ZXJhZ2UpIHx8IChmb3JjZUF2ZXJhZ2UgPT09IFwidHJpbGxpb25cIikpIHtcbiAgICAgICAgLy8gdHJpbGxpb25cbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50cmlsbGlvbjtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAxMik7XG4gICAgfSBlbHNlIGlmICgoYWJzIDwgTWF0aC5wb3coMTAsIDEyKSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDkpICYmICFmb3JjZUF2ZXJhZ2UpIHx8IChmb3JjZUF2ZXJhZ2UgPT09IFwiYmlsbGlvblwiKSkge1xuICAgICAgICAvLyBiaWxsaW9uXG4gICAgICAgIGFiYnJldmlhdGlvbiA9IGFiYnJldmlhdGlvbnMuYmlsbGlvbjtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCA5KTtcbiAgICB9IGVsc2UgaWYgKChhYnMgPCBNYXRoLnBvdygxMCwgOSkgJiYgYWJzID49IE1hdGgucG93KDEwLCA2KSAmJiAhZm9yY2VBdmVyYWdlKSB8fCAoZm9yY2VBdmVyYWdlID09PSBcIm1pbGxpb25cIikpIHtcbiAgICAgICAgLy8gbWlsbGlvblxuICAgICAgICBhYmJyZXZpYXRpb24gPSBhYmJyZXZpYXRpb25zLm1pbGxpb247XG4gICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgNik7XG4gICAgfSBlbHNlIGlmICgoYWJzIDwgTWF0aC5wb3coMTAsIDYpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgMykgJiYgIWZvcmNlQXZlcmFnZSkgfHwgKGZvcmNlQXZlcmFnZSA9PT0gXCJ0aG91c2FuZFwiKSkge1xuICAgICAgICAvLyB0aG91c2FuZFxuICAgICAgICBhYmJyZXZpYXRpb24gPSBhYmJyZXZpYXRpb25zLnRob3VzYW5kO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDMpO1xuICAgIH1cblxuICAgIGxldCBvcHRpb25hbFNwYWNlID0gc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCI7XG5cbiAgICBpZiAoYWJicmV2aWF0aW9uKSB7XG4gICAgICAgIGFiYnJldmlhdGlvbiA9IG9wdGlvbmFsU3BhY2UgKyBhYmJyZXZpYXRpb247XG4gICAgfVxuXG4gICAgaWYgKHRvdGFsTGVuZ3RoKSB7XG4gICAgICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpWzBdO1xuICAgICAgICBtYW50aXNzYVByZWNpc2lvbiA9IE1hdGgubWF4KHRvdGFsTGVuZ3RoIC0gY2hhcmFjdGVyaXN0aWMubGVuZ3RoLCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3ZhbHVlLCBhYmJyZXZpYXRpb24sIG1hbnRpc3NhUHJlY2lzaW9ufTtcbn1cblxuLyoqXG4gKiBDb21wdXRlIGFuIGV4cG9uZW50aWFsIGZvcm0gZm9yIFZBTFVFLCB0YWtpbmcgaW50byBhY2NvdW50IENIQVJBQ1RFUklTVElDXG4gKiBpZiBwcm92aWRlZC5cbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIHZhbHVlIHRvIGNvbXB1dGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY2hhcmFjdGVyaXN0aWNQcmVjaXNpb25dIC0gb3B0aW9uYWwgY2hhcmFjdGVyaXN0aWMgbGVuZ3RoXG4gKiBAcmV0dXJuIHt7dmFsdWU6IG51bWJlciwgYWJicmV2aWF0aW9uOiBzdHJpbmd9fVxuICovXG5mdW5jdGlvbiBjb21wdXRlRXhwb25lbnRpYWwoe3ZhbHVlLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbiA9IDB9KSB7XG4gICAgbGV0IFtudW1iZXJTdHJpbmcsIGV4cG9uZW50aWFsXSA9IHZhbHVlLnRvRXhwb25lbnRpYWwoKS5zcGxpdChcImVcIik7XG4gICAgbGV0IG51bWJlciA9ICtudW1iZXJTdHJpbmc7XG5cbiAgICBpZiAoIWNoYXJhY3RlcmlzdGljUHJlY2lzaW9uKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZTogbnVtYmVyLFxuICAgICAgICAgICAgYWJicmV2aWF0aW9uOiBgZSR7ZXhwb25lbnRpYWx9YFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGxldCBjaGFyYWN0ZXJpc3RpY0xlbmd0aCA9IDE7IC8vIHNlZSBgdG9FeHBvbmVudGlhbGBcblxuICAgIGlmIChjaGFyYWN0ZXJpc3RpY0xlbmd0aCA8IGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uKSB7XG4gICAgICAgIG51bWJlciA9IG51bWJlciAqIE1hdGgucG93KDEwLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbiAtIGNoYXJhY3RlcmlzdGljTGVuZ3RoKTtcbiAgICAgICAgZXhwb25lbnRpYWwgPSArZXhwb25lbnRpYWwgLSAoY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gLSBjaGFyYWN0ZXJpc3RpY0xlbmd0aCk7XG4gICAgICAgIGV4cG9uZW50aWFsID0gZXhwb25lbnRpYWwgPj0gMCA/IGArJHtleHBvbmVudGlhbH1gIDogZXhwb25lbnRpYWw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IG51bWJlcixcbiAgICAgICAgYWJicmV2aWF0aW9uOiBgZSR7ZXhwb25lbnRpYWx9YFxuICAgIH07XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIG9mIE5VTUJFUiB6ZXJvLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgLSBMZW5ndGggb2YgdGhlIG91dHB1dFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB6ZXJvZXMobnVtYmVyKSB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXI7IGkrKykge1xuICAgICAgICByZXN1bHQgKz0gXCIwXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIFZBTFVFIHdpdGggYSBQUkVDSVNJT04tbG9uZyBtYW50aXNzYS5cbiAqIFRoaXMgbWV0aG9kIGlzIGZvciBsYXJnZS9zbWFsbCBudW1iZXJzIG9ubHkgKGEuay5hLiBpbmNsdWRpbmcgYSBcImVcIikuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHByZWNpc2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIGxlbmd0aCBmb3IgdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvRml4ZWRMYXJnZSh2YWx1ZSwgcHJlY2lzaW9uKSB7XG4gICAgbGV0IHJlc3VsdCA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgICBsZXQgW2Jhc2UsIGV4cF0gPSByZXN1bHQuc3BsaXQoXCJlXCIpO1xuXG4gICAgbGV0IFtjaGFyYWN0ZXJpc3RpYywgbWFudGlzc2EgPSBcIlwiXSA9IGJhc2Uuc3BsaXQoXCIuXCIpO1xuXG4gICAgaWYgKCtleHAgPiAwKSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljICsgbWFudGlzc2EgKyB6ZXJvZXMoZXhwIC0gbWFudGlzc2EubGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJlZml4ID0gXCIuXCI7XG5cbiAgICAgICAgaWYgKCtjaGFyYWN0ZXJpc3RpYyA8IDApIHtcbiAgICAgICAgICAgIHByZWZpeCA9IGAtMCR7cHJlZml4fWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmVmaXggPSBgMCR7cHJlZml4fWA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3VmZml4ID0gKHplcm9lcygtZXhwIC0gMSkgKyBNYXRoLmFicyhjaGFyYWN0ZXJpc3RpYykgKyBtYW50aXNzYSkuc3Vic3RyKDAsIHByZWNpc2lvbik7XG4gICAgICAgIGlmIChzdWZmaXgubGVuZ3RoIDwgcHJlY2lzaW9uKSB7XG4gICAgICAgICAgICBzdWZmaXggKz0gemVyb2VzKHByZWNpc2lvbiAtIHN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IHByZWZpeCArIHN1ZmZpeDtcbiAgICB9XG5cbiAgICBpZiAoK2V4cCA+IDAgJiYgcHJlY2lzaW9uID4gMCkge1xuICAgICAgICByZXN1bHQgKz0gYC4ke3plcm9lcyhwcmVjaXNpb24pfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIFZBTFVFIHdpdGggYSBQUkVDSVNJT04tbG9uZyBtYW50aXNzYS5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgdG8gcHJlY2lzZVxuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgbGVuZ3RoIGZvciB0aGUgbWFudGlzc2FcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdG9GaXhlZCh2YWx1ZSwgcHJlY2lzaW9uKSB7XG4gICAgaWYgKHZhbHVlLnRvU3RyaW5nKCkuaW5kZXhPZihcImVcIikgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0b0ZpeGVkTGFyZ2UodmFsdWUsIHByZWNpc2lvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIChNYXRoLnJvdW5kKCtgJHt2YWx1ZX1lKyR7cHJlY2lzaW9ufWApIC8gKE1hdGgucG93KDEwLCBwcmVjaXNpb24pKSkudG9GaXhlZChwcmVjaXNpb24pO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBPVVRQVVQgd2l0aCBhIG1hbnRpc3NhIHByZWNpc2lvbiBvZiBQUkVDSVNJT04uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25hbE1hbnRpc3NhIC0gYHRydWVgIGlmIHRoZSBtYW50aXNzYSBpcyBvbWl0dGVkIHdoZW4gaXQncyBvbmx5IHplcm9lc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgcHJlY2lzaW9uIG9mIHRoZSBtYW50aXNzYVxuICogQHBhcmFtIHtib29sZWFufSB0cmltIC0gZGVzaXJlZCBwcmVjaXNpb24gb2YgdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHNldE1hbnRpc3NhUHJlY2lzaW9uKG91dHB1dCwgdmFsdWUsIG9wdGlvbmFsTWFudGlzc2EsIHByZWNpc2lvbiwgdHJpbSkge1xuICAgIGlmIChwcmVjaXNpb24gPT09IC0xKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCA9IHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbik7XG4gICAgbGV0IFtjdXJyZW50Q2hhcmFjdGVyaXN0aWMsIGN1cnJlbnRNYW50aXNzYSA9IFwiXCJdID0gcmVzdWx0LnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpO1xuXG4gICAgaWYgKGN1cnJlbnRNYW50aXNzYS5tYXRjaCgvXjArJC8pICYmIChvcHRpb25hbE1hbnRpc3NhIHx8IHRyaW0pKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50Q2hhcmFjdGVyaXN0aWM7XG4gICAgfVxuXG4gICAgbGV0IGhhc1RyYWlsaW5nWmVyb2VzID0gY3VycmVudE1hbnRpc3NhLm1hdGNoKC8wKyQvKTtcbiAgICBpZiAodHJpbSAmJiBoYXNUcmFpbGluZ1plcm9lcykge1xuICAgICAgICByZXR1cm4gYCR7Y3VycmVudENoYXJhY3RlcmlzdGljfS4ke2N1cnJlbnRNYW50aXNzYS50b1N0cmluZygpLnNsaWNlKDAsIGhhc1RyYWlsaW5nWmVyb2VzLmluZGV4KX1gO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgT1VUUFVUIHdpdGggYSBjaGFyYWN0ZXJpc3RpYyBwcmVjaXNpb24gb2YgUFJFQ0lTSU9OLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIGJlaW5nIGN1cnJlbnRseSBmb3JtYXR0ZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyAtIGB0cnVlYCBpZiB0aGUgY2hhcmFjdGVyaXN0aWMgaXMgb21pdHRlZCB3aGVuIGl0J3Mgb25seSB6ZXJvZXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIHByZWNpc2lvbiBvZiB0aGUgY2hhcmFjdGVyaXN0aWNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gc2V0Q2hhcmFjdGVyaXN0aWNQcmVjaXNpb24ob3V0cHV0LCB2YWx1ZSwgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYywgcHJlY2lzaW9uKSB7XG4gICAgbGV0IHJlc3VsdCA9IG91dHB1dDtcbiAgICBsZXQgW2N1cnJlbnRDaGFyYWN0ZXJpc3RpYywgY3VycmVudE1hbnRpc3NhXSA9IHJlc3VsdC50b1N0cmluZygpLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmIChjdXJyZW50Q2hhcmFjdGVyaXN0aWMubWF0Y2goL14tPzAkLykgJiYgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYykge1xuICAgICAgICBpZiAoIWN1cnJlbnRNYW50aXNzYSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5yZXBsYWNlKFwiMFwiLCBcIlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBgJHtjdXJyZW50Q2hhcmFjdGVyaXN0aWMucmVwbGFjZShcIjBcIiwgXCJcIil9LiR7Y3VycmVudE1hbnRpc3NhfWA7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5sZW5ndGggPCBwcmVjaXNpb24pIHtcbiAgICAgICAgbGV0IG1pc3NpbmdaZXJvcyA9IHByZWNpc2lvbiAtIGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWlzc2luZ1plcm9zOyBpKyspIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGAwJHtyZXN1bHR9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGluZGV4ZXMgd2hlcmUgYXJlIHRoZSBncm91cCBzZXBhcmF0aW9ucyBhZnRlciBzcGxpdHRpbmdcbiAqIGB0b3RhbExlbmd0aGAgaW4gZ3JvdXAgb2YgYGdyb3VwU2l6ZWAgc2l6ZS5cbiAqIEltcG9ydGFudDogd2Ugc3RhcnQgZ3JvdXBpbmcgZnJvbSB0aGUgcmlnaHQgaGFuZCBzaWRlLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB0b3RhbExlbmd0aCAtIHRvdGFsIGxlbmd0aCBvZiB0aGUgY2hhcmFjdGVyaXN0aWMgdG8gc3BsaXRcbiAqIEBwYXJhbSB7bnVtYmVyfSBncm91cFNpemUgLSBsZW5ndGggb2YgZWFjaCBncm91cFxuICogQHJldHVybiB7W251bWJlcl19XG4gKi9cbmZ1bmN0aW9uIGluZGV4ZXNPZkdyb3VwU3BhY2VzKHRvdGFsTGVuZ3RoLCBncm91cFNpemUpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgbGV0IGNvdW50ZXIgPSAwO1xuICAgIGZvciAobGV0IGkgPSB0b3RhbExlbmd0aDsgaSA+IDA7IGktLSkge1xuICAgICAgICBpZiAoY291bnRlciA9PT0gZ3JvdXBTaXplKSB7XG4gICAgICAgICAgICByZXN1bHQudW5zaGlmdChpKTtcbiAgICAgICAgICAgIGNvdW50ZXIgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50ZXIrKztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlcGxhY2UgdGhlIGRlY2ltYWwgc2VwYXJhdG9yIHdpdGggREVDSU1BTFNFUEFSQVRPUiBhbmQgaW5zZXJ0IHRob3VzYW5kXG4gKiBzZXBhcmF0b3JzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIGJlaW5nIGN1cnJlbnRseSBmb3JtYXR0ZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gdGhvdXNhbmRTZXBhcmF0ZWQgLSBgdHJ1ZWAgaWYgdGhlIGNoYXJhY3RlcmlzdGljIG11c3QgYmUgc2VwYXJhdGVkXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IGRlY2ltYWxTZXBhcmF0b3IgLSBzdHJpbmcgdG8gdXNlIGFzIGRlY2ltYWwgc2VwYXJhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHJlcGxhY2VEZWxpbWl0ZXJzKG91dHB1dCwgdmFsdWUsIHRob3VzYW5kU2VwYXJhdGVkLCBzdGF0ZSwgZGVjaW1hbFNlcGFyYXRvcikge1xuICAgIGxldCBkZWxpbWl0ZXJzID0gc3RhdGUuY3VycmVudERlbGltaXRlcnMoKTtcbiAgICBsZXQgdGhvdXNhbmRTZXBhcmF0b3IgPSBkZWxpbWl0ZXJzLnRob3VzYW5kcztcbiAgICBkZWNpbWFsU2VwYXJhdG9yID0gZGVjaW1hbFNlcGFyYXRvciB8fCBkZWxpbWl0ZXJzLmRlY2ltYWw7XG4gICAgbGV0IHRob3VzYW5kc1NpemUgPSBkZWxpbWl0ZXJzLnRob3VzYW5kc1NpemUgfHwgMztcblxuICAgIGxldCByZXN1bHQgPSBvdXRwdXQudG9TdHJpbmcoKTtcbiAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSByZXN1bHQuc3BsaXQoXCIuXCIpWzBdO1xuICAgIGxldCBtYW50aXNzYSA9IHJlc3VsdC5zcGxpdChcIi5cIilbMV07XG5cbiAgICBpZiAodGhvdXNhbmRTZXBhcmF0ZWQpIHtcbiAgICAgICAgaWYgKHZhbHVlIDwgMCkge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBtaW51cyBzaWduXG4gICAgICAgICAgICBjaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLnNsaWNlKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGluZGV4ZXNUb0luc2VydFRob3VzYW5kRGVsaW1pdGVycyA9IGluZGV4ZXNPZkdyb3VwU3BhY2VzKGNoYXJhY3RlcmlzdGljLmxlbmd0aCwgdGhvdXNhbmRzU2l6ZSk7XG4gICAgICAgIGluZGV4ZXNUb0luc2VydFRob3VzYW5kRGVsaW1pdGVycy5mb3JFYWNoKChwb3NpdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljID0gY2hhcmFjdGVyaXN0aWMuc2xpY2UoMCwgcG9zaXRpb24gKyBpbmRleCkgKyB0aG91c2FuZFNlcGFyYXRvciArIGNoYXJhY3RlcmlzdGljLnNsaWNlKHBvc2l0aW9uICsgaW5kZXgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodmFsdWUgPCAwKSB7XG4gICAgICAgICAgICAvLyBBZGQgYmFjayB0aGUgbWludXMgc2lnblxuICAgICAgICAgICAgY2hhcmFjdGVyaXN0aWMgPSBgLSR7Y2hhcmFjdGVyaXN0aWN9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghbWFudGlzc2EpIHtcbiAgICAgICAgcmVzdWx0ID0gY2hhcmFjdGVyaXN0aWM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gY2hhcmFjdGVyaXN0aWMgKyBkZWNpbWFsU2VwYXJhdG9yICsgbWFudGlzc2E7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwcm92aWRlZCBBQkJSRVZJQVRJT04gYXQgdGhlIGVuZCBvZiBPVVRQVVQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJicmV2aWF0aW9uIC0gYWJicmV2aWF0aW9uIHRvIGFwcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0QWJicmV2aWF0aW9uKG91dHB1dCwgYWJicmV2aWF0aW9uKSB7XG4gICAgcmV0dXJuIG91dHB1dCArIGFiYnJldmlhdGlvbjtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHBvc2l0aXZlL25lZ2F0aXZlIHNpZ24gYWNjb3JkaW5nIHRvIHRoZSBORUdBVElWRSBmbGFnLlxuICogSWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlIGJ1dCBzdGlsbCBvdXRwdXQgYXMgMCwgdGhlIG5lZ2F0aXZlIHNpZ24gaXMgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gbmVnYXRpdmUgLSBmbGFnIGZvciB0aGUgbmVnYXRpdmUgZm9ybSAoXCJzaWduXCIgb3IgXCJwYXJlbnRoZXNpc1wiKVxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGlmICgrb3V0cHV0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQucmVwbGFjZShcIi1cIiwgXCJcIik7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID4gMCkge1xuICAgICAgICByZXR1cm4gYCske291dHB1dH1gO1xuICAgIH1cblxuICAgIGlmIChuZWdhdGl2ZSA9PT0gXCJzaWduXCIpIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCgke291dHB1dC5yZXBsYWNlKFwiLVwiLCBcIlwiKX0pYDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHByb3ZpZGVkIFBSRUZJWCBhdCB0aGUgc3RhcnQgb2YgT1VUUFVULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIGFiYnJldmlhdGlvbiB0byBwcmVwZW5kXG4gKiBAcmV0dXJuIHsqfVxuICovXG5mdW5jdGlvbiBpbnNlcnRQcmVmaXgob3V0cHV0LCBwcmVmaXgpIHtcbiAgICByZXR1cm4gcHJlZml4ICsgb3V0cHV0O1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgcHJvdmlkZWQgUE9TVEZJWCBhdCB0aGUgZW5kIG9mIE9VVFBVVC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBwb3N0Zml4IC0gYWJicmV2aWF0aW9uIHRvIGFwcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0UG9zdGZpeChvdXRwdXQsIHBvc3RmaXgpIHtcbiAgICByZXR1cm4gb3V0cHV0ICsgcG9zdGZpeDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgbnVtYmVyIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKiBUaGlzIGlzIHRoZSBrZXkgbWV0aG9kIG9mIHRoZSBmcmFtZXdvcmshXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gW3Byb3ZpZGVkRm9ybWF0XSAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gZGVjaW1hbFNlcGFyYXRvciAtIHN0cmluZyB0byB1c2UgYXMgZGVjaW1hbCBzZXBhcmF0b3JcbiAqIEBwYXJhbSB7e319IGRlZmF1bHRzIC0gU2V0IG9mIGRlZmF1bHQgdmFsdWVzIHVzZWQgZm9yIGZvcm1hdHRpbmdcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0TnVtYmVyKHtpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlID0gZ2xvYmFsU3RhdGUsIGRlY2ltYWxTZXBhcmF0b3IsIGRlZmF1bHRzID0gc3RhdGUuY3VycmVudERlZmF1bHRzKCl9KSB7XG4gICAgbGV0IHZhbHVlID0gaW5zdGFuY2UuX3ZhbHVlO1xuXG4gICAgaWYgKHZhbHVlID09PSAwICYmIHN0YXRlLmhhc1plcm9Gb3JtYXQoKSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZ2V0WmVyb0Zvcm1hdCgpO1xuICAgIH1cblxuICAgIGlmICghaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICAgIH1cblxuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIGRlZmF1bHRzLCBwcm92aWRlZEZvcm1hdCk7XG5cbiAgICBsZXQgdG90YWxMZW5ndGggPSBvcHRpb25zLnRvdGFsTGVuZ3RoO1xuICAgIGxldCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbiA9IHRvdGFsTGVuZ3RoID8gMCA6IG9wdGlvbnMuY2hhcmFjdGVyaXN0aWM7XG4gICAgbGV0IG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMgPSBvcHRpb25zLm9wdGlvbmFsQ2hhcmFjdGVyaXN0aWM7XG4gICAgbGV0IGZvcmNlQXZlcmFnZSA9IG9wdGlvbnMuZm9yY2VBdmVyYWdlO1xuICAgIGxldCBhdmVyYWdlID0gISF0b3RhbExlbmd0aCB8fCAhIWZvcmNlQXZlcmFnZSB8fCBvcHRpb25zLmF2ZXJhZ2U7XG5cbiAgICAvLyBkZWZhdWx0IHdoZW4gYXZlcmFnaW5nIGlzIHRvIGNob3Agb2ZmIGRlY2ltYWxzXG4gICAgbGV0IG1hbnRpc3NhUHJlY2lzaW9uID0gdG90YWxMZW5ndGggPyAtMSA6IChhdmVyYWdlICYmIHByb3ZpZGVkRm9ybWF0Lm1hbnRpc3NhID09PSB1bmRlZmluZWQgPyAwIDogb3B0aW9ucy5tYW50aXNzYSk7XG4gICAgbGV0IG9wdGlvbmFsTWFudGlzc2EgPSB0b3RhbExlbmd0aCA/IGZhbHNlIDogKHByb3ZpZGVkRm9ybWF0Lm9wdGlvbmFsTWFudGlzc2EgPT09IHVuZGVmaW5lZCA/IG1hbnRpc3NhUHJlY2lzaW9uID09PSAtMSA6IG9wdGlvbnMub3B0aW9uYWxNYW50aXNzYSk7XG4gICAgbGV0IHRyaW1NYW50aXNzYSA9IG9wdGlvbnMudHJpbU1hbnRpc3NhO1xuICAgIGxldCB0aG91c2FuZFNlcGFyYXRlZCA9IG9wdGlvbnMudGhvdXNhbmRTZXBhcmF0ZWQ7XG4gICAgbGV0IHNwYWNlU2VwYXJhdGVkID0gb3B0aW9ucy5zcGFjZVNlcGFyYXRlZDtcbiAgICBsZXQgbmVnYXRpdmUgPSBvcHRpb25zLm5lZ2F0aXZlO1xuICAgIGxldCBmb3JjZVNpZ24gPSBvcHRpb25zLmZvcmNlU2lnbjtcbiAgICBsZXQgZXhwb25lbnRpYWwgPSBvcHRpb25zLmV4cG9uZW50aWFsO1xuXG4gICAgbGV0IGFiYnJldmlhdGlvbiA9IFwiXCI7XG5cbiAgICBpZiAoYXZlcmFnZSkge1xuICAgICAgICBsZXQgZGF0YSA9IGNvbXB1dGVBdmVyYWdlKHtcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZm9yY2VBdmVyYWdlLFxuICAgICAgICAgICAgYWJicmV2aWF0aW9uczogc3RhdGUuY3VycmVudEFiYnJldmlhdGlvbnMoKSxcbiAgICAgICAgICAgIHNwYWNlU2VwYXJhdGVkOiBzcGFjZVNlcGFyYXRlZCxcbiAgICAgICAgICAgIHRvdGFsTGVuZ3RoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhbHVlID0gZGF0YS52YWx1ZTtcbiAgICAgICAgYWJicmV2aWF0aW9uICs9IGRhdGEuYWJicmV2aWF0aW9uO1xuXG4gICAgICAgIGlmICh0b3RhbExlbmd0aCkge1xuICAgICAgICAgICAgbWFudGlzc2FQcmVjaXNpb24gPSBkYXRhLm1hbnRpc3NhUHJlY2lzaW9uO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4cG9uZW50aWFsKSB7XG4gICAgICAgIGxldCBkYXRhID0gY29tcHV0ZUV4cG9uZW50aWFsKHtcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb25cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFsdWUgPSBkYXRhLnZhbHVlO1xuICAgICAgICBhYmJyZXZpYXRpb24gPSBkYXRhLmFiYnJldmlhdGlvbiArIGFiYnJldmlhdGlvbjtcbiAgICB9XG5cbiAgICBsZXQgb3V0cHV0ID0gc2V0TWFudGlzc2FQcmVjaXNpb24odmFsdWUudG9TdHJpbmcoKSwgdmFsdWUsIG9wdGlvbmFsTWFudGlzc2EsIG1hbnRpc3NhUHJlY2lzaW9uLCB0cmltTWFudGlzc2EpO1xuICAgIG91dHB1dCA9IHNldENoYXJhY3RlcmlzdGljUHJlY2lzaW9uKG91dHB1dCwgdmFsdWUsIG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMsIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uKTtcbiAgICBvdXRwdXQgPSByZXBsYWNlRGVsaW1pdGVycyhvdXRwdXQsIHZhbHVlLCB0aG91c2FuZFNlcGFyYXRlZCwgc3RhdGUsIGRlY2ltYWxTZXBhcmF0b3IpO1xuXG4gICAgaWYgKGF2ZXJhZ2UgfHwgZXhwb25lbnRpYWwpIHtcbiAgICAgICAgb3V0cHV0ID0gaW5zZXJ0QWJicmV2aWF0aW9uKG91dHB1dCwgYWJicmV2aWF0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoZm9yY2VTaWduIHx8IHZhbHVlIDwgMCkge1xuICAgICAgICBvdXRwdXQgPSBpbnNlcnRTaWduKG91dHB1dCwgdmFsdWUsIG5lZ2F0aXZlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIElmIEZPUk1BVCBpcyBub24tbnVsbCBhbmQgbm90IGp1c3QgYW4gb3V0cHV0LCByZXR1cm4gRk9STUFULlxuICogUmV0dXJuIERFRkFVTFRGT1JNQVQgb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSBwcm92aWRlZEZvcm1hdFxuICogQHBhcmFtIGRlZmF1bHRGb3JtYXRcbiAqL1xuZnVuY3Rpb24gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBkZWZhdWx0Rm9ybWF0KSB7XG4gICAgaWYgKCFwcm92aWRlZEZvcm1hdCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdEZvcm1hdDtcbiAgICB9XG5cbiAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHByb3ZpZGVkRm9ybWF0KTtcbiAgICBpZiAoa2V5cy5sZW5ndGggPT09IDEgJiYga2V5c1swXSA9PT0gXCJvdXRwdXRcIikge1xuICAgICAgICByZXR1cm4gZGVmYXVsdEZvcm1hdDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvdmlkZWRGb3JtYXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKG51bWJybykgPT4gKHtcbiAgICBmb3JtYXQ6ICguLi5hcmdzKSA9PiBmb3JtYXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBnZXRCeXRlVW5pdDogKC4uLmFyZ3MpID0+IGdldEJ5dGVVbml0KC4uLmFyZ3MsIG51bWJybyksXG4gICAgZ2V0QmluYXJ5Qnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXRCaW5hcnlCeXRlVW5pdCguLi5hcmdzLCBudW1icm8pLFxuICAgIGdldERlY2ltYWxCeXRlVW5pdDogKC4uLmFyZ3MpID0+IGdldERlY2ltYWxCeXRlVW5pdCguLi5hcmdzLCBudW1icm8pLFxuICAgIGZvcm1hdE9yRGVmYXVsdFxufSk7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgZW5VUyA9IHJlcXVpcmUoXCIuL2VuLVVTXCIpO1xuY29uc3QgdmFsaWRhdGluZyA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRpbmdcIik7XG5jb25zdCBwYXJzaW5nID0gcmVxdWlyZShcIi4vcGFyc2luZ1wiKTtcblxubGV0IHN0YXRlID0ge307XG5cbmxldCBjdXJyZW50TGFuZ3VhZ2VUYWcgPSB1bmRlZmluZWQ7XG5sZXQgbGFuZ3VhZ2VzID0ge307XG5cbmxldCB6ZXJvRm9ybWF0ID0gbnVsbDtcblxubGV0IGdsb2JhbERlZmF1bHRzID0ge307XG5cbmZ1bmN0aW9uIGNob29zZUxhbmd1YWdlKHRhZykgeyBjdXJyZW50TGFuZ3VhZ2VUYWcgPSB0YWc7IH1cblxuZnVuY3Rpb24gY3VycmVudExhbmd1YWdlRGF0YSgpIHsgcmV0dXJuIGxhbmd1YWdlc1tjdXJyZW50TGFuZ3VhZ2VUYWddOyB9XG5cbi8qKlxuICogUmV0dXJuIGFsbCB0aGUgcmVnaXN0ZXIgbGFuZ3VhZ2VzXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmxhbmd1YWdlcyA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIGxhbmd1YWdlcyk7XG5cbi8vXG4vLyBDdXJyZW50IGxhbmd1YWdlIGFjY2Vzc29yc1xuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgdGFnXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5zdGF0ZS5jdXJyZW50TGFuZ3VhZ2UgPSAoKSA9PiBjdXJyZW50TGFuZ3VhZ2VUYWc7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGN1cnJlbmN5IGRhdGFcbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudEN1cnJlbmN5ID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLmN1cnJlbmN5O1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBhYmJyZXZpYXRpb25zIGRhdGFcbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudEFiYnJldmlhdGlvbnMgPSAoKSA9PiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuYWJicmV2aWF0aW9ucztcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgZGVsaW1pdGVycyBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnREZWxpbWl0ZXJzID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLmRlbGltaXRlcnM7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIG9yZGluYWwgZnVuY3Rpb25cbiAqXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn1cbiAqL1xuc3RhdGUuY3VycmVudE9yZGluYWwgPSAoKSA9PiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkub3JkaW5hbDtcblxuLy9cbi8vIERlZmF1bHRzXG4vL1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBmb3JtYXR0aW5nIGRlZmF1bHRzLlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgZ2xvYmFsbHkgZGVmaW5lZCBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudERlZmF1bHRzID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudExhbmd1YWdlRGF0YSgpLmRlZmF1bHRzLCBnbG9iYWxEZWZhdWx0cyk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBvcmRpbmFsIGRlZmF1bHQtZm9ybWF0LlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2Ugb3JkaW5hbCBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50T3JkaW5hbERlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLm9yZGluYWxGb3JtYXQpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgYnl0ZSBkZWZhdWx0LWZvcm1hdC5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIGJ5dGUgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudEJ5dGVEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5ieXRlRm9ybWF0KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHBlcmNlbnRhZ2UgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBwZXJjZW50YWdlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRQZXJjZW50YWdlRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkucGVyY2VudGFnZUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW5jeSBkZWZhdWx0LWZvcm1hdC5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIGN1cnJlbmN5IGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRDdXJyZW5jeURlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLmN1cnJlbmN5Rm9ybWF0KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHRpbWUgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50VGltZURlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLnRpbWVGb3JtYXQpO1xuXG4vKipcbiAqIFNldCB0aGUgZ2xvYmFsIGZvcm1hdHRpbmcgZGVmYXVsdHMuXG4gKlxuICogQHBhcmFtIHt7fXxzdHJpbmd9IGZvcm1hdCAtIGZvcm1hdHRpbmcgb3B0aW9ucyB0byB1c2UgYXMgZGVmYXVsdHNcbiAqL1xuc3RhdGUuc2V0RGVmYXVsdHMgPSAoZm9ybWF0KSA9PiB7XG4gICAgZm9ybWF0ID0gcGFyc2luZy5wYXJzZUZvcm1hdChmb3JtYXQpO1xuICAgIGlmICh2YWxpZGF0aW5nLnZhbGlkYXRlRm9ybWF0KGZvcm1hdCkpIHtcbiAgICAgICAgZ2xvYmFsRGVmYXVsdHMgPSBmb3JtYXQ7XG4gICAgfVxufTtcblxuLy9cbi8vIFplcm8gZm9ybWF0XG4vL1xuXG4vKipcbiAqIFJldHVybiB0aGUgZm9ybWF0IHN0cmluZyBmb3IgMC5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbnN0YXRlLmdldFplcm9Gb3JtYXQgPSAoKSA9PiB6ZXJvRm9ybWF0O1xuXG4vKipcbiAqIFNldCBhIFNUUklORyB0byBvdXRwdXQgd2hlbiB0aGUgdmFsdWUgaXMgMC5cbiAqXG4gKiBAcGFyYW0ge3t9fHN0cmluZ30gc3RyaW5nIC0gc3RyaW5nIHRvIHNldFxuICovXG5zdGF0ZS5zZXRaZXJvRm9ybWF0ID0gKHN0cmluZykgPT4gemVyb0Zvcm1hdCA9IHR5cGVvZihzdHJpbmcpID09PSBcInN0cmluZ1wiID8gc3RyaW5nIDogbnVsbDtcblxuLyoqXG4gKiBSZXR1cm4gdHJ1ZSBpZiBhIGZvcm1hdCBmb3IgMCBoYXMgYmVlbiBzZXQgYWxyZWFkeS5cbiAqXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5zdGF0ZS5oYXNaZXJvRm9ybWF0ID0gKCkgPT4gemVyb0Zvcm1hdCAhPT0gbnVsbDtcblxuLy9cbi8vIEdldHRlcnMvU2V0dGVyc1xuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxhbmd1YWdlIGRhdGEgZm9yIHRoZSBwcm92aWRlZCBUQUcuXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgZGF0YSBpZiBubyB0YWcgaXMgcHJvdmlkZWQuXG4gKlxuICogVGhyb3cgYW4gZXJyb3IgaWYgdGhlIHRhZyBkb2Vzbid0IG1hdGNoIGFueSByZWdpc3RlcmVkIGxhbmd1YWdlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbdGFnXSAtIGxhbmd1YWdlIHRhZyBvZiBhIHJlZ2lzdGVyZWQgbGFuZ3VhZ2VcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5sYW5ndWFnZURhdGEgPSAodGFnKSA9PiB7XG4gICAgaWYgKHRhZykge1xuICAgICAgICBpZiAobGFuZ3VhZ2VzW3RhZ10pIHtcbiAgICAgICAgICAgIHJldHVybiBsYW5ndWFnZXNbdGFnXTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdGFnIFwiJHt0YWd9XCJgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudExhbmd1YWdlRGF0YSgpO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciB0aGUgcHJvdmlkZWQgREFUQSBhcyBhIGxhbmd1YWdlIGlmIGFuZCBvbmx5IGlmIHRoZSBkYXRhIGlzIHZhbGlkLlxuICogSWYgdGhlIGRhdGEgaXMgbm90IHZhbGlkLCBhbiBlcnJvciBpcyB0aHJvd24uXG4gKlxuICogV2hlbiBVU0VMQU5HVUFHRSBpcyB0cnVlLCB0aGUgcmVnaXN0ZXJlZCBsYW5ndWFnZSBpcyB0aGVuIHVzZWQuXG4gKlxuICogQHBhcmFtIHt7fX0gZGF0YSAtIGxhbmd1YWdlIGRhdGEgdG8gcmVnaXN0ZXJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VzZUxhbmd1YWdlXSAtIGB0cnVlYCBpZiB0aGUgcHJvdmlkZWQgZGF0YSBzaG91bGQgYmVjb21lIHRoZSBjdXJyZW50IGxhbmd1YWdlXG4gKi9cbnN0YXRlLnJlZ2lzdGVyTGFuZ3VhZ2UgPSAoZGF0YSwgdXNlTGFuZ3VhZ2UgPSBmYWxzZSkgPT4ge1xuICAgIGlmICghdmFsaWRhdGluZy52YWxpZGF0ZUxhbmd1YWdlKGRhdGEpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgbGFuZ3VhZ2UgZGF0YVwiKTtcbiAgICB9XG5cbiAgICBsYW5ndWFnZXNbZGF0YS5sYW5ndWFnZVRhZ10gPSBkYXRhO1xuXG4gICAgaWYgKHVzZUxhbmd1YWdlKSB7XG4gICAgICAgIGNob29zZUxhbmd1YWdlKGRhdGEubGFuZ3VhZ2VUYWcpO1xuICAgIH1cbn07XG5cbi8qKlxuICogU2V0IHRoZSBjdXJyZW50IGxhbmd1YWdlIGFjY29yZGluZyB0byBUQUcuXG4gKiBJZiBUQUcgZG9lc24ndCBtYXRjaCBhIHJlZ2lzdGVyZWQgbGFuZ3VhZ2UsIGFub3RoZXIgbGFuZ3VhZ2UgbWF0Y2hpbmdcbiAqIHRoZSBcImxhbmd1YWdlXCIgcGFydCBvZiB0aGUgdGFnIChhY2NvcmRpbmcgdG8gQkNQNDc6IGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvcmZjL2JjcC9iY3A0Ny50eHQpLlxuICogSWYgbm9uZSwgdGhlIEZBTExCQUNLVEFHIGlzIHVzZWQuIElmIHRoZSBGQUxMQkFDS1RBRyBkb2Vzbid0IG1hdGNoIGEgcmVnaXN0ZXIgbGFuZ3VhZ2UsXG4gKiBgZW4tVVNgIGlzIGZpbmFsbHkgdXNlZC5cbiAqXG4gKiBAcGFyYW0gdGFnXG4gKiBAcGFyYW0gZmFsbGJhY2tUYWdcbiAqL1xuc3RhdGUuc2V0TGFuZ3VhZ2UgPSAodGFnLCBmYWxsYmFja1RhZyA9IGVuVVMubGFuZ3VhZ2VUYWcpID0+IHtcbiAgICBpZiAoIWxhbmd1YWdlc1t0YWddKSB7XG4gICAgICAgIGxldCBzdWZmaXggPSB0YWcuc3BsaXQoXCItXCIpWzBdO1xuXG4gICAgICAgIGxldCBtYXRjaGluZ0xhbmd1YWdlVGFnID0gT2JqZWN0LmtleXMobGFuZ3VhZ2VzKS5maW5kKGVhY2ggPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGVhY2guc3BsaXQoXCItXCIpWzBdID09PSBzdWZmaXg7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghbGFuZ3VhZ2VzW21hdGNoaW5nTGFuZ3VhZ2VUYWddKSB7XG4gICAgICAgICAgICBjaG9vc2VMYW5ndWFnZShmYWxsYmFja1RhZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjaG9vc2VMYW5ndWFnZShtYXRjaGluZ0xhbmd1YWdlVGFnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNob29zZUxhbmd1YWdlKHRhZyk7XG59O1xuXG5zdGF0ZS5yZWdpc3Rlckxhbmd1YWdlKGVuVVMpO1xuY3VycmVudExhbmd1YWdlVGFnID0gZW5VUy5sYW5ndWFnZVRhZztcblxubW9kdWxlLmV4cG9ydHMgPSBzdGF0ZTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIExvYWQgbGFuZ3VhZ2VzIG1hdGNoaW5nIFRBR1MuIFNpbGVudGx5IHBhc3Mgb3ZlciB0aGUgZmFpbGluZyBsb2FkLlxuICpcbiAqIFdlIGFzc3VtZSBoZXJlIHRoYXQgd2UgYXJlIGluIGEgbm9kZSBlbnZpcm9ubWVudCwgc28gd2UgZG9uJ3QgY2hlY2sgZm9yIGl0LlxuICogQHBhcmFtIHtbU3RyaW5nXX0gdGFncyAtIGxpc3Qgb2YgdGFncyB0byBsb2FkXG4gKiBAcGFyYW0ge051bWJyb30gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqL1xuZnVuY3Rpb24gbG9hZExhbmd1YWdlc0luTm9kZSh0YWdzLCBudW1icm8pIHtcbiAgICB0YWdzLmZvckVhY2goKHRhZykgPT4ge1xuICAgICAgICBsZXQgZGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRhdGEgPSByZXF1aXJlKGAuLi9sYW5ndWFnZXMvJHt0YWd9YCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVuYWJsZSB0byBsb2FkIFwiJHt0YWd9XCIuIE5vIG1hdGNoaW5nIGxhbmd1YWdlIGZpbGUgZm91bmQuYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIG51bWJyby5yZWdpc3Rlckxhbmd1YWdlKGRhdGEpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKG51bWJybykgPT4gKHtcbiAgICBsb2FkTGFuZ3VhZ2VzSW5Ob2RlOiAodGFncykgPT4gbG9hZExhbmd1YWdlc0luTm9kZSh0YWdzLCBudW1icm8pXG59KTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5jb25zdCBCaWdOdW1iZXIgPSByZXF1aXJlKFwiYmlnbnVtYmVyLmpzXCIpO1xuXG4vKipcbiAqIEFkZCBhIG51bWJlciBvciBhIG51bWJybyB0byBOLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gYXVnZW5kXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyIC0gYWRkZW5kXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7TnVtYnJvfSBuXG4gKi9cbmZ1bmN0aW9uIGFkZChuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IHZhbHVlID0gbmV3IEJpZ051bWJlcihuLl92YWx1ZSk7XG4gICAgbGV0IG90aGVyVmFsdWUgPSBvdGhlcjtcblxuICAgIGlmIChudW1icm8uaXNOdW1icm8ob3RoZXIpKSB7XG4gICAgICAgIG90aGVyVmFsdWUgPSBvdGhlci5fdmFsdWU7XG4gICAgfVxuXG4gICAgb3RoZXJWYWx1ZSA9IG5ldyBCaWdOdW1iZXIob3RoZXJWYWx1ZSk7XG5cbiAgICBuLl92YWx1ZSA9IHZhbHVlLmFkZChvdGhlclZhbHVlKS50b051bWJlcigpO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIFN1YnRyYWN0IGEgbnVtYmVyIG9yIGEgbnVtYnJvIGZyb20gTi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIG1pbnVlbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBzdWJ0cmFoZW5kXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7TnVtYnJvfSBuXG4gKi9cbmZ1bmN0aW9uIHN1YnRyYWN0KG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUubWludXMob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBNdWx0aXBseSBOIGJ5IGEgbnVtYmVyIG9yIGEgbnVtYnJvLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbXVsdGlwbGljYW5kXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyIC0gbXVsdGlwbGllclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBtdWx0aXBseShuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IHZhbHVlID0gbmV3IEJpZ051bWJlcihuLl92YWx1ZSk7XG4gICAgbGV0IG90aGVyVmFsdWUgPSBvdGhlcjtcblxuICAgIGlmIChudW1icm8uaXNOdW1icm8ob3RoZXIpKSB7XG4gICAgICAgIG90aGVyVmFsdWUgPSBvdGhlci5fdmFsdWU7XG4gICAgfVxuXG4gICAgb3RoZXJWYWx1ZSA9IG5ldyBCaWdOdW1iZXIob3RoZXJWYWx1ZSk7XG5cbiAgICBuLl92YWx1ZSA9IHZhbHVlLnRpbWVzKG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogRGl2aWRlIE4gYnkgYSBudW1iZXIgb3IgYSBudW1icm8uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBkaXZpZGVuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIGRpdmlzb3JcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gZGl2aWRlKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUuZGl2aWRlZEJ5KG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogU2V0IE4gdG8gdGhlIE9USEVSIChvciB0aGUgdmFsdWUgb2YgT1RIRVIgd2hlbiBpdCdzIGEgbnVtYnJvIGluc3RhbmNlKS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIG51bWJybyBpbnN0YW5jZSB0byBtdXRhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBuZXcgdmFsdWUgdG8gYXNzaWduIHRvIE5cbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gc2V0IChuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IHZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICB2YWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBuLl92YWx1ZSA9IHZhbHVlO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgZGlzdGFuY2UgYmV0d2VlbiBOIGFuZCBPVEhFUi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gblxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gZGlmZmVyZW5jZShuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IGNsb25lID0gbnVtYnJvKG4uX3ZhbHVlKTtcbiAgICBzdWJ0cmFjdChjbG9uZSwgb3RoZXIsIG51bWJybyk7XG5cbiAgICByZXR1cm4gTWF0aC5hYnMoY2xvbmUuX3ZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBudW1icm8gPT4gKHtcbiAgICBhZGQ6IChuLCBvdGhlcikgPT4gYWRkKG4sIG90aGVyLCBudW1icm8pLFxuICAgIHN1YnRyYWN0OiAobiwgb3RoZXIpID0+IHN1YnRyYWN0KG4sIG90aGVyLCBudW1icm8pLFxuICAgIG11bHRpcGx5OiAobiwgb3RoZXIpID0+IG11bHRpcGx5KG4sIG90aGVyLCBudW1icm8pLFxuICAgIGRpdmlkZTogKG4sIG90aGVyKSA9PiBkaXZpZGUobiwgb3RoZXIsIG51bWJybyksXG4gICAgc2V0OiAobiwgb3RoZXIpID0+IHNldChuLCBvdGhlciwgbnVtYnJvKSxcbiAgICBkaWZmZXJlbmNlOiAobiwgb3RoZXIpID0+IGRpZmZlcmVuY2Uobiwgb3RoZXIsIG51bWJybylcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IFZFUlNJT04gPSBcIjIuMS4xXCI7XG5cbmNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgbG9hZGVyID0gcmVxdWlyZShcIi4vbG9hZGluZ1wiKShudW1icm8pO1xuY29uc3QgdW5mb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi91bmZvcm1hdHRpbmdcIik7XG5sZXQgZm9ybWF0dGVyID0gcmVxdWlyZShcIi4vZm9ybWF0dGluZ1wiKShudW1icm8pO1xubGV0IG1hbmlwdWxhdGUgPSByZXF1aXJlKFwiLi9tYW5pcHVsYXRpbmdcIikobnVtYnJvKTtcbmNvbnN0IHBhcnNpbmcgPSByZXF1aXJlKFwiLi9wYXJzaW5nXCIpO1xuXG5jbGFzcyBOdW1icm8ge1xuICAgIGNvbnN0cnVjdG9yKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICBjbG9uZSgpIHsgcmV0dXJuIG51bWJybyh0aGlzLl92YWx1ZSk7IH1cblxuICAgIGZvcm1hdChmb3JtYXQgPSB7fSkgeyByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpOyB9XG5cbiAgICBmb3JtYXRDdXJyZW5jeShmb3JtYXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQoZm9ybWF0KTtcbiAgICAgICAgfVxuICAgICAgICBmb3JtYXQgPSBmb3JtYXR0ZXIuZm9ybWF0T3JEZWZhdWx0KGZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgZm9ybWF0Lm91dHB1dCA9IFwiY3VycmVuY3lcIjtcbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQodGhpcywgZm9ybWF0KTtcbiAgICB9XG5cbiAgICBmb3JtYXRUaW1lKGZvcm1hdCA9IHt9KSB7XG4gICAgICAgIGZvcm1hdC5vdXRwdXQgPSBcInRpbWVcIjtcbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQodGhpcywgZm9ybWF0KTtcbiAgICB9XG5cbiAgICBiaW5hcnlCeXRlVW5pdHMoKSB7IHJldHVybiBmb3JtYXR0ZXIuZ2V0QmluYXJ5Qnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgZGVjaW1hbEJ5dGVVbml0cygpIHsgcmV0dXJuIGZvcm1hdHRlci5nZXREZWNpbWFsQnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgYnl0ZVVuaXRzKCkgeyByZXR1cm4gZm9ybWF0dGVyLmdldEJ5dGVVbml0KHRoaXMpO31cblxuICAgIGRpZmZlcmVuY2Uob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUuZGlmZmVyZW5jZSh0aGlzLCBvdGhlcik7IH1cblxuICAgIGFkZChvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5hZGQodGhpcywgb3RoZXIpOyB9XG5cbiAgICBzdWJ0cmFjdChvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5zdWJ0cmFjdCh0aGlzLCBvdGhlcik7IH1cblxuICAgIG11bHRpcGx5KG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLm11bHRpcGx5KHRoaXMsIG90aGVyKTsgfVxuXG4gICAgZGl2aWRlKG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLmRpdmlkZSh0aGlzLCBvdGhlcik7IH1cblxuICAgIHNldChpbnB1dCkgeyByZXR1cm4gbWFuaXB1bGF0ZS5zZXQodGhpcywgbm9ybWFsaXplSW5wdXQoaW5wdXQpKTsgfVxuXG4gICAgdmFsdWUoKSB7IHJldHVybiB0aGlzLl92YWx1ZTsgfVxuXG4gICAgdmFsdWVPZigpIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG59XG5cbi8qKlxuICogTWFrZSBpdHMgYmVzdCB0byBjb252ZXJ0IGlucHV0IGludG8gYSBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtudW1icm98c3RyaW5nfG51bWJlcn0gaW5wdXQgLSBJbnB1dCB0byBjb252ZXJ0XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUlucHV0KGlucHV0KSB7XG4gICAgbGV0IHJlc3VsdCA9IGlucHV0O1xuICAgIGlmIChudW1icm8uaXNOdW1icm8oaW5wdXQpKSB7XG4gICAgICAgIHJlc3VsdCA9IGlucHV0Ll92YWx1ZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXN1bHQgPSBudW1icm8udW5mb3JtYXQoaW5wdXQpO1xuICAgIH0gZWxzZSBpZiAoaXNOYU4oaW5wdXQpKSB7XG4gICAgICAgIHJlc3VsdCA9IE5hTjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBudW1icm8oaW5wdXQpIHtcbiAgICByZXR1cm4gbmV3IE51bWJybyhub3JtYWxpemVJbnB1dChpbnB1dCkpO1xufVxuXG5udW1icm8udmVyc2lvbiA9IFZFUlNJT047XG5cbm51bWJyby5pc051bWJybyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBOdW1icm87XG59O1xuXG4vL1xuLy8gYG51bWJyb2Agc3RhdGljIG1ldGhvZHNcbi8vXG5cbm51bWJyby5sYW5ndWFnZSA9IGdsb2JhbFN0YXRlLmN1cnJlbnRMYW5ndWFnZTtcbm51bWJyby5yZWdpc3Rlckxhbmd1YWdlID0gZ2xvYmFsU3RhdGUucmVnaXN0ZXJMYW5ndWFnZTtcbm51bWJyby5zZXRMYW5ndWFnZSA9IGdsb2JhbFN0YXRlLnNldExhbmd1YWdlO1xubnVtYnJvLmxhbmd1YWdlcyA9IGdsb2JhbFN0YXRlLmxhbmd1YWdlcztcbm51bWJyby5sYW5ndWFnZURhdGEgPSBnbG9iYWxTdGF0ZS5sYW5ndWFnZURhdGE7XG5udW1icm8uemVyb0Zvcm1hdCA9IGdsb2JhbFN0YXRlLnNldFplcm9Gb3JtYXQ7XG5udW1icm8uZGVmYXVsdEZvcm1hdCA9IGdsb2JhbFN0YXRlLmN1cnJlbnREZWZhdWx0cztcbm51bWJyby5zZXREZWZhdWx0cyA9IGdsb2JhbFN0YXRlLnNldERlZmF1bHRzO1xubnVtYnJvLmRlZmF1bHRDdXJyZW5jeUZvcm1hdCA9IGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeURlZmF1bHRGb3JtYXQ7XG5udW1icm8udmFsaWRhdGUgPSB2YWxpZGF0b3IudmFsaWRhdGU7XG5udW1icm8ubG9hZExhbmd1YWdlc0luTm9kZSA9IGxvYWRlci5sb2FkTGFuZ3VhZ2VzSW5Ob2RlO1xubnVtYnJvLnVuZm9ybWF0ID0gdW5mb3JtYXR0ZXIudW5mb3JtYXQ7XG5cbm1vZHVsZS5leHBvcnRzID0gbnVtYnJvO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgYSBwcmVmaXguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlUHJlZml4KHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IG1hdGNoID0gc3RyaW5nLm1hdGNoKC9eeyhbXn1dKil9Lyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC5wcmVmaXggPSBtYXRjaFsxXTtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5zbGljZShtYXRjaFswXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgYSBwb3N0Zml4LiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZVBvc3RmaXgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL3soW159XSopfSQvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnBvc3RmaXggPSBtYXRjaFsxXTtcblxuICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKDAsIC1tYXRjaFswXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIG91dHB1dCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VPdXRwdXQoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIkXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJjdXJyZW5jeVwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiJVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwicGVyY2VudFwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYmRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImdlbmVyYWxcIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcImJcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImJpbmFyeVwiO1xuICAgICAgICByZXR1cm47XG5cbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJkXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJieXRlXCI7XG4gICAgICAgIHJlc3VsdC5iYXNlID0gXCJkZWNpbWFsXCI7XG4gICAgICAgIHJldHVybjtcblxuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIjpcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcInRpbWVcIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIm9cIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcIm9yZGluYWxcIjtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHRob3VzYW5kIHNlcGFyYXRlZCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VUaG91c2FuZFNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIixcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC50aG91c2FuZFNlcGFyYXRlZCA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBzcGFjZSBzZXBhcmF0ZWQgdmFsdWUuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlU3BhY2VTZXBhcmF0ZWQoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIgXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuc3BhY2VTZXBhcmF0ZWQgPSB0cnVlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgdG90YWwgbGVuZ3RoLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZVRvdGFsTGVuZ3RoKHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IG1hdGNoID0gc3RyaW5nLm1hdGNoKC9bMS05XStbMC05XSovKTtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXN1bHQudG90YWxMZW5ndGggPSArbWF0Y2hbMF07XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBjaGFyYWN0ZXJpc3RpYyBsZW5ndGguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlQ2hhcmFjdGVyaXN0aWMoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSBzdHJpbmcuc3BsaXQoXCIuXCIpWzBdO1xuICAgIGxldCBtYXRjaCA9IGNoYXJhY3RlcmlzdGljLm1hdGNoKC8wKy8pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXN1bHQuY2hhcmFjdGVyaXN0aWMgPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBtYW50aXNzYSBsZW5ndGguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWFudGlzc2EgPSBzdHJpbmcuc3BsaXQoXCIuXCIpWzFdO1xuICAgIGlmIChtYW50aXNzYSkge1xuICAgICAgICBsZXQgbWF0Y2ggPSBtYW50aXNzYS5tYXRjaCgvMCsvKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICByZXN1bHQubWFudGlzc2EgPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIGF2ZXJhZ2UgdmFsdWUuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlQXZlcmFnZShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcImFcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5hdmVyYWdlID0gdHJ1ZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgYSBmb3JjZWQgYXZlcmFnZSBwcmVjaXNpb24uIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlRm9yY2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiS1wiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlQXZlcmFnZSA9IFwidGhvdXNhbmRcIjtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5pbmRleE9mKFwiTVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlQXZlcmFnZSA9IFwibWlsbGlvblwiO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nLmluZGV4T2YoXCJCXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJiaWxsaW9uXCI7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcuaW5kZXhPZihcIlRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcInRyaWxsaW9uXCI7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGZpbmRpbmcgaWYgdGhlIG1hbnRpc3NhIGlzIG9wdGlvbmFsLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU9wdGlvbmFsTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLm1hdGNoKC9cXFtcXC5dLykpIHtcbiAgICAgICAgcmVzdWx0Lm9wdGlvbmFsTWFudGlzc2EgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nLm1hdGNoKC9cXC4vKSkge1xuICAgICAgICByZXN1bHQub3B0aW9uYWxNYW50aXNzYSA9IGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBmaW5kaW5nIGlmIHRoZSBjaGFyYWN0ZXJpc3RpYyBpcyBvcHRpb25hbC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VPcHRpb25hbENoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiLlwiKSAhPT0gLTEpIHtcbiAgICAgICAgbGV0IGNoYXJhY3RlcmlzdGljID0gc3RyaW5nLnNwbGl0KFwiLlwiKVswXTtcbiAgICAgICAgcmVzdWx0Lm9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMgPSBjaGFyYWN0ZXJpc3RpYy5pbmRleE9mKFwiMFwiKSA9PT0gLTE7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBuZWdhdGl2ZSBmb3JtYXQuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlTmVnYXRpdmUoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLm1hdGNoKC9eXFwrP1xcKFteKV0qXFwpJC8pKSB7XG4gICAgICAgIHJlc3VsdC5uZWdhdGl2ZSA9IFwicGFyZW50aGVzaXNcIjtcbiAgICB9XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXlxcKz8tLykpIHtcbiAgICAgICAgcmVzdWx0Lm5lZ2F0aXZlID0gXCJzaWduXCI7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGZpbmRpbmcgaWYgdGhlIHNpZ24gaXMgbWFuZGF0b3J5LiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICovXG5mdW5jdGlvbiBwYXJzZUZvcmNlU2lnbihzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcubWF0Y2goL15cXCsvKSkge1xuICAgICAgICByZXN1bHQuZm9yY2VTaWduID0gdHJ1ZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgYW5kIGFjY3VtdWxhdGluZyB0aGUgdmFsdWVzIGllIFJFU1VMVC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtOdW1icm9Gb3JtYXR9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlRm9ybWF0KHN0cmluZywgcmVzdWx0ID0ge30pIHtcbiAgICBpZiAodHlwZW9mIHN0cmluZyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH1cblxuICAgIHN0cmluZyA9IHBhcnNlUHJlZml4KHN0cmluZywgcmVzdWx0KTtcbiAgICBzdHJpbmcgPSBwYXJzZVBvc3RmaXgoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlT3V0cHV0KHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVRvdGFsTGVuZ3RoKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUNoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlQXZlcmFnZShzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VGb3JjZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlT3B0aW9uYWxNYW50aXNzYShzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VUaG91c2FuZFNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VTcGFjZVNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VOZWdhdGl2ZShzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VGb3JjZVNpZ24oc3RyaW5nLCByZXN1bHQpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcGFyc2VGb3JtYXRcbn07XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgYWxsU3VmZml4ZXMgPSBbXG4gICAge2tleTogXCJaaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA3KX0sXG4gICAge2tleTogXCJaQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDcpfSxcbiAgICB7a2V5OiBcIllpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDgpfSxcbiAgICB7a2V5OiBcIllCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgOCl9LFxuICAgIHtrZXk6IFwiVGlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgNCl9LFxuICAgIHtrZXk6IFwiVEJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA0KX0sXG4gICAge2tleTogXCJQaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA1KX0sXG4gICAge2tleTogXCJQQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDUpfSxcbiAgICB7a2V5OiBcIk1pQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDIpfSxcbiAgICB7a2V5OiBcIk1CXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgMil9LFxuICAgIHtrZXk6IFwiS2lCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgMSl9LFxuICAgIHtrZXk6IFwiS0JcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCAxKX0sXG4gICAge2tleTogXCJHaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCAzKX0sXG4gICAge2tleTogXCJHQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDMpfSxcbiAgICB7a2V5OiBcIkVpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDYpfSxcbiAgICB7a2V5OiBcIkVCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNil9LFxuICAgIHtrZXk6IFwiQlwiLCBmYWN0b3I6IDF9XG5dO1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgUmVnRXhwIHdoZXJlIFMgZ2V0IGFsbCBSZWdFeHAgc3BlY2lmaWMgY2hhcmFjdGVycyBlc2NhcGVkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzIC0gc3RyaW5nIHJlcHJlc2VudGluZyBhIFJlZ0V4cFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVSZWdFeHAocykge1xuICAgIHJldHVybiBzLnJlcGxhY2UoL1stL1xcXFxeJCorPy4oKXxbXFxde31dL2csIFwiXFxcXCQmXCIpO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGNvbXB1dGUgdGhlIHVuZm9ybWF0dGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHBhcmFtIHsqfSBkZWxpbWl0ZXJzIC0gRGVsaW1pdGVycyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtjdXJyZW5jeVN5bWJvbF0gLSBzeW1ib2wgdXNlZCBmb3IgY3VycmVuY3kgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9yZGluYWwgLSBmdW5jdGlvbiB1c2VkIHRvIGdlbmVyYXRlIGFuIG9yZGluYWwgb3V0IG9mIGEgbnVtYmVyXG4gKiBAcGFyYW0ge3N0cmluZ30gemVyb0Zvcm1hdCAtIHN0cmluZyByZXByZXNlbnRpbmcgemVyb1xuICogQHBhcmFtIHsqfSBhYmJyZXZpYXRpb25zIC0gYWJicmV2aWF0aW9ucyB1c2VkIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCA9IFwiXCIsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkge1xuICAgIGlmICghaXNOYU4oK2lucHV0U3RyaW5nKSkge1xuICAgICAgICByZXR1cm4gK2lucHV0U3RyaW5nO1xuICAgIH1cblxuICAgIGxldCBzdHJpcHBlZCA9IFwiXCI7XG4gICAgLy8gTmVnYXRpdmVcblxuICAgIGxldCBuZXdJbnB1dCA9IGlucHV0U3RyaW5nLnJlcGxhY2UoLyheW14oXSopXFwoKC4qKVxcKShbXildKiQpLywgXCIkMSQyJDNcIik7XG5cbiAgICBpZiAobmV3SW5wdXQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgIHJldHVybiAtMSAqIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKG5ld0lucHV0LCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KTtcbiAgICB9XG5cbiAgICAvLyBCeXRlXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbFN1ZmZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBzdWZmaXggPSBhbGxTdWZmaXhlc1tpXTtcbiAgICAgICAgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKHN1ZmZpeC5rZXksIFwiXCIpO1xuXG4gICAgICAgIGlmIChzdHJpcHBlZCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkgKiBzdWZmaXguZmFjdG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUGVyY2VudFxuXG4gICAgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKFwiJVwiLCBcIlwiKTtcblxuICAgIGlmIChzdHJpcHBlZCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHN0cmlwcGVkLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSAvIDEwMDtcbiAgICB9XG5cbiAgICAvLyBPcmRpbmFsXG5cbiAgICBsZXQgcG9zc2libGVPcmRpbmFsVmFsdWUgPSBwYXJzZUZsb2F0KGlucHV0U3RyaW5nKTtcblxuICAgIGlmIChpc05hTihwb3NzaWJsZU9yZGluYWxWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBsZXQgb3JkaW5hbFN0cmluZyA9IG9yZGluYWwocG9zc2libGVPcmRpbmFsVmFsdWUpO1xuICAgIGlmIChvcmRpbmFsU3RyaW5nICYmIG9yZGluYWxTdHJpbmcgIT09IFwiLlwiKSB7IC8vIGlmIG9yZGluYWwgaXMgXCIuXCIgaXQgd2lsbCBiZSBjYXVnaHQgbmV4dCByb3VuZCBpbiB0aGUgK2lucHV0U3RyaW5nXG4gICAgICAgIHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShuZXcgUmVnRXhwKGAke2VzY2FwZVJlZ0V4cChvcmRpbmFsU3RyaW5nKX0kYCksIFwiXCIpO1xuXG4gICAgICAgIGlmIChzdHJpcHBlZCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBdmVyYWdlXG5cbiAgICBsZXQgaW52ZXJzZWRBYmJyZXZpYXRpb25zID0ge307XG4gICAgT2JqZWN0LmtleXMoYWJicmV2aWF0aW9ucykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGludmVyc2VkQWJicmV2aWF0aW9uc1thYmJyZXZpYXRpb25zW2tleV1dID0ga2V5O1xuICAgIH0pO1xuXG4gICAgbGV0IGFiYnJldmlhdGlvblZhbHVlcyA9IE9iamVjdC5rZXlzKGludmVyc2VkQWJicmV2aWF0aW9ucykuc29ydCgpLnJldmVyc2UoKTtcbiAgICBsZXQgbnVtYmVyT2ZBYmJyZXZpYXRpb25zID0gYWJicmV2aWF0aW9uVmFsdWVzLmxlbmd0aDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyT2ZBYmJyZXZpYXRpb25zOyBpKyspIHtcbiAgICAgICAgbGV0IHZhbHVlID0gYWJicmV2aWF0aW9uVmFsdWVzW2ldO1xuICAgICAgICBsZXQga2V5ID0gaW52ZXJzZWRBYmJyZXZpYXRpb25zW3ZhbHVlXTtcblxuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UodmFsdWUsIFwiXCIpO1xuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICBsZXQgZmFjdG9yID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgc3dpdGNoIChrZXkpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBkZWZhdWx0LWNhc2VcbiAgICAgICAgICAgICAgICBjYXNlIFwidGhvdXNhbmRcIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwibWlsbGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgNik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJiaWxsaW9uXCI6XG4gICAgICAgICAgICAgICAgICAgIGZhY3RvciA9IE1hdGgucG93KDEwLCA5KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInRyaWxsaW9uXCI6XG4gICAgICAgICAgICAgICAgICAgIGZhY3RvciA9IE1hdGgucG93KDEwLCAxMik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHN0cmlwcGVkLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSAqIGZhY3RvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBpbiBvbmUgcGFzcyBhbGwgZm9ybWF0dGluZyBzeW1ib2xzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHBhcmFtIHsqfSBkZWxpbWl0ZXJzIC0gRGVsaW1pdGVycyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtjdXJyZW5jeVN5bWJvbF0gLSBzeW1ib2wgdXNlZCBmb3IgY3VycmVuY3kgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRm9ybWF0dGluZ1N5bWJvbHMoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sID0gXCJcIikge1xuICAgIC8vIEN1cnJlbmN5XG5cbiAgICBsZXQgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKGN1cnJlbmN5U3ltYm9sLCBcIlwiKTtcblxuICAgIC8vIFRob3VzYW5kIHNlcGFyYXRvcnNcblxuICAgIHN0cmlwcGVkID0gc3RyaXBwZWQucmVwbGFjZShuZXcgUmVnRXhwKGAoWzAtOV0pJHtlc2NhcGVSZWdFeHAoZGVsaW1pdGVycy50aG91c2FuZHMpfShbMC05XSlgLCBcImdcIiksIFwiJDEkMlwiKTtcblxuICAgIC8vIERlY2ltYWxcblxuICAgIHN0cmlwcGVkID0gc3RyaXBwZWQucmVwbGFjZShkZWxpbWl0ZXJzLmRlY2ltYWwsIFwiLlwiKTtcblxuICAgIHJldHVybiBzdHJpcHBlZDtcbn1cblxuLyoqXG4gKiBVbmZvcm1hdCBhIG51bWJyby1nZW5lcmF0ZWQgc3RyaW5nIHRvIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEBwYXJhbSB7Kn0gZGVsaW1pdGVycyAtIERlbGltaXRlcnMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVuY3lTeW1ib2xdIC0gc3ltYm9sIHVzZWQgZm9yIGN1cnJlbmN5IHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcmRpbmFsIC0gZnVuY3Rpb24gdXNlZCB0byBnZW5lcmF0ZSBhbiBvcmRpbmFsIG91dCBvZiBhIG51bWJlclxuICogQHBhcmFtIHtzdHJpbmd9IHplcm9Gb3JtYXQgLSBzdHJpbmcgcmVwcmVzZW50aW5nIHplcm9cbiAqIEBwYXJhbSB7Kn0gYWJicmV2aWF0aW9ucyAtIGFiYnJldmlhdGlvbnMgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IGZvcm1hdCAtIGZvcm1hdCB1c2VkIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtudW1iZXJ8dW5kZWZpbmVkfVxuICovXG5mdW5jdGlvbiB1bmZvcm1hdFZhbHVlKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCA9IFwiXCIsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkge1xuICAgIGlmIChpbnB1dFN0cmluZyA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICghaXNOYU4oK2lucHV0U3RyaW5nKSkge1xuICAgICAgICByZXR1cm4gK2lucHV0U3RyaW5nO1xuICAgIH1cblxuICAgIC8vIFplcm8gRm9ybWF0XG5cbiAgICBpZiAoaW5wdXRTdHJpbmcgPT09IHplcm9Gb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgbGV0IHZhbHVlID0gcmVtb3ZlRm9ybWF0dGluZ1N5bWJvbHMoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sKTtcbiAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUodmFsdWUsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSBJTlBVVFNUUklORyByZXByZXNlbnRzIGEgdGltZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gY2hlY2tcbiAqIEBwYXJhbSB7Kn0gZGVsaW1pdGVycyAtIERlbGltaXRlcnMgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1RpbWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMpIHtcbiAgICBsZXQgc2VwYXJhdG9ycyA9IGlucHV0U3RyaW5nLmluZGV4T2YoXCI6XCIpICYmIGRlbGltaXRlcnMudGhvdXNhbmRzICE9PSBcIjpcIjtcblxuICAgIGlmICghc2VwYXJhdG9ycykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHNlZ21lbnRzID0gaW5wdXRTdHJpbmcuc3BsaXQoXCI6XCIpO1xuICAgIGlmIChzZWdtZW50cy5sZW5ndGggIT09IDMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBob3VycyA9ICtzZWdtZW50c1swXTtcbiAgICBsZXQgbWludXRlcyA9ICtzZWdtZW50c1sxXTtcbiAgICBsZXQgc2Vjb25kcyA9ICtzZWdtZW50c1syXTtcblxuICAgIHJldHVybiAhaXNOYU4oaG91cnMpICYmICFpc05hTihtaW51dGVzKSAmJiAhaXNOYU4oc2Vjb25kcyk7XG59XG5cbi8qKlxuICogVW5mb3JtYXQgYSBudW1icm8tZ2VuZXJhdGVkIHN0cmluZyByZXByZXNlbnRpbmcgYSB0aW1lIHRvIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gdW5mb3JtYXRUaW1lKGlucHV0U3RyaW5nKSB7XG4gICAgbGV0IHNlZ21lbnRzID0gaW5wdXRTdHJpbmcuc3BsaXQoXCI6XCIpO1xuXG4gICAgbGV0IGhvdXJzID0gK3NlZ21lbnRzWzBdO1xuICAgIGxldCBtaW51dGVzID0gK3NlZ21lbnRzWzFdO1xuICAgIGxldCBzZWNvbmRzID0gK3NlZ21lbnRzWzJdO1xuXG4gICAgcmV0dXJuIHNlY29uZHMgKyA2MCAqIG1pbnV0ZXMgKyAzNjAwICogaG91cnM7XG59XG5cbi8qKlxuICogVW5mb3JtYXQgYSBudW1icm8tZ2VuZXJhdGVkIHN0cmluZyB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHVzZWQgIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHVuZm9ybWF0KGlucHV0U3RyaW5nLCBmb3JtYXQpIHtcbiAgICAvLyBBdm9pZCBjaXJjdWxhciByZWZlcmVuY2VzXG4gICAgY29uc3QgZ2xvYmFsU3RhdGUgPSByZXF1aXJlKFwiLi9nbG9iYWxTdGF0ZVwiKTtcblxuICAgIGxldCBkZWxpbWl0ZXJzID0gZ2xvYmFsU3RhdGUuY3VycmVudERlbGltaXRlcnMoKTtcbiAgICBsZXQgY3VycmVuY3lTeW1ib2wgPSBnbG9iYWxTdGF0ZS5jdXJyZW50Q3VycmVuY3koKS5zeW1ib2w7XG4gICAgbGV0IG9yZGluYWwgPSBnbG9iYWxTdGF0ZS5jdXJyZW50T3JkaW5hbCgpO1xuICAgIGxldCB6ZXJvRm9ybWF0ID0gZ2xvYmFsU3RhdGUuZ2V0WmVyb0Zvcm1hdCgpO1xuICAgIGxldCBhYmJyZXZpYXRpb25zID0gZ2xvYmFsU3RhdGUuY3VycmVudEFiYnJldmlhdGlvbnMoKTtcblxuICAgIGxldCB2YWx1ZSA9IHVuZGVmaW5lZDtcblxuICAgIGlmICh0eXBlb2YgaW5wdXRTdHJpbmcgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKG1hdGNoZXNUaW1lKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzKSkge1xuICAgICAgICAgICAgdmFsdWUgPSB1bmZvcm1hdFRpbWUoaW5wdXRTdHJpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSB1bmZvcm1hdFZhbHVlKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0U3RyaW5nID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHZhbHVlID0gaW5wdXRTdHJpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdW5mb3JtYXRcbn07XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxubGV0IHVuZm9ybWF0dGVyID0gcmVxdWlyZShcIi4vdW5mb3JtYXR0aW5nXCIpO1xuXG4vLyBTaW1wbGlmaWVkIHJlZ2V4cCBzdXBwb3J0aW5nIG9ubHkgYGxhbmd1YWdlYCwgYHNjcmlwdGAsIGFuZCBgcmVnaW9uYFxuY29uc3QgYmNwNDdSZWdFeHAgPSAvXlthLXpdezIsM30oLVthLXpBLVpdezR9KT8oLShbQS1aXXsyfXxbMC05XXszfSkpPyQvO1xuXG5jb25zdCB2YWxpZE91dHB1dFZhbHVlcyA9IFtcbiAgICBcImN1cnJlbmN5XCIsXG4gICAgXCJwZXJjZW50XCIsXG4gICAgXCJieXRlXCIsXG4gICAgXCJ0aW1lXCIsXG4gICAgXCJvcmRpbmFsXCIsXG4gICAgXCJudW1iZXJcIlxuXTtcblxuY29uc3QgdmFsaWRGb3JjZUF2ZXJhZ2VWYWx1ZXMgPSBbXG4gICAgXCJ0cmlsbGlvblwiLFxuICAgIFwiYmlsbGlvblwiLFxuICAgIFwibWlsbGlvblwiLFxuICAgIFwidGhvdXNhbmRcIlxuXTtcblxuY29uc3QgdmFsaWRDdXJyZW5jeVBvc2l0aW9uID0gW1xuICAgIFwicHJlZml4XCIsXG4gICAgXCJpbmZpeFwiLFxuICAgIFwicG9zdGZpeFwiXG5dO1xuXG5jb25zdCB2YWxpZE5lZ2F0aXZlVmFsdWVzID0gW1xuICAgIFwic2lnblwiLFxuICAgIFwicGFyZW50aGVzaXNcIlxuXTtcblxuY29uc3QgdmFsaWRNYW5kYXRvcnlBYmJyZXZpYXRpb25zID0ge1xuICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgY2hpbGRyZW46IHtcbiAgICAgICAgdGhvdXNhbmQ6IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbWlsbGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBiaWxsaW9uOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHRyaWxsaW9uOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1hbmRhdG9yeTogdHJ1ZVxufTtcblxuY29uc3QgdmFsaWRBYmJyZXZpYXRpb25zID0ge1xuICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgY2hpbGRyZW46IHtcbiAgICAgICAgdGhvdXNhbmQ6IFwic3RyaW5nXCIsXG4gICAgICAgIG1pbGxpb246IFwic3RyaW5nXCIsXG4gICAgICAgIGJpbGxpb246IFwic3RyaW5nXCIsXG4gICAgICAgIHRyaWxsaW9uOiBcInN0cmluZ1wiXG4gICAgfVxufTtcblxuY29uc3QgdmFsaWRCYXNlVmFsdWVzID0gW1xuICAgIFwiZGVjaW1hbFwiLFxuICAgIFwiYmluYXJ5XCIsXG4gICAgXCJnZW5lcmFsXCJcbl07XG5cbmNvbnN0IHZhbGlkRm9ybWF0ID0ge1xuICAgIG91dHB1dDoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICB2YWxpZFZhbHVlczogdmFsaWRPdXRwdXRWYWx1ZXNcbiAgICB9LFxuICAgIGJhc2U6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkQmFzZVZhbHVlcyxcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIsIGZvcm1hdCkgPT4gZm9ybWF0Lm91dHB1dCA9PT0gXCJieXRlXCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiYGJhc2VgIG11c3QgYmUgcHJvdmlkZWQgb25seSB3aGVuIHRoZSBvdXRwdXQgaXMgYGJ5dGVgXCIsXG4gICAgICAgIG1hbmRhdG9yeTogKGZvcm1hdCkgPT4gZm9ybWF0Lm91dHB1dCA9PT0gXCJieXRlXCJcbiAgICB9LFxuICAgIGNoYXJhY3RlcmlzdGljOiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyKSA9PiBudW1iZXIgPj0gMCxcbiAgICAgICAgbWVzc2FnZTogXCJ2YWx1ZSBtdXN0IGJlIHBvc2l0aXZlXCJcbiAgICB9LFxuICAgIHByZWZpeDogXCJzdHJpbmdcIixcbiAgICBwb3N0Zml4OiBcInN0cmluZ1wiLFxuICAgIGZvcmNlQXZlcmFnZToge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICB2YWxpZFZhbHVlczogdmFsaWRGb3JjZUF2ZXJhZ2VWYWx1ZXNcbiAgICB9LFxuICAgIGF2ZXJhZ2U6IFwiYm9vbGVhblwiLFxuICAgIGN1cnJlbmN5UG9zaXRpb246IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkQ3VycmVuY3lQb3NpdGlvblxuICAgIH0sXG4gICAgY3VycmVuY3lTeW1ib2w6IFwic3RyaW5nXCIsXG4gICAgdG90YWxMZW5ndGg6IHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgcmVzdHJpY3Rpb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIpID0+IG51bWJlciA+PSAwLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwidmFsdWUgbXVzdCBiZSBwb3NpdGl2ZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+ICFmb3JtYXQuZXhwb25lbnRpYWwsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJgdG90YWxMZW5ndGhgIGlzIGluY29tcGF0aWJsZSB3aXRoIGBleHBvbmVudGlhbGBcIlxuICAgICAgICAgICAgfVxuICAgICAgICBdXG4gICAgfSxcbiAgICBtYW50aXNzYToge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICByZXN0cmljdGlvbjogKG51bWJlcikgPT4gbnVtYmVyID49IDAsXG4gICAgICAgIG1lc3NhZ2U6IFwidmFsdWUgbXVzdCBiZSBwb3NpdGl2ZVwiXG4gICAgfSxcbiAgICBvcHRpb25hbE1hbnRpc3NhOiBcImJvb2xlYW5cIixcbiAgICB0cmltTWFudGlzc2E6IFwiYm9vbGVhblwiLFxuICAgIG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWM6IFwiYm9vbGVhblwiLFxuICAgIHRob3VzYW5kU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZDogXCJib29sZWFuXCIsXG4gICAgYWJicmV2aWF0aW9uczogdmFsaWRBYmJyZXZpYXRpb25zLFxuICAgIG5lZ2F0aXZlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZE5lZ2F0aXZlVmFsdWVzXG4gICAgfSxcbiAgICBmb3JjZVNpZ246IFwiYm9vbGVhblwiLFxuICAgIGV4cG9uZW50aWFsOiB7XG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgfSxcbiAgICBwcmVmaXhTeW1ib2w6IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwicGVyY2VudFwiLFxuICAgICAgICBtZXNzYWdlOiBcImBwcmVmaXhTeW1ib2xgIGNhbiBiZSBwcm92aWRlZCBvbmx5IHdoZW4gdGhlIG91dHB1dCBpcyBgcGVyY2VudGBcIlxuICAgIH1cbn07XG5cbmNvbnN0IHZhbGlkTGFuZ3VhZ2UgPSB7XG4gICAgbGFuZ3VhZ2VUYWc6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlLFxuICAgICAgICByZXN0cmljdGlvbjogKHRhZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRhZy5tYXRjaChiY3A0N1JlZ0V4cCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2U6IFwidGhlIGxhbmd1YWdlIHRhZyBtdXN0IGZvbGxvdyB0aGUgQkNQIDQ3IHNwZWNpZmljYXRpb24gKHNlZSBodHRwczovL3Rvb2xzLmllZnQub3JnL2h0bWwvYmNwNDcpXCJcbiAgICB9LFxuICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlY2ltYWw6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICB0aG91c2FuZHNTaXplOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgIH0sXG4gICAgYWJicmV2aWF0aW9uczogdmFsaWRNYW5kYXRvcnlBYmJyZXZpYXRpb25zLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBvcmRpbmFsOiB7XG4gICAgICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBjdXJyZW5jeToge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgc3ltYm9sOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgcG9zaXRpb246IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBjb2RlOiBcInN0cmluZ1wiXG4gICAgICAgIH0sXG4gICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgIH0sXG4gICAgZGVmYXVsdHM6IFwiZm9ybWF0XCIsXG4gICAgb3JkaW5hbEZvcm1hdDogXCJmb3JtYXRcIixcbiAgICBieXRlRm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIHBlcmNlbnRhZ2VGb3JtYXQ6IFwiZm9ybWF0XCIsXG4gICAgY3VycmVuY3lGb3JtYXQ6IFwiZm9ybWF0XCIsXG4gICAgdGltZURlZmF1bHRzOiBcImZvcm1hdFwiLFxuICAgIGZvcm1hdHM6IHtcbiAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICAgIGZvdXJEaWdpdHM6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZvcm1hdFwiLFxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bGxXaXRoVHdvRGVjaW1hbHM6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZvcm1hdFwiLFxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bGxXaXRoVHdvRGVjaW1hbHNOb0N1cnJlbmN5OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJmb3JtYXRcIixcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdWxsV2l0aE5vRGVjaW1hbHM6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZvcm1hdFwiLFxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBDaGVjayB0aGUgdmFsaWRpdHkgb2YgdGhlIHByb3ZpZGVkIGlucHV0IGFuZCBmb3JtYXQuXG4gKiBUaGUgY2hlY2sgaXMgTk9UIGxhenkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfE51bWJyb30gaW5wdXQgLSBpbnB1dCB0byBjaGVja1xuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IGZvcm1hdCAtIGZvcm1hdCB0byBjaGVja1xuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSB3aGVuIGV2ZXJ5dGhpbmcgaXMgY29ycmVjdFxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZShpbnB1dCwgZm9ybWF0KSB7XG4gICAgbGV0IHZhbGlkSW5wdXQgPSB2YWxpZGF0ZUlucHV0KGlucHV0KTtcbiAgICBsZXQgaXNGb3JtYXRWYWxpZCA9IHZhbGlkYXRlRm9ybWF0KGZvcm1hdCk7XG5cbiAgICByZXR1cm4gdmFsaWRJbnB1dCAmJiBpc0Zvcm1hdFZhbGlkO1xufVxuXG4vKipcbiAqIENoZWNrIHRoZSB2YWxpZGl0eSBvZiB0aGUgbnVtYnJvIGlucHV0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxOdW1icm99IGlucHV0IC0gaW5wdXQgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgd2hlbiBldmVyeXRoaW5nIGlzIGNvcnJlY3RcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVJbnB1dChpbnB1dCkge1xuICAgIGxldCB2YWx1ZSA9IHVuZm9ybWF0dGVyLnVuZm9ybWF0KGlucHV0KTtcblxuICAgIHJldHVybiAhIXZhbHVlO1xufVxuXG4vKipcbiAqIENoZWNrIHRoZSB2YWxpZGl0eSBvZiB0aGUgcHJvdmlkZWQgZm9ybWF0IFRPVkFMSURBVEUgYWdhaW5zdCBTUEVDLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSB0b1ZhbGlkYXRlIC0gZm9ybWF0IHRvIGNoZWNrXG4gKiBAcGFyYW0geyp9IHNwZWMgLSBzcGVjaWZpY2F0aW9uIGFnYWluc3Qgd2hpY2ggdG8gY2hlY2tcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBwcmVmaXggdXNlIGZvciBlcnJvciBtZXNzYWdlc1xuICogQHBhcmFtIHtib29sZWFufSBza2lwTWFuZGF0b3J5Q2hlY2sgLSBgdHJ1ZWAgd2hlbiB0aGUgY2hlY2sgZm9yIG1hbmRhdG9yeSBrZXkgbXVzdCBiZSBza2lwcGVkXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIHdoZW4gZXZlcnl0aGluZyBpcyBjb3JyZWN0XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlU3BlYyh0b1ZhbGlkYXRlLCBzcGVjLCBwcmVmaXgsIHNraXBNYW5kYXRvcnlDaGVjayA9IGZhbHNlKSB7XG4gICAgbGV0IHJlc3VsdHMgPSBPYmplY3Qua2V5cyh0b1ZhbGlkYXRlKS5tYXAoKGtleSkgPT4ge1xuICAgICAgICBpZiAoIXNwZWNba2V5XSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9IEludmFsaWQga2V5OiAke2tleX1gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdmFsdWUgPSB0b1ZhbGlkYXRlW2tleV07XG4gICAgICAgIGxldCBkYXRhID0gc3BlY1trZXldO1xuXG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZGF0YSA9IHt0eXBlOiBkYXRhfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnR5cGUgPT09IFwiZm9ybWF0XCIpIHsgLy8gYWxsIGZvcm1hdHMgYXJlIHBhcnRpYWwgKGEuay5hIHdpbGwgYmUgbWVyZ2VkIHdpdGggc29tZSBkZWZhdWx0IHZhbHVlcykgdGh1cyBubyBuZWVkIHRvIGNoZWNrIG1hbmRhdG9yeSB2YWx1ZXNcbiAgICAgICAgICAgIGxldCB2YWxpZCA9IHZhbGlkYXRlU3BlYyh2YWx1ZSwgdmFsaWRGb3JtYXQsIGBbVmFsaWRhdGUgJHtrZXl9XWAsIHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gJHtrZXl9IHR5cGUgbWlzbWF0Y2hlZDogXCIke2RhdGEudHlwZX1cIiBleHBlY3RlZCwgXCIke3R5cGVvZiB2YWx1ZX1cIiBwcm92aWRlZGApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnJlc3RyaWN0aW9ucyAmJiBkYXRhLnJlc3RyaWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxldCBsZW5ndGggPSBkYXRhLnJlc3RyaWN0aW9ucy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHtyZXN0cmljdGlvbiwgbWVzc2FnZX0gPSBkYXRhLnJlc3RyaWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3RyaWN0aW9uKHZhbHVlLCB0b1ZhbGlkYXRlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gJHtrZXl9IGludmFsaWQgdmFsdWU6ICR7bWVzc2FnZX1gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5yZXN0cmljdGlvbiAmJiAhZGF0YS5yZXN0cmljdGlvbih2YWx1ZSwgdG9WYWxpZGF0ZSkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gaW52YWxpZCB2YWx1ZTogJHtkYXRhLm1lc3NhZ2V9YCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEudmFsaWRWYWx1ZXMgJiYgZGF0YS52YWxpZFZhbHVlcy5pbmRleE9mKHZhbHVlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gaW52YWxpZCB2YWx1ZTogbXVzdCBiZSBhbW9uZyAke0pTT04uc3RyaW5naWZ5KGRhdGEudmFsaWRWYWx1ZXMpfSwgXCIke3ZhbHVlfVwiIHByb3ZpZGVkYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGxldCB2YWxpZCA9IHZhbGlkYXRlU3BlYyh2YWx1ZSwgZGF0YS5jaGlsZHJlbiwgYFtWYWxpZGF0ZSAke2tleX1dYCk7XG5cbiAgICAgICAgICAgIGlmICghdmFsaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGlmICghc2tpcE1hbmRhdG9yeUNoZWNrKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCguLi5PYmplY3Qua2V5cyhzcGVjKS5tYXAoKGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IGRhdGEgPSBzcGVjW2tleV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0ge3R5cGU6IGRhdGF9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YS5tYW5kYXRvcnkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbWFuZGF0b3J5ID0gZGF0YS5tYW5kYXRvcnk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYW5kYXRvcnkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBtYW5kYXRvcnkgPSBtYW5kYXRvcnkodG9WYWxpZGF0ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG1hbmRhdG9yeSAmJiB0b1ZhbGlkYXRlW2tleV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gTWlzc2luZyBtYW5kYXRvcnkga2V5IFwiJHtrZXl9XCJgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHMucmVkdWNlKChhY2MsIGN1cnJlbnQpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjYyAmJiBjdXJyZW50O1xuICAgIH0sIHRydWUpO1xufVxuXG4vKipcbiAqIENoZWNrIHRoZSBwcm92aWRlZCBGT1JNQVQuXG4gKlxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IGZvcm1hdCAtIGZvcm1hdCB0byBjaGVja1xuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVGb3JtYXQoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHZhbGlkYXRlU3BlYyhmb3JtYXQsIHZhbGlkRm9ybWF0LCBcIltWYWxpZGF0ZSBmb3JtYXRdXCIpO1xufVxuXG4vKipcbiAqIENoZWNrIHRoZSBwcm92aWRlZCBMQU5HVUFHRS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb0xhbmd1YWdlfSBsYW5ndWFnZSAtIGxhbmd1YWdlIHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUxhbmd1YWdlKGxhbmd1YWdlKSB7XG4gICAgcmV0dXJuIHZhbGlkYXRlU3BlYyhsYW5ndWFnZSwgdmFsaWRMYW5ndWFnZSwgXCJbVmFsaWRhdGUgbGFuZ3VhZ2VdXCIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB2YWxpZGF0ZSxcbiAgICB2YWxpZGF0ZUZvcm1hdCxcbiAgICB2YWxpZGF0ZUlucHV0LFxuICAgIHZhbGlkYXRlTGFuZ3VhZ2Vcbn07XG4iXX0=
