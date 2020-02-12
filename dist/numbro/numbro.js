(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.numbro = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v8.0.2
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,

    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
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

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                    // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',      // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * n {number|string|BigNumber} A numeric value.
     * [b] {number} The base of n. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(n, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor usage without new.
      if (!(x instanceof BigNumber)) {

        // Don't throw on constructor call without new (#81).
        // '[BigNumber Error] Constructor call without new: {n}'
        //throw Error(bignumberError + ' Constructor call without new: ' + n);
        return new BigNumber(n, b);
      }

      if (b == null) {

        // Duplicate.
        if (n instanceof BigNumber) {
          x.s = n.s;
          x.e = n.e;
          x.c = (n = n.c) ? n.slice() : n;
          return;
        }

        isNum = typeof n == 'number';

        if (isNum && n * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / n < 0 ? (n = -n, -1) : 1;

          // Faster path for integers.
          if (n === ~~n) {
            for (e = 0, i = n; i >= 10; i /= 10, e++);
            x.e = e;
            x.c = [n];
            return;
          }

          str = String(n);
        } else {
          str = String(n);
          if (!isNumeric.test(str)) return parseNumeric(x, str, isNum);
          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');
        str = String(n);

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10) {
          x = new BigNumber(n instanceof BigNumber ? n : str);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        isNum = typeof n == 'number';

        if (isNum) {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (n * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / n < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + n);
          }

          // Prevent later check for length on converted number.
          isNum = false;
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(n), isNum, b);
          }
        }

        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      str = str.slice(i, ++len);

      if (str) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (n > MAX_SAFE_INTEGER || n !== mathfloor(n))) {
            throw Error
             (tooManyDigits + (x.s * n));
        }

        e = e - i - 1;

         // Overflow?
        if (e > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            str = str.slice(i);
            i = LOG_BASE - str.length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

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
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if only one character,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * v {any}
     */
    BigNumber.isBigNumber = function (v) {
      return v instanceof BigNumber || v && v._isBigNumber === true || false;
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, P.lt);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, P.gt);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

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
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

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
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    function maxOrMin(args, method) {
      var n,
        i = 1,
        m = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        n = new BigNumber(args[i]);

        // If any number is NaN, return NaN.
        if (!n.s) {
          m = n;
          break;
        } else if (method.call(m, n)) {
          m = n;
        }
      }

      return m;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
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

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
          x.c = x.e = null;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.c = x.e = x.s = null;
        }
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
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
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = n / pows10[d - j - 1] % 10 | 0;
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
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
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

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
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
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
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
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
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
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
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
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
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
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
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '1e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
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
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
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
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) i = g1, g1 = g2, g2 = i, len -= i;

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
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
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(coeffToString(n.c), e)
           : toFixedPoint(coeffToString(n.c), e, '0');
        } else if (b === 10) {
          n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
          str = toFixedPoint(coeffToString(n.c), n.e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol') {
      P[Symbol.toStringTag] = 'BigNumber';
      // Node.js v10.12.0+
      P[Symbol.for('nodejs.util.inspect.custom')] = P.valueOf;
    }

    if (configObject != null) BigNumber.set(configObject);

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

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== (n < 0 ? mathceil(n) : mathfloor(n))) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
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

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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
  general: {
    scale: 1024,
    suffixes: decimalSuffixes,
    marker: "bd"
  },
  binary: {
    scale: 1024,
    suffixes: binarySuffixes,
    marker: "b"
  },
  decimal: {
    scale: 1000,
    suffixes: decimalSuffixes,
    marker: "d"
  }
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
  var numbro = arguments.length > 2 ? arguments[2] : undefined;

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
    } // values greater than or equal to [scale] YB never set the suffix


    if (suffix === suffixes[0]) {
      value = value / Math.pow(scale, suffixes.length - 1);
      suffix = suffixes[suffixes.length - 1];
    }
  }

  return {
    value: value,
    suffix: suffix
  };
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
  return "".concat(output).concat(abbreviations.spaced ? " " : "").concat(suffix);
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
  return "".concat(output).concat(options.spaceSeparated ? " " : "").concat(ordinal);
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
  return "".concat(hours, ":").concat(minutes < 10 ? "0" : "").concat(minutes, ":").concat(seconds < 10 ? "0" : "").concat(seconds);
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
    return "%".concat(options.spaceSeparated ? " " : "").concat(output);
  }

  return "".concat(output).concat(options.spaceSeparated ? " " : "", "%");
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
      output = "-".concat(space).concat(symbol).concat(output.slice(1));
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
      spaceSeparated = _ref$spaceSeparated === void 0 ? false : _ref$spaceSeparated,
      _ref$totalLength = _ref.totalLength,
      totalLength = _ref$totalLength === void 0 ? 0 : _ref$totalLength;
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

  return {
    value: value,
    abbreviation: abbreviation,
    mantissaPrecision: mantissaPrecision
  };
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
      characteristicPrecision = _ref2$characteristicP === void 0 ? 0 : _ref2$characteristicP;

  var _value$toExponential$ = value.toExponential().split("e"),
      _value$toExponential$2 = _slicedToArray(_value$toExponential$, 2),
      numberString = _value$toExponential$2[0],
      exponential = _value$toExponential$2[1];

  var number = +numberString;

  if (!characteristicPrecision) {
    return {
      value: number,
      abbreviation: "e".concat(exponential)
    };
  }

  var characteristicLength = 1; // see `toExponential`

  if (characteristicLength < characteristicPrecision) {
    number = number * Math.pow(10, characteristicPrecision - characteristicLength);
    exponential = +exponential - (characteristicPrecision - characteristicLength);
    exponential = exponential >= 0 ? "+".concat(exponential) : exponential;
  }

  return {
    value: number,
    abbreviation: "e".concat(exponential)
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
      mantissa = _base$split2$ === void 0 ? "" : _base$split2$;

  if (+exp > 0) {
    result = characteristic + mantissa + zeroes(exp - mantissa.length);
  } else {
    var prefix = ".";

    if (+characteristic < 0) {
      prefix = "-0".concat(prefix);
    } else {
      prefix = "0".concat(prefix);
    }

    var suffix = (zeroes(-exp - 1) + Math.abs(characteristic) + mantissa).substr(0, precision);

    if (suffix.length < precision) {
      suffix += zeroes(precision - suffix.length);
    }

    result = prefix + suffix;
  }

  if (+exp > 0 && precision > 0) {
    result += ".".concat(zeroes(precision));
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

  return (Math.round(+"".concat(value, "e+").concat(precision)) / Math.pow(10, precision)).toFixed(precision);
}
/**
 * Return the current OUTPUT with a mantissa precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalMantissa - if `true`, the mantissa is omitted when it's only zeroes
 * @param {number} precision - desired precision of the mantissa
 * @param {boolean} trim - if `true`, trailing zeroes are removed from the mantissa
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
      currentMantissa = _result$toString$spli3 === void 0 ? "" : _result$toString$spli3;

  if (currentMantissa.match(/^0+$/) && (optionalMantissa || trim)) {
    return currentCharacteristic;
  }

  var hasTrailingZeroes = currentMantissa.match(/0+$/);

  if (trim && hasTrailingZeroes) {
    return "".concat(currentCharacteristic, ".").concat(currentMantissa.toString().slice(0, hasTrailingZeroes.index));
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

    return "".concat(currentCharacteristic.replace("0", ""), ".").concat(currentMantissa);
  }

  if (currentCharacteristic.length < precision) {
    var missingZeros = precision - currentCharacteristic.length;

    for (var i = 0; i < missingZeros; i++) {
      result = "0".concat(result);
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
      characteristic = "-".concat(characteristic);
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
    return "+".concat(output);
  }

  if (negative === "sign") {
    return output;
  }

  return "(".concat(output.replace("-", ""), ")");
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
      state = _ref3$state === void 0 ? globalState : _ref3$state,
      decimalSeparator = _ref3.decimalSeparator,
      _ref3$defaults = _ref3.defaults,
      defaults = _ref3$defaults === void 0 ? state.currentDefaults() : _ref3$defaults;
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
  var average = !!totalLength || !!forceAverage || options.average; // default when averaging is to chop off decimals

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
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _format.apply(void 0, args.concat([numbro]));
    },
    getByteUnit: function getByteUnit() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return _getByteUnit.apply(void 0, args.concat([numbro]));
    },
    getBinaryByteUnit: function getBinaryByteUnit() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _getBinaryByteUnit.apply(void 0, args.concat([numbro]));
    },
    getDecimalByteUnit: function getDecimalByteUnit() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return _getDecimalByteUnit.apply(void 0, args.concat([numbro]));
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
}; //
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
}; //
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
}; //
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
}; //
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

    throw new Error("Unknown tag \"".concat(tag, "\""));
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
      data = require("../languages/".concat(tag));
    } catch (e) {
      console.error("Unable to load \"".concat(tag, "\". No matching language file found.")); // eslint-disable-line no-console
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
  n._value = value.plus(otherValue).toNumber();
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

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
var VERSION = "2.1.2";

var globalState = require("./globalState");

var validator = require("./validating");

var loader = require("./loading")(numbro);

var unformatter = require("./unformatting");

var formatter = require("./formatting")(numbro);

var manipulate = require("./manipulating")(numbro);

var parsing = require("./parsing");

var Numbro =
/*#__PURE__*/
function () {
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
}; //
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
var allSuffixes = [{
  key: "ZiB",
  factor: Math.pow(1024, 7)
}, {
  key: "ZB",
  factor: Math.pow(1000, 7)
}, {
  key: "YiB",
  factor: Math.pow(1024, 8)
}, {
  key: "YB",
  factor: Math.pow(1000, 8)
}, {
  key: "TiB",
  factor: Math.pow(1024, 4)
}, {
  key: "TB",
  factor: Math.pow(1000, 4)
}, {
  key: "PiB",
  factor: Math.pow(1024, 5)
}, {
  key: "PB",
  factor: Math.pow(1000, 5)
}, {
  key: "MiB",
  factor: Math.pow(1024, 2)
}, {
  key: "MB",
  factor: Math.pow(1000, 2)
}, {
  key: "KiB",
  factor: Math.pow(1024, 1)
}, {
  key: "KB",
  factor: Math.pow(1000, 1)
}, {
  key: "GiB",
  factor: Math.pow(1024, 3)
}, {
  key: "GB",
  factor: Math.pow(1000, 3)
}, {
  key: "EiB",
  factor: Math.pow(1024, 6)
}, {
  key: "EB",
  factor: Math.pow(1000, 6)
}, {
  key: "B",
  factor: 1
}];
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
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (!isNaN(+inputString)) {
    return +inputString;
  }

  var stripped = ""; // Negative

  var newInput = inputString.replace(/(^[^(]*)\((.*)\)([^)]*$)/, "$1$2$3");

  if (newInput !== inputString) {
    return -1 * computeUnformattedValue(newInput, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
  } // Byte


  for (var i = 0; i < allSuffixes.length; i++) {
    var suffix = allSuffixes[i];
    stripped = inputString.replace(suffix.key, "");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * suffix.factor;
    }
  } // Percent


  stripped = inputString.replace("%", "");

  if (stripped !== inputString) {
    return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) / 100;
  } // Ordinal


  var possibleOrdinalValue = parseFloat(inputString);

  if (isNaN(possibleOrdinalValue)) {
    return undefined;
  }

  var ordinalString = ordinal(possibleOrdinalValue);

  if (ordinalString && ordinalString !== ".") {
    // if ordinal is "." it will be caught next round in the +inputString
    stripped = inputString.replace(new RegExp("".concat(escapeRegExp(ordinalString), "$")), "");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }
  } // Average


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

      switch (key) {
        // eslint-disable-line default-case
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
  var stripped = inputString.replace(currencySymbol, ""); // Thousand separators

  stripped = stripped.replace(new RegExp("([0-9])".concat(escapeRegExp(delimiters.thousands), "([0-9])"), "g"), "$1$2"); // Decimal

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
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (inputString === "") {
    return undefined;
  } // Zero Format


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

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
var unformatter = require("./unformatting"); // Simplified regexp supporting only `language`, `script`, and `region`


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
      console.error("".concat(prefix, " Invalid key: ").concat(key)); // eslint-disable-line no-console

      return false;
    }

    var value = toValidate[key];
    var data = spec[key];

    if (typeof data === "string") {
      data = {
        type: data
      };
    }

    if (data.type === "format") {
      // all formats are partial (a.k.a will be merged with some default values) thus no need to check mandatory values
      var valid = validateSpec(value, validFormat, "[Validate ".concat(key, "]"), true);

      if (!valid) {
        return false;
      }
    } else if (_typeof(value) !== data.type) {
      console.error("".concat(prefix, " ").concat(key, " type mismatched: \"").concat(data.type, "\" expected, \"").concat(_typeof(value), "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.restrictions && data.restrictions.length) {
      var length = data.restrictions.length;

      for (var i = 0; i < length; i++) {
        var _data$restrictions$i = data.restrictions[i],
            restriction = _data$restrictions$i.restriction,
            message = _data$restrictions$i.message;

        if (!restriction(value, toValidate)) {
          console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(message)); // eslint-disable-line no-console

          return false;
        }
      }
    }

    if (data.restriction && !data.restriction(value, toValidate)) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(data.message)); // eslint-disable-line no-console

      return false;
    }

    if (data.validValues && data.validValues.indexOf(value) === -1) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: must be among ").concat(JSON.stringify(data.validValues), ", \"").concat(value, "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.children) {
      var _valid = validateSpec(value, data.children, "[Validate ".concat(key, "]"));

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
        data = {
          type: data
        };
      }

      if (data.mandatory) {
        var mandatory = data.mandatory;

        if (typeof mandatory === "function") {
          mandatory = mandatory(toValidate);
        }

        if (mandatory && toValidate[key] === undefined) {
          console.error("".concat(prefix, " Missing mandatory key \"").concat(key, "\"")); // eslint-disable-line no-console

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnbnVtYmVyLmpzL2JpZ251bWJlci5qcyIsInNyYy9lbi1VUy5qcyIsInNyYy9mb3JtYXR0aW5nLmpzIiwic3JjL2dsb2JhbFN0YXRlLmpzIiwic3JjL2xvYWRpbmcuanMiLCJzcmMvbWFuaXB1bGF0aW5nLmpzIiwic3JjL251bWJyby5qcyIsInNyYy9wYXJzaW5nLmpzIiwic3JjL3VuZm9ybWF0dGluZy5qcyIsInNyYy92YWxpZGF0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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LEtBbkJlLENBQVQsRUFBUDtBQW9CSDs7QUFFRCxTQUFPLE9BQU8sQ0FBQyxNQUFSLENBQWUsVUFBQyxHQUFELEVBQU0sT0FBTixFQUFrQjtBQUNwQyxXQUFPLEdBQUcsSUFBSSxPQUFkO0FBQ0gsR0FGTSxFQUVKLElBRkksQ0FBUDtBQUdIO0FBRUQ7Ozs7Ozs7O0FBTUEsU0FBUyxjQUFULENBQXdCLE1BQXhCLEVBQWdDO0FBQzVCLFNBQU8sWUFBWSxDQUFDLE1BQUQsRUFBUyxXQUFULEVBQXNCLG1CQUF0QixDQUFuQjtBQUNIO0FBRUQ7Ozs7Ozs7O0FBTUEsU0FBUyxnQkFBVCxDQUEwQixRQUExQixFQUFvQztBQUNoQyxTQUFPLFlBQVksQ0FBQyxRQUFELEVBQVcsYUFBWCxFQUEwQixxQkFBMUIsQ0FBbkI7QUFDSDs7QUFFRCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQUNiLEVBQUEsUUFBUSxFQUFSLFFBRGE7QUFFYixFQUFBLGNBQWMsRUFBZCxjQUZhO0FBR2IsRUFBQSxhQUFhLEVBQWIsYUFIYTtBQUliLEVBQUEsZ0JBQWdCLEVBQWhCO0FBSmEsQ0FBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCI7KGZ1bmN0aW9uIChnbG9iYWxPYmplY3QpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4vKlxyXG4gKiAgICAgIGJpZ251bWJlci5qcyB2OC4wLjJcclxuICogICAgICBBIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgYXJiaXRyYXJ5LXByZWNpc2lvbiBhcml0aG1ldGljLlxyXG4gKiAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZ251bWJlci5qc1xyXG4gKiAgICAgIENvcHlyaWdodCAoYykgMjAxOSBNaWNoYWVsIE1jbGF1Z2hsaW4gPE04Y2g4OGxAZ21haWwuY29tPlxyXG4gKiAgICAgIE1JVCBMaWNlbnNlZC5cclxuICpcclxuICogICAgICBCaWdOdW1iZXIucHJvdG90eXBlIG1ldGhvZHMgICAgIHwgIEJpZ051bWJlciBtZXRob2RzXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgYWJzb2x1dGVWYWx1ZSAgICAgICAgICAgIGFicyAgICB8ICBjbG9uZVxyXG4gKiAgICAgIGNvbXBhcmVkVG8gICAgICAgICAgICAgICAgICAgICAgfCAgY29uZmlnICAgICAgICAgICAgICAgc2V0XHJcbiAqICAgICAgZGVjaW1hbFBsYWNlcyAgICAgICAgICAgIGRwICAgICB8ICAgICAgREVDSU1BTF9QTEFDRVNcclxuICogICAgICBkaXZpZGVkQnkgICAgICAgICAgICAgICAgZGl2ICAgIHwgICAgICBST1VORElOR19NT0RFXHJcbiAqICAgICAgZGl2aWRlZFRvSW50ZWdlckJ5ICAgICAgIGlkaXYgICB8ICAgICAgRVhQT05FTlRJQUxfQVRcclxuICogICAgICBleHBvbmVudGlhdGVkQnkgICAgICAgICAgcG93ICAgIHwgICAgICBSQU5HRVxyXG4gKiAgICAgIGludGVnZXJWYWx1ZSAgICAgICAgICAgICAgICAgICAgfCAgICAgIENSWVBUT1xyXG4gKiAgICAgIGlzRXF1YWxUbyAgICAgICAgICAgICAgICBlcSAgICAgfCAgICAgIE1PRFVMT19NT0RFXHJcbiAqICAgICAgaXNGaW5pdGUgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgUE9XX1BSRUNJU0lPTlxyXG4gKiAgICAgIGlzR3JlYXRlclRoYW4gICAgICAgICAgICBndCAgICAgfCAgICAgIEZPUk1BVFxyXG4gKiAgICAgIGlzR3JlYXRlclRoYW5PckVxdWFsVG8gICBndGUgICAgfCAgICAgIEFMUEhBQkVUXHJcbiAqICAgICAgaXNJbnRlZ2VyICAgICAgICAgICAgICAgICAgICAgICB8ICBpc0JpZ051bWJlclxyXG4gKiAgICAgIGlzTGVzc1RoYW4gICAgICAgICAgICAgICBsdCAgICAgfCAgbWF4aW11bSAgICAgICAgICAgICAgbWF4XHJcbiAqICAgICAgaXNMZXNzVGhhbk9yRXF1YWxUbyAgICAgIGx0ZSAgICB8ICBtaW5pbXVtICAgICAgICAgICAgICBtaW5cclxuICogICAgICBpc05hTiAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgIHJhbmRvbVxyXG4gKiAgICAgIGlzTmVnYXRpdmUgICAgICAgICAgICAgICAgICAgICAgfCAgc3VtXHJcbiAqICAgICAgaXNQb3NpdGl2ZSAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgaXNaZXJvICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgbWludXMgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgbW9kdWxvICAgICAgICAgICAgICAgICAgIG1vZCAgICB8XHJcbiAqICAgICAgbXVsdGlwbGllZEJ5ICAgICAgICAgICAgIHRpbWVzICB8XHJcbiAqICAgICAgbmVnYXRlZCAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgcGx1cyAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgcHJlY2lzaW9uICAgICAgICAgICAgICAgIHNkICAgICB8XHJcbiAqICAgICAgc2hpZnRlZEJ5ICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgc3F1YXJlUm9vdCAgICAgICAgICAgICAgIHNxcnQgICB8XHJcbiAqICAgICAgdG9FeHBvbmVudGlhbCAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9GaXhlZCAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9Gb3JtYXQgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9GcmFjdGlvbiAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9KU09OICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9OdW1iZXIgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9QcmVjaXNpb24gICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9TdHJpbmcgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdmFsdWVPZiAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqXHJcbiAqL1xyXG5cclxuXHJcbiAgdmFyIEJpZ051bWJlcixcclxuICAgIGlzTnVtZXJpYyA9IC9eLT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKD86ZVsrLV0/XFxkKyk/JC9pLFxyXG5cclxuICAgIG1hdGhjZWlsID0gTWF0aC5jZWlsLFxyXG4gICAgbWF0aGZsb29yID0gTWF0aC5mbG9vcixcclxuXHJcbiAgICBiaWdudW1iZXJFcnJvciA9ICdbQmlnTnVtYmVyIEVycm9yXSAnLFxyXG4gICAgdG9vTWFueURpZ2l0cyA9IGJpZ251bWJlckVycm9yICsgJ051bWJlciBwcmltaXRpdmUgaGFzIG1vcmUgdGhhbiAxNSBzaWduaWZpY2FudCBkaWdpdHM6ICcsXHJcblxyXG4gICAgQkFTRSA9IDFlMTQsXHJcbiAgICBMT0dfQkFTRSA9IDE0LFxyXG4gICAgTUFYX1NBRkVfSU5URUdFUiA9IDB4MWZmZmZmZmZmZmZmZmYsICAgICAgICAgLy8gMl41MyAtIDFcclxuICAgIC8vIE1BWF9JTlQzMiA9IDB4N2ZmZmZmZmYsICAgICAgICAgICAgICAgICAgIC8vIDJeMzEgLSAxXHJcbiAgICBQT1dTX1RFTiA9IFsxLCAxMCwgMTAwLCAxZTMsIDFlNCwgMWU1LCAxZTYsIDFlNywgMWU4LCAxZTksIDFlMTAsIDFlMTEsIDFlMTIsIDFlMTNdLFxyXG4gICAgU1FSVF9CQVNFID0gMWU3LFxyXG5cclxuICAgIC8vIEVESVRBQkxFXHJcbiAgICAvLyBUaGUgbGltaXQgb24gdGhlIHZhbHVlIG9mIERFQ0lNQUxfUExBQ0VTLCBUT19FWFBfTkVHLCBUT19FWFBfUE9TLCBNSU5fRVhQLCBNQVhfRVhQLCBhbmRcclxuICAgIC8vIHRoZSBhcmd1bWVudHMgdG8gdG9FeHBvbmVudGlhbCwgdG9GaXhlZCwgdG9Gb3JtYXQsIGFuZCB0b1ByZWNpc2lvbi5cclxuICAgIE1BWCA9IDFFOTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYX0lOVDMyXHJcblxyXG5cclxuICAvKlxyXG4gICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgQmlnTnVtYmVyIGNvbnN0cnVjdG9yLlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNsb25lKGNvbmZpZ09iamVjdCkge1xyXG4gICAgdmFyIGRpdiwgY29udmVydEJhc2UsIHBhcnNlTnVtZXJpYyxcclxuICAgICAgUCA9IEJpZ051bWJlci5wcm90b3R5cGUgPSB7IGNvbnN0cnVjdG9yOiBCaWdOdW1iZXIsIHRvU3RyaW5nOiBudWxsLCB2YWx1ZU9mOiBudWxsIH0sXHJcbiAgICAgIE9ORSA9IG5ldyBCaWdOdW1iZXIoMSksXHJcblxyXG5cclxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFRElUQUJMRSBDT05GSUcgREVGQVVMVFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbiAgICAgIC8vIFRoZSBkZWZhdWx0IHZhbHVlcyBiZWxvdyBtdXN0IGJlIGludGVnZXJzIHdpdGhpbiB0aGUgaW5jbHVzaXZlIHJhbmdlcyBzdGF0ZWQuXHJcbiAgICAgIC8vIFRoZSB2YWx1ZXMgY2FuIGFsc28gYmUgY2hhbmdlZCBhdCBydW4tdGltZSB1c2luZyBCaWdOdW1iZXIuc2V0LlxyXG5cclxuICAgICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIGZvciBvcGVyYXRpb25zIGludm9sdmluZyBkaXZpc2lvbi5cclxuICAgICAgREVDSU1BTF9QTEFDRVMgPSAyMCwgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWFxyXG5cclxuICAgICAgLy8gVGhlIHJvdW5kaW5nIG1vZGUgdXNlZCB3aGVuIHJvdW5kaW5nIHRvIHRoZSBhYm92ZSBkZWNpbWFsIHBsYWNlcywgYW5kIHdoZW4gdXNpbmdcclxuICAgICAgLy8gdG9FeHBvbmVudGlhbCwgdG9GaXhlZCwgdG9Gb3JtYXQgYW5kIHRvUHJlY2lzaW9uLCBhbmQgcm91bmQgKGRlZmF1bHQgdmFsdWUpLlxyXG4gICAgICAvLyBVUCAgICAgICAgIDAgQXdheSBmcm9tIHplcm8uXHJcbiAgICAgIC8vIERPV04gICAgICAgMSBUb3dhcmRzIHplcm8uXHJcbiAgICAgIC8vIENFSUwgICAgICAgMiBUb3dhcmRzICtJbmZpbml0eS5cclxuICAgICAgLy8gRkxPT1IgICAgICAzIFRvd2FyZHMgLUluZmluaXR5LlxyXG4gICAgICAvLyBIQUxGX1VQICAgIDQgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHVwLlxyXG4gICAgICAvLyBIQUxGX0RPV04gIDUgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIGRvd24uXHJcbiAgICAgIC8vIEhBTEZfRVZFTiAgNiBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdG93YXJkcyBldmVuIG5laWdoYm91ci5cclxuICAgICAgLy8gSEFMRl9DRUlMICA3IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzICtJbmZpbml0eS5cclxuICAgICAgLy8gSEFMRl9GTE9PUiA4IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgUk9VTkRJTkdfTU9ERSA9IDQsICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIDhcclxuXHJcbiAgICAgIC8vIEVYUE9ORU5USUFMX0FUIDogW1RPX0VYUF9ORUcgLCBUT19FWFBfUE9TXVxyXG5cclxuICAgICAgLy8gVGhlIGV4cG9uZW50IHZhbHVlIGF0IGFuZCBiZW5lYXRoIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAtN1xyXG4gICAgICBUT19FWFBfTkVHID0gLTcsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gLU1BWFxyXG5cclxuICAgICAgLy8gVGhlIGV4cG9uZW50IHZhbHVlIGF0IGFuZCBhYm92ZSB3aGljaCB0b1N0cmluZyByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogMjFcclxuICAgICAgVE9fRVhQX1BPUyA9IDIxLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWFxyXG5cclxuICAgICAgLy8gUkFOR0UgOiBbTUlOX0VYUCwgTUFYX0VYUF1cclxuXHJcbiAgICAgIC8vIFRoZSBtaW5pbXVtIGV4cG9uZW50IHZhbHVlLCBiZW5lYXRoIHdoaWNoIHVuZGVyZmxvdyB0byB6ZXJvIG9jY3Vycy5cclxuICAgICAgLy8gTnVtYmVyIHR5cGU6IC0zMjQgICg1ZS0zMjQpXHJcbiAgICAgIE1JTl9FWFAgPSAtMWU3LCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLTEgdG8gLU1BWFxyXG5cclxuICAgICAgLy8gVGhlIG1heGltdW0gZXhwb25lbnQgdmFsdWUsIGFib3ZlIHdoaWNoIG92ZXJmbG93IHRvIEluZmluaXR5IG9jY3Vycy5cclxuICAgICAgLy8gTnVtYmVyIHR5cGU6ICAzMDggICgxLjc5NzY5MzEzNDg2MjMxNTdlKzMwOClcclxuICAgICAgLy8gRm9yIE1BWF9FWFAgPiAxZTcsIGUuZy4gbmV3IEJpZ051bWJlcignMWUxMDAwMDAwMDAnKS5wbHVzKDEpIG1heSBiZSBzbG93LlxyXG4gICAgICBNQVhfRVhQID0gMWU3LCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDEgdG8gTUFYXHJcblxyXG4gICAgICAvLyBXaGV0aGVyIHRvIHVzZSBjcnlwdG9ncmFwaGljYWxseS1zZWN1cmUgcmFuZG9tIG51bWJlciBnZW5lcmF0aW9uLCBpZiBhdmFpbGFibGUuXHJcbiAgICAgIENSWVBUTyA9IGZhbHNlLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdHJ1ZSBvciBmYWxzZVxyXG5cclxuICAgICAgLy8gVGhlIG1vZHVsbyBtb2RlIHVzZWQgd2hlbiBjYWxjdWxhdGluZyB0aGUgbW9kdWx1czogYSBtb2Qgbi5cclxuICAgICAgLy8gVGhlIHF1b3RpZW50IChxID0gYSAvIG4pIGlzIGNhbGN1bGF0ZWQgYWNjb3JkaW5nIHRvIHRoZSBjb3JyZXNwb25kaW5nIHJvdW5kaW5nIG1vZGUuXHJcbiAgICAgIC8vIFRoZSByZW1haW5kZXIgKHIpIGlzIGNhbGN1bGF0ZWQgYXM6IHIgPSBhIC0gbiAqIHEuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFVQICAgICAgICAwIFRoZSByZW1haW5kZXIgaXMgcG9zaXRpdmUgaWYgdGhlIGRpdmlkZW5kIGlzIG5lZ2F0aXZlLCBlbHNlIGlzIG5lZ2F0aXZlLlxyXG4gICAgICAvLyBET1dOICAgICAgMSBUaGUgcmVtYWluZGVyIGhhcyB0aGUgc2FtZSBzaWduIGFzIHRoZSBkaXZpZGVuZC5cclxuICAgICAgLy8gICAgICAgICAgICAgVGhpcyBtb2R1bG8gbW9kZSBpcyBjb21tb25seSBrbm93biBhcyAndHJ1bmNhdGVkIGRpdmlzaW9uJyBhbmQgaXNcclxuICAgICAgLy8gICAgICAgICAgICAgZXF1aXZhbGVudCB0byAoYSAlIG4pIGluIEphdmFTY3JpcHQuXHJcbiAgICAgIC8vIEZMT09SICAgICAzIFRoZSByZW1haW5kZXIgaGFzIHRoZSBzYW1lIHNpZ24gYXMgdGhlIGRpdmlzb3IgKFB5dGhvbiAlKS5cclxuICAgICAgLy8gSEFMRl9FVkVOIDYgVGhpcyBtb2R1bG8gbW9kZSBpbXBsZW1lbnRzIHRoZSBJRUVFIDc1NCByZW1haW5kZXIgZnVuY3Rpb24uXHJcbiAgICAgIC8vIEVVQ0xJRCAgICA5IEV1Y2xpZGlhbiBkaXZpc2lvbi4gcSA9IHNpZ24obikgKiBmbG9vcihhIC8gYWJzKG4pKS5cclxuICAgICAgLy8gICAgICAgICAgICAgVGhlIHJlbWFpbmRlciBpcyBhbHdheXMgcG9zaXRpdmUuXHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIFRoZSB0cnVuY2F0ZWQgZGl2aXNpb24sIGZsb29yZWQgZGl2aXNpb24sIEV1Y2xpZGlhbiBkaXZpc2lvbiBhbmQgSUVFRSA3NTQgcmVtYWluZGVyXHJcbiAgICAgIC8vIG1vZGVzIGFyZSBjb21tb25seSB1c2VkIGZvciB0aGUgbW9kdWx1cyBvcGVyYXRpb24uXHJcbiAgICAgIC8vIEFsdGhvdWdoIHRoZSBvdGhlciByb3VuZGluZyBtb2RlcyBjYW4gYWxzbyBiZSB1c2VkLCB0aGV5IG1heSBub3QgZ2l2ZSB1c2VmdWwgcmVzdWx0cy5cclxuICAgICAgTU9EVUxPX01PREUgPSAxLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIDlcclxuXHJcbiAgICAgIC8vIFRoZSBtYXhpbXVtIG51bWJlciBvZiBzaWduaWZpY2FudCBkaWdpdHMgb2YgdGhlIHJlc3VsdCBvZiB0aGUgZXhwb25lbnRpYXRlZEJ5IG9wZXJhdGlvbi5cclxuICAgICAgLy8gSWYgUE9XX1BSRUNJU0lPTiBpcyAwLCB0aGVyZSB3aWxsIGJlIHVubGltaXRlZCBzaWduaWZpY2FudCBkaWdpdHMuXHJcbiAgICAgIFBPV19QUkVDSVNJT04gPSAwLCAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhcclxuXHJcbiAgICAgIC8vIFRoZSBmb3JtYXQgc3BlY2lmaWNhdGlvbiB1c2VkIGJ5IHRoZSBCaWdOdW1iZXIucHJvdG90eXBlLnRvRm9ybWF0IG1ldGhvZC5cclxuICAgICAgRk9STUFUID0ge1xyXG4gICAgICAgIHByZWZpeDogJycsXHJcbiAgICAgICAgZ3JvdXBTaXplOiAzLFxyXG4gICAgICAgIHNlY29uZGFyeUdyb3VwU2l6ZTogMCxcclxuICAgICAgICBncm91cFNlcGFyYXRvcjogJywnLFxyXG4gICAgICAgIGRlY2ltYWxTZXBhcmF0b3I6ICcuJyxcclxuICAgICAgICBmcmFjdGlvbkdyb3VwU2l6ZTogMCxcclxuICAgICAgICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yOiAnXFx4QTAnLCAgICAgIC8vIG5vbi1icmVha2luZyBzcGFjZVxyXG4gICAgICAgIHN1ZmZpeDogJydcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIFRoZSBhbHBoYWJldCB1c2VkIGZvciBiYXNlIGNvbnZlcnNpb24uIEl0IG11c3QgYmUgYXQgbGVhc3QgMiBjaGFyYWN0ZXJzIGxvbmcsIHdpdGggbm8gJysnLFxyXG4gICAgICAvLyAnLScsICcuJywgd2hpdGVzcGFjZSwgb3IgcmVwZWF0ZWQgY2hhcmFjdGVyLlxyXG4gICAgICAvLyAnMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVokXydcclxuICAgICAgQUxQSEFCRVQgPSAnMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6JztcclxuXHJcblxyXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblxyXG4gICAgLy8gQ09OU1RSVUNUT1JcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFRoZSBCaWdOdW1iZXIgY29uc3RydWN0b3IgYW5kIGV4cG9ydGVkIGZ1bmN0aW9uLlxyXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBuZXcgaW5zdGFuY2Ugb2YgYSBCaWdOdW1iZXIgb2JqZWN0LlxyXG4gICAgICpcclxuICAgICAqIG4ge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfSBBIG51bWVyaWMgdmFsdWUuXHJcbiAgICAgKiBbYl0ge251bWJlcn0gVGhlIGJhc2Ugb2Ygbi4gSW50ZWdlciwgMiB0byBBTFBIQUJFVC5sZW5ndGggaW5jbHVzaXZlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBCaWdOdW1iZXIobiwgYikge1xyXG4gICAgICB2YXIgYWxwaGFiZXQsIGMsIGNhc2VDaGFuZ2VkLCBlLCBpLCBpc051bSwgbGVuLCBzdHIsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICAvLyBFbmFibGUgY29uc3RydWN0b3IgdXNhZ2Ugd2l0aG91dCBuZXcuXHJcbiAgICAgIGlmICghKHggaW5zdGFuY2VvZiBCaWdOdW1iZXIpKSB7XHJcblxyXG4gICAgICAgIC8vIERvbid0IHRocm93IG9uIGNvbnN0cnVjdG9yIGNhbGwgd2l0aG91dCBuZXcgKCM4MSkuXHJcbiAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIENvbnN0cnVjdG9yIGNhbGwgd2l0aG91dCBuZXc6IHtufSdcclxuICAgICAgICAvL3Rocm93IEVycm9yKGJpZ251bWJlckVycm9yICsgJyBDb25zdHJ1Y3RvciBjYWxsIHdpdGhvdXQgbmV3OiAnICsgbik7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIobiwgYik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChiID09IG51bGwpIHtcclxuXHJcbiAgICAgICAgLy8gRHVwbGljYXRlLlxyXG4gICAgICAgIGlmIChuIGluc3RhbmNlb2YgQmlnTnVtYmVyKSB7XHJcbiAgICAgICAgICB4LnMgPSBuLnM7XHJcbiAgICAgICAgICB4LmUgPSBuLmU7XHJcbiAgICAgICAgICB4LmMgPSAobiA9IG4uYykgPyBuLnNsaWNlKCkgOiBuO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaXNOdW0gPSB0eXBlb2YgbiA9PSAnbnVtYmVyJztcclxuXHJcbiAgICAgICAgaWYgKGlzTnVtICYmIG4gKiAwID09IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBVc2UgYDEgLyBuYCB0byBoYW5kbGUgbWludXMgemVybyBhbHNvLlxyXG4gICAgICAgICAgeC5zID0gMSAvIG4gPCAwID8gKG4gPSAtbiwgLTEpIDogMTtcclxuXHJcbiAgICAgICAgICAvLyBGYXN0ZXIgcGF0aCBmb3IgaW50ZWdlcnMuXHJcbiAgICAgICAgICBpZiAobiA9PT0gfn5uKSB7XHJcbiAgICAgICAgICAgIGZvciAoZSA9IDAsIGkgPSBuOyBpID49IDEwOyBpIC89IDEwLCBlKyspO1xyXG4gICAgICAgICAgICB4LmUgPSBlO1xyXG4gICAgICAgICAgICB4LmMgPSBbbl07XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBzdHIgPSBTdHJpbmcobik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHN0ciA9IFN0cmluZyhuKTtcclxuICAgICAgICAgIGlmICghaXNOdW1lcmljLnRlc3Qoc3RyKSkgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBzdHIsIGlzTnVtKTtcclxuICAgICAgICAgIHgucyA9IHN0ci5jaGFyQ29kZUF0KDApID09IDQ1ID8gKHN0ciA9IHN0ci5zbGljZSgxKSwgLTEpIDogMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERlY2ltYWwgcG9pbnQ/XHJcbiAgICAgICAgaWYgKChlID0gc3RyLmluZGV4T2YoJy4nKSkgPiAtMSkgc3RyID0gc3RyLnJlcGxhY2UoJy4nLCAnJyk7XHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50aWFsIGZvcm0/XHJcbiAgICAgICAgaWYgKChpID0gc3RyLnNlYXJjaCgvZS9pKSkgPiAwKSB7XHJcblxyXG4gICAgICAgICAgLy8gRGV0ZXJtaW5lIGV4cG9uZW50LlxyXG4gICAgICAgICAgaWYgKGUgPCAwKSBlID0gaTtcclxuICAgICAgICAgIGUgKz0gK3N0ci5zbGljZShpICsgMSk7XHJcbiAgICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIGkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBJbnRlZ2VyLlxyXG4gICAgICAgICAgZSA9IHN0ci5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIEJhc2Uge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2J9J1xyXG4gICAgICAgIGludENoZWNrKGIsIDIsIEFMUEhBQkVULmxlbmd0aCwgJ0Jhc2UnKTtcclxuICAgICAgICBzdHIgPSBTdHJpbmcobik7XHJcblxyXG4gICAgICAgIC8vIEFsbG93IGV4cG9uZW50aWFsIG5vdGF0aW9uIHRvIGJlIHVzZWQgd2l0aCBiYXNlIDEwIGFyZ3VtZW50LCB3aGlsZVxyXG4gICAgICAgIC8vIGFsc28gcm91bmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYXMgd2l0aCBvdGhlciBiYXNlcy5cclxuICAgICAgICBpZiAoYiA9PSAxMCkge1xyXG4gICAgICAgICAgeCA9IG5ldyBCaWdOdW1iZXIobiBpbnN0YW5jZW9mIEJpZ051bWJlciA/IG4gOiBzdHIpO1xyXG4gICAgICAgICAgcmV0dXJuIHJvdW5kKHgsIERFQ0lNQUxfUExBQ0VTICsgeC5lICsgMSwgUk9VTkRJTkdfTU9ERSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpc051bSA9IHR5cGVvZiBuID09ICdudW1iZXInO1xyXG5cclxuICAgICAgICBpZiAoaXNOdW0pIHtcclxuXHJcbiAgICAgICAgICAvLyBBdm9pZCBwb3RlbnRpYWwgaW50ZXJwcmV0YXRpb24gb2YgSW5maW5pdHkgYW5kIE5hTiBhcyBiYXNlIDQ0KyB2YWx1ZXMuXHJcbiAgICAgICAgICBpZiAobiAqIDAgIT0gMCkgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBzdHIsIGlzTnVtLCBiKTtcclxuXHJcbiAgICAgICAgICB4LnMgPSAxIC8gbiA8IDAgPyAoc3RyID0gc3RyLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiB7bn0nXHJcbiAgICAgICAgICBpZiAoQmlnTnVtYmVyLkRFQlVHICYmIHN0ci5yZXBsYWNlKC9eMFxcLjAqfFxcLi8sICcnKS5sZW5ndGggPiAxNSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKHRvb01hbnlEaWdpdHMgKyBuKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBQcmV2ZW50IGxhdGVyIGNoZWNrIGZvciBsZW5ndGggb24gY29udmVydGVkIG51bWJlci5cclxuICAgICAgICAgIGlzTnVtID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHgucyA9IHN0ci5jaGFyQ29kZUF0KDApID09PSA0NSA/IChzdHIgPSBzdHIuc2xpY2UoMSksIC0xKSA6IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhbHBoYWJldCA9IEFMUEhBQkVULnNsaWNlKDAsIGIpO1xyXG4gICAgICAgIGUgPSBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCBzdHIgaXMgYSB2YWxpZCBiYXNlIGIgbnVtYmVyLlxyXG4gICAgICAgIC8vIERvbid0IHVzZSBSZWdFeHAgc28gYWxwaGFiZXQgY2FuIGNvbnRhaW4gc3BlY2lhbCBjaGFyYWN0ZXJzLlxyXG4gICAgICAgIGZvciAobGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoYWxwaGFiZXQuaW5kZXhPZihjID0gc3RyLmNoYXJBdChpKSkgPCAwKSB7XHJcbiAgICAgICAgICAgIGlmIChjID09ICcuJykge1xyXG5cclxuICAgICAgICAgICAgICAvLyBJZiAnLicgaXMgbm90IHRoZSBmaXJzdCBjaGFyYWN0ZXIgYW5kIGl0IGhhcyBub3QgYmUgZm91bmQgYmVmb3JlLlxyXG4gICAgICAgICAgICAgIGlmIChpID4gZSkge1xyXG4gICAgICAgICAgICAgICAgZSA9IGxlbjtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICghY2FzZUNoYW5nZWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQWxsb3cgZS5nLiBoZXhhZGVjaW1hbCAnRkYnIGFzIHdlbGwgYXMgJ2ZmJy5cclxuICAgICAgICAgICAgICBpZiAoc3RyID09IHN0ci50b1VwcGVyQ2FzZSgpICYmIChzdHIgPSBzdHIudG9Mb3dlckNhc2UoKSkgfHxcclxuICAgICAgICAgICAgICAgICAgc3RyID09IHN0ci50b0xvd2VyQ2FzZSgpICYmIChzdHIgPSBzdHIudG9VcHBlckNhc2UoKSkpIHtcclxuICAgICAgICAgICAgICAgIGNhc2VDaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGkgPSAtMTtcclxuICAgICAgICAgICAgICAgIGUgPSAwO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VOdW1lcmljKHgsIFN0cmluZyhuKSwgaXNOdW0sIGIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RyID0gY29udmVydEJhc2Uoc3RyLCBiLCAxMCwgeC5zKTtcclxuXHJcbiAgICAgICAgLy8gRGVjaW1hbCBwb2ludD9cclxuICAgICAgICBpZiAoKGUgPSBzdHIuaW5kZXhPZignLicpKSA+IC0xKSBzdHIgPSBzdHIucmVwbGFjZSgnLicsICcnKTtcclxuICAgICAgICBlbHNlIGUgPSBzdHIubGVuZ3RoO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgZm9yIChpID0gMDsgc3RyLmNoYXJDb2RlQXQoaSkgPT09IDQ4OyBpKyspO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKGxlbiA9IHN0ci5sZW5ndGg7IHN0ci5jaGFyQ29kZUF0KC0tbGVuKSA9PT0gNDg7KTtcclxuXHJcbiAgICAgIHN0ciA9IHN0ci5zbGljZShpLCArK2xlbik7XHJcblxyXG4gICAgICBpZiAoc3RyKSB7XHJcbiAgICAgICAgbGVuIC09IGk7XHJcblxyXG4gICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiB7bn0nXHJcbiAgICAgICAgaWYgKGlzTnVtICYmIEJpZ051bWJlci5ERUJVRyAmJlxyXG4gICAgICAgICAgbGVuID4gMTUgJiYgKG4gPiBNQVhfU0FGRV9JTlRFR0VSIHx8IG4gIT09IG1hdGhmbG9vcihuKSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICh0b29NYW55RGlnaXRzICsgKHgucyAqIG4pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGUgPSBlIC0gaSAtIDE7XHJcblxyXG4gICAgICAgICAvLyBPdmVyZmxvdz9cclxuICAgICAgICBpZiAoZSA+IE1BWF9FWFApIHtcclxuXHJcbiAgICAgICAgICAvLyBJbmZpbml0eS5cclxuICAgICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIFVuZGVyZmxvdz9cclxuICAgICAgICB9IGVsc2UgaWYgKGUgPCBNSU5fRVhQKSB7XHJcblxyXG4gICAgICAgICAgLy8gWmVyby5cclxuICAgICAgICAgIHguYyA9IFt4LmUgPSAwXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeC5lID0gZTtcclxuICAgICAgICAgIHguYyA9IFtdO1xyXG5cclxuICAgICAgICAgIC8vIFRyYW5zZm9ybSBiYXNlXHJcblxyXG4gICAgICAgICAgLy8gZSBpcyB0aGUgYmFzZSAxMCBleHBvbmVudC5cclxuICAgICAgICAgIC8vIGkgaXMgd2hlcmUgdG8gc2xpY2Ugc3RyIHRvIGdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgY29lZmZpY2llbnQgYXJyYXkuXHJcbiAgICAgICAgICBpID0gKGUgKyAxKSAlIExPR19CQVNFO1xyXG4gICAgICAgICAgaWYgKGUgPCAwKSBpICs9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAgIGlmIChpIDwgbGVuKSB7XHJcbiAgICAgICAgICAgIGlmIChpKSB4LmMucHVzaCgrc3RyLnNsaWNlKDAsIGkpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGVuIC09IExPR19CQVNFOyBpIDwgbGVuOykge1xyXG4gICAgICAgICAgICAgIHguYy5wdXNoKCtzdHIuc2xpY2UoaSwgaSArPSBMT0dfQkFTRSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdHIgPSBzdHIuc2xpY2UoaSk7XHJcbiAgICAgICAgICAgIGkgPSBMT0dfQkFTRSAtIHN0ci5sZW5ndGg7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpIC09IGxlbjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBmb3IgKDsgaS0tOyBzdHIgKz0gJzAnKTtcclxuICAgICAgICAgIHguYy5wdXNoKCtzdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gWmVyby5cclxuICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gQ09OU1RSVUNUT1IgUFJPUEVSVElFU1xyXG5cclxuXHJcbiAgICBCaWdOdW1iZXIuY2xvbmUgPSBjbG9uZTtcclxuXHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfVVAgPSAwO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0RPV04gPSAxO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0NFSUwgPSAyO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0ZMT09SID0gMztcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX1VQID0gNDtcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0RPV04gPSA1O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRVZFTiA9IDY7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9DRUlMID0gNztcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0ZMT09SID0gODtcclxuICAgIEJpZ051bWJlci5FVUNMSUQgPSA5O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ29uZmlndXJlIGluZnJlcXVlbnRseS1jaGFuZ2luZyBsaWJyYXJ5LXdpZGUgc2V0dGluZ3MuXHJcbiAgICAgKlxyXG4gICAgICogQWNjZXB0IGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgb3B0aW9uYWwgcHJvcGVydGllcyAoaWYgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaXNcclxuICAgICAqIGEgbnVtYmVyLCBpdCBtdXN0IGJlIGFuIGludGVnZXIgd2l0aGluIHRoZSBpbmNsdXNpdmUgcmFuZ2Ugc3RhdGVkKTpcclxuICAgICAqXHJcbiAgICAgKiAgIERFQ0lNQUxfUExBQ0VTICAge251bWJlcn0gICAgICAgICAgIDAgdG8gTUFYXHJcbiAgICAgKiAgIFJPVU5ESU5HX01PREUgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gOFxyXG4gICAgICogICBFWFBPTkVOVElBTF9BVCAgIHtudW1iZXJ8bnVtYmVyW119ICAtTUFYIHRvIE1BWCAgb3IgIFstTUFYIHRvIDAsIDAgdG8gTUFYXVxyXG4gICAgICogICBSQU5HRSAgICAgICAgICAgIHtudW1iZXJ8bnVtYmVyW119ICAtTUFYIHRvIE1BWCAobm90IHplcm8pICBvciAgWy1NQVggdG8gLTEsIDEgdG8gTUFYXVxyXG4gICAgICogICBDUllQVE8gICAgICAgICAgIHtib29sZWFufSAgICAgICAgICB0cnVlIG9yIGZhbHNlXHJcbiAgICAgKiAgIE1PRFVMT19NT0RFICAgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gOVxyXG4gICAgICogICBQT1dfUFJFQ0lTSU9OICAgICAgIHtudW1iZXJ9ICAgICAgICAgICAwIHRvIE1BWFxyXG4gICAgICogICBBTFBIQUJFVCAgICAgICAgIHtzdHJpbmd9ICAgICAgICAgICBBIHN0cmluZyBvZiB0d28gb3IgbW9yZSB1bmlxdWUgY2hhcmFjdGVycyB3aGljaCBkb2VzXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdCBjb250YWluICcuJy5cclxuICAgICAqICAgRk9STUFUICAgICAgICAgICB7b2JqZWN0fSAgICAgICAgICAgQW4gb2JqZWN0IHdpdGggc29tZSBvZiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XHJcbiAgICAgKiAgICAgcHJlZml4ICAgICAgICAgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGdyb3VwU2l6ZSAgICAgICAgICAgICAge251bWJlcn1cclxuICAgICAqICAgICBzZWNvbmRhcnlHcm91cFNpemUgICAgIHtudW1iZXJ9XHJcbiAgICAgKiAgICAgZ3JvdXBTZXBhcmF0b3IgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGRlY2ltYWxTZXBhcmF0b3IgICAgICAge3N0cmluZ31cclxuICAgICAqICAgICBmcmFjdGlvbkdyb3VwU2l6ZSAgICAgIHtudW1iZXJ9XHJcbiAgICAgKiAgICAgZnJhY3Rpb25Hcm91cFNlcGFyYXRvciB7c3RyaW5nfVxyXG4gICAgICogICAgIHN1ZmZpeCAgICAgICAgICAgICAgICAge3N0cmluZ31cclxuICAgICAqXHJcbiAgICAgKiAoVGhlIHZhbHVlcyBhc3NpZ25lZCB0byB0aGUgYWJvdmUgRk9STUFUIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3QgY2hlY2tlZCBmb3IgdmFsaWRpdHkuKVxyXG4gICAgICpcclxuICAgICAqIEUuZy5cclxuICAgICAqIEJpZ051bWJlci5jb25maWcoeyBERUNJTUFMX1BMQUNFUyA6IDIwLCBST1VORElOR19NT0RFIDogNCB9KVxyXG4gICAgICpcclxuICAgICAqIElnbm9yZSBwcm9wZXJ0aWVzL3BhcmFtZXRlcnMgc2V0IHRvIG51bGwgb3IgdW5kZWZpbmVkLCBleGNlcHQgZm9yIEFMUEhBQkVULlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBjdXJyZW50IHZhbHVlcy5cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLmNvbmZpZyA9IEJpZ051bWJlci5zZXQgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgIHZhciBwLCB2O1xyXG5cclxuICAgICAgaWYgKG9iaiAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09ICdvYmplY3QnKSB7XHJcblxyXG4gICAgICAgICAgLy8gREVDSU1BTF9QTEFDRVMge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIERFQ0lNQUxfUExBQ0VTIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdERUNJTUFMX1BMQUNFUycpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgIERFQ0lNQUxfUExBQ0VTID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBST1VORElOR19NT0RFIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUk9VTkRJTkdfTU9ERSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUk9VTkRJTkdfTU9ERScpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIDgsIHApO1xyXG4gICAgICAgICAgICBST1VORElOR19NT0RFID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBFWFBPTkVOVElBTF9BVCB7bnVtYmVyfG51bWJlcltdfVxyXG4gICAgICAgICAgLy8gSW50ZWdlciwgLU1BWCB0byBNQVggaW5jbHVzaXZlIG9yXHJcbiAgICAgICAgICAvLyBbaW50ZWdlciAtTUFYIHRvIDAgaW5jbHVzaXZlLCAwIHRvIE1BWCBpbmNsdXNpdmVdLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIEVYUE9ORU5USUFMX0FUIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdFWFBPTkVOVElBTF9BVCcpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh2ICYmIHYucG9wKSB7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlswXSwgLU1BWCwgMCwgcCk7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlsxXSwgMCwgTUFYLCBwKTtcclxuICAgICAgICAgICAgICBUT19FWFBfTkVHID0gdlswXTtcclxuICAgICAgICAgICAgICBUT19FWFBfUE9TID0gdlsxXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2LCAtTUFYLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSAtKFRPX0VYUF9QT1MgPSB2IDwgMCA/IC12IDogdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSQU5HRSB7bnVtYmVyfG51bWJlcltdfSBOb24temVybyBpbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgIC8vIFtpbnRlZ2VyIC1NQVggdG8gLTEgaW5jbHVzaXZlLCBpbnRlZ2VyIDEgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUkFOR0Uge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfGNhbm5vdCBiZSB6ZXJvfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ1JBTkdFJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHYgJiYgdi5wb3ApIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzBdLCAtTUFYLCAtMSwgcCk7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlsxXSwgMSwgTUFYLCBwKTtcclxuICAgICAgICAgICAgICBNSU5fRVhQID0gdlswXTtcclxuICAgICAgICAgICAgICBNQVhfRVhQID0gdlsxXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2LCAtTUFYLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIGlmICh2KSB7XHJcbiAgICAgICAgICAgICAgICBNSU5fRVhQID0gLShNQVhfRVhQID0gdiA8IDAgPyAtdiA6IHYpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIGNhbm5vdCBiZSB6ZXJvOiAnICsgdik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ1JZUFRPIHtib29sZWFufSB0cnVlIG9yIGZhbHNlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIENSWVBUTyBub3QgdHJ1ZSBvciBmYWxzZToge3Z9J1xyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIGNyeXB0byB1bmF2YWlsYWJsZSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdDUllQVE8nKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpZiAodiA9PT0gISF2KSB7XHJcbiAgICAgICAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9ICd1bmRlZmluZWQnICYmIGNyeXB0byAmJlxyXG4gICAgICAgICAgICAgICAgIChjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzIHx8IGNyeXB0by5yYW5kb21CeXRlcykpIHtcclxuICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gdjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIENSWVBUTyA9ICF2O1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ2NyeXB0byB1bmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBDUllQVE8gPSB2O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBub3QgdHJ1ZSBvciBmYWxzZTogJyArIHYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTU9EVUxPX01PREUge251bWJlcn0gSW50ZWdlciwgMCB0byA5IGluY2x1c2l2ZS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBNT0RVTE9fTU9ERSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnTU9EVUxPX01PREUnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpbnRDaGVjayh2LCAwLCA5LCBwKTtcclxuICAgICAgICAgICAgTU9EVUxPX01PREUgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFBPV19QUkVDSVNJT04ge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIFBPV19QUkVDSVNJT04ge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ1BPV19QUkVDSVNJT04nKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpbnRDaGVjayh2LCAwLCBNQVgsIHApO1xyXG4gICAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBGT1JNQVQge29iamVjdH1cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBGT1JNQVQgbm90IGFuIG9iamVjdDoge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0ZPUk1BVCcpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgRk9STUFUID0gdjtcclxuICAgICAgICAgICAgZWxzZSB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgcCArICcgbm90IGFuIG9iamVjdDogJyArIHYpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEFMUEhBQkVUIHtzdHJpbmd9XHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQUxQSEFCRVQgaW52YWxpZDoge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0FMUEhBQkVUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuXHJcbiAgICAgICAgICAgIC8vIERpc2FsbG93IGlmIG9ubHkgb25lIGNoYXJhY3RlcixcclxuICAgICAgICAgICAgLy8gb3IgaWYgaXQgY29udGFpbnMgJysnLCAnLScsICcuJywgd2hpdGVzcGFjZSwgb3IgYSByZXBlYXRlZCBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PSAnc3RyaW5nJyAmJiAhL14uJHxbKy0uXFxzXXwoLikuKlxcMS8udGVzdCh2KSkge1xyXG4gICAgICAgICAgICAgIEFMUEhBQkVUID0gdjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBpbnZhbGlkOiAnICsgdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gT2JqZWN0IGV4cGVjdGVkOiB7dn0nXHJcbiAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdPYmplY3QgZXhwZWN0ZWQ6ICcgKyBvYmopO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBERUNJTUFMX1BMQUNFUzogREVDSU1BTF9QTEFDRVMsXHJcbiAgICAgICAgUk9VTkRJTkdfTU9ERTogUk9VTkRJTkdfTU9ERSxcclxuICAgICAgICBFWFBPTkVOVElBTF9BVDogW1RPX0VYUF9ORUcsIFRPX0VYUF9QT1NdLFxyXG4gICAgICAgIFJBTkdFOiBbTUlOX0VYUCwgTUFYX0VYUF0sXHJcbiAgICAgICAgQ1JZUFRPOiBDUllQVE8sXHJcbiAgICAgICAgTU9EVUxPX01PREU6IE1PRFVMT19NT0RFLFxyXG4gICAgICAgIFBPV19QUkVDSVNJT046IFBPV19QUkVDSVNJT04sXHJcbiAgICAgICAgRk9STUFUOiBGT1JNQVQsXHJcbiAgICAgICAgQUxQSEFCRVQ6IEFMUEhBQkVUXHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdiBpcyBhIEJpZ051bWJlciBpbnN0YW5jZSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqXHJcbiAgICAgKiB2IHthbnl9XHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5pc0JpZ051bWJlciA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIHJldHVybiB2IGluc3RhbmNlb2YgQmlnTnVtYmVyIHx8IHYgJiYgdi5faXNCaWdOdW1iZXIgPT09IHRydWUgfHwgZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgbWF4aW11bSBvZiB0aGUgYXJndW1lbnRzLlxyXG4gICAgICpcclxuICAgICAqIGFyZ3VtZW50cyB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5tYXhpbXVtID0gQmlnTnVtYmVyLm1heCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIG1heE9yTWluKGFyZ3VtZW50cywgUC5sdCk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgbWluaW11bSBvZiB0aGUgYXJndW1lbnRzLlxyXG4gICAgICpcclxuICAgICAqIGFyZ3VtZW50cyB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5taW5pbXVtID0gQmlnTnVtYmVyLm1pbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIG1heE9yTWluKGFyZ3VtZW50cywgUC5ndCk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aXRoIGEgcmFuZG9tIHZhbHVlIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiAwIGFuZCBsZXNzIHRoYW4gMSxcclxuICAgICAqIGFuZCB3aXRoIGRwLCBvciBERUNJTUFMX1BMQUNFUyBpZiBkcCBpcyBvbWl0dGVkLCBkZWNpbWFsIHBsYWNlcyAob3IgbGVzcyBpZiB0cmFpbGluZ1xyXG4gICAgICogemVyb3MgYXJlIHByb2R1Y2VkKS5cclxuICAgICAqXHJcbiAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtkcH0nXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gY3J5cHRvIHVuYXZhaWxhYmxlJ1xyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIucmFuZG9tID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHBvdzJfNTMgPSAweDIwMDAwMDAwMDAwMDAwO1xyXG5cclxuICAgICAgLy8gUmV0dXJuIGEgNTMgYml0IGludGVnZXIgbiwgd2hlcmUgMCA8PSBuIDwgOTAwNzE5OTI1NDc0MDk5Mi5cclxuICAgICAgLy8gQ2hlY2sgaWYgTWF0aC5yYW5kb20oKSBwcm9kdWNlcyBtb3JlIHRoYW4gMzIgYml0cyBvZiByYW5kb21uZXNzLlxyXG4gICAgICAvLyBJZiBpdCBkb2VzLCBhc3N1bWUgYXQgbGVhc3QgNTMgYml0cyBhcmUgcHJvZHVjZWQsIG90aGVyd2lzZSBhc3N1bWUgYXQgbGVhc3QgMzAgYml0cy5cclxuICAgICAgLy8gMHg0MDAwMDAwMCBpcyAyXjMwLCAweDgwMDAwMCBpcyAyXjIzLCAweDFmZmZmZiBpcyAyXjIxIC0gMS5cclxuICAgICAgdmFyIHJhbmRvbTUzYml0SW50ID0gKE1hdGgucmFuZG9tKCkgKiBwb3cyXzUzKSAmIDB4MWZmZmZmXHJcbiAgICAgICA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1hdGhmbG9vcihNYXRoLnJhbmRvbSgpICogcG93Ml81Myk7IH1cclxuICAgICAgIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gKChNYXRoLnJhbmRvbSgpICogMHg0MDAwMDAwMCB8IDApICogMHg4MDAwMDApICtcclxuICAgICAgICAgKE1hdGgucmFuZG9tKCkgKiAweDgwMDAwMCB8IDApOyB9O1xyXG5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkcCkge1xyXG4gICAgICAgIHZhciBhLCBiLCBlLCBrLCB2LFxyXG4gICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICBjID0gW10sXHJcbiAgICAgICAgICByYW5kID0gbmV3IEJpZ051bWJlcihPTkUpO1xyXG5cclxuICAgICAgICBpZiAoZHAgPT0gbnVsbCkgZHAgPSBERUNJTUFMX1BMQUNFUztcclxuICAgICAgICBlbHNlIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG5cclxuICAgICAgICBrID0gbWF0aGNlaWwoZHAgLyBMT0dfQkFTRSk7XHJcblxyXG4gICAgICAgIGlmIChDUllQVE8pIHtcclxuXHJcbiAgICAgICAgICAvLyBCcm93c2VycyBzdXBwb3J0aW5nIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMuXHJcbiAgICAgICAgICBpZiAoY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xyXG5cclxuICAgICAgICAgICAgYSA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQzMkFycmF5KGsgKj0gMikpO1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IGkgPCBrOykge1xyXG5cclxuICAgICAgICAgICAgICAvLyA1MyBiaXRzOlxyXG4gICAgICAgICAgICAgIC8vICgoTWF0aC5wb3coMiwgMzIpIC0gMSkgKiBNYXRoLnBvdygyLCAyMSkpLnRvU3RyaW5nKDIpXHJcbiAgICAgICAgICAgICAgLy8gMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDBcclxuICAgICAgICAgICAgICAvLyAoKE1hdGgucG93KDIsIDMyKSAtIDEpID4+PiAxMSkudG9TdHJpbmcoMilcclxuICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMTExMSAxMTExMTExMSAxMTExMTExMVxyXG4gICAgICAgICAgICAgIC8vIDB4MjAwMDAgaXMgMl4yMS5cclxuICAgICAgICAgICAgICB2ID0gYVtpXSAqIDB4MjAwMDAgKyAoYVtpICsgMV0gPj4+IDExKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gUmVqZWN0aW9uIHNhbXBsaW5nOlxyXG4gICAgICAgICAgICAgIC8vIDAgPD0gdiA8IDkwMDcxOTkyNTQ3NDA5OTJcclxuICAgICAgICAgICAgICAvLyBQcm9iYWJpbGl0eSB0aGF0IHYgPj0gOWUxNSwgaXNcclxuICAgICAgICAgICAgICAvLyA3MTk5MjU0NzQwOTkyIC8gOTAwNzE5OTI1NDc0MDk5MiB+PSAwLjAwMDgsIGkuZS4gMSBpbiAxMjUxXHJcbiAgICAgICAgICAgICAgaWYgKHYgPj0gOWUxNSkge1xyXG4gICAgICAgICAgICAgICAgYiA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQzMkFycmF5KDIpKTtcclxuICAgICAgICAgICAgICAgIGFbaV0gPSBiWzBdO1xyXG4gICAgICAgICAgICAgICAgYVtpICsgMV0gPSBiWzFdO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gMCA8PSB2IDw9IDg5OTk5OTk5OTk5OTk5OTlcclxuICAgICAgICAgICAgICAgIC8vIDAgPD0gKHYgJSAxZTE0KSA8PSA5OTk5OTk5OTk5OTk5OVxyXG4gICAgICAgICAgICAgICAgYy5wdXNoKHYgJSAxZTE0KTtcclxuICAgICAgICAgICAgICAgIGkgKz0gMjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSA9IGsgLyAyO1xyXG5cclxuICAgICAgICAgIC8vIE5vZGUuanMgc3VwcG9ydGluZyBjcnlwdG8ucmFuZG9tQnl0ZXMuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGNyeXB0by5yYW5kb21CeXRlcykge1xyXG5cclxuICAgICAgICAgICAgLy8gYnVmZmVyXHJcbiAgICAgICAgICAgIGEgPSBjcnlwdG8ucmFuZG9tQnl0ZXMoayAqPSA3KTtcclxuXHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgazspIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gMHgxMDAwMDAwMDAwMDAwIGlzIDJeNDgsIDB4MTAwMDAwMDAwMDAgaXMgMl40MFxyXG4gICAgICAgICAgICAgIC8vIDB4MTAwMDAwMDAwIGlzIDJeMzIsIDB4MTAwMDAwMCBpcyAyXjI0XHJcbiAgICAgICAgICAgICAgLy8gMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTEgMTExMTExMTFcclxuICAgICAgICAgICAgICAvLyAwIDw9IHYgPCA5MDA3MTk5MjU0NzQwOTkyXHJcbiAgICAgICAgICAgICAgdiA9ICgoYVtpXSAmIDMxKSAqIDB4MTAwMDAwMDAwMDAwMCkgKyAoYVtpICsgMV0gKiAweDEwMDAwMDAwMDAwKSArXHJcbiAgICAgICAgICAgICAgICAgKGFbaSArIDJdICogMHgxMDAwMDAwMDApICsgKGFbaSArIDNdICogMHgxMDAwMDAwKSArXHJcbiAgICAgICAgICAgICAgICAgKGFbaSArIDRdIDw8IDE2KSArIChhW2kgKyA1XSA8PCA4KSArIGFbaSArIDZdO1xyXG5cclxuICAgICAgICAgICAgICBpZiAodiA+PSA5ZTE1KSB7XHJcbiAgICAgICAgICAgICAgICBjcnlwdG8ucmFuZG9tQnl0ZXMoNykuY29weShhLCBpKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIDAgPD0gKHYgJSAxZTE0KSA8PSA5OTk5OTk5OTk5OTk5OVxyXG4gICAgICAgICAgICAgICAgYy5wdXNoKHYgJSAxZTE0KTtcclxuICAgICAgICAgICAgICAgIGkgKz0gNztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSA9IGsgLyA3O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgQ1JZUFRPID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnY3J5cHRvIHVuYXZhaWxhYmxlJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVc2UgTWF0aC5yYW5kb20uXHJcbiAgICAgICAgaWYgKCFDUllQVE8pIHtcclxuXHJcbiAgICAgICAgICBmb3IgKDsgaSA8IGs7KSB7XHJcbiAgICAgICAgICAgIHYgPSByYW5kb201M2JpdEludCgpO1xyXG4gICAgICAgICAgICBpZiAodiA8IDllMTUpIGNbaSsrXSA9IHYgJSAxZTE0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgayA9IGNbLS1pXTtcclxuICAgICAgICBkcCAlPSBMT0dfQkFTRTtcclxuXHJcbiAgICAgICAgLy8gQ29udmVydCB0cmFpbGluZyBkaWdpdHMgdG8gemVyb3MgYWNjb3JkaW5nIHRvIGRwLlxyXG4gICAgICAgIGlmIChrICYmIGRwKSB7XHJcbiAgICAgICAgICB2ID0gUE9XU19URU5bTE9HX0JBU0UgLSBkcF07XHJcbiAgICAgICAgICBjW2ldID0gbWF0aGZsb29yKGsgLyB2KSAqIHY7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgZWxlbWVudHMgd2hpY2ggYXJlIHplcm8uXHJcbiAgICAgICAgZm9yICg7IGNbaV0gPT09IDA7IGMucG9wKCksIGktLSk7XHJcblxyXG4gICAgICAgIC8vIFplcm8/XHJcbiAgICAgICAgaWYgKGkgPCAwKSB7XHJcbiAgICAgICAgICBjID0gW2UgPSAwXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIGVsZW1lbnRzIHdoaWNoIGFyZSB6ZXJvIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgICAgICBmb3IgKGUgPSAtMSA7IGNbMF0gPT09IDA7IGMuc3BsaWNlKDAsIDEpLCBlIC09IExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgICAvLyBDb3VudCB0aGUgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50IG9mIGMgdG8gZGV0ZXJtaW5lIGxlYWRpbmcgemVyb3MsIGFuZC4uLlxyXG4gICAgICAgICAgZm9yIChpID0gMSwgdiA9IGNbMF07IHYgPj0gMTA7IHYgLz0gMTAsIGkrKyk7XHJcblxyXG4gICAgICAgICAgLy8gYWRqdXN0IHRoZSBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgICAgIGlmIChpIDwgTE9HX0JBU0UpIGUgLT0gTE9HX0JBU0UgLSBpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmFuZC5lID0gZTtcclxuICAgICAgICByYW5kLmMgPSBjO1xyXG4gICAgICAgIHJldHVybiByYW5kO1xyXG4gICAgICB9O1xyXG4gICAgfSkoKTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgc3VtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLnN1bSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGkgPSAxLFxyXG4gICAgICAgIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgc3VtID0gbmV3IEJpZ051bWJlcihhcmdzWzBdKTtcclxuICAgICAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDspIHN1bSA9IHN1bS5wbHVzKGFyZ3NbaSsrXSk7XHJcbiAgICAgIHJldHVybiBzdW07XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvLyBQUklWQVRFIEZVTkNUSU9OU1xyXG5cclxuXHJcbiAgICAvLyBDYWxsZWQgYnkgQmlnTnVtYmVyIGFuZCBCaWdOdW1iZXIucHJvdG90eXBlLnRvU3RyaW5nLlxyXG4gICAgY29udmVydEJhc2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgZGVjaW1hbCA9ICcwMTIzNDU2Nzg5JztcclxuXHJcbiAgICAgIC8qXHJcbiAgICAgICAqIENvbnZlcnQgc3RyaW5nIG9mIGJhc2VJbiB0byBhbiBhcnJheSBvZiBudW1iZXJzIG9mIGJhc2VPdXQuXHJcbiAgICAgICAqIEVnLiB0b0Jhc2VPdXQoJzI1NScsIDEwLCAxNikgcmV0dXJucyBbMTUsIDE1XS5cclxuICAgICAgICogRWcuIHRvQmFzZU91dCgnZmYnLCAxNiwgMTApIHJldHVybnMgWzIsIDUsIDVdLlxyXG4gICAgICAgKi9cclxuICAgICAgZnVuY3Rpb24gdG9CYXNlT3V0KHN0ciwgYmFzZUluLCBiYXNlT3V0LCBhbHBoYWJldCkge1xyXG4gICAgICAgIHZhciBqLFxyXG4gICAgICAgICAgYXJyID0gWzBdLFxyXG4gICAgICAgICAgYXJyTCxcclxuICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgbGVuID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgICAgZm9yICg7IGkgPCBsZW47KSB7XHJcbiAgICAgICAgICBmb3IgKGFyckwgPSBhcnIubGVuZ3RoOyBhcnJMLS07IGFyclthcnJMXSAqPSBiYXNlSW4pO1xyXG5cclxuICAgICAgICAgIGFyclswXSArPSBhbHBoYWJldC5pbmRleE9mKHN0ci5jaGFyQXQoaSsrKSk7XHJcblxyXG4gICAgICAgICAgZm9yIChqID0gMDsgaiA8IGFyci5sZW5ndGg7IGorKykge1xyXG5cclxuICAgICAgICAgICAgaWYgKGFycltqXSA+IGJhc2VPdXQgLSAxKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGFycltqICsgMV0gPT0gbnVsbCkgYXJyW2ogKyAxXSA9IDA7XHJcbiAgICAgICAgICAgICAgYXJyW2ogKyAxXSArPSBhcnJbal0gLyBiYXNlT3V0IHwgMDtcclxuICAgICAgICAgICAgICBhcnJbal0gJT0gYmFzZU91dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFyci5yZXZlcnNlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENvbnZlcnQgYSBudW1lcmljIHN0cmluZyBvZiBiYXNlSW4gdG8gYSBudW1lcmljIHN0cmluZyBvZiBiYXNlT3V0LlxyXG4gICAgICAvLyBJZiB0aGUgY2FsbGVyIGlzIHRvU3RyaW5nLCB3ZSBhcmUgY29udmVydGluZyBmcm9tIGJhc2UgMTAgdG8gYmFzZU91dC5cclxuICAgICAgLy8gSWYgdGhlIGNhbGxlciBpcyBCaWdOdW1iZXIsIHdlIGFyZSBjb252ZXJ0aW5nIGZyb20gYmFzZUluIHRvIGJhc2UgMTAuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoc3RyLCBiYXNlSW4sIGJhc2VPdXQsIHNpZ24sIGNhbGxlcklzVG9TdHJpbmcpIHtcclxuICAgICAgICB2YXIgYWxwaGFiZXQsIGQsIGUsIGssIHIsIHgsIHhjLCB5LFxyXG4gICAgICAgICAgaSA9IHN0ci5pbmRleE9mKCcuJyksXHJcbiAgICAgICAgICBkcCA9IERFQ0lNQUxfUExBQ0VTLFxyXG4gICAgICAgICAgcm0gPSBST1VORElOR19NT0RFO1xyXG5cclxuICAgICAgICAvLyBOb24taW50ZWdlci5cclxuICAgICAgICBpZiAoaSA+PSAwKSB7XHJcbiAgICAgICAgICBrID0gUE9XX1BSRUNJU0lPTjtcclxuXHJcbiAgICAgICAgICAvLyBVbmxpbWl0ZWQgcHJlY2lzaW9uLlxyXG4gICAgICAgICAgUE9XX1BSRUNJU0lPTiA9IDA7XHJcbiAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgnLicsICcnKTtcclxuICAgICAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKGJhc2VJbik7XHJcbiAgICAgICAgICB4ID0geS5wb3coc3RyLmxlbmd0aCAtIGkpO1xyXG4gICAgICAgICAgUE9XX1BSRUNJU0lPTiA9IGs7XHJcblxyXG4gICAgICAgICAgLy8gQ29udmVydCBzdHIgYXMgaWYgYW4gaW50ZWdlciwgdGhlbiByZXN0b3JlIHRoZSBmcmFjdGlvbiBwYXJ0IGJ5IGRpdmlkaW5nIHRoZVxyXG4gICAgICAgICAgLy8gcmVzdWx0IGJ5IGl0cyBiYXNlIHJhaXNlZCB0byBhIHBvd2VyLlxyXG5cclxuICAgICAgICAgIHkuYyA9IHRvQmFzZU91dCh0b0ZpeGVkUG9pbnQoY29lZmZUb1N0cmluZyh4LmMpLCB4LmUsICcwJyksXHJcbiAgICAgICAgICAgMTAsIGJhc2VPdXQsIGRlY2ltYWwpO1xyXG4gICAgICAgICAgeS5lID0geS5jLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbnZlcnQgdGhlIG51bWJlciBhcyBpbnRlZ2VyLlxyXG5cclxuICAgICAgICB4YyA9IHRvQmFzZU91dChzdHIsIGJhc2VJbiwgYmFzZU91dCwgY2FsbGVySXNUb1N0cmluZ1xyXG4gICAgICAgICA/IChhbHBoYWJldCA9IEFMUEhBQkVULCBkZWNpbWFsKVxyXG4gICAgICAgICA6IChhbHBoYWJldCA9IGRlY2ltYWwsIEFMUEhBQkVUKSk7XHJcblxyXG4gICAgICAgIC8vIHhjIG5vdyByZXByZXNlbnRzIHN0ciBhcyBhbiBpbnRlZ2VyIGFuZCBjb252ZXJ0ZWQgdG8gYmFzZU91dC4gZSBpcyB0aGUgZXhwb25lbnQuXHJcbiAgICAgICAgZSA9IGsgPSB4Yy5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKDsgeGNbLS1rXSA9PSAwOyB4Yy5wb3AoKSk7XHJcblxyXG4gICAgICAgIC8vIFplcm8/XHJcbiAgICAgICAgaWYgKCF4Y1swXSkgcmV0dXJuIGFscGhhYmV0LmNoYXJBdCgwKTtcclxuXHJcbiAgICAgICAgLy8gRG9lcyBzdHIgcmVwcmVzZW50IGFuIGludGVnZXI/IElmIHNvLCBubyBuZWVkIGZvciB0aGUgZGl2aXNpb24uXHJcbiAgICAgICAgaWYgKGkgPCAwKSB7XHJcbiAgICAgICAgICAtLWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHguYyA9IHhjO1xyXG4gICAgICAgICAgeC5lID0gZTtcclxuXHJcbiAgICAgICAgICAvLyBUaGUgc2lnbiBpcyBuZWVkZWQgZm9yIGNvcnJlY3Qgcm91bmRpbmcuXHJcbiAgICAgICAgICB4LnMgPSBzaWduO1xyXG4gICAgICAgICAgeCA9IGRpdih4LCB5LCBkcCwgcm0sIGJhc2VPdXQpO1xyXG4gICAgICAgICAgeGMgPSB4LmM7XHJcbiAgICAgICAgICByID0geC5yO1xyXG4gICAgICAgICAgZSA9IHguZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHhjIG5vdyByZXByZXNlbnRzIHN0ciBjb252ZXJ0ZWQgdG8gYmFzZU91dC5cclxuXHJcbiAgICAgICAgLy8gVEhlIGluZGV4IG9mIHRoZSByb3VuZGluZyBkaWdpdC5cclxuICAgICAgICBkID0gZSArIGRwICsgMTtcclxuXHJcbiAgICAgICAgLy8gVGhlIHJvdW5kaW5nIGRpZ2l0OiB0aGUgZGlnaXQgdG8gdGhlIHJpZ2h0IG9mIHRoZSBkaWdpdCB0aGF0IG1heSBiZSByb3VuZGVkIHVwLlxyXG4gICAgICAgIGkgPSB4Y1tkXTtcclxuXHJcbiAgICAgICAgLy8gTG9vayBhdCB0aGUgcm91bmRpbmcgZGlnaXRzIGFuZCBtb2RlIHRvIGRldGVybWluZSB3aGV0aGVyIHRvIHJvdW5kIHVwLlxyXG5cclxuICAgICAgICBrID0gYmFzZU91dCAvIDI7XHJcbiAgICAgICAgciA9IHIgfHwgZCA8IDAgfHwgeGNbZCArIDFdICE9IG51bGw7XHJcblxyXG4gICAgICAgIHIgPSBybSA8IDQgPyAoaSAhPSBudWxsIHx8IHIpICYmIChybSA9PSAwIHx8IHJtID09ICh4LnMgPCAwID8gMyA6IDIpKVxyXG4gICAgICAgICAgICAgIDogaSA+IGsgfHwgaSA9PSBrICYmKHJtID09IDQgfHwgciB8fCBybSA9PSA2ICYmIHhjW2QgLSAxXSAmIDEgfHxcclxuICAgICAgICAgICAgICAgcm0gPT0gKHgucyA8IDAgPyA4IDogNykpO1xyXG5cclxuICAgICAgICAvLyBJZiB0aGUgaW5kZXggb2YgdGhlIHJvdW5kaW5nIGRpZ2l0IGlzIG5vdCBncmVhdGVyIHRoYW4gemVybywgb3IgeGMgcmVwcmVzZW50c1xyXG4gICAgICAgIC8vIHplcm8sIHRoZW4gdGhlIHJlc3VsdCBvZiB0aGUgYmFzZSBjb252ZXJzaW9uIGlzIHplcm8gb3IsIGlmIHJvdW5kaW5nIHVwLCBhIHZhbHVlXHJcbiAgICAgICAgLy8gc3VjaCBhcyAwLjAwMDAxLlxyXG4gICAgICAgIGlmIChkIDwgMSB8fCAheGNbMF0pIHtcclxuXHJcbiAgICAgICAgICAvLyAxXi1kcCBvciAwXHJcbiAgICAgICAgICBzdHIgPSByID8gdG9GaXhlZFBvaW50KGFscGhhYmV0LmNoYXJBdCgxKSwgLWRwLCBhbHBoYWJldC5jaGFyQXQoMCkpIDogYWxwaGFiZXQuY2hhckF0KDApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gVHJ1bmNhdGUgeGMgdG8gdGhlIHJlcXVpcmVkIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlcy5cclxuICAgICAgICAgIHhjLmxlbmd0aCA9IGQ7XHJcblxyXG4gICAgICAgICAgLy8gUm91bmQgdXA/XHJcbiAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgLy8gUm91bmRpbmcgdXAgbWF5IG1lYW4gdGhlIHByZXZpb3VzIGRpZ2l0IGhhcyB0byBiZSByb3VuZGVkIHVwIGFuZCBzbyBvbi5cclxuICAgICAgICAgICAgZm9yICgtLWJhc2VPdXQ7ICsreGNbLS1kXSA+IGJhc2VPdXQ7KSB7XHJcbiAgICAgICAgICAgICAgeGNbZF0gPSAwO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoIWQpIHtcclxuICAgICAgICAgICAgICAgICsrZTtcclxuICAgICAgICAgICAgICAgIHhjID0gWzFdLmNvbmNhdCh4Yyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgZm9yIChrID0geGMubGVuZ3RoOyAheGNbLS1rXTspO1xyXG5cclxuICAgICAgICAgIC8vIEUuZy4gWzQsIDExLCAxNV0gYmVjb21lcyA0YmYuXHJcbiAgICAgICAgICBmb3IgKGkgPSAwLCBzdHIgPSAnJzsgaSA8PSBrOyBzdHIgKz0gYWxwaGFiZXQuY2hhckF0KHhjW2krK10pKTtcclxuXHJcbiAgICAgICAgICAvLyBBZGQgbGVhZGluZyB6ZXJvcywgZGVjaW1hbCBwb2ludCBhbmQgdHJhaWxpbmcgemVyb3MgYXMgcmVxdWlyZWQuXHJcbiAgICAgICAgICBzdHIgPSB0b0ZpeGVkUG9pbnQoc3RyLCBlLCBhbHBoYWJldC5jaGFyQXQoMCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVGhlIGNhbGxlciB3aWxsIGFkZCB0aGUgc2lnbi5cclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgICB9O1xyXG4gICAgfSkoKTtcclxuXHJcblxyXG4gICAgLy8gUGVyZm9ybSBkaXZpc2lvbiBpbiB0aGUgc3BlY2lmaWVkIGJhc2UuIENhbGxlZCBieSBkaXYgYW5kIGNvbnZlcnRCYXNlLlxyXG4gICAgZGl2ID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIC8vIEFzc3VtZSBub24temVybyB4IGFuZCBrLlxyXG4gICAgICBmdW5jdGlvbiBtdWx0aXBseSh4LCBrLCBiYXNlKSB7XHJcbiAgICAgICAgdmFyIG0sIHRlbXAsIHhsbywgeGhpLFxyXG4gICAgICAgICAgY2FycnkgPSAwLFxyXG4gICAgICAgICAgaSA9IHgubGVuZ3RoLFxyXG4gICAgICAgICAga2xvID0gayAlIFNRUlRfQkFTRSxcclxuICAgICAgICAgIGtoaSA9IGsgLyBTUVJUX0JBU0UgfCAwO1xyXG5cclxuICAgICAgICBmb3IgKHggPSB4LnNsaWNlKCk7IGktLTspIHtcclxuICAgICAgICAgIHhsbyA9IHhbaV0gJSBTUVJUX0JBU0U7XHJcbiAgICAgICAgICB4aGkgPSB4W2ldIC8gU1FSVF9CQVNFIHwgMDtcclxuICAgICAgICAgIG0gPSBraGkgKiB4bG8gKyB4aGkgKiBrbG87XHJcbiAgICAgICAgICB0ZW1wID0ga2xvICogeGxvICsgKChtICUgU1FSVF9CQVNFKSAqIFNRUlRfQkFTRSkgKyBjYXJyeTtcclxuICAgICAgICAgIGNhcnJ5ID0gKHRlbXAgLyBiYXNlIHwgMCkgKyAobSAvIFNRUlRfQkFTRSB8IDApICsga2hpICogeGhpO1xyXG4gICAgICAgICAgeFtpXSA9IHRlbXAgJSBiYXNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNhcnJ5KSB4ID0gW2NhcnJ5XS5jb25jYXQoeCk7XHJcblxyXG4gICAgICAgIHJldHVybiB4O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBjb21wYXJlKGEsIGIsIGFMLCBiTCkge1xyXG4gICAgICAgIHZhciBpLCBjbXA7XHJcblxyXG4gICAgICAgIGlmIChhTCAhPSBiTCkge1xyXG4gICAgICAgICAgY21wID0gYUwgPiBiTCA/IDEgOiAtMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIGZvciAoaSA9IGNtcCA9IDA7IGkgPCBhTDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYVtpXSAhPSBiW2ldKSB7XHJcbiAgICAgICAgICAgICAgY21wID0gYVtpXSA+IGJbaV0gPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjbXA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIHN1YnRyYWN0KGEsIGIsIGFMLCBiYXNlKSB7XHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG5cclxuICAgICAgICAvLyBTdWJ0cmFjdCBiIGZyb20gYS5cclxuICAgICAgICBmb3IgKDsgYUwtLTspIHtcclxuICAgICAgICAgIGFbYUxdIC09IGk7XHJcbiAgICAgICAgICBpID0gYVthTF0gPCBiW2FMXSA/IDEgOiAwO1xyXG4gICAgICAgICAgYVthTF0gPSBpICogYmFzZSArIGFbYUxdIC0gYlthTF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZW1vdmUgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKDsgIWFbMF0gJiYgYS5sZW5ndGggPiAxOyBhLnNwbGljZSgwLCAxKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHg6IGRpdmlkZW5kLCB5OiBkaXZpc29yLlxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHgsIHksIGRwLCBybSwgYmFzZSkge1xyXG4gICAgICAgIHZhciBjbXAsIGUsIGksIG1vcmUsIG4sIHByb2QsIHByb2RMLCBxLCBxYywgcmVtLCByZW1MLCByZW0wLCB4aSwgeEwsIHljMCxcclxuICAgICAgICAgIHlMLCB5eixcclxuICAgICAgICAgIHMgPSB4LnMgPT0geS5zID8gMSA6IC0xLFxyXG4gICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIE5hTiwgSW5maW5pdHkgb3IgMD9cclxuICAgICAgICBpZiAoIXhjIHx8ICF4Y1swXSB8fCAheWMgfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoXHJcblxyXG4gICAgICAgICAgIC8vIFJldHVybiBOYU4gaWYgZWl0aGVyIE5hTiwgb3IgYm90aCBJbmZpbml0eSBvciAwLlxyXG4gICAgICAgICAgICF4LnMgfHwgIXkucyB8fCAoeGMgPyB5YyAmJiB4Y1swXSA9PSB5Y1swXSA6ICF5YykgPyBOYU4gOlxyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIMKxMCBpZiB4IGlzIMKxMCBvciB5IGlzIMKxSW5maW5pdHksIG9yIHJldHVybiDCsUluZmluaXR5IGFzIHkgaXMgwrEwLlxyXG4gICAgICAgICAgICB4YyAmJiB4Y1swXSA9PSAwIHx8ICF5YyA/IHMgKiAwIDogcyAvIDBcclxuICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHEgPSBuZXcgQmlnTnVtYmVyKHMpO1xyXG4gICAgICAgIHFjID0gcS5jID0gW107XHJcbiAgICAgICAgZSA9IHguZSAtIHkuZTtcclxuICAgICAgICBzID0gZHAgKyBlICsgMTtcclxuXHJcbiAgICAgICAgaWYgKCFiYXNlKSB7XHJcbiAgICAgICAgICBiYXNlID0gQkFTRTtcclxuICAgICAgICAgIGUgPSBiaXRGbG9vcih4LmUgLyBMT0dfQkFTRSkgLSBiaXRGbG9vcih5LmUgLyBMT0dfQkFTRSk7XHJcbiAgICAgICAgICBzID0gcyAvIExPR19CQVNFIHwgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlc3VsdCBleHBvbmVudCBtYXkgYmUgb25lIGxlc3MgdGhlbiB0aGUgY3VycmVudCB2YWx1ZSBvZiBlLlxyXG4gICAgICAgIC8vIFRoZSBjb2VmZmljaWVudHMgb2YgdGhlIEJpZ051bWJlcnMgZnJvbSBjb252ZXJ0QmFzZSBtYXkgaGF2ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKGkgPSAwOyB5Y1tpXSA9PSAoeGNbaV0gfHwgMCk7IGkrKyk7XHJcblxyXG4gICAgICAgIGlmICh5Y1tpXSA+ICh4Y1tpXSB8fCAwKSkgZS0tO1xyXG5cclxuICAgICAgICBpZiAocyA8IDApIHtcclxuICAgICAgICAgIHFjLnB1c2goMSk7XHJcbiAgICAgICAgICBtb3JlID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeEwgPSB4Yy5sZW5ndGg7XHJcbiAgICAgICAgICB5TCA9IHljLmxlbmd0aDtcclxuICAgICAgICAgIGkgPSAwO1xyXG4gICAgICAgICAgcyArPSAyO1xyXG5cclxuICAgICAgICAgIC8vIE5vcm1hbGlzZSB4YyBhbmQgeWMgc28gaGlnaGVzdCBvcmRlciBkaWdpdCBvZiB5YyBpcyA+PSBiYXNlIC8gMi5cclxuXHJcbiAgICAgICAgICBuID0gbWF0aGZsb29yKGJhc2UgLyAoeWNbMF0gKyAxKSk7XHJcblxyXG4gICAgICAgICAgLy8gTm90IG5lY2Vzc2FyeSwgYnV0IHRvIGhhbmRsZSBvZGQgYmFzZXMgd2hlcmUgeWNbMF0gPT0gKGJhc2UgLyAyKSAtIDEuXHJcbiAgICAgICAgICAvLyBpZiAobiA+IDEgfHwgbisrID09IDEgJiYgeWNbMF0gPCBiYXNlIC8gMikge1xyXG4gICAgICAgICAgaWYgKG4gPiAxKSB7XHJcbiAgICAgICAgICAgIHljID0gbXVsdGlwbHkoeWMsIG4sIGJhc2UpO1xyXG4gICAgICAgICAgICB4YyA9IG11bHRpcGx5KHhjLCBuLCBiYXNlKTtcclxuICAgICAgICAgICAgeUwgPSB5Yy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHhMID0geGMubGVuZ3RoO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHhpID0geUw7XHJcbiAgICAgICAgICByZW0gPSB4Yy5zbGljZSgwLCB5TCk7XHJcbiAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAvLyBBZGQgemVyb3MgdG8gbWFrZSByZW1haW5kZXIgYXMgbG9uZyBhcyBkaXZpc29yLlxyXG4gICAgICAgICAgZm9yICg7IHJlbUwgPCB5TDsgcmVtW3JlbUwrK10gPSAwKTtcclxuICAgICAgICAgIHl6ID0geWMuc2xpY2UoKTtcclxuICAgICAgICAgIHl6ID0gWzBdLmNvbmNhdCh5eik7XHJcbiAgICAgICAgICB5YzAgPSB5Y1swXTtcclxuICAgICAgICAgIGlmICh5Y1sxXSA+PSBiYXNlIC8gMikgeWMwKys7XHJcbiAgICAgICAgICAvLyBOb3QgbmVjZXNzYXJ5LCBidXQgdG8gcHJldmVudCB0cmlhbCBkaWdpdCBuID4gYmFzZSwgd2hlbiB1c2luZyBiYXNlIDMuXHJcbiAgICAgICAgICAvLyBlbHNlIGlmIChiYXNlID09IDMgJiYgeWMwID09IDEpIHljMCA9IDEgKyAxZS0xNTtcclxuXHJcbiAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIG4gPSAwO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgIGNtcCA9IGNvbXBhcmUoeWMsIHJlbSwgeUwsIHJlbUwpO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgZGl2aXNvciA8IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgaWYgKGNtcCA8IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRyaWFsIGRpZ2l0LCBuLlxyXG5cclxuICAgICAgICAgICAgICByZW0wID0gcmVtWzBdO1xyXG4gICAgICAgICAgICAgIGlmICh5TCAhPSByZW1MKSByZW0wID0gcmVtMCAqIGJhc2UgKyAocmVtWzFdIHx8IDApO1xyXG5cclxuICAgICAgICAgICAgICAvLyBuIGlzIGhvdyBtYW55IHRpbWVzIHRoZSBkaXZpc29yIGdvZXMgaW50byB0aGUgY3VycmVudCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgbiA9IG1hdGhmbG9vcihyZW0wIC8geWMwKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gIEFsZ29yaXRobTpcclxuICAgICAgICAgICAgICAvLyAgcHJvZHVjdCA9IGRpdmlzb3IgbXVsdGlwbGllZCBieSB0cmlhbCBkaWdpdCAobikuXHJcbiAgICAgICAgICAgICAgLy8gIENvbXBhcmUgcHJvZHVjdCBhbmQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIC8vICBJZiBwcm9kdWN0IGlzIGdyZWF0ZXIgdGhhbiByZW1haW5kZXI6XHJcbiAgICAgICAgICAgICAgLy8gICAgU3VidHJhY3QgZGl2aXNvciBmcm9tIHByb2R1Y3QsIGRlY3JlbWVudCB0cmlhbCBkaWdpdC5cclxuICAgICAgICAgICAgICAvLyAgU3VidHJhY3QgcHJvZHVjdCBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAvLyAgSWYgcHJvZHVjdCB3YXMgbGVzcyB0aGFuIHJlbWFpbmRlciBhdCB0aGUgbGFzdCBjb21wYXJlOlxyXG4gICAgICAgICAgICAgIC8vICAgIENvbXBhcmUgbmV3IHJlbWFpbmRlciBhbmQgZGl2aXNvci5cclxuICAgICAgICAgICAgICAvLyAgICBJZiByZW1haW5kZXIgaXMgZ3JlYXRlciB0aGFuIGRpdmlzb3I6XHJcbiAgICAgICAgICAgICAgLy8gICAgICBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcmVtYWluZGVyLCBpbmNyZW1lbnQgdHJpYWwgZGlnaXQuXHJcblxyXG4gICAgICAgICAgICAgIGlmIChuID4gMSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIG4gbWF5IGJlID4gYmFzZSBvbmx5IHdoZW4gYmFzZSBpcyAzLlxyXG4gICAgICAgICAgICAgICAgaWYgKG4gPj0gYmFzZSkgbiA9IGJhc2UgLSAxO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHByb2R1Y3QgPSBkaXZpc29yICogdHJpYWwgZGlnaXQuXHJcbiAgICAgICAgICAgICAgICBwcm9kID0gbXVsdGlwbHkoeWMsIG4sIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgcHJvZEwgPSBwcm9kLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENvbXBhcmUgcHJvZHVjdCBhbmQgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgLy8gSWYgcHJvZHVjdCA+IHJlbWFpbmRlciB0aGVuIHRyaWFsIGRpZ2l0IG4gdG9vIGhpZ2guXHJcbiAgICAgICAgICAgICAgICAvLyBuIGlzIDEgdG9vIGhpZ2ggYWJvdXQgNSUgb2YgdGhlIHRpbWUsIGFuZCBpcyBub3Qga25vd24gdG8gaGF2ZVxyXG4gICAgICAgICAgICAgICAgLy8gZXZlciBiZWVuIG1vcmUgdGhhbiAxIHRvbyBoaWdoLlxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGNvbXBhcmUocHJvZCwgcmVtLCBwcm9kTCwgcmVtTCkgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICBuLS07XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcHJvZHVjdC5cclxuICAgICAgICAgICAgICAgICAgc3VidHJhY3QocHJvZCwgeUwgPCBwcm9kTCA/IHl6IDogeWMsIHByb2RMLCBiYXNlKTtcclxuICAgICAgICAgICAgICAgICAgcHJvZEwgPSBwcm9kLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgY21wID0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIG4gaXMgMCBvciAxLCBjbXAgaXMgLTEuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBuIGlzIDAsIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29tcGFyZSB5YyBhbmQgcmVtIGFnYWluIGJlbG93LFxyXG4gICAgICAgICAgICAgICAgLy8gc28gY2hhbmdlIGNtcCB0byAxIHRvIGF2b2lkIGl0LlxyXG4gICAgICAgICAgICAgICAgLy8gSWYgbiBpcyAxLCBsZWF2ZSBjbXAgYXMgLTEsIHNvIHljIGFuZCByZW0gYXJlIGNvbXBhcmVkIGFnYWluLlxyXG4gICAgICAgICAgICAgICAgaWYgKG4gPT0gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gZGl2aXNvciA8IHJlbWFpbmRlciwgc28gbiBtdXN0IGJlIGF0IGxlYXN0IDEuXHJcbiAgICAgICAgICAgICAgICAgIGNtcCA9IG4gPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHByb2R1Y3QgPSBkaXZpc29yXHJcbiAgICAgICAgICAgICAgICBwcm9kID0geWMuc2xpY2UoKTtcclxuICAgICAgICAgICAgICAgIHByb2RMID0gcHJvZC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAocHJvZEwgPCByZW1MKSBwcm9kID0gWzBdLmNvbmNhdChwcm9kKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gU3VidHJhY3QgcHJvZHVjdCBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICBzdWJ0cmFjdChyZW0sIHByb2QsIHJlbUwsIGJhc2UpO1xyXG4gICAgICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgLy8gSWYgcHJvZHVjdCB3YXMgPCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgaWYgKGNtcCA9PSAtMSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENvbXBhcmUgZGl2aXNvciBhbmQgbmV3IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgIC8vIElmIGRpdmlzb3IgPCBuZXcgcmVtYWluZGVyLCBzdWJ0cmFjdCBkaXZpc29yIGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgLy8gVHJpYWwgZGlnaXQgbiB0b28gbG93LlxyXG4gICAgICAgICAgICAgICAgLy8gbiBpcyAxIHRvbyBsb3cgYWJvdXQgNSUgb2YgdGhlIHRpbWUsIGFuZCB2ZXJ5IHJhcmVseSAyIHRvbyBsb3cuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoY29tcGFyZSh5YywgcmVtLCB5TCwgcmVtTCkgPCAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIG4rKztcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAgIHN1YnRyYWN0KHJlbSwgeUwgPCByZW1MID8geXogOiB5YywgcmVtTCwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjbXAgPT09IDApIHtcclxuICAgICAgICAgICAgICBuKys7XHJcbiAgICAgICAgICAgICAgcmVtID0gWzBdO1xyXG4gICAgICAgICAgICB9IC8vIGVsc2UgY21wID09PSAxIGFuZCBuIHdpbGwgYmUgMFxyXG5cclxuICAgICAgICAgICAgLy8gQWRkIHRoZSBuZXh0IGRpZ2l0LCBuLCB0byB0aGUgcmVzdWx0IGFycmF5LlxyXG4gICAgICAgICAgICBxY1tpKytdID0gbjtcclxuXHJcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBpZiAocmVtWzBdKSB7XHJcbiAgICAgICAgICAgICAgcmVtW3JlbUwrK10gPSB4Y1t4aV0gfHwgMDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZW0gPSBbeGNbeGldXTtcclxuICAgICAgICAgICAgICByZW1MID0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSB3aGlsZSAoKHhpKysgPCB4TCB8fCByZW1bMF0gIT0gbnVsbCkgJiYgcy0tKTtcclxuXHJcbiAgICAgICAgICBtb3JlID0gcmVtWzBdICE9IG51bGw7XHJcblxyXG4gICAgICAgICAgLy8gTGVhZGluZyB6ZXJvP1xyXG4gICAgICAgICAgaWYgKCFxY1swXSkgcWMuc3BsaWNlKDAsIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGJhc2UgPT0gQkFTRSkge1xyXG5cclxuICAgICAgICAgIC8vIFRvIGNhbGN1bGF0ZSBxLmUsIGZpcnN0IGdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBxY1swXS5cclxuICAgICAgICAgIGZvciAoaSA9IDEsIHMgPSBxY1swXTsgcyA+PSAxMDsgcyAvPSAxMCwgaSsrKTtcclxuXHJcbiAgICAgICAgICByb3VuZChxLCBkcCArIChxLmUgPSBpICsgZSAqIExPR19CQVNFIC0gMSkgKyAxLCBybSwgbW9yZSk7XHJcblxyXG4gICAgICAgIC8vIENhbGxlciBpcyBjb252ZXJ0QmFzZS5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcS5lID0gZTtcclxuICAgICAgICAgIHEuciA9ICttb3JlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHE7XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyIG4gaW4gZml4ZWQtcG9pbnQgb3IgZXhwb25lbnRpYWxcclxuICAgICAqIG5vdGF0aW9uIHJvdW5kZWQgdG8gdGhlIHNwZWNpZmllZCBkZWNpbWFsIHBsYWNlcyBvciBzaWduaWZpY2FudCBkaWdpdHMuXHJcbiAgICAgKlxyXG4gICAgICogbjogYSBCaWdOdW1iZXIuXHJcbiAgICAgKiBpOiB0aGUgaW5kZXggb2YgdGhlIGxhc3QgZGlnaXQgcmVxdWlyZWQgKGkuZS4gdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXApLlxyXG4gICAgICogcm06IHRoZSByb3VuZGluZyBtb2RlLlxyXG4gICAgICogaWQ6IDEgKHRvRXhwb25lbnRpYWwpIG9yIDIgKHRvUHJlY2lzaW9uKS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZm9ybWF0KG4sIGksIHJtLCBpZCkge1xyXG4gICAgICB2YXIgYzAsIGUsIG5lLCBsZW4sIHN0cjtcclxuXHJcbiAgICAgIGlmIChybSA9PSBudWxsKSBybSA9IFJPVU5ESU5HX01PREU7XHJcbiAgICAgIGVsc2UgaW50Q2hlY2socm0sIDAsIDgpO1xyXG5cclxuICAgICAgaWYgKCFuLmMpIHJldHVybiBuLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICBjMCA9IG4uY1swXTtcclxuICAgICAgbmUgPSBuLmU7XHJcblxyXG4gICAgICBpZiAoaSA9PSBudWxsKSB7XHJcbiAgICAgICAgc3RyID0gY29lZmZUb1N0cmluZyhuLmMpO1xyXG4gICAgICAgIHN0ciA9IGlkID09IDEgfHwgaWQgPT0gMiAmJiAobmUgPD0gVE9fRVhQX05FRyB8fCBuZSA+PSBUT19FWFBfUE9TKVxyXG4gICAgICAgICA/IHRvRXhwb25lbnRpYWwoc3RyLCBuZSlcclxuICAgICAgICAgOiB0b0ZpeGVkUG9pbnQoc3RyLCBuZSwgJzAnKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuID0gcm91bmQobmV3IEJpZ051bWJlcihuKSwgaSwgcm0pO1xyXG5cclxuICAgICAgICAvLyBuLmUgbWF5IGhhdmUgY2hhbmdlZCBpZiB0aGUgdmFsdWUgd2FzIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgICAgc3RyID0gY29lZmZUb1N0cmluZyhuLmMpO1xyXG4gICAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIHRvUHJlY2lzaW9uIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhlIG51bWJlciBvZiBzaWduaWZpY2FudCBkaWdpdHNcclxuICAgICAgICAvLyBzcGVjaWZpZWQgaXMgbGVzcyB0aGFuIHRoZSBudW1iZXIgb2YgZGlnaXRzIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIGludGVnZXJcclxuICAgICAgICAvLyBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBmaXhlZC1wb2ludCBub3RhdGlvbi5cclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgICAgaWYgKGlkID09IDEgfHwgaWQgPT0gMiAmJiAoaSA8PSBlIHx8IGUgPD0gVE9fRVhQX05FRykpIHtcclxuXHJcbiAgICAgICAgICAvLyBBcHBlbmQgemVyb3M/XHJcbiAgICAgICAgICBmb3IgKDsgbGVuIDwgaTsgc3RyICs9ICcwJywgbGVuKyspO1xyXG4gICAgICAgICAgc3RyID0gdG9FeHBvbmVudGlhbChzdHIsIGUpO1xyXG5cclxuICAgICAgICAvLyBGaXhlZC1wb2ludCBub3RhdGlvbi5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaSAtPSBuZTtcclxuICAgICAgICAgIHN0ciA9IHRvRml4ZWRQb2ludChzdHIsIGUsICcwJyk7XHJcblxyXG4gICAgICAgICAgLy8gQXBwZW5kIHplcm9zP1xyXG4gICAgICAgICAgaWYgKGUgKyAxID4gbGVuKSB7XHJcbiAgICAgICAgICAgIGlmICgtLWkgPiAwKSBmb3IgKHN0ciArPSAnLic7IGktLTsgc3RyICs9ICcwJyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpICs9IGUgLSBsZW47XHJcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgIGlmIChlICsgMSA9PSBsZW4pIHN0ciArPSAnLic7XHJcbiAgICAgICAgICAgICAgZm9yICg7IGktLTsgc3RyICs9ICcwJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuLnMgPCAwICYmIGMwID8gJy0nICsgc3RyIDogc3RyO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBIYW5kbGUgQmlnTnVtYmVyLm1heCBhbmQgQmlnTnVtYmVyLm1pbi5cclxuICAgIGZ1bmN0aW9uIG1heE9yTWluKGFyZ3MsIG1ldGhvZCkge1xyXG4gICAgICB2YXIgbixcclxuICAgICAgICBpID0gMSxcclxuICAgICAgICBtID0gbmV3IEJpZ051bWJlcihhcmdzWzBdKTtcclxuXHJcbiAgICAgIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIG4gPSBuZXcgQmlnTnVtYmVyKGFyZ3NbaV0pO1xyXG5cclxuICAgICAgICAvLyBJZiBhbnkgbnVtYmVyIGlzIE5hTiwgcmV0dXJuIE5hTi5cclxuICAgICAgICBpZiAoIW4ucykge1xyXG4gICAgICAgICAgbSA9IG47XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9IGVsc2UgaWYgKG1ldGhvZC5jYWxsKG0sIG4pKSB7XHJcbiAgICAgICAgICBtID0gbjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBtO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogU3RyaXAgdHJhaWxpbmcgemVyb3MsIGNhbGN1bGF0ZSBiYXNlIDEwIGV4cG9uZW50IGFuZCBjaGVjayBhZ2FpbnN0IE1JTl9FWFAgYW5kIE1BWF9FWFAuXHJcbiAgICAgKiBDYWxsZWQgYnkgbWludXMsIHBsdXMgYW5kIHRpbWVzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBub3JtYWxpc2UobiwgYywgZSkge1xyXG4gICAgICB2YXIgaSA9IDEsXHJcbiAgICAgICAgaiA9IGMubGVuZ3RoO1xyXG5cclxuICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgZm9yICg7ICFjWy0tal07IGMucG9wKCkpO1xyXG5cclxuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBiYXNlIDEwIGV4cG9uZW50LiBGaXJzdCBnZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2YgY1swXS5cclxuICAgICAgZm9yIChqID0gY1swXTsgaiA+PSAxMDsgaiAvPSAxMCwgaSsrKTtcclxuXHJcbiAgICAgIC8vIE92ZXJmbG93P1xyXG4gICAgICBpZiAoKGUgPSBpICsgZSAqIExPR19CQVNFIC0gMSkgPiBNQVhfRVhQKSB7XHJcblxyXG4gICAgICAgIC8vIEluZmluaXR5LlxyXG4gICAgICAgIG4uYyA9IG4uZSA9IG51bGw7XHJcblxyXG4gICAgICAvLyBVbmRlcmZsb3c/XHJcbiAgICAgIH0gZWxzZSBpZiAoZSA8IE1JTl9FWFApIHtcclxuXHJcbiAgICAgICAgLy8gWmVyby5cclxuICAgICAgICBuLmMgPSBbbi5lID0gMF07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbi5lID0gZTtcclxuICAgICAgICBuLmMgPSBjO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gSGFuZGxlIHZhbHVlcyB0aGF0IGZhaWwgdGhlIHZhbGlkaXR5IHRlc3QgaW4gQmlnTnVtYmVyLlxyXG4gICAgcGFyc2VOdW1lcmljID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGJhc2VQcmVmaXggPSAvXigtPykwKFt4Ym9dKSg/PVxcd1tcXHcuXSokKS9pLFxyXG4gICAgICAgIGRvdEFmdGVyID0gL14oW14uXSspXFwuJC8sXHJcbiAgICAgICAgZG90QmVmb3JlID0gL15cXC4oW14uXSspJC8sXHJcbiAgICAgICAgaXNJbmZpbml0eU9yTmFOID0gL14tPyhJbmZpbml0eXxOYU4pJC8sXHJcbiAgICAgICAgd2hpdGVzcGFjZU9yUGx1cyA9IC9eXFxzKlxcKyg/PVtcXHcuXSl8Xlxccyt8XFxzKyQvZztcclxuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoeCwgc3RyLCBpc051bSwgYikge1xyXG4gICAgICAgIHZhciBiYXNlLFxyXG4gICAgICAgICAgcyA9IGlzTnVtID8gc3RyIDogc3RyLnJlcGxhY2Uod2hpdGVzcGFjZU9yUGx1cywgJycpO1xyXG5cclxuICAgICAgICAvLyBObyBleGNlcHRpb24gb24gwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgICAgaWYgKGlzSW5maW5pdHlPck5hTi50ZXN0KHMpKSB7XHJcbiAgICAgICAgICB4LnMgPSBpc05hTihzKSA/IG51bGwgOiBzIDwgMCA/IC0xIDogMTtcclxuICAgICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICghaXNOdW0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJhc2VQcmVmaXggPSAvXigtPykwKFt4Ym9dKSg/PVxcd1tcXHcuXSokKS9pXHJcbiAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoYmFzZVByZWZpeCwgZnVuY3Rpb24gKG0sIHAxLCBwMikge1xyXG4gICAgICAgICAgICAgIGJhc2UgPSAocDIgPSBwMi50b0xvd2VyQ2FzZSgpKSA9PSAneCcgPyAxNiA6IHAyID09ICdiJyA/IDIgOiA4O1xyXG4gICAgICAgICAgICAgIHJldHVybiAhYiB8fCBiID09IGJhc2UgPyBwMSA6IG07XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgICBiYXNlID0gYjtcclxuXHJcbiAgICAgICAgICAgICAgLy8gRS5nLiAnMS4nIHRvICcxJywgJy4xJyB0byAnMC4xJ1xyXG4gICAgICAgICAgICAgIHMgPSBzLnJlcGxhY2UoZG90QWZ0ZXIsICckMScpLnJlcGxhY2UoZG90QmVmb3JlLCAnMC4kMScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RyICE9IHMpIHJldHVybiBuZXcgQmlnTnVtYmVyKHMsIGJhc2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOb3QgYSBudW1iZXI6IHtufSdcclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOb3QgYSBiYXNlIHtifSBudW1iZXI6IHtufSdcclxuICAgICAgICAgIGlmIChCaWdOdW1iZXIuREVCVUcpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnTm90IGEnICsgKGIgPyAnIGJhc2UgJyArIGIgOiAnJykgKyAnIG51bWJlcjogJyArIHN0cik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTmFOXHJcbiAgICAgICAgICB4LmMgPSB4LmUgPSB4LnMgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSkoKTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJvdW5kIHggdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0uIENoZWNrIGZvciBvdmVyL3VuZGVyLWZsb3cuXHJcbiAgICAgKiBJZiByIGlzIHRydXRoeSwgaXQgaXMga25vd24gdGhhdCB0aGVyZSBhcmUgbW9yZSBkaWdpdHMgYWZ0ZXIgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByb3VuZCh4LCBzZCwgcm0sIHIpIHtcclxuICAgICAgdmFyIGQsIGksIGosIGssIG4sIG5pLCByZCxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICBwb3dzMTAgPSBQT1dTX1RFTjtcclxuXHJcbiAgICAgIC8vIGlmIHggaXMgbm90IEluZmluaXR5IG9yIE5hTi4uLlxyXG4gICAgICBpZiAoeGMpIHtcclxuXHJcbiAgICAgICAgLy8gcmQgaXMgdGhlIHJvdW5kaW5nIGRpZ2l0LCBpLmUuIHRoZSBkaWdpdCBhZnRlciB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cC5cclxuICAgICAgICAvLyBuIGlzIGEgYmFzZSAxZTE0IG51bWJlciwgdGhlIHZhbHVlIG9mIHRoZSBlbGVtZW50IG9mIGFycmF5IHguYyBjb250YWluaW5nIHJkLlxyXG4gICAgICAgIC8vIG5pIGlzIHRoZSBpbmRleCBvZiBuIHdpdGhpbiB4LmMuXHJcbiAgICAgICAgLy8gZCBpcyB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgIC8vIGkgaXMgdGhlIGluZGV4IG9mIHJkIHdpdGhpbiBuIGluY2x1ZGluZyBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIC8vIGogaXMgdGhlIGFjdHVhbCBpbmRleCBvZiByZCB3aXRoaW4gbiAoaWYgPCAwLCByZCBpcyBhIGxlYWRpbmcgemVybykuXHJcbiAgICAgICAgb3V0OiB7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLlxyXG4gICAgICAgICAgZm9yIChkID0gMSwgayA9IHhjWzBdOyBrID49IDEwOyBrIC89IDEwLCBkKyspO1xyXG4gICAgICAgICAgaSA9IHNkIC0gZDtcclxuXHJcbiAgICAgICAgICAvLyBJZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgIGlmIChpIDwgMCkge1xyXG4gICAgICAgICAgICBpICs9IExPR19CQVNFO1xyXG4gICAgICAgICAgICBqID0gc2Q7XHJcbiAgICAgICAgICAgIG4gPSB4Y1tuaSA9IDBdO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHRoZSByb3VuZGluZyBkaWdpdCBhdCBpbmRleCBqIG9mIG4uXHJcbiAgICAgICAgICAgIHJkID0gbiAvIHBvd3MxMFtkIC0gaiAtIDFdICUgMTAgfCAwO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmkgPSBtYXRoY2VpbCgoaSArIDEpIC8gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5pID49IHhjLmxlbmd0aCkge1xyXG5cclxuICAgICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5lZWRlZCBieSBzcXJ0LlxyXG4gICAgICAgICAgICAgICAgZm9yICg7IHhjLmxlbmd0aCA8PSBuaTsgeGMucHVzaCgwKSk7XHJcbiAgICAgICAgICAgICAgICBuID0gcmQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZCA9IDE7XHJcbiAgICAgICAgICAgICAgICBpICU9IExPR19CQVNFO1xyXG4gICAgICAgICAgICAgICAgaiA9IGkgLSBMT0dfQkFTRSArIDE7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrIG91dDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgbiA9IGsgPSB4Y1tuaV07XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBuLlxyXG4gICAgICAgICAgICAgIGZvciAoZCA9IDE7IGsgPj0gMTA7IGsgLz0gMTAsIGQrKyk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4uXHJcbiAgICAgICAgICAgICAgaSAlPSBMT0dfQkFTRTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gR2V0IHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiwgYWRqdXN0ZWQgZm9yIGxlYWRpbmcgemVyb3MuXHJcbiAgICAgICAgICAgICAgLy8gVGhlIG51bWJlciBvZiBsZWFkaW5nIHplcm9zIG9mIG4gaXMgZ2l2ZW4gYnkgTE9HX0JBU0UgLSBkLlxyXG4gICAgICAgICAgICAgIGogPSBpIC0gTE9HX0JBU0UgKyBkO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIHJvdW5kaW5nIGRpZ2l0IGF0IGluZGV4IGogb2Ygbi5cclxuICAgICAgICAgICAgICByZCA9IGogPCAwID8gMCA6IG4gLyBwb3dzMTBbZCAtIGogLSAxXSAlIDEwIHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHIgPSByIHx8IHNkIDwgMCB8fFxyXG5cclxuICAgICAgICAgIC8vIEFyZSB0aGVyZSBhbnkgbm9uLXplcm8gZGlnaXRzIGFmdGVyIHRoZSByb3VuZGluZyBkaWdpdD9cclxuICAgICAgICAgIC8vIFRoZSBleHByZXNzaW9uICBuICUgcG93czEwW2QgLSBqIC0gMV0gIHJldHVybnMgYWxsIGRpZ2l0cyBvZiBuIHRvIHRoZSByaWdodFxyXG4gICAgICAgICAgLy8gb2YgdGhlIGRpZ2l0IGF0IGosIGUuZy4gaWYgbiBpcyA5MDg3MTQgYW5kIGogaXMgMiwgdGhlIGV4cHJlc3Npb24gZ2l2ZXMgNzE0LlxyXG4gICAgICAgICAgIHhjW25pICsgMV0gIT0gbnVsbCB8fCAoaiA8IDAgPyBuIDogbiAlIHBvd3MxMFtkIC0gaiAtIDFdKTtcclxuXHJcbiAgICAgICAgICByID0gcm0gPCA0XHJcbiAgICAgICAgICAgPyAocmQgfHwgcikgJiYgKHJtID09IDAgfHwgcm0gPT0gKHgucyA8IDAgPyAzIDogMikpXHJcbiAgICAgICAgICAgOiByZCA+IDUgfHwgcmQgPT0gNSAmJiAocm0gPT0gNCB8fCByIHx8IHJtID09IDYgJiZcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIGRpZ2l0IHRvIHRoZSBsZWZ0IG9mIHRoZSByb3VuZGluZyBkaWdpdCBpcyBvZGQuXHJcbiAgICAgICAgICAgICgoaSA+IDAgPyBqID4gMCA/IG4gLyBwb3dzMTBbZCAtIGpdIDogMCA6IHhjW25pIC0gMV0pICUgMTApICYgMSB8fFxyXG4gICAgICAgICAgICAgcm0gPT0gKHgucyA8IDAgPyA4IDogNykpO1xyXG5cclxuICAgICAgICAgIGlmIChzZCA8IDEgfHwgIXhjWzBdKSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHNkIHRvIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgICAgIHNkIC09IHguZSArIDE7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDEsIDAuMSwgMC4wMSwgMC4wMDEsIDAuMDAwMSBldGMuXHJcbiAgICAgICAgICAgICAgeGNbMF0gPSBwb3dzMTBbKExPR19CQVNFIC0gc2QgJSBMT0dfQkFTRSkgJSBMT0dfQkFTRV07XHJcbiAgICAgICAgICAgICAgeC5lID0gLXNkIHx8IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICAgICAgeGNbMF0gPSB4LmUgPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgZXhjZXNzIGRpZ2l0cy5cclxuICAgICAgICAgIGlmIChpID09IDApIHtcclxuICAgICAgICAgICAgeGMubGVuZ3RoID0gbmk7XHJcbiAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICBuaS0tO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeGMubGVuZ3RoID0gbmkgKyAxO1xyXG4gICAgICAgICAgICBrID0gcG93czEwW0xPR19CQVNFIC0gaV07XHJcblxyXG4gICAgICAgICAgICAvLyBFLmcuIDU2NzAwIGJlY29tZXMgNTYwMDAgaWYgNyBpcyB0aGUgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICAgIC8vIGogPiAwIG1lYW5zIGkgPiBudW1iZXIgb2YgbGVhZGluZyB6ZXJvcyBvZiBuLlxyXG4gICAgICAgICAgICB4Y1tuaV0gPSBqID4gMCA/IG1hdGhmbG9vcihuIC8gcG93czEwW2QgLSBqXSAlIHBvd3MxMFtqXSkgKiBrIDogMDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgIGlmIChyKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgOykge1xyXG5cclxuICAgICAgICAgICAgICAvLyBJZiB0aGUgZGlnaXQgdG8gYmUgcm91bmRlZCB1cCBpcyBpbiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy4uLlxyXG4gICAgICAgICAgICAgIGlmIChuaSA9PSAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaSB3aWxsIGJlIHRoZSBsZW5ndGggb2YgeGNbMF0gYmVmb3JlIGsgaXMgYWRkZWQuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAxLCBqID0geGNbMF07IGogPj0gMTA7IGogLz0gMTAsIGkrKyk7XHJcbiAgICAgICAgICAgICAgICBqID0geGNbMF0gKz0gaztcclxuICAgICAgICAgICAgICAgIGZvciAoayA9IDE7IGogPj0gMTA7IGogLz0gMTAsIGsrKyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgaSAhPSBrIHRoZSBsZW5ndGggaGFzIGluY3JlYXNlZC5cclxuICAgICAgICAgICAgICAgIGlmIChpICE9IGspIHtcclxuICAgICAgICAgICAgICAgICAgeC5lKys7XHJcbiAgICAgICAgICAgICAgICAgIGlmICh4Y1swXSA9PSBCQVNFKSB4Y1swXSA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHhjW25pXSArPSBrO1xyXG4gICAgICAgICAgICAgICAgaWYgKHhjW25pXSAhPSBCQVNFKSBicmVhaztcclxuICAgICAgICAgICAgICAgIHhjW25pLS1dID0gMDtcclxuICAgICAgICAgICAgICAgIGsgPSAxO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgIGZvciAoaSA9IHhjLmxlbmd0aDsgeGNbLS1pXSA9PT0gMDsgeGMucG9wKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3ZlcmZsb3c/IEluZmluaXR5LlxyXG4gICAgICAgIGlmICh4LmUgPiBNQVhfRVhQKSB7XHJcbiAgICAgICAgICB4LmMgPSB4LmUgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBVbmRlcmZsb3c/IFplcm8uXHJcbiAgICAgICAgfSBlbHNlIGlmICh4LmUgPCBNSU5fRVhQKSB7XHJcbiAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4geDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gdmFsdWVPZihuKSB7XHJcbiAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgIGlmIChlID09PSBudWxsKSByZXR1cm4gbi50b1N0cmluZygpO1xyXG5cclxuICAgICAgc3RyID0gY29lZmZUb1N0cmluZyhuLmMpO1xyXG5cclxuICAgICAgc3RyID0gZSA8PSBUT19FWFBfTkVHIHx8IGUgPj0gVE9fRVhQX1BPU1xyXG4gICAgICAgID8gdG9FeHBvbmVudGlhbChzdHIsIGUpXHJcbiAgICAgICAgOiB0b0ZpeGVkUG9pbnQoc3RyLCBlLCAnMCcpO1xyXG5cclxuICAgICAgcmV0dXJuIG4ucyA8IDAgPyAnLScgKyBzdHIgOiBzdHI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIFBST1RPVFlQRS9JTlNUQU5DRSBNRVRIT0RTXHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlci5cclxuICAgICAqL1xyXG4gICAgUC5hYnNvbHV0ZVZhbHVlID0gUC5hYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB4ID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgaWYgKHgucyA8IDApIHgucyA9IDE7XHJcbiAgICAgIHJldHVybiB4O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVyblxyXG4gICAgICogICAxIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqICAgLTEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogICAwIGlmIHRoZXkgaGF2ZSB0aGUgc2FtZSB2YWx1ZSxcclxuICAgICAqICAgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgZWl0aGVyIGlzIE5hTi5cclxuICAgICAqL1xyXG4gICAgUC5jb21wYXJlZFRvID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogSWYgZHAgaXMgdW5kZWZpbmVkIG9yIG51bGwgb3IgdHJ1ZSBvciBmYWxzZSwgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgb2YgdGhlXHJcbiAgICAgKiB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciwgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgKlxyXG4gICAgICogT3RoZXJ3aXNlLCBpZiBkcCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSBtYXhpbXVtIG9mIGRwIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yXHJcbiAgICAgKiBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlczogaW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB8cm19J1xyXG4gICAgICovXHJcbiAgICBQLmRlY2ltYWxQbGFjZXMgPSBQLmRwID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICB2YXIgYywgbiwgdixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChkcCAhPSBudWxsKSB7XHJcbiAgICAgICAgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcbiAgICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvdW5kKG5ldyBCaWdOdW1iZXIoeCksIGRwICsgeC5lICsgMSwgcm0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIShjID0geC5jKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgIG4gPSAoKHYgPSBjLmxlbmd0aCAtIDEpIC0gYml0Rmxvb3IodGhpcy5lIC8gTE9HX0JBU0UpKSAqIExPR19CQVNFO1xyXG5cclxuICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvcyBvZiB0aGUgbGFzdCBudW1iZXIuXHJcbiAgICAgIGlmICh2ID0gY1t2XSkgZm9yICg7IHYgJSAxMCA9PSAwOyB2IC89IDEwLCBuLS0pO1xyXG4gICAgICBpZiAobiA8IDApIG4gPSAwO1xyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gLyAwID0gSVxyXG4gICAgICogIG4gLyBOID0gTlxyXG4gICAgICogIG4gLyBJID0gMFxyXG4gICAgICogIDAgLyBuID0gMFxyXG4gICAgICogIDAgLyAwID0gTlxyXG4gICAgICogIDAgLyBOID0gTlxyXG4gICAgICogIDAgLyBJID0gMFxyXG4gICAgICogIE4gLyBuID0gTlxyXG4gICAgICogIE4gLyAwID0gTlxyXG4gICAgICogIE4gLyBOID0gTlxyXG4gICAgICogIE4gLyBJID0gTlxyXG4gICAgICogIEkgLyBuID0gSVxyXG4gICAgICogIEkgLyAwID0gSVxyXG4gICAgICogIEkgLyBOID0gTlxyXG4gICAgICogIEkgLyBJID0gTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGRpdmlkZWQgYnkgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYiksIHJvdW5kZWQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZCBST1VORElOR19NT0RFLlxyXG4gICAgICovXHJcbiAgICBQLmRpdmlkZWRCeSA9IFAuZGl2ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGRpdih0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpLCBERUNJTUFMX1BMQUNFUywgUk9VTkRJTkdfTU9ERSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgaW50ZWdlciBwYXJ0IG9mIGRpdmlkaW5nIHRoZSB2YWx1ZSBvZiB0aGlzXHJcbiAgICAgKiBCaWdOdW1iZXIgYnkgdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5kaXZpZGVkVG9JbnRlZ2VyQnkgPSBQLmlkaXYgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gZGl2KHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYiksIDAsIDEpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgZXhwb25lbnRpYXRlZCBieSBuLlxyXG4gICAgICpcclxuICAgICAqIElmIG0gaXMgcHJlc2VudCwgcmV0dXJuIHRoZSByZXN1bHQgbW9kdWxvIG0uXHJcbiAgICAgKiBJZiBuIGlzIG5lZ2F0aXZlIHJvdW5kIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqIElmIFBPV19QUkVDSVNJT04gaXMgbm9uLXplcm8gYW5kIG0gaXMgbm90IHByZXNlbnQsIHJvdW5kIHRvIFBPV19QUkVDSVNJT04gdXNpbmcgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqXHJcbiAgICAgKiBUaGUgbW9kdWxhciBwb3dlciBvcGVyYXRpb24gd29ya3MgZWZmaWNpZW50bHkgd2hlbiB4LCBuLCBhbmQgbSBhcmUgaW50ZWdlcnMsIG90aGVyd2lzZSBpdFxyXG4gICAgICogaXMgZXF1aXZhbGVudCB0byBjYWxjdWxhdGluZyB4LmV4cG9uZW50aWF0ZWRCeShuKS5tb2R1bG8obSkgd2l0aCBhIFBPV19QUkVDSVNJT04gb2YgMC5cclxuICAgICAqXHJcbiAgICAgKiBuIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gVGhlIGV4cG9uZW50LiBBbiBpbnRlZ2VyLlxyXG4gICAgICogW21dIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gVGhlIG1vZHVsdXMuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEV4cG9uZW50IG5vdCBhbiBpbnRlZ2VyOiB7bn0nXHJcbiAgICAgKi9cclxuICAgIFAuZXhwb25lbnRpYXRlZEJ5ID0gUC5wb3cgPSBmdW5jdGlvbiAobiwgbSkge1xyXG4gICAgICB2YXIgaGFsZiwgaXNNb2RFeHAsIGksIGssIG1vcmUsIG5Jc0JpZywgbklzTmVnLCBuSXNPZGQsIHksXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBuID0gbmV3IEJpZ051bWJlcihuKTtcclxuXHJcbiAgICAgIC8vIEFsbG93IE5hTiBhbmQgwrFJbmZpbml0eSwgYnV0IG5vdCBvdGhlciBub24taW50ZWdlcnMuXHJcbiAgICAgIGlmIChuLmMgJiYgIW4uaXNJbnRlZ2VyKCkpIHtcclxuICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ0V4cG9uZW50IG5vdCBhbiBpbnRlZ2VyOiAnICsgdmFsdWVPZihuKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChtICE9IG51bGwpIG0gPSBuZXcgQmlnTnVtYmVyKG0pO1xyXG5cclxuICAgICAgLy8gRXhwb25lbnQgb2YgTUFYX1NBRkVfSU5URUdFUiBpcyAxNS5cclxuICAgICAgbklzQmlnID0gbi5lID4gMTQ7XHJcblxyXG4gICAgICAvLyBJZiB4IGlzIE5hTiwgwrFJbmZpbml0eSwgwrEwIG9yIMKxMSwgb3IgbiBpcyDCsUluZmluaXR5LCBOYU4gb3IgwrEwLlxyXG4gICAgICBpZiAoIXguYyB8fCAheC5jWzBdIHx8IHguY1swXSA9PSAxICYmICF4LmUgJiYgeC5jLmxlbmd0aCA9PSAxIHx8ICFuLmMgfHwgIW4uY1swXSkge1xyXG5cclxuICAgICAgICAvLyBUaGUgc2lnbiBvZiB0aGUgcmVzdWx0IG9mIHBvdyB3aGVuIHggaXMgbmVnYXRpdmUgZGVwZW5kcyBvbiB0aGUgZXZlbm5lc3Mgb2Ygbi5cclxuICAgICAgICAvLyBJZiArbiBvdmVyZmxvd3MgdG8gwrFJbmZpbml0eSwgdGhlIGV2ZW5uZXNzIG9mIG4gd291bGQgYmUgbm90IGJlIGtub3duLlxyXG4gICAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKE1hdGgucG93KCt2YWx1ZU9mKHgpLCBuSXNCaWcgPyAyIC0gaXNPZGQobikgOiArdmFsdWVPZihuKSkpO1xyXG4gICAgICAgIHJldHVybiBtID8geS5tb2QobSkgOiB5O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBuSXNOZWcgPSBuLnMgPCAwO1xyXG5cclxuICAgICAgaWYgKG0pIHtcclxuXHJcbiAgICAgICAgLy8geCAlIG0gcmV0dXJucyBOYU4gaWYgYWJzKG0pIGlzIHplcm8sIG9yIG0gaXMgTmFOLlxyXG4gICAgICAgIGlmIChtLmMgPyAhbS5jWzBdIDogIW0ucykgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgICAgaXNNb2RFeHAgPSAhbklzTmVnICYmIHguaXNJbnRlZ2VyKCkgJiYgbS5pc0ludGVnZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKGlzTW9kRXhwKSB4ID0geC5tb2QobSk7XHJcblxyXG4gICAgICAvLyBPdmVyZmxvdyB0byDCsUluZmluaXR5OiA+PTIqKjFlMTAgb3IgPj0xLjAwMDAwMjQqKjFlMTUuXHJcbiAgICAgIC8vIFVuZGVyZmxvdyB0byDCsTA6IDw9MC43OSoqMWUxMCBvciA8PTAuOTk5OTk3NSoqMWUxNS5cclxuICAgICAgfSBlbHNlIGlmIChuLmUgPiA5ICYmICh4LmUgPiAwIHx8IHguZSA8IC0xIHx8ICh4LmUgPT0gMFxyXG4gICAgICAgIC8vIFsxLCAyNDAwMDAwMDBdXHJcbiAgICAgICAgPyB4LmNbMF0gPiAxIHx8IG5Jc0JpZyAmJiB4LmNbMV0gPj0gMjRlN1xyXG4gICAgICAgIC8vIFs4MDAwMDAwMDAwMDAwMF0gIFs5OTk5OTc1MDAwMDAwMF1cclxuICAgICAgICA6IHguY1swXSA8IDhlMTMgfHwgbklzQmlnICYmIHguY1swXSA8PSA5OTk5OTc1ZTcpKSkge1xyXG5cclxuICAgICAgICAvLyBJZiB4IGlzIG5lZ2F0aXZlIGFuZCBuIGlzIG9kZCwgayA9IC0wLCBlbHNlIGsgPSAwLlxyXG4gICAgICAgIGsgPSB4LnMgPCAwICYmIGlzT2RkKG4pID8gLTAgOiAwO1xyXG5cclxuICAgICAgICAvLyBJZiB4ID49IDEsIGsgPSDCsUluZmluaXR5LlxyXG4gICAgICAgIGlmICh4LmUgPiAtMSkgayA9IDEgLyBrO1xyXG5cclxuICAgICAgICAvLyBJZiBuIGlzIG5lZ2F0aXZlIHJldHVybiDCsTAsIGVsc2UgcmV0dXJuIMKxSW5maW5pdHkuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIobklzTmVnID8gMSAvIGsgOiBrKTtcclxuXHJcbiAgICAgIH0gZWxzZSBpZiAoUE9XX1BSRUNJU0lPTikge1xyXG5cclxuICAgICAgICAvLyBUcnVuY2F0aW5nIGVhY2ggY29lZmZpY2llbnQgYXJyYXkgdG8gYSBsZW5ndGggb2YgayBhZnRlciBlYWNoIG11bHRpcGxpY2F0aW9uXHJcbiAgICAgICAgLy8gZXF1YXRlcyB0byB0cnVuY2F0aW5nIHNpZ25pZmljYW50IGRpZ2l0cyB0byBQT1dfUFJFQ0lTSU9OICsgWzI4LCA0MV0sXHJcbiAgICAgICAgLy8gaS5lLiB0aGVyZSB3aWxsIGJlIGEgbWluaW11bSBvZiAyOCBndWFyZCBkaWdpdHMgcmV0YWluZWQuXHJcbiAgICAgICAgayA9IG1hdGhjZWlsKFBPV19QUkVDSVNJT04gLyBMT0dfQkFTRSArIDIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobklzQmlnKSB7XHJcbiAgICAgICAgaGFsZiA9IG5ldyBCaWdOdW1iZXIoMC41KTtcclxuICAgICAgICBpZiAobklzTmVnKSBuLnMgPSAxO1xyXG4gICAgICAgIG5Jc09kZCA9IGlzT2RkKG4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGkgPSBNYXRoLmFicygrdmFsdWVPZihuKSk7XHJcbiAgICAgICAgbklzT2RkID0gaSAlIDI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAvLyBQZXJmb3JtcyA1NCBsb29wIGl0ZXJhdGlvbnMgZm9yIG4gb2YgOTAwNzE5OTI1NDc0MDk5MS5cclxuICAgICAgZm9yICg7IDspIHtcclxuXHJcbiAgICAgICAgaWYgKG5Jc09kZCkge1xyXG4gICAgICAgICAgeSA9IHkudGltZXMoeCk7XHJcbiAgICAgICAgICBpZiAoIXkuYykgYnJlYWs7XHJcblxyXG4gICAgICAgICAgaWYgKGspIHtcclxuICAgICAgICAgICAgaWYgKHkuYy5sZW5ndGggPiBrKSB5LmMubGVuZ3RoID0gaztcclxuICAgICAgICAgIH0gZWxzZSBpZiAoaXNNb2RFeHApIHtcclxuICAgICAgICAgICAgeSA9IHkubW9kKG0pOyAgICAvL3kgPSB5Lm1pbnVzKGRpdih5LCBtLCAwLCBNT0RVTE9fTU9ERSkudGltZXMobSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGkpIHtcclxuICAgICAgICAgIGkgPSBtYXRoZmxvb3IoaSAvIDIpO1xyXG4gICAgICAgICAgaWYgKGkgPT09IDApIGJyZWFrO1xyXG4gICAgICAgICAgbklzT2RkID0gaSAlIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG4gPSBuLnRpbWVzKGhhbGYpO1xyXG4gICAgICAgICAgcm91bmQobiwgbi5lICsgMSwgMSk7XHJcblxyXG4gICAgICAgICAgaWYgKG4uZSA+IDE0KSB7XHJcbiAgICAgICAgICAgIG5Jc09kZCA9IGlzT2RkKG4pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaSA9ICt2YWx1ZU9mKG4pO1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkgYnJlYWs7XHJcbiAgICAgICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeCA9IHgudGltZXMoeCk7XHJcblxyXG4gICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICBpZiAoeC5jICYmIHguYy5sZW5ndGggPiBrKSB4LmMubGVuZ3RoID0gaztcclxuICAgICAgICB9IGVsc2UgaWYgKGlzTW9kRXhwKSB7XHJcbiAgICAgICAgICB4ID0geC5tb2QobSk7ICAgIC8veCA9IHgubWludXMoZGl2KHgsIG0sIDAsIE1PRFVMT19NT0RFKS50aW1lcyhtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaXNNb2RFeHApIHJldHVybiB5O1xyXG4gICAgICBpZiAobklzTmVnKSB5ID0gT05FLmRpdih5KTtcclxuXHJcbiAgICAgIHJldHVybiBtID8geS5tb2QobSkgOiBrID8gcm91bmQoeSwgUE9XX1BSRUNJU0lPTiwgUk9VTkRJTkdfTU9ERSwgbW9yZSkgOiB5O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gYW4gaW50ZWdlclxyXG4gICAgICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSwgb3IgUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3JtfSdcclxuICAgICAqL1xyXG4gICAgUC5pbnRlZ2VyVmFsdWUgPSBmdW5jdGlvbiAocm0pIHtcclxuICAgICAgdmFyIG4gPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICBpZiAocm0gPT0gbnVsbCkgcm0gPSBST1VORElOR19NT0RFO1xyXG4gICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuICAgICAgcmV0dXJuIHJvdW5kKG4sIG4uZSArIDEsIHJtKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZXF1YWwgdG8gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNFcXVhbFRvID0gUC5lcSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpID09PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhIGZpbml0ZSBudW1iZXIsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNGaW5pdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiAhIXRoaXMuYztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzR3JlYXRlclRoYW4gPSBQLmd0ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkgPiAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYiksIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNHcmVhdGVyVGhhbk9yRXF1YWxUbyA9IFAuZ3RlID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIChiID0gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSkgPT09IDEgfHwgYiA9PT0gMDtcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGFuIGludGVnZXIsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNJbnRlZ2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmMgJiYgYml0Rmxvb3IodGhpcy5lIC8gTE9HX0JBU0UpID4gdGhpcy5jLmxlbmd0aCAtIDI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0xlc3NUaGFuID0gUC5sdCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpIDwgMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzTGVzc1RoYW5PckVxdWFsVG8gPSBQLmx0ZSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiAoYiA9IGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkpID09PSAtMSB8fCBiID09PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBOYU4sIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNOYU4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiAhdGhpcy5zO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBuZWdhdGl2ZSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc05lZ2F0aXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zIDwgMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgcG9zaXRpdmUsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNQb3NpdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucyA+IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIDAgb3IgLTAsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNaZXJvID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmMgJiYgdGhpcy5jWzBdID09IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gLSAwID0gblxyXG4gICAgICogIG4gLSBOID0gTlxyXG4gICAgICogIG4gLSBJID0gLUlcclxuICAgICAqICAwIC0gbiA9IC1uXHJcbiAgICAgKiAgMCAtIDAgPSAwXHJcbiAgICAgKiAgMCAtIE4gPSBOXHJcbiAgICAgKiAgMCAtIEkgPSAtSVxyXG4gICAgICogIE4gLSBuID0gTlxyXG4gICAgICogIE4gLSAwID0gTlxyXG4gICAgICogIE4gLSBOID0gTlxyXG4gICAgICogIE4gLSBJID0gTlxyXG4gICAgICogIEkgLSBuID0gSVxyXG4gICAgICogIEkgLSAwID0gSVxyXG4gICAgICogIEkgLSBOID0gTlxyXG4gICAgICogIEkgLSBJID0gTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG1pbnVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICovXHJcbiAgICBQLm1pbnVzID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIGksIGosIHQsIHhMVHksXHJcbiAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgYSA9IHgucztcclxuXHJcbiAgICAgIHkgPSBuZXcgQmlnTnVtYmVyKHksIGIpO1xyXG4gICAgICBiID0geS5zO1xyXG5cclxuICAgICAgLy8gRWl0aGVyIE5hTj9cclxuICAgICAgaWYgKCFhIHx8ICFiKSByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgcmV0dXJuIHgucGx1cyh5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeWUgPSB5LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgIGlmICgheGUgfHwgIXllKSB7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciBJbmZpbml0eT9cclxuICAgICAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIHhjID8gKHkucyA9IC1iLCB5KSA6IG5ldyBCaWdOdW1iZXIoeWMgPyB4IDogTmFOKTtcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICAgICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4geSBpZiB5IGlzIG5vbi16ZXJvLCB4IGlmIHggaXMgbm9uLXplcm8sIG9yIHplcm8gaWYgYm90aCBhcmUgemVyby5cclxuICAgICAgICAgIHJldHVybiB5Y1swXSA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnTnVtYmVyKHhjWzBdID8geCA6XHJcblxyXG4gICAgICAgICAgIC8vIElFRUUgNzU0ICgyMDA4KSA2LjM6IG4gLSBuID0gLTAgd2hlbiByb3VuZGluZyB0byAtSW5maW5pdHlcclxuICAgICAgICAgICBST1VORElOR19NT0RFID09IDMgPyAtMCA6IDApO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgeGUgPSBiaXRGbG9vcih4ZSk7XHJcbiAgICAgIHllID0gYml0Rmxvb3IoeWUpO1xyXG4gICAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggaXMgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgIGlmIChhID0geGUgLSB5ZSkge1xyXG5cclxuICAgICAgICBpZiAoeExUeSA9IGEgPCAwKSB7XHJcbiAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuXHJcbiAgICAgICAgZm9yIChiID0gYTsgYi0tOyB0LnB1c2goMCkpO1xyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyBFeHBvbmVudHMgZXF1YWwuIENoZWNrIGRpZ2l0IGJ5IGRpZ2l0LlxyXG4gICAgICAgIGogPSAoeExUeSA9IChhID0geGMubGVuZ3RoKSA8IChiID0geWMubGVuZ3RoKSkgPyBhIDogYjtcclxuXHJcbiAgICAgICAgZm9yIChhID0gYiA9IDA7IGIgPCBqOyBiKyspIHtcclxuXHJcbiAgICAgICAgICBpZiAoeGNbYl0gIT0geWNbYl0pIHtcclxuICAgICAgICAgICAgeExUeSA9IHhjW2JdIDwgeWNbYl07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8geCA8IHk/IFBvaW50IHhjIHRvIHRoZSBhcnJheSBvZiB0aGUgYmlnZ2VyIG51bWJlci5cclxuICAgICAgaWYgKHhMVHkpIHQgPSB4YywgeGMgPSB5YywgeWMgPSB0LCB5LnMgPSAteS5zO1xyXG5cclxuICAgICAgYiA9IChqID0geWMubGVuZ3RoKSAtIChpID0geGMubGVuZ3RoKTtcclxuXHJcbiAgICAgIC8vIEFwcGVuZCB6ZXJvcyB0byB4YyBpZiBzaG9ydGVyLlxyXG4gICAgICAvLyBObyBuZWVkIHRvIGFkZCB6ZXJvcyB0byB5YyBpZiBzaG9ydGVyIGFzIHN1YnRyYWN0IG9ubHkgbmVlZHMgdG8gc3RhcnQgYXQgeWMubGVuZ3RoLlxyXG4gICAgICBpZiAoYiA+IDApIGZvciAoOyBiLS07IHhjW2krK10gPSAwKTtcclxuICAgICAgYiA9IEJBU0UgLSAxO1xyXG5cclxuICAgICAgLy8gU3VidHJhY3QgeWMgZnJvbSB4Yy5cclxuICAgICAgZm9yICg7IGogPiBhOykge1xyXG5cclxuICAgICAgICBpZiAoeGNbLS1qXSA8IHljW2pdKSB7XHJcbiAgICAgICAgICBmb3IgKGkgPSBqOyBpICYmICF4Y1stLWldOyB4Y1tpXSA9IGIpO1xyXG4gICAgICAgICAgLS14Y1tpXTtcclxuICAgICAgICAgIHhjW2pdICs9IEJBU0U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB4Y1tqXSAtPSB5Y1tqXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgemVyb3MgYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgZm9yICg7IHhjWzBdID09IDA7IHhjLnNwbGljZSgwLCAxKSwgLS15ZSk7XHJcblxyXG4gICAgICAvLyBaZXJvP1xyXG4gICAgICBpZiAoIXhjWzBdKSB7XHJcblxyXG4gICAgICAgIC8vIEZvbGxvd2luZyBJRUVFIDc1NCAoMjAwOCkgNi4zLFxyXG4gICAgICAgIC8vIG4gLSBuID0gKzAgIGJ1dCAgbiAtIG4gPSAtMCAgd2hlbiByb3VuZGluZyB0b3dhcmRzIC1JbmZpbml0eS5cclxuICAgICAgICB5LnMgPSBST1VORElOR19NT0RFID09IDMgPyAtMSA6IDE7XHJcbiAgICAgICAgeS5jID0gW3kuZSA9IDBdO1xyXG4gICAgICAgIHJldHVybiB5O1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBObyBuZWVkIHRvIGNoZWNrIGZvciBJbmZpbml0eSBhcyAreCAtICt5ICE9IEluZmluaXR5ICYmIC14IC0gLXkgIT0gSW5maW5pdHlcclxuICAgICAgLy8gZm9yIGZpbml0ZSB4IGFuZCB5LlxyXG4gICAgICByZXR1cm4gbm9ybWFsaXNlKHksIHhjLCB5ZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogICBuICUgMCA9ICBOXHJcbiAgICAgKiAgIG4gJSBOID0gIE5cclxuICAgICAqICAgbiAlIEkgPSAgblxyXG4gICAgICogICAwICUgbiA9ICAwXHJcbiAgICAgKiAgLTAgJSBuID0gLTBcclxuICAgICAqICAgMCAlIDAgPSAgTlxyXG4gICAgICogICAwICUgTiA9ICBOXHJcbiAgICAgKiAgIDAgJSBJID0gIDBcclxuICAgICAqICAgTiAlIG4gPSAgTlxyXG4gICAgICogICBOICUgMCA9ICBOXHJcbiAgICAgKiAgIE4gJSBOID0gIE5cclxuICAgICAqICAgTiAlIEkgPSAgTlxyXG4gICAgICogICBJICUgbiA9ICBOXHJcbiAgICAgKiAgIEkgJSAwID0gIE5cclxuICAgICAqICAgSSAlIE4gPSAgTlxyXG4gICAgICogICBJICUgSSA9ICBOXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbW9kdWxvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLiBUaGUgcmVzdWx0IGRlcGVuZHMgb24gdGhlIHZhbHVlIG9mIE1PRFVMT19NT0RFLlxyXG4gICAgICovXHJcbiAgICBQLm1vZHVsbyA9IFAubW9kID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIHEsIHMsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuXHJcbiAgICAgIC8vIFJldHVybiBOYU4gaWYgeCBpcyBJbmZpbml0eSBvciBOYU4sIG9yIHkgaXMgTmFOIG9yIHplcm8uXHJcbiAgICAgIGlmICgheC5jIHx8ICF5LnMgfHwgeS5jICYmICF5LmNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihOYU4pO1xyXG5cclxuICAgICAgLy8gUmV0dXJuIHggaWYgeSBpcyBJbmZpbml0eSBvciB4IGlzIHplcm8uXHJcbiAgICAgIH0gZWxzZSBpZiAoIXkuYyB8fCB4LmMgJiYgIXguY1swXSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKHgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoTU9EVUxPX01PREUgPT0gOSkge1xyXG5cclxuICAgICAgICAvLyBFdWNsaWRpYW4gZGl2aXNpb246IHEgPSBzaWduKHkpICogZmxvb3IoeCAvIGFicyh5KSlcclxuICAgICAgICAvLyByID0geCAtIHF5ICAgIHdoZXJlICAwIDw9IHIgPCBhYnMoeSlcclxuICAgICAgICBzID0geS5zO1xyXG4gICAgICAgIHkucyA9IDE7XHJcbiAgICAgICAgcSA9IGRpdih4LCB5LCAwLCAzKTtcclxuICAgICAgICB5LnMgPSBzO1xyXG4gICAgICAgIHEucyAqPSBzO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHEgPSBkaXYoeCwgeSwgMCwgTU9EVUxPX01PREUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB5ID0geC5taW51cyhxLnRpbWVzKHkpKTtcclxuXHJcbiAgICAgIC8vIFRvIG1hdGNoIEphdmFTY3JpcHQgJSwgZW5zdXJlIHNpZ24gb2YgemVybyBpcyBzaWduIG9mIGRpdmlkZW5kLlxyXG4gICAgICBpZiAoIXkuY1swXSAmJiBNT0RVTE9fTU9ERSA9PSAxKSB5LnMgPSB4LnM7XHJcblxyXG4gICAgICByZXR1cm4geTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiAgbiAqIDAgPSAwXHJcbiAgICAgKiAgbiAqIE4gPSBOXHJcbiAgICAgKiAgbiAqIEkgPSBJXHJcbiAgICAgKiAgMCAqIG4gPSAwXHJcbiAgICAgKiAgMCAqIDAgPSAwXHJcbiAgICAgKiAgMCAqIE4gPSBOXHJcbiAgICAgKiAgMCAqIEkgPSBOXHJcbiAgICAgKiAgTiAqIG4gPSBOXHJcbiAgICAgKiAgTiAqIDAgPSBOXHJcbiAgICAgKiAgTiAqIE4gPSBOXHJcbiAgICAgKiAgTiAqIEkgPSBOXHJcbiAgICAgKiAgSSAqIG4gPSBJXHJcbiAgICAgKiAgSSAqIDAgPSBOXHJcbiAgICAgKiAgSSAqIE4gPSBOXHJcbiAgICAgKiAgSSAqIEkgPSBJXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbXVsdGlwbGllZCBieSB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5tdWx0aXBsaWVkQnkgPSBQLnRpbWVzID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgdmFyIGMsIGUsIGksIGosIGssIG0sIHhjTCwgeGxvLCB4aGksIHljTCwgeWxvLCB5aGksIHpjLFxyXG4gICAgICAgIGJhc2UsIHNxcnRCYXNlLFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIHhjID0geC5jLFxyXG4gICAgICAgIHljID0gKHkgPSBuZXcgQmlnTnVtYmVyKHksIGIpKS5jO1xyXG5cclxuICAgICAgLy8gRWl0aGVyIE5hTiwgwrFJbmZpbml0eSBvciDCsTA/XHJcbiAgICAgIGlmICgheGMgfHwgIXljIHx8ICF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiBlaXRoZXIgaXMgTmFOLCBvciBvbmUgaXMgMCBhbmQgdGhlIG90aGVyIGlzIEluZmluaXR5LlxyXG4gICAgICAgIGlmICgheC5zIHx8ICF5LnMgfHwgeGMgJiYgIXhjWzBdICYmICF5YyB8fCB5YyAmJiAheWNbMF0gJiYgIXhjKSB7XHJcbiAgICAgICAgICB5LmMgPSB5LmUgPSB5LnMgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB5LnMgKj0geC5zO1xyXG5cclxuICAgICAgICAgIC8vIFJldHVybiDCsUluZmluaXR5IGlmIGVpdGhlciBpcyDCsUluZmluaXR5LlxyXG4gICAgICAgICAgaWYgKCF4YyB8fCAheWMpIHtcclxuICAgICAgICAgICAgeS5jID0geS5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4gwrEwIGlmIGVpdGhlciBpcyDCsTAuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB5LmMgPSBbMF07XHJcbiAgICAgICAgICAgIHkuZSA9IDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZSA9IGJpdEZsb29yKHguZSAvIExPR19CQVNFKSArIGJpdEZsb29yKHkuZSAvIExPR19CQVNFKTtcclxuICAgICAgeS5zICo9IHgucztcclxuICAgICAgeGNMID0geGMubGVuZ3RoO1xyXG4gICAgICB5Y0wgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBFbnN1cmUgeGMgcG9pbnRzIHRvIGxvbmdlciBhcnJheSBhbmQgeGNMIHRvIGl0cyBsZW5ndGguXHJcbiAgICAgIGlmICh4Y0wgPCB5Y0wpIHpjID0geGMsIHhjID0geWMsIHljID0gemMsIGkgPSB4Y0wsIHhjTCA9IHljTCwgeWNMID0gaTtcclxuXHJcbiAgICAgIC8vIEluaXRpYWxpc2UgdGhlIHJlc3VsdCBhcnJheSB3aXRoIHplcm9zLlxyXG4gICAgICBmb3IgKGkgPSB4Y0wgKyB5Y0wsIHpjID0gW107IGktLTsgemMucHVzaCgwKSk7XHJcblxyXG4gICAgICBiYXNlID0gQkFTRTtcclxuICAgICAgc3FydEJhc2UgPSBTUVJUX0JBU0U7XHJcblxyXG4gICAgICBmb3IgKGkgPSB5Y0w7IC0taSA+PSAwOykge1xyXG4gICAgICAgIGMgPSAwO1xyXG4gICAgICAgIHlsbyA9IHljW2ldICUgc3FydEJhc2U7XHJcbiAgICAgICAgeWhpID0geWNbaV0gLyBzcXJ0QmFzZSB8IDA7XHJcblxyXG4gICAgICAgIGZvciAoayA9IHhjTCwgaiA9IGkgKyBrOyBqID4gaTspIHtcclxuICAgICAgICAgIHhsbyA9IHhjWy0ta10gJSBzcXJ0QmFzZTtcclxuICAgICAgICAgIHhoaSA9IHhjW2tdIC8gc3FydEJhc2UgfCAwO1xyXG4gICAgICAgICAgbSA9IHloaSAqIHhsbyArIHhoaSAqIHlsbztcclxuICAgICAgICAgIHhsbyA9IHlsbyAqIHhsbyArICgobSAlIHNxcnRCYXNlKSAqIHNxcnRCYXNlKSArIHpjW2pdICsgYztcclxuICAgICAgICAgIGMgPSAoeGxvIC8gYmFzZSB8IDApICsgKG0gLyBzcXJ0QmFzZSB8IDApICsgeWhpICogeGhpO1xyXG4gICAgICAgICAgemNbai0tXSA9IHhsbyAlIGJhc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB6Y1tqXSA9IGM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjKSB7XHJcbiAgICAgICAgKytlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHpjLnNwbGljZSgwLCAxKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5vcm1hbGlzZSh5LCB6YywgZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgbmVnYXRlZCxcclxuICAgICAqIGkuZS4gbXVsdGlwbGllZCBieSAtMS5cclxuICAgICAqL1xyXG4gICAgUC5uZWdhdGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgIHgucyA9IC14LnMgfHwgbnVsbDtcclxuICAgICAgcmV0dXJuIHg7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gKyAwID0gblxyXG4gICAgICogIG4gKyBOID0gTlxyXG4gICAgICogIG4gKyBJID0gSVxyXG4gICAgICogIDAgKyBuID0gblxyXG4gICAgICogIDAgKyAwID0gMFxyXG4gICAgICogIDAgKyBOID0gTlxyXG4gICAgICogIDAgKyBJID0gSVxyXG4gICAgICogIE4gKyBuID0gTlxyXG4gICAgICogIE4gKyAwID0gTlxyXG4gICAgICogIE4gKyBOID0gTlxyXG4gICAgICogIE4gKyBJID0gTlxyXG4gICAgICogIEkgKyBuID0gSVxyXG4gICAgICogIEkgKyAwID0gSVxyXG4gICAgICogIEkgKyBOID0gTlxyXG4gICAgICogIEkgKyBJID0gSVxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHBsdXMgdGhlIHZhbHVlIG9mXHJcbiAgICAgKiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAucGx1cyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciB0LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuICAgICAgYiA9IHkucztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICAgIGlmICghYSB8fCAhYikgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgIGlmIChhICE9IGIpIHtcclxuICAgICAgICB5LnMgPSAtYjtcclxuICAgICAgICByZXR1cm4geC5taW51cyh5KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHhlID0geC5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeWUgPSB5LmUgLyBMT0dfQkFTRSxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9IHkuYztcclxuXHJcbiAgICAgIGlmICgheGUgfHwgIXllKSB7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiDCsUluZmluaXR5IGlmIGVpdGhlciDCsUluZmluaXR5LlxyXG4gICAgICAgIGlmICgheGMgfHwgIXljKSByZXR1cm4gbmV3IEJpZ051bWJlcihhIC8gMCk7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIC8vIFJldHVybiB5IGlmIHkgaXMgbm9uLXplcm8sIHggaWYgeCBpcyBub24temVybywgb3IgemVybyBpZiBib3RoIGFyZSB6ZXJvLlxyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSByZXR1cm4geWNbMF0gPyB5IDogbmV3IEJpZ051bWJlcih4Y1swXSA/IHggOiBhICogMCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHhlID0gYml0Rmxvb3IoeGUpO1xyXG4gICAgICB5ZSA9IGJpdEZsb29yKHllKTtcclxuICAgICAgeGMgPSB4Yy5zbGljZSgpO1xyXG5cclxuICAgICAgLy8gUHJlcGVuZCB6ZXJvcyB0byBlcXVhbGlzZSBleHBvbmVudHMuIEZhc3RlciB0byB1c2UgcmV2ZXJzZSB0aGVuIGRvIHVuc2hpZnRzLlxyXG4gICAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuICAgICAgICBpZiAoYSA+IDApIHtcclxuICAgICAgICAgIHllID0geGU7XHJcbiAgICAgICAgICB0ID0geWM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGEgPSAtYTtcclxuICAgICAgICAgIHQgPSB4YztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIGZvciAoOyBhLS07IHQucHVzaCgwKSk7XHJcbiAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGEgPSB4Yy5sZW5ndGg7XHJcbiAgICAgIGIgPSB5Yy5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBQb2ludCB4YyB0byB0aGUgbG9uZ2VyIGFycmF5LCBhbmQgYiB0byB0aGUgc2hvcnRlciBsZW5ndGguXHJcbiAgICAgIGlmIChhIC0gYiA8IDApIHQgPSB5YywgeWMgPSB4YywgeGMgPSB0LCBiID0gYTtcclxuXHJcbiAgICAgIC8vIE9ubHkgc3RhcnQgYWRkaW5nIGF0IHljLmxlbmd0aCAtIDEgYXMgdGhlIGZ1cnRoZXIgZGlnaXRzIG9mIHhjIGNhbiBiZSBpZ25vcmVkLlxyXG4gICAgICBmb3IgKGEgPSAwOyBiOykge1xyXG4gICAgICAgIGEgPSAoeGNbLS1iXSA9IHhjW2JdICsgeWNbYl0gKyBhKSAvIEJBU0UgfCAwO1xyXG4gICAgICAgIHhjW2JdID0gQkFTRSA9PT0geGNbYl0gPyAwIDogeGNbYl0gJSBCQVNFO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYSkge1xyXG4gICAgICAgIHhjID0gW2FdLmNvbmNhdCh4Yyk7XHJcbiAgICAgICAgKyt5ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgemVybywgYXMgK3ggKyAreSAhPSAwICYmIC14ICsgLXkgIT0gMFxyXG4gICAgICAvLyB5ZSA9IE1BWF9FWFAgKyAxIHBvc3NpYmxlXHJcbiAgICAgIHJldHVybiBub3JtYWxpc2UoeSwgeGMsIHllKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBJZiBzZCBpcyB1bmRlZmluZWQgb3IgbnVsbCBvciB0cnVlIG9yIGZhbHNlLCByZXR1cm4gdGhlIG51bWJlciBvZiBzaWduaWZpY2FudCBkaWdpdHMgb2ZcclxuICAgICAqIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciwgb3IgbnVsbCBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgwrFJbmZpbml0eSBvciBOYU4uXHJcbiAgICAgKiBJZiBzZCBpcyB0cnVlIGluY2x1ZGUgaW50ZWdlci1wYXJ0IHRyYWlsaW5nIHplcm9zIGluIHRoZSBjb3VudC5cclxuICAgICAqXHJcbiAgICAgKiBPdGhlcndpc2UsIGlmIHNkIGlzIGEgbnVtYmVyLCByZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzXHJcbiAgICAgKiBCaWdOdW1iZXIgcm91bmRlZCB0byBhIG1heGltdW0gb2Ygc2Qgc2lnbmlmaWNhbnQgZGlnaXRzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yXHJcbiAgICAgKiBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogc2Qge251bWJlcnxib29sZWFufSBudW1iZXI6IHNpZ25pZmljYW50IGRpZ2l0czogaW50ZWdlciwgMSB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICBib29sZWFuOiB3aGV0aGVyIHRvIGNvdW50IGludGVnZXItcGFydCB0cmFpbGluZyB6ZXJvczogdHJ1ZSBvciBmYWxzZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3NkfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC5wcmVjaXNpb24gPSBQLnNkID0gZnVuY3Rpb24gKHNkLCBybSkge1xyXG4gICAgICB2YXIgYywgbiwgdixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChzZCAhPSBudWxsICYmIHNkICE9PSAhIXNkKSB7XHJcbiAgICAgICAgaW50Q2hlY2soc2QsIDEsIE1BWCk7XHJcbiAgICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgICBlbHNlIGludENoZWNrKHJtLCAwLCA4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvdW5kKG5ldyBCaWdOdW1iZXIoeCksIHNkLCBybSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghKGMgPSB4LmMpKSByZXR1cm4gbnVsbDtcclxuICAgICAgdiA9IGMubGVuZ3RoIC0gMTtcclxuICAgICAgbiA9IHYgKiBMT0dfQkFTRSArIDE7XHJcblxyXG4gICAgICBpZiAodiA9IGNbdl0pIHtcclxuXHJcbiAgICAgICAgLy8gU3VidHJhY3QgdGhlIG51bWJlciBvZiB0cmFpbGluZyB6ZXJvcyBvZiB0aGUgbGFzdCBlbGVtZW50LlxyXG4gICAgICAgIGZvciAoOyB2ICUgMTAgPT0gMDsgdiAvPSAxMCwgbi0tKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHRoZSBmaXJzdCBlbGVtZW50LlxyXG4gICAgICAgIGZvciAodiA9IGNbMF07IHYgPj0gMTA7IHYgLz0gMTAsIG4rKyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzZCAmJiB4LmUgKyAxID4gbikgbiA9IHguZSArIDE7XHJcblxyXG4gICAgICByZXR1cm4gbjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBzaGlmdGVkIGJ5IGsgcGxhY2VzXHJcbiAgICAgKiAocG93ZXJzIG9mIDEwKS4gU2hpZnQgdG8gdGhlIHJpZ2h0IGlmIG4gPiAwLCBhbmQgdG8gdGhlIGxlZnQgaWYgbiA8IDAuXHJcbiAgICAgKlxyXG4gICAgICogayB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1NBRkVfSU5URUdFUiB0byBNQVhfU0FGRV9JTlRFR0VSIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2t9J1xyXG4gICAgICovXHJcbiAgICBQLnNoaWZ0ZWRCeSA9IGZ1bmN0aW9uIChrKSB7XHJcbiAgICAgIGludENoZWNrKGssIC1NQVhfU0FGRV9JTlRFR0VSLCBNQVhfU0FGRV9JTlRFR0VSKTtcclxuICAgICAgcmV0dXJuIHRoaXMudGltZXMoJzFlJyArIGspO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBzcXJ0KC1uKSA9ICBOXHJcbiAgICAgKiAgc3FydChOKSA9ICBOXHJcbiAgICAgKiAgc3FydCgtSSkgPSAgTlxyXG4gICAgICogIHNxcnQoSSkgPSAgSVxyXG4gICAgICogIHNxcnQoMCkgPSAgMFxyXG4gICAgICogIHNxcnQoLTApID0gLTBcclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBzcXVhcmUgcm9vdCBvZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsXHJcbiAgICAgKiByb3VuZGVkIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5zcXVhcmVSb290ID0gUC5zcXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgbSwgbiwgciwgcmVwLCB0LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGMgPSB4LmMsXHJcbiAgICAgICAgcyA9IHgucyxcclxuICAgICAgICBlID0geC5lLFxyXG4gICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMgKyA0LFxyXG4gICAgICAgIGhhbGYgPSBuZXcgQmlnTnVtYmVyKCcwLjUnKTtcclxuXHJcbiAgICAgIC8vIE5lZ2F0aXZlL05hTi9JbmZpbml0eS96ZXJvP1xyXG4gICAgICBpZiAocyAhPT0gMSB8fCAhYyB8fCAhY1swXSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKCFzIHx8IHMgPCAwICYmICghYyB8fCBjWzBdKSA/IE5hTiA6IGMgPyB4IDogMSAvIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbml0aWFsIGVzdGltYXRlLlxyXG4gICAgICBzID0gTWF0aC5zcXJ0KCt2YWx1ZU9mKHgpKTtcclxuXHJcbiAgICAgIC8vIE1hdGguc3FydCB1bmRlcmZsb3cvb3ZlcmZsb3c/XHJcbiAgICAgIC8vIFBhc3MgeCB0byBNYXRoLnNxcnQgYXMgaW50ZWdlciwgdGhlbiBhZGp1c3QgdGhlIGV4cG9uZW50IG9mIHRoZSByZXN1bHQuXHJcbiAgICAgIGlmIChzID09IDAgfHwgcyA9PSAxIC8gMCkge1xyXG4gICAgICAgIG4gPSBjb2VmZlRvU3RyaW5nKGMpO1xyXG4gICAgICAgIGlmICgobi5sZW5ndGggKyBlKSAlIDIgPT0gMCkgbiArPSAnMCc7XHJcbiAgICAgICAgcyA9IE1hdGguc3FydCgrbik7XHJcbiAgICAgICAgZSA9IGJpdEZsb29yKChlICsgMSkgLyAyKSAtIChlIDwgMCB8fCBlICUgMik7XHJcblxyXG4gICAgICAgIGlmIChzID09IDEgLyAwKSB7XHJcbiAgICAgICAgICBuID0gJzFlJyArIGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG4gPSBzLnRvRXhwb25lbnRpYWwoKTtcclxuICAgICAgICAgIG4gPSBuLnNsaWNlKDAsIG4uaW5kZXhPZignZScpICsgMSkgKyBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgciA9IG5ldyBCaWdOdW1iZXIobik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgciA9IG5ldyBCaWdOdW1iZXIocyArICcnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2hlY2sgZm9yIHplcm8uXHJcbiAgICAgIC8vIHIgY291bGQgYmUgemVybyBpZiBNSU5fRVhQIGlzIGNoYW5nZWQgYWZ0ZXIgdGhlIHRoaXMgdmFsdWUgd2FzIGNyZWF0ZWQuXHJcbiAgICAgIC8vIFRoaXMgd291bGQgY2F1c2UgYSBkaXZpc2lvbiBieSB6ZXJvICh4L3QpIGFuZCBoZW5jZSBJbmZpbml0eSBiZWxvdywgd2hpY2ggd291bGQgY2F1c2VcclxuICAgICAgLy8gY29lZmZUb1N0cmluZyB0byB0aHJvdy5cclxuICAgICAgaWYgKHIuY1swXSkge1xyXG4gICAgICAgIGUgPSByLmU7XHJcbiAgICAgICAgcyA9IGUgKyBkcDtcclxuICAgICAgICBpZiAocyA8IDMpIHMgPSAwO1xyXG5cclxuICAgICAgICAvLyBOZXd0b24tUmFwaHNvbiBpdGVyYXRpb24uXHJcbiAgICAgICAgZm9yICg7IDspIHtcclxuICAgICAgICAgIHQgPSByO1xyXG4gICAgICAgICAgciA9IGhhbGYudGltZXModC5wbHVzKGRpdih4LCB0LCBkcCwgMSkpKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29lZmZUb1N0cmluZyh0LmMpLnNsaWNlKDAsIHMpID09PSAobiA9IGNvZWZmVG9TdHJpbmcoci5jKSkuc2xpY2UoMCwgcykpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSBleHBvbmVudCBvZiByIG1heSBoZXJlIGJlIG9uZSBsZXNzIHRoYW4gdGhlIGZpbmFsIHJlc3VsdCBleHBvbmVudCxcclxuICAgICAgICAgICAgLy8gZS5nIDAuMDAwOTk5OSAoZS00KSAtLT4gMC4wMDEgKGUtMyksIHNvIGFkanVzdCBzIHNvIHRoZSByb3VuZGluZyBkaWdpdHNcclxuICAgICAgICAgICAgLy8gYXJlIGluZGV4ZWQgY29ycmVjdGx5LlxyXG4gICAgICAgICAgICBpZiAoci5lIDwgZSkgLS1zO1xyXG4gICAgICAgICAgICBuID0gbi5zbGljZShzIC0gMywgcyArIDEpO1xyXG5cclxuICAgICAgICAgICAgLy8gVGhlIDR0aCByb3VuZGluZyBkaWdpdCBtYXkgYmUgaW4gZXJyb3IgYnkgLTEgc28gaWYgdGhlIDQgcm91bmRpbmcgZGlnaXRzXHJcbiAgICAgICAgICAgIC8vIGFyZSA5OTk5IG9yIDQ5OTkgKGkuZS4gYXBwcm9hY2hpbmcgYSByb3VuZGluZyBib3VuZGFyeSkgY29udGludWUgdGhlXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdGlvbi5cclxuICAgICAgICAgICAgaWYgKG4gPT0gJzk5OTknIHx8ICFyZXAgJiYgbiA9PSAnNDk5OScpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gT24gdGhlIGZpcnN0IGl0ZXJhdGlvbiBvbmx5LCBjaGVjayB0byBzZWUgaWYgcm91bmRpbmcgdXAgZ2l2ZXMgdGhlXHJcbiAgICAgICAgICAgICAgLy8gZXhhY3QgcmVzdWx0IGFzIHRoZSBuaW5lcyBtYXkgaW5maW5pdGVseSByZXBlYXQuXHJcbiAgICAgICAgICAgICAgaWYgKCFyZXApIHtcclxuICAgICAgICAgICAgICAgIHJvdW5kKHQsIHQuZSArIERFQ0lNQUxfUExBQ0VTICsgMiwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHQudGltZXModCkuZXEoeCkpIHtcclxuICAgICAgICAgICAgICAgICAgciA9IHQ7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgZHAgKz0gNDtcclxuICAgICAgICAgICAgICBzICs9IDQ7XHJcbiAgICAgICAgICAgICAgcmVwID0gMTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgcm91bmRpbmcgZGlnaXRzIGFyZSBudWxsLCAwezAsNH0gb3IgNTB7MCwzfSwgY2hlY2sgZm9yIGV4YWN0XHJcbiAgICAgICAgICAgICAgLy8gcmVzdWx0LiBJZiBub3QsIHRoZW4gdGhlcmUgYXJlIGZ1cnRoZXIgZGlnaXRzIGFuZCBtIHdpbGwgYmUgdHJ1dGh5LlxyXG4gICAgICAgICAgICAgIGlmICghK24gfHwgIStuLnNsaWNlKDEpICYmIG4uY2hhckF0KDApID09ICc1Jykge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRydW5jYXRlIHRvIHRoZSBmaXJzdCByb3VuZGluZyBkaWdpdC5cclxuICAgICAgICAgICAgICAgIHJvdW5kKHIsIHIuZSArIERFQ0lNQUxfUExBQ0VTICsgMiwgMSk7XHJcbiAgICAgICAgICAgICAgICBtID0gIXIudGltZXMocikuZXEoeCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJvdW5kKHIsIHIuZSArIERFQ0lNQUxfUExBQ0VTICsgMSwgUk9VTkRJTkdfTU9ERSwgbSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZXhwb25lbnRpYWwgbm90YXRpb24gYW5kXHJcbiAgICAgKiByb3VuZGVkIHVzaW5nIFJPVU5ESU5HX01PREUgdG8gZHAgZml4ZWQgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7ZHB8cm19J1xyXG4gICAgICovXHJcbiAgICBQLnRvRXhwb25lbnRpYWwgPSBmdW5jdGlvbiAoZHAsIHJtKSB7XHJcbiAgICAgIGlmIChkcCAhPSBudWxsKSB7XHJcbiAgICAgICAgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcbiAgICAgICAgZHArKztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCBybSwgMSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24gcm91bmRpbmdcclxuICAgICAqIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAqXHJcbiAgICAgKiBOb3RlOiBhcyB3aXRoIEphdmFTY3JpcHQncyBudW1iZXIgdHlwZSwgKC0wKS50b0ZpeGVkKDApIGlzICcwJyxcclxuICAgICAqIGJ1dCBlLmcuICgtMC4wMDAwMSkudG9GaXhlZCgwKSBpcyAnLTAnLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC50b0ZpeGVkID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGRwID0gZHAgKyB0aGlzLmUgKyAxO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmb3JtYXQodGhpcywgZHAsIHJtKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiByb3VuZGVkXHJcbiAgICAgKiB1c2luZyBybSBvciBST1VORElOR19NT0RFIHRvIGRwIGRlY2ltYWwgcGxhY2VzLCBhbmQgZm9ybWF0dGVkIGFjY29yZGluZyB0byB0aGUgcHJvcGVydGllc1xyXG4gICAgICogb2YgdGhlIGZvcm1hdCBvciBGT1JNQVQgb2JqZWN0IChzZWUgQmlnTnVtYmVyLnNldCkuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIGZvcm1hdHRpbmcgb2JqZWN0IG1heSBjb250YWluIHNvbWUgb3IgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIHNob3duIGJlbG93LlxyXG4gICAgICpcclxuICAgICAqIEZPUk1BVCA9IHtcclxuICAgICAqICAgcHJlZml4OiAnJyxcclxuICAgICAqICAgZ3JvdXBTaXplOiAzLFxyXG4gICAgICogICBzZWNvbmRhcnlHcm91cFNpemU6IDAsXHJcbiAgICAgKiAgIGdyb3VwU2VwYXJhdG9yOiAnLCcsXHJcbiAgICAgKiAgIGRlY2ltYWxTZXBhcmF0b3I6ICcuJyxcclxuICAgICAqICAgZnJhY3Rpb25Hcm91cFNpemU6IDAsXHJcbiAgICAgKiAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3I6ICdcXHhBMCcsICAgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgKiAgIHN1ZmZpeDogJydcclxuICAgICAqIH07XHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBEZWNpbWFsIHBsYWNlcy4gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICogW2Zvcm1hdF0ge29iamVjdH0gRm9ybWF0dGluZyBvcHRpb25zLiBTZWUgRk9STUFUIHBiamVjdCBhYm92ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCBub3QgYW4gb2JqZWN0OiB7Zm9ybWF0fSdcclxuICAgICAqL1xyXG4gICAgUC50b0Zvcm1hdCA9IGZ1bmN0aW9uIChkcCwgcm0sIGZvcm1hdCkge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgaWYgKGZvcm1hdCA9PSBudWxsKSB7XHJcbiAgICAgICAgaWYgKGRwICE9IG51bGwgJiYgcm0gJiYgdHlwZW9mIHJtID09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICBmb3JtYXQgPSBybTtcclxuICAgICAgICAgIHJtID0gbnVsbDtcclxuICAgICAgICB9IGVsc2UgaWYgKGRwICYmIHR5cGVvZiBkcCA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgZm9ybWF0ID0gZHA7XHJcbiAgICAgICAgICBkcCA9IHJtID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZm9ybWF0ID0gRk9STUFUO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZm9ybWF0ICE9ICdvYmplY3QnKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdBcmd1bWVudCBub3QgYW4gb2JqZWN0OiAnICsgZm9ybWF0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc3RyID0geC50b0ZpeGVkKGRwLCBybSk7XHJcblxyXG4gICAgICBpZiAoeC5jKSB7XHJcbiAgICAgICAgdmFyIGksXHJcbiAgICAgICAgICBhcnIgPSBzdHIuc3BsaXQoJy4nKSxcclxuICAgICAgICAgIGcxID0gK2Zvcm1hdC5ncm91cFNpemUsXHJcbiAgICAgICAgICBnMiA9ICtmb3JtYXQuc2Vjb25kYXJ5R3JvdXBTaXplLFxyXG4gICAgICAgICAgZ3JvdXBTZXBhcmF0b3IgPSBmb3JtYXQuZ3JvdXBTZXBhcmF0b3IgfHwgJycsXHJcbiAgICAgICAgICBpbnRQYXJ0ID0gYXJyWzBdLFxyXG4gICAgICAgICAgZnJhY3Rpb25QYXJ0ID0gYXJyWzFdLFxyXG4gICAgICAgICAgaXNOZWcgPSB4LnMgPCAwLFxyXG4gICAgICAgICAgaW50RGlnaXRzID0gaXNOZWcgPyBpbnRQYXJ0LnNsaWNlKDEpIDogaW50UGFydCxcclxuICAgICAgICAgIGxlbiA9IGludERpZ2l0cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmIChnMikgaSA9IGcxLCBnMSA9IGcyLCBnMiA9IGksIGxlbiAtPSBpO1xyXG5cclxuICAgICAgICBpZiAoZzEgPiAwICYmIGxlbiA+IDApIHtcclxuICAgICAgICAgIGkgPSBsZW4gJSBnMSB8fCBnMTtcclxuICAgICAgICAgIGludFBhcnQgPSBpbnREaWdpdHMuc3Vic3RyKDAsIGkpO1xyXG4gICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkgKz0gZzEpIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc3Vic3RyKGksIGcxKTtcclxuICAgICAgICAgIGlmIChnMiA+IDApIGludFBhcnQgKz0gZ3JvdXBTZXBhcmF0b3IgKyBpbnREaWdpdHMuc2xpY2UoaSk7XHJcbiAgICAgICAgICBpZiAoaXNOZWcpIGludFBhcnQgPSAnLScgKyBpbnRQYXJ0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RyID0gZnJhY3Rpb25QYXJ0XHJcbiAgICAgICAgID8gaW50UGFydCArIChmb3JtYXQuZGVjaW1hbFNlcGFyYXRvciB8fCAnJykgKyAoKGcyID0gK2Zvcm1hdC5mcmFjdGlvbkdyb3VwU2l6ZSlcclxuICAgICAgICAgID8gZnJhY3Rpb25QYXJ0LnJlcGxhY2UobmV3IFJlZ0V4cCgnXFxcXGR7JyArIGcyICsgJ31cXFxcQicsICdnJyksXHJcbiAgICAgICAgICAgJyQmJyArIChmb3JtYXQuZnJhY3Rpb25Hcm91cFNlcGFyYXRvciB8fCAnJykpXHJcbiAgICAgICAgICA6IGZyYWN0aW9uUGFydClcclxuICAgICAgICAgOiBpbnRQYXJ0O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKGZvcm1hdC5wcmVmaXggfHwgJycpICsgc3RyICsgKGZvcm1hdC5zdWZmaXggfHwgJycpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhbiBhcnJheSBvZiB0d28gQmlnTnVtYmVycyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGFzIGEgc2ltcGxlXHJcbiAgICAgKiBmcmFjdGlvbiB3aXRoIGFuIGludGVnZXIgbnVtZXJhdG9yIGFuZCBhbiBpbnRlZ2VyIGRlbm9taW5hdG9yLlxyXG4gICAgICogVGhlIGRlbm9taW5hdG9yIHdpbGwgYmUgYSBwb3NpdGl2ZSBub24temVybyB2YWx1ZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHNwZWNpZmllZFxyXG4gICAgICogbWF4aW11bSBkZW5vbWluYXRvci4gSWYgYSBtYXhpbXVtIGRlbm9taW5hdG9yIGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBkZW5vbWluYXRvciB3aWxsIGJlXHJcbiAgICAgKiB0aGUgbG93ZXN0IHZhbHVlIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIG51bWJlciBleGFjdGx5LlxyXG4gICAgICpcclxuICAgICAqIFttZF0ge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfSBJbnRlZ2VyID49IDEsIG9yIEluZmluaXR5LiBUaGUgbWF4aW11bSBkZW5vbWluYXRvci5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX0gOiB7bWR9J1xyXG4gICAgICovXHJcbiAgICBQLnRvRnJhY3Rpb24gPSBmdW5jdGlvbiAobWQpIHtcclxuICAgICAgdmFyIGQsIGQwLCBkMSwgZDIsIGUsIGV4cCwgbiwgbjAsIG4xLCBxLCByLCBzLFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIHhjID0geC5jO1xyXG5cclxuICAgICAgaWYgKG1kICE9IG51bGwpIHtcclxuICAgICAgICBuID0gbmV3IEJpZ051bWJlcihtZCk7XHJcblxyXG4gICAgICAgIC8vIFRocm93IGlmIG1kIGlzIGxlc3MgdGhhbiBvbmUgb3IgaXMgbm90IGFuIGludGVnZXIsIHVubGVzcyBpdCBpcyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoIW4uaXNJbnRlZ2VyKCkgJiYgKG4uYyB8fCBuLnMgIT09IDEpIHx8IG4ubHQoT05FKSkge1xyXG4gICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ0FyZ3VtZW50ICcgK1xyXG4gICAgICAgICAgICAgIChuLmlzSW50ZWdlcigpID8gJ291dCBvZiByYW5nZTogJyA6ICdub3QgYW4gaW50ZWdlcjogJykgKyB2YWx1ZU9mKG4pKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICgheGMpIHJldHVybiBuZXcgQmlnTnVtYmVyKHgpO1xyXG5cclxuICAgICAgZCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgbjEgPSBkMCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgZDEgPSBuMCA9IG5ldyBCaWdOdW1iZXIoT05FKTtcclxuICAgICAgcyA9IGNvZWZmVG9TdHJpbmcoeGMpO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIGluaXRpYWwgZGVub21pbmF0b3IuXHJcbiAgICAgIC8vIGQgaXMgYSBwb3dlciBvZiAxMCBhbmQgdGhlIG1pbmltdW0gbWF4IGRlbm9taW5hdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSB2YWx1ZSBleGFjdGx5LlxyXG4gICAgICBlID0gZC5lID0gcy5sZW5ndGggLSB4LmUgLSAxO1xyXG4gICAgICBkLmNbMF0gPSBQT1dTX1RFTlsoZXhwID0gZSAlIExPR19CQVNFKSA8IDAgPyBMT0dfQkFTRSArIGV4cCA6IGV4cF07XHJcbiAgICAgIG1kID0gIW1kIHx8IG4uY29tcGFyZWRUbyhkKSA+IDAgPyAoZSA+IDAgPyBkIDogbjEpIDogbjtcclxuXHJcbiAgICAgIGV4cCA9IE1BWF9FWFA7XHJcbiAgICAgIE1BWF9FWFAgPSAxIC8gMDtcclxuICAgICAgbiA9IG5ldyBCaWdOdW1iZXIocyk7XHJcblxyXG4gICAgICAvLyBuMCA9IGQxID0gMFxyXG4gICAgICBuMC5jWzBdID0gMDtcclxuXHJcbiAgICAgIGZvciAoOyA7KSAge1xyXG4gICAgICAgIHEgPSBkaXYobiwgZCwgMCwgMSk7XHJcbiAgICAgICAgZDIgPSBkMC5wbHVzKHEudGltZXMoZDEpKTtcclxuICAgICAgICBpZiAoZDIuY29tcGFyZWRUbyhtZCkgPT0gMSkgYnJlYWs7XHJcbiAgICAgICAgZDAgPSBkMTtcclxuICAgICAgICBkMSA9IGQyO1xyXG4gICAgICAgIG4xID0gbjAucGx1cyhxLnRpbWVzKGQyID0gbjEpKTtcclxuICAgICAgICBuMCA9IGQyO1xyXG4gICAgICAgIGQgPSBuLm1pbnVzKHEudGltZXMoZDIgPSBkKSk7XHJcbiAgICAgICAgbiA9IGQyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkMiA9IGRpdihtZC5taW51cyhkMCksIGQxLCAwLCAxKTtcclxuICAgICAgbjAgPSBuMC5wbHVzKGQyLnRpbWVzKG4xKSk7XHJcbiAgICAgIGQwID0gZDAucGx1cyhkMi50aW1lcyhkMSkpO1xyXG4gICAgICBuMC5zID0gbjEucyA9IHgucztcclxuICAgICAgZSA9IGUgKiAyO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGZyYWN0aW9uIGlzIGNsb3NlciB0byB4LCBuMC9kMCBvciBuMS9kMVxyXG4gICAgICByID0gZGl2KG4xLCBkMSwgZSwgUk9VTkRJTkdfTU9ERSkubWludXMoeCkuYWJzKCkuY29tcGFyZWRUbyhcclxuICAgICAgICAgIGRpdihuMCwgZDAsIGUsIFJPVU5ESU5HX01PREUpLm1pbnVzKHgpLmFicygpKSA8IDEgPyBbbjEsIGQxXSA6IFtuMCwgZDBdO1xyXG5cclxuICAgICAgTUFYX0VYUCA9IGV4cDtcclxuXHJcbiAgICAgIHJldHVybiByO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgY29udmVydGVkIHRvIGEgbnVtYmVyIHByaW1pdGl2ZS5cclxuICAgICAqL1xyXG4gICAgUC50b051bWJlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICt2YWx1ZU9mKHRoaXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIHJvdW5kZWQgdG8gc2Qgc2lnbmlmaWNhbnQgZGlnaXRzXHJcbiAgICAgKiB1c2luZyByb3VuZGluZyBtb2RlIHJtIG9yIFJPVU5ESU5HX01PREUuIElmIHNkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0c1xyXG4gICAgICogbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlciBwYXJ0IG9mIHRoZSB2YWx1ZSBpbiBmaXhlZC1wb2ludCBub3RhdGlvbiwgdGhlbiB1c2VcclxuICAgICAqIGV4cG9uZW50aWFsIG5vdGF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIFtzZF0ge251bWJlcn0gU2lnbmlmaWNhbnQgZGlnaXRzLiBJbnRlZ2VyLCAxIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtzZHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAudG9QcmVjaXNpb24gPSBmdW5jdGlvbiAoc2QsIHJtKSB7XHJcbiAgICAgIGlmIChzZCAhPSBudWxsKSBpbnRDaGVjayhzZCwgMSwgTUFYKTtcclxuICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBzZCwgcm0sIDIpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGJhc2UgYiwgb3IgYmFzZSAxMCBpZiBiIGlzXHJcbiAgICAgKiBvbWl0dGVkLiBJZiBhIGJhc2UgaXMgc3BlY2lmaWVkLCBpbmNsdWRpbmcgYmFzZSAxMCwgcm91bmQgYWNjb3JkaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFuZFxyXG4gICAgICogUk9VTkRJTkdfTU9ERS4gSWYgYSBiYXNlIGlzIG5vdCBzcGVjaWZpZWQsIGFuZCB0aGlzIEJpZ051bWJlciBoYXMgYSBwb3NpdGl2ZSBleHBvbmVudFxyXG4gICAgICogdGhhdCBpcyBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gVE9fRVhQX1BPUywgb3IgYSBuZWdhdGl2ZSBleHBvbmVudCBlcXVhbCB0byBvciBsZXNzIHRoYW5cclxuICAgICAqIFRPX0VYUF9ORUcsIHJldHVybiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBbYl0ge251bWJlcn0gSW50ZWdlciwgMiB0byBBTFBIQUJFVC5sZW5ndGggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBCYXNlIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtifSdcclxuICAgICAqL1xyXG4gICAgUC50b1N0cmluZyA9IGZ1bmN0aW9uIChiKSB7XHJcbiAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgbiA9IHRoaXMsXHJcbiAgICAgICAgcyA9IG4ucyxcclxuICAgICAgICBlID0gbi5lO1xyXG5cclxuICAgICAgLy8gSW5maW5pdHkgb3IgTmFOP1xyXG4gICAgICBpZiAoZSA9PT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChzKSB7XHJcbiAgICAgICAgICBzdHIgPSAnSW5maW5pdHknO1xyXG4gICAgICAgICAgaWYgKHMgPCAwKSBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHN0ciA9ICdOYU4nO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoYiA9PSBudWxsKSB7XHJcbiAgICAgICAgICBzdHIgPSBlIDw9IFRPX0VYUF9ORUcgfHwgZSA+PSBUT19FWFBfUE9TXHJcbiAgICAgICAgICAgPyB0b0V4cG9uZW50aWFsKGNvZWZmVG9TdHJpbmcobi5jKSwgZSlcclxuICAgICAgICAgICA6IHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKG4uYyksIGUsICcwJyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChiID09PSAxMCkge1xyXG4gICAgICAgICAgbiA9IHJvdW5kKG5ldyBCaWdOdW1iZXIobiksIERFQ0lNQUxfUExBQ0VTICsgZSArIDEsIFJPVU5ESU5HX01PREUpO1xyXG4gICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KGNvZWZmVG9TdHJpbmcobi5jKSwgbi5lLCAnMCcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpbnRDaGVjayhiLCAyLCBBTFBIQUJFVC5sZW5ndGgsICdCYXNlJyk7XHJcbiAgICAgICAgICBzdHIgPSBjb252ZXJ0QmFzZSh0b0ZpeGVkUG9pbnQoY29lZmZUb1N0cmluZyhuLmMpLCBlLCAnMCcpLCAxMCwgYiwgcywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocyA8IDAgJiYgbi5jWzBdKSBzdHIgPSAnLScgKyBzdHI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGFzIHRvU3RyaW5nLCBidXQgZG8gbm90IGFjY2VwdCBhIGJhc2UgYXJndW1lbnQsIGFuZCBpbmNsdWRlIHRoZSBtaW51cyBzaWduIGZvclxyXG4gICAgICogbmVnYXRpdmUgemVyby5cclxuICAgICAqL1xyXG4gICAgUC52YWx1ZU9mID0gUC50b0pTT04gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZU9mKHRoaXMpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgUC5faXNCaWdOdW1iZXIgPSB0cnVlO1xyXG5cclxuICAgIGlmICh0eXBlb2YgU3ltYm9sID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PSAnc3ltYm9sJykge1xyXG4gICAgICBQW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnQmlnTnVtYmVyJztcclxuICAgICAgLy8gTm9kZS5qcyB2MTAuMTIuMCtcclxuICAgICAgUFtTeW1ib2wuZm9yKCdub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbScpXSA9IFAudmFsdWVPZjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlnT2JqZWN0ICE9IG51bGwpIEJpZ051bWJlci5zZXQoY29uZmlnT2JqZWN0KTtcclxuXHJcbiAgICByZXR1cm4gQmlnTnVtYmVyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIFBSSVZBVEUgSEVMUEVSIEZVTkNUSU9OU1xyXG5cclxuXHJcbiAgZnVuY3Rpb24gYml0Rmxvb3Iobikge1xyXG4gICAgdmFyIGkgPSBuIHwgMDtcclxuICAgIHJldHVybiBuID4gMCB8fCBuID09PSBpID8gaSA6IGkgLSAxO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIFJldHVybiBhIGNvZWZmaWNpZW50IGFycmF5IGFzIGEgc3RyaW5nIG9mIGJhc2UgMTAgZGlnaXRzLlxyXG4gIGZ1bmN0aW9uIGNvZWZmVG9TdHJpbmcoYSkge1xyXG4gICAgdmFyIHMsIHosXHJcbiAgICAgIGkgPSAxLFxyXG4gICAgICBqID0gYS5sZW5ndGgsXHJcbiAgICAgIHIgPSBhWzBdICsgJyc7XHJcblxyXG4gICAgZm9yICg7IGkgPCBqOykge1xyXG4gICAgICBzID0gYVtpKytdICsgJyc7XHJcbiAgICAgIHogPSBMT0dfQkFTRSAtIHMubGVuZ3RoO1xyXG4gICAgICBmb3IgKDsgei0tOyBzID0gJzAnICsgcyk7XHJcbiAgICAgIHIgKz0gcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICBmb3IgKGogPSByLmxlbmd0aDsgci5jaGFyQ29kZUF0KC0taikgPT09IDQ4Oyk7XHJcblxyXG4gICAgcmV0dXJuIHIuc2xpY2UoMCwgaiArIDEgfHwgMSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gQ29tcGFyZSB0aGUgdmFsdWUgb2YgQmlnTnVtYmVycyB4IGFuZCB5LlxyXG4gIGZ1bmN0aW9uIGNvbXBhcmUoeCwgeSkge1xyXG4gICAgdmFyIGEsIGIsXHJcbiAgICAgIHhjID0geC5jLFxyXG4gICAgICB5YyA9IHkuYyxcclxuICAgICAgaSA9IHgucyxcclxuICAgICAgaiA9IHkucyxcclxuICAgICAgayA9IHguZSxcclxuICAgICAgbCA9IHkuZTtcclxuXHJcbiAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgaWYgKCFpIHx8ICFqKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBhID0geGMgJiYgIXhjWzBdO1xyXG4gICAgYiA9IHljICYmICF5Y1swXTtcclxuXHJcbiAgICAvLyBFaXRoZXIgemVybz9cclxuICAgIGlmIChhIHx8IGIpIHJldHVybiBhID8gYiA/IDAgOiAtaiA6IGk7XHJcblxyXG4gICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgaWYgKGkgIT0gaikgcmV0dXJuIGk7XHJcblxyXG4gICAgYSA9IGkgPCAwO1xyXG4gICAgYiA9IGsgPT0gbDtcclxuXHJcbiAgICAvLyBFaXRoZXIgSW5maW5pdHk/XHJcbiAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIGIgPyAwIDogIXhjIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICAvLyBDb21wYXJlIGV4cG9uZW50cy5cclxuICAgIGlmICghYikgcmV0dXJuIGsgPiBsIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICBqID0gKGsgPSB4Yy5sZW5ndGgpIDwgKGwgPSB5Yy5sZW5ndGgpID8gayA6IGw7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBkaWdpdCBieSBkaWdpdC5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBqOyBpKyspIGlmICh4Y1tpXSAhPSB5Y1tpXSkgcmV0dXJuIHhjW2ldID4geWNbaV0gXiBhID8gMSA6IC0xO1xyXG5cclxuICAgIC8vIENvbXBhcmUgbGVuZ3Rocy5cclxuICAgIHJldHVybiBrID09IGwgPyAwIDogayA+IGwgXiBhID8gMSA6IC0xO1xyXG4gIH1cclxuXHJcblxyXG4gIC8qXHJcbiAgICogQ2hlY2sgdGhhdCBuIGlzIGEgcHJpbWl0aXZlIG51bWJlciwgYW4gaW50ZWdlciwgYW5kIGluIHJhbmdlLCBvdGhlcndpc2UgdGhyb3cuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW50Q2hlY2sobiwgbWluLCBtYXgsIG5hbWUpIHtcclxuICAgIGlmIChuIDwgbWluIHx8IG4gPiBtYXggfHwgbiAhPT0gKG4gPCAwID8gbWF0aGNlaWwobikgOiBtYXRoZmxvb3IobikpKSB7XHJcbiAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAobmFtZSB8fCAnQXJndW1lbnQnKSArICh0eXBlb2YgbiA9PSAnbnVtYmVyJ1xyXG4gICAgICAgICA/IG4gPCBtaW4gfHwgbiA+IG1heCA/ICcgb3V0IG9mIHJhbmdlOiAnIDogJyBub3QgYW4gaW50ZWdlcjogJ1xyXG4gICAgICAgICA6ICcgbm90IGEgcHJpbWl0aXZlIG51bWJlcjogJykgKyBTdHJpbmcobikpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIEFzc3VtZXMgZmluaXRlIG4uXHJcbiAgZnVuY3Rpb24gaXNPZGQobikge1xyXG4gICAgdmFyIGsgPSBuLmMubGVuZ3RoIC0gMTtcclxuICAgIHJldHVybiBiaXRGbG9vcihuLmUgLyBMT0dfQkFTRSkgPT0gayAmJiBuLmNba10gJSAyICE9IDA7XHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gdG9FeHBvbmVudGlhbChzdHIsIGUpIHtcclxuICAgIHJldHVybiAoc3RyLmxlbmd0aCA+IDEgPyBzdHIuY2hhckF0KDApICsgJy4nICsgc3RyLnNsaWNlKDEpIDogc3RyKSArXHJcbiAgICAgKGUgPCAwID8gJ2UnIDogJ2UrJykgKyBlO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHRvRml4ZWRQb2ludChzdHIsIGUsIHopIHtcclxuICAgIHZhciBsZW4sIHpzO1xyXG5cclxuICAgIC8vIE5lZ2F0aXZlIGV4cG9uZW50P1xyXG4gICAgaWYgKGUgPCAwKSB7XHJcblxyXG4gICAgICAvLyBQcmVwZW5kIHplcm9zLlxyXG4gICAgICBmb3IgKHpzID0geiArICcuJzsgKytlOyB6cyArPSB6KTtcclxuICAgICAgc3RyID0genMgKyBzdHI7XHJcblxyXG4gICAgLy8gUG9zaXRpdmUgZXhwb25lbnRcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxlbiA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBBcHBlbmQgemVyb3MuXHJcbiAgICAgIGlmICgrK2UgPiBsZW4pIHtcclxuICAgICAgICBmb3IgKHpzID0geiwgZSAtPSBsZW47IC0tZTsgenMgKz0geik7XHJcbiAgICAgICAgc3RyICs9IHpzO1xyXG4gICAgICB9IGVsc2UgaWYgKGUgPCBsZW4pIHtcclxuICAgICAgICBzdHIgPSBzdHIuc2xpY2UoMCwgZSkgKyAnLicgKyBzdHIuc2xpY2UoZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3RyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIEVYUE9SVFxyXG5cclxuXHJcbiAgQmlnTnVtYmVyID0gY2xvbmUoKTtcclxuICBCaWdOdW1iZXJbJ2RlZmF1bHQnXSA9IEJpZ051bWJlci5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcblxyXG4gIC8vIEFNRC5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBCaWdOdW1iZXI7IH0pO1xyXG5cclxuICAvLyBOb2RlLmpzIGFuZCBvdGhlciBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLlxyXG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBCaWdOdW1iZXI7XHJcblxyXG4gIC8vIEJyb3dzZXIuXHJcbiAgfSBlbHNlIHtcclxuICAgIGlmICghZ2xvYmFsT2JqZWN0KSB7XHJcbiAgICAgIGdsb2JhbE9iamVjdCA9IHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYgPyBzZWxmIDogd2luZG93O1xyXG4gICAgfVxyXG5cclxuICAgIGdsb2JhbE9iamVjdC5CaWdOdW1iZXIgPSBCaWdOdW1iZXI7XHJcbiAgfVxyXG59KSh0aGlzKTtcclxuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxhbmd1YWdlVGFnOiBcImVuLVVTXCIsXG4gICAgZGVsaW1pdGVyczoge1xuICAgICAgICB0aG91c2FuZHM6IFwiLFwiLFxuICAgICAgICBkZWNpbWFsOiBcIi5cIlxuICAgIH0sXG4gICAgYWJicmV2aWF0aW9uczoge1xuICAgICAgICB0aG91c2FuZDogXCJrXCIsXG4gICAgICAgIG1pbGxpb246IFwibVwiLFxuICAgICAgICBiaWxsaW9uOiBcImJcIixcbiAgICAgICAgdHJpbGxpb246IFwidFwiXG4gICAgfSxcbiAgICBzcGFjZVNlcGFyYXRlZDogZmFsc2UsXG4gICAgb3JkaW5hbDogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgIGxldCBiID0gbnVtYmVyICUgMTA7XG4gICAgICAgIHJldHVybiAofn4obnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/IFwidGhcIiA6IChiID09PSAxKSA/IFwic3RcIiA6IChiID09PSAyKSA/IFwibmRcIiA6IChiID09PSAzKSA/IFwicmRcIiA6IFwidGhcIjtcbiAgICB9LFxuICAgIGN1cnJlbmN5OiB7XG4gICAgICAgIHN5bWJvbDogXCIkXCIsXG4gICAgICAgIHBvc2l0aW9uOiBcInByZWZpeFwiLFxuICAgICAgICBjb2RlOiBcIlVTRFwiXG4gICAgfSxcbiAgICBjdXJyZW5jeUZvcm1hdDoge1xuICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgdG90YWxMZW5ndGg6IDQsXG4gICAgICAgIHNwYWNlU2VwYXJhdGVkOiB0cnVlXG4gICAgfSxcbiAgICBmb3JtYXRzOiB7XG4gICAgICAgIGZvdXJEaWdpdHM6IHtcbiAgICAgICAgICAgIHRvdGFsTGVuZ3RoOiA0LFxuICAgICAgICAgICAgc3BhY2VTZXBhcmF0ZWQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsczoge1xuICAgICAgICAgICAgb3V0cHV0OiBcImN1cnJlbmN5XCIsXG4gICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIG1hbnRpc3NhOiAyXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bGxXaXRoVHdvRGVjaW1hbHNOb0N1cnJlbmN5OiB7XG4gICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIG1hbnRpc3NhOiAyXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bGxXaXRoTm9EZWNpbWFsczoge1xuICAgICAgICAgICAgb3V0cHV0OiBcImN1cnJlbmN5XCIsXG4gICAgICAgICAgICB0aG91c2FuZFNlcGFyYXRlZDogdHJ1ZSxcbiAgICAgICAgICAgIG1hbnRpc3NhOiAwXG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5jb25zdCB2YWxpZGF0aW5nID0gcmVxdWlyZShcIi4vdmFsaWRhdGluZ1wiKTtcbmNvbnN0IHBhcnNpbmcgPSByZXF1aXJlKFwiLi9wYXJzaW5nXCIpO1xuXG5jb25zdCBiaW5hcnlTdWZmaXhlcyA9IFtcIkJcIiwgXCJLaUJcIiwgXCJNaUJcIiwgXCJHaUJcIiwgXCJUaUJcIiwgXCJQaUJcIiwgXCJFaUJcIiwgXCJaaUJcIiwgXCJZaUJcIl07XG5jb25zdCBkZWNpbWFsU3VmZml4ZXMgPSBbXCJCXCIsIFwiS0JcIiwgXCJNQlwiLCBcIkdCXCIsIFwiVEJcIiwgXCJQQlwiLCBcIkVCXCIsIFwiWkJcIiwgXCJZQlwiXTtcbmNvbnN0IGJ5dGVzID0ge1xuICAgIGdlbmVyYWw6IHtzY2FsZTogMTAyNCwgc3VmZml4ZXM6IGRlY2ltYWxTdWZmaXhlcywgbWFya2VyOiBcImJkXCJ9LFxuICAgIGJpbmFyeToge3NjYWxlOiAxMDI0LCBzdWZmaXhlczogYmluYXJ5U3VmZml4ZXMsIG1hcmtlcjogXCJiXCJ9LFxuICAgIGRlY2ltYWw6IHtzY2FsZTogMTAwMCwgc3VmZml4ZXM6IGRlY2ltYWxTdWZmaXhlcywgbWFya2VyOiBcImRcIn1cbn07XG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgIHRvdGFsTGVuZ3RoOiAwLFxuICAgIGNoYXJhY3RlcmlzdGljOiAwLFxuICAgIGZvcmNlQXZlcmFnZTogZmFsc2UsXG4gICAgYXZlcmFnZTogZmFsc2UsXG4gICAgbWFudGlzc2E6IC0xLFxuICAgIG9wdGlvbmFsTWFudGlzc2E6IHRydWUsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IGZhbHNlLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBmYWxzZSxcbiAgICBuZWdhdGl2ZTogXCJzaWduXCIsXG4gICAgZm9yY2VTaWduOiBmYWxzZVxufTtcblxuLyoqXG4gKiBFbnRyeSBwb2ludC4gRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhY2NvcmRpbmcgdG8gdGhlIFBST1ZJREVERk9STUFULlxuICogVGhpcyBtZXRob2QgZW5zdXJlIHRoZSBwcmVmaXggYW5kIHBvc3RmaXggYXJlIGFkZGVkIGFzIHRoZSBsYXN0IHN0ZXAuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR8c3RyaW5nfSBbcHJvdmlkZWRGb3JtYXRdIC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQgPSB7fSwgbnVtYnJvKSB7XG4gICAgaWYgKHR5cGVvZiBwcm92aWRlZEZvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBwcm92aWRlZEZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQocHJvdmlkZWRGb3JtYXQpO1xuICAgIH1cblxuICAgIGxldCB2YWxpZCA9IHZhbGlkYXRpbmcudmFsaWRhdGVGb3JtYXQocHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgaWYgKCF2YWxpZCkge1xuICAgICAgICByZXR1cm4gXCJFUlJPUjogaW52YWxpZCBmb3JtYXRcIjtcbiAgICB9XG5cbiAgICBsZXQgcHJlZml4ID0gcHJvdmlkZWRGb3JtYXQucHJlZml4IHx8IFwiXCI7XG4gICAgbGV0IHBvc3RmaXggPSBwcm92aWRlZEZvcm1hdC5wb3N0Zml4IHx8IFwiXCI7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYnJvKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgbnVtYnJvKTtcbiAgICBvdXRwdXQgPSBpbnNlcnRQcmVmaXgob3V0cHV0LCBwcmVmaXgpO1xuICAgIG91dHB1dCA9IGluc2VydFBvc3RmaXgob3V0cHV0LCBwb3N0Zml4KTtcbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYWNjb3JkaW5nIHRvIHRoZSBQUk9WSURFREZPUk1BVC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXROdW1icm8oaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBudW1icm8pIHtcbiAgICBzd2l0Y2ggKHByb3ZpZGVkRm9ybWF0Lm91dHB1dCkge1xuICAgICAgICBjYXNlIFwiY3VycmVuY3lcIjoge1xuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0Q3VycmVuY3koaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwicGVyY2VudFwiOiB7XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudFBlcmNlbnRhZ2VEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFBlcmNlbnRhZ2UoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYnl0ZVwiOlxuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRCeXRlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIGNhc2UgXCJ0aW1lXCI6XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudFRpbWVEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFRpbWUoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgY2FzZSBcIm9yZGluYWxcIjpcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50T3JkaW5hbERlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0T3JkaW5hbChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgICAgICAgICBudW1icm9cbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIGRlY2ltYWwgYnl0ZSB1bml0IChNQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDAwKS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXREZWNpbWFsQnl0ZVVuaXQoaW5zdGFuY2UpIHtcbiAgICBsZXQgZGF0YSA9IGJ5dGVzLmRlY2ltYWw7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGJpbmFyeSBieXRlIHVuaXQgKE1pQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDI0KS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXRCaW5hcnlCeXRlVW5pdChpbnN0YW5jZSkge1xuICAgIGxldCBkYXRhID0gYnl0ZXMuYmluYXJ5O1xuICAgIHJldHVybiBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBkYXRhLnN1ZmZpeGVzLCBkYXRhLnNjYWxlKS5zdWZmaXg7XG59XG5cbi8qKlxuICogR2V0IHRoZSBkZWNpbWFsIGJ5dGUgdW5pdCAoTUIpIGZvciB0aGUgcHJvdmlkZWQgbnVtYnJvIElOU1RBTkNFLlxuICogV2UgZ28gZnJvbSBvbmUgdW5pdCB0byBhbm90aGVyIHVzaW5nIHRoZSBkZWNpbWFsIHN5c3RlbSAoMTAyNCkuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGNvbXB1dGVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0Qnl0ZVVuaXQoaW5zdGFuY2UpIHtcbiAgICBsZXQgZGF0YSA9IGJ5dGVzLmdlbmVyYWw7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHZhbHVlIGFuZCB0aGUgc3VmZml4IGNvbXB1dGVkIGluIGJ5dGUuXG4gKiBJdCB1c2VzIHRoZSBTVUZGSVhFUyBhbmQgdGhlIFNDQUxFIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIE51bWJlciB0byBmb3JtYXRcbiAqIEBwYXJhbSB7W1N0cmluZ119IHN1ZmZpeGVzIC0gTGlzdCBvZiBzdWZmaXhlc1xuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIC0gTnVtYmVyIGluLWJldHdlZW4gdHdvIHVuaXRzXG4gKiBAcmV0dXJuIHt7dmFsdWU6IE51bWJlciwgc3VmZml4OiBTdHJpbmd9fVxuICovXG5mdW5jdGlvbiBnZXRGb3JtYXRCeXRlVW5pdHModmFsdWUsIHN1ZmZpeGVzLCBzY2FsZSkge1xuICAgIGxldCBzdWZmaXggPSBzdWZmaXhlc1swXTtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuXG4gICAgaWYgKGFicyA+PSBzY2FsZSkge1xuICAgICAgICBmb3IgKGxldCBwb3dlciA9IDE7IHBvd2VyIDwgc3VmZml4ZXMubGVuZ3RoOyArK3Bvd2VyKSB7XG4gICAgICAgICAgICBsZXQgbWluID0gTWF0aC5wb3coc2NhbGUsIHBvd2VyKTtcbiAgICAgICAgICAgIGxldCBtYXggPSBNYXRoLnBvdyhzY2FsZSwgcG93ZXIgKyAxKTtcblxuICAgICAgICAgICAgaWYgKGFicyA+PSBtaW4gJiYgYWJzIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgc3VmZml4ID0gc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBtaW47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWx1ZXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIFtzY2FsZV0gWUIgbmV2ZXIgc2V0IHRoZSBzdWZmaXhcbiAgICAgICAgaWYgKHN1ZmZpeCA9PT0gc3VmZml4ZXNbMF0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdyhzY2FsZSwgc3VmZml4ZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICBzdWZmaXggPSBzdWZmaXhlc1tzdWZmaXhlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7dmFsdWUsIHN1ZmZpeH07XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBieXRlcyB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsIGFuZCBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0Qnl0ZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlLCBudW1icm8pIHtcbiAgICBsZXQgYmFzZSA9IHByb3ZpZGVkRm9ybWF0LmJhc2UgfHwgXCJiaW5hcnlcIjtcbiAgICBsZXQgYmFzZUluZm8gPSBieXRlc1tiYXNlXTtcblxuICAgIGxldCB7dmFsdWUsIHN1ZmZpeH0gPSBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBiYXNlSW5mby5zdWZmaXhlcywgYmFzZUluZm8uc2NhbGUpO1xuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1iZXIoe1xuICAgICAgICBpbnN0YW5jZTogbnVtYnJvKHZhbHVlKSxcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBkZWZhdWx0czogc3RhdGUuY3VycmVudEJ5dGVEZWZhdWx0Rm9ybWF0KClcbiAgICB9KTtcbiAgICBsZXQgYWJicmV2aWF0aW9ucyA9IHN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCk7XG4gICAgcmV0dXJuIGAke291dHB1dH0ke2FiYnJldmlhdGlvbnMuc3BhY2VkID8gXCIgXCIgOiBcIlwifSR7c3VmZml4fWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhbiBvcmRpbmFsIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRPcmRpbmFsKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUpIHtcbiAgICBsZXQgb3JkaW5hbEZuID0gc3RhdGUuY3VycmVudE9yZGluYWwoKTtcbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwcm92aWRlZEZvcm1hdCk7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICBzdGF0ZVxuICAgIH0pO1xuICAgIGxldCBvcmRpbmFsID0gb3JkaW5hbEZuKGluc3RhbmNlLl92YWx1ZSk7XG5cbiAgICByZXR1cm4gYCR7b3V0cHV0fSR7b3B0aW9ucy5zcGFjZVNlcGFyYXRlZCA/IFwiIFwiIDogXCJcIn0ke29yZGluYWx9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgdGltZSBISDpNTTpTUy5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFRpbWUoaW5zdGFuY2UpIHtcbiAgICBsZXQgaG91cnMgPSBNYXRoLmZsb29yKGluc3RhbmNlLl92YWx1ZSAvIDYwIC8gNjApO1xuICAgIGxldCBtaW51dGVzID0gTWF0aC5mbG9vcigoaW5zdGFuY2UuX3ZhbHVlIC0gKGhvdXJzICogNjAgKiA2MCkpIC8gNjApO1xuICAgIGxldCBzZWNvbmRzID0gTWF0aC5yb3VuZChpbnN0YW5jZS5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSAtIChtaW51dGVzICogNjApKTtcbiAgICByZXR1cm4gYCR7aG91cnN9OiR7KG1pbnV0ZXMgPCAxMCkgPyBcIjBcIiA6IFwiXCJ9JHttaW51dGVzfTokeyhzZWNvbmRzIDwgMTApID8gXCIwXCIgOiBcIlwifSR7c2Vjb25kc31gO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYSBwZXJjZW50YWdlIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gcHJvdmlkZWRGb3JtYXQgLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFBlcmNlbnRhZ2UoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSwgbnVtYnJvKSB7XG4gICAgbGV0IHByZWZpeFN5bWJvbCA9IHByb3ZpZGVkRm9ybWF0LnByZWZpeFN5bWJvbDtcblxuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1iZXIoe1xuICAgICAgICBpbnN0YW5jZTogbnVtYnJvKGluc3RhbmNlLl92YWx1ZSAqIDEwMCksXG4gICAgICAgIHByb3ZpZGVkRm9ybWF0LFxuICAgICAgICBzdGF0ZVxuICAgIH0pO1xuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGlmIChwcmVmaXhTeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIGAlJHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSR7b3V0cHV0fWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAke291dHB1dH0ke29wdGlvbnMuc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCJ9JWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIHBlcmNlbnRhZ2UgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULFxuICogYW5kIHRoZSBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5KGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUpIHtcbiAgICBjb25zdCBjdXJyZW50Q3VycmVuY3kgPSBzdGF0ZS5jdXJyZW50Q3VycmVuY3koKTtcbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwcm92aWRlZEZvcm1hdCk7XG4gICAgbGV0IGRlY2ltYWxTZXBhcmF0b3IgPSB1bmRlZmluZWQ7XG4gICAgbGV0IHNwYWNlID0gXCJcIjtcbiAgICBsZXQgYXZlcmFnZSA9ICEhb3B0aW9ucy50b3RhbExlbmd0aCB8fCAhIW9wdGlvbnMuZm9yY2VBdmVyYWdlIHx8IG9wdGlvbnMuYXZlcmFnZTtcbiAgICBsZXQgcG9zaXRpb24gPSBwcm92aWRlZEZvcm1hdC5jdXJyZW5jeVBvc2l0aW9uIHx8IGN1cnJlbnRDdXJyZW5jeS5wb3NpdGlvbjtcbiAgICBsZXQgc3ltYm9sID0gcHJvdmlkZWRGb3JtYXQuY3VycmVuY3lTeW1ib2wgfHwgY3VycmVudEN1cnJlbmN5LnN5bWJvbDtcblxuICAgIGlmIChvcHRpb25zLnNwYWNlU2VwYXJhdGVkKSB7XG4gICAgICAgIHNwYWNlID0gXCIgXCI7XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uID09PSBcImluZml4XCIpIHtcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvciA9IHNwYWNlICsgc3ltYm9sICsgc3BhY2U7XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIGRlY2ltYWxTZXBhcmF0b3JcbiAgICB9KTtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gXCJwcmVmaXhcIikge1xuICAgICAgICBpZiAoaW5zdGFuY2UuX3ZhbHVlIDwgMCAmJiBvcHRpb25zLm5lZ2F0aXZlID09PSBcInNpZ25cIikge1xuICAgICAgICAgICAgb3V0cHV0ID0gYC0ke3NwYWNlfSR7c3ltYm9sfSR7b3V0cHV0LnNsaWNlKDEpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBzeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcG9zaXRpb24gfHwgcG9zaXRpb24gPT09IFwicG9zdGZpeFwiKSB7XG4gICAgICAgIHNwYWNlID0gYXZlcmFnZSA/IFwiXCIgOiBzcGFjZTtcbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0ICsgc3BhY2UgKyBzeW1ib2w7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBhdmVyYWdlIHZhbHVlIG91dCBvZiBWQUxVRS5cbiAqIFRoZSBvdGhlciBwYXJhbWV0ZXJzIGFyZSBjb21wdXRhdGlvbiBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIHZhbHVlIHRvIGNvbXB1dGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZm9yY2VBdmVyYWdlXSAtIGZvcmNlZCB1bml0IHVzZWQgdG8gY29tcHV0ZVxuICogQHBhcmFtIHt7fX0gYWJicmV2aWF0aW9ucyAtIHBhcnQgb2YgdGhlIGxhbmd1YWdlIHNwZWNpZmljYXRpb25cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc3BhY2VTZXBhcmF0ZWQgLSBgdHJ1ZWAgaWYgYSBzcGFjZSBtdXN0IGJlIGluc2VydGVkIGJldHdlZW4gdGhlIHZhbHVlIGFuZCB0aGUgYWJicmV2aWF0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gW3RvdGFsTGVuZ3RoXSAtIHRvdGFsIGxlbmd0aCBvZiB0aGUgb3V0cHV0IGluY2x1ZGluZyB0aGUgY2hhcmFjdGVyaXN0aWMgYW5kIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nLCBtYW50aXNzYVByZWNpc2lvbjogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUF2ZXJhZ2Uoe3ZhbHVlLCBmb3JjZUF2ZXJhZ2UsIGFiYnJldmlhdGlvbnMsIHNwYWNlU2VwYXJhdGVkID0gZmFsc2UsIHRvdGFsTGVuZ3RoID0gMH0pIHtcbiAgICBsZXQgYWJicmV2aWF0aW9uID0gXCJcIjtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IC0xO1xuXG4gICAgaWYgKChhYnMgPj0gTWF0aC5wb3coMTAsIDEyKSAmJiAhZm9yY2VBdmVyYWdlKSB8fCAoZm9yY2VBdmVyYWdlID09PSBcInRyaWxsaW9uXCIpKSB7XG4gICAgICAgIC8vIHRyaWxsaW9uXG4gICAgICAgIGFiYnJldmlhdGlvbiA9IGFiYnJldmlhdGlvbnMudHJpbGxpb247XG4gICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgMTIpO1xuICAgIH0gZWxzZSBpZiAoKGFicyA8IE1hdGgucG93KDEwLCAxMikgJiYgYWJzID49IE1hdGgucG93KDEwLCA5KSAmJiAhZm9yY2VBdmVyYWdlKSB8fCAoZm9yY2VBdmVyYWdlID09PSBcImJpbGxpb25cIikpIHtcbiAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICBhYmJyZXZpYXRpb24gPSBhYmJyZXZpYXRpb25zLmJpbGxpb247XG4gICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdygxMCwgOSk7XG4gICAgfSBlbHNlIGlmICgoYWJzIDwgTWF0aC5wb3coMTAsIDkpICYmIGFicyA+PSBNYXRoLnBvdygxMCwgNikgJiYgIWZvcmNlQXZlcmFnZSkgfHwgKGZvcmNlQXZlcmFnZSA9PT0gXCJtaWxsaW9uXCIpKSB7XG4gICAgICAgIC8vIG1pbGxpb25cbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy5taWxsaW9uO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gTWF0aC5wb3coMTAsIDYpO1xuICAgIH0gZWxzZSBpZiAoKGFicyA8IE1hdGgucG93KDEwLCA2KSAmJiBhYnMgPj0gTWF0aC5wb3coMTAsIDMpICYmICFmb3JjZUF2ZXJhZ2UpIHx8IChmb3JjZUF2ZXJhZ2UgPT09IFwidGhvdXNhbmRcIikpIHtcbiAgICAgICAgLy8gdGhvdXNhbmRcbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIE1hdGgucG93KDEwLCAzKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9uYWxTcGFjZSA9IHNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwiO1xuXG4gICAgaWYgKGFiYnJldmlhdGlvbikge1xuICAgICAgICBhYmJyZXZpYXRpb24gPSBvcHRpb25hbFNwYWNlICsgYWJicmV2aWF0aW9uO1xuICAgIH1cblxuICAgIGlmICh0b3RhbExlbmd0aCkge1xuICAgICAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSB2YWx1ZS50b1N0cmluZygpLnNwbGl0KFwiLlwiKVswXTtcbiAgICAgICAgbWFudGlzc2FQcmVjaXNpb24gPSBNYXRoLm1heCh0b3RhbExlbmd0aCAtIGNoYXJhY3RlcmlzdGljLmxlbmd0aCwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHt2YWx1ZSwgYWJicmV2aWF0aW9uLCBtYW50aXNzYVByZWNpc2lvbn07XG59XG5cbi8qKlxuICogQ29tcHV0ZSBhbiBleHBvbmVudGlhbCBmb3JtIGZvciBWQUxVRSwgdGFraW5nIGludG8gYWNjb3VudCBDSEFSQUNURVJJU1RJQ1xuICogaWYgcHJvdmlkZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSB2YWx1ZSB0byBjb21wdXRlXG4gKiBAcGFyYW0ge251bWJlcn0gW2NoYXJhY3RlcmlzdGljUHJlY2lzaW9uXSAtIG9wdGlvbmFsIGNoYXJhY3RlcmlzdGljIGxlbmd0aFxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUV4cG9uZW50aWFsKHt2YWx1ZSwgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gPSAwfSkge1xuICAgIGxldCBbbnVtYmVyU3RyaW5nLCBleHBvbmVudGlhbF0gPSB2YWx1ZS50b0V4cG9uZW50aWFsKCkuc3BsaXQoXCJlXCIpO1xuICAgIGxldCBudW1iZXIgPSArbnVtYmVyU3RyaW5nO1xuXG4gICAgaWYgKCFjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IG51bWJlcixcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbjogYGUke2V4cG9uZW50aWFsfWBcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgY2hhcmFjdGVyaXN0aWNMZW5ndGggPSAxOyAvLyBzZWUgYHRvRXhwb25lbnRpYWxgXG5cbiAgICBpZiAoY2hhcmFjdGVyaXN0aWNMZW5ndGggPCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbikge1xuICAgICAgICBudW1iZXIgPSBudW1iZXIgKiBNYXRoLnBvdygxMCwgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gLSBjaGFyYWN0ZXJpc3RpY0xlbmd0aCk7XG4gICAgICAgIGV4cG9uZW50aWFsID0gK2V4cG9uZW50aWFsIC0gKGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uIC0gY2hhcmFjdGVyaXN0aWNMZW5ndGgpO1xuICAgICAgICBleHBvbmVudGlhbCA9IGV4cG9uZW50aWFsID49IDAgPyBgKyR7ZXhwb25lbnRpYWx9YCA6IGV4cG9uZW50aWFsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiBudW1iZXIsXG4gICAgICAgIGFiYnJldmlhdGlvbjogYGUke2V4cG9uZW50aWFsfWBcbiAgICB9O1xufVxuXG4vKipcbiAqIFJldHVybiBhIHN0cmluZyBvZiBOVU1CRVIgemVyby5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gTGVuZ3RoIG9mIHRoZSBvdXRwdXRcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gemVyb2VzKG51bWJlcikge1xuICAgIGxldCByZXN1bHQgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyOyBpKyspIHtcbiAgICAgICAgcmVzdWx0ICs9IFwiMFwiO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyBWQUxVRSB3aXRoIGEgUFJFQ0lTSU9OLWxvbmcgbWFudGlzc2EuXG4gKiBUaGlzIG1ldGhvZCBpcyBmb3IgbGFyZ2Uvc21hbGwgbnVtYmVycyBvbmx5IChhLmsuYS4gaW5jbHVkaW5nIGEgXCJlXCIpLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciB0byBwcmVjaXNlXG4gKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIC0gZGVzaXJlZCBsZW5ndGggZm9yIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB0b0ZpeGVkTGFyZ2UodmFsdWUsIHByZWNpc2lvbikge1xuICAgIGxldCByZXN1bHQgPSB2YWx1ZS50b1N0cmluZygpO1xuXG4gICAgbGV0IFtiYXNlLCBleHBdID0gcmVzdWx0LnNwbGl0KFwiZVwiKTtcblxuICAgIGxldCBbY2hhcmFjdGVyaXN0aWMsIG1hbnRpc3NhID0gXCJcIl0gPSBiYXNlLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmICgrZXhwID4gMCkge1xuICAgICAgICByZXN1bHQgPSBjaGFyYWN0ZXJpc3RpYyArIG1hbnRpc3NhICsgemVyb2VzKGV4cCAtIG1hbnRpc3NhLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByZWZpeCA9IFwiLlwiO1xuXG4gICAgICAgIGlmICgrY2hhcmFjdGVyaXN0aWMgPCAwKSB7XG4gICAgICAgICAgICBwcmVmaXggPSBgLTAke3ByZWZpeH1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJlZml4ID0gYDAke3ByZWZpeH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN1ZmZpeCA9ICh6ZXJvZXMoLWV4cCAtIDEpICsgTWF0aC5hYnMoY2hhcmFjdGVyaXN0aWMpICsgbWFudGlzc2EpLnN1YnN0cigwLCBwcmVjaXNpb24pO1xuICAgICAgICBpZiAoc3VmZml4Lmxlbmd0aCA8IHByZWNpc2lvbikge1xuICAgICAgICAgICAgc3VmZml4ICs9IHplcm9lcyhwcmVjaXNpb24gLSBzdWZmaXgubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBwcmVmaXggKyBzdWZmaXg7XG4gICAgfVxuXG4gICAgaWYgKCtleHAgPiAwICYmIHByZWNpc2lvbiA+IDApIHtcbiAgICAgICAgcmVzdWx0ICs9IGAuJHt6ZXJvZXMocHJlY2lzaW9uKX1gO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyBWQUxVRSB3aXRoIGEgUFJFQ0lTSU9OLWxvbmcgbWFudGlzc2EuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHByZWNpc2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIGxlbmd0aCBmb3IgdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbikge1xuICAgIGlmICh2YWx1ZS50b1N0cmluZygpLmluZGV4T2YoXCJlXCIpICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gdG9GaXhlZExhcmdlKHZhbHVlLCBwcmVjaXNpb24pO1xuICAgIH1cblxuICAgIHJldHVybiAoTWF0aC5yb3VuZCgrYCR7dmFsdWV9ZSske3ByZWNpc2lvbn1gKSAvIChNYXRoLnBvdygxMCwgcHJlY2lzaW9uKSkpLnRvRml4ZWQocHJlY2lzaW9uKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgT1VUUFVUIHdpdGggYSBtYW50aXNzYSBwcmVjaXNpb24gb2YgUFJFQ0lTSU9OLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIGJlaW5nIGN1cnJlbnRseSBmb3JtYXR0ZWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9uYWxNYW50aXNzYSAtIGlmIGB0cnVlYCwgdGhlIG1hbnRpc3NhIGlzIG9taXR0ZWQgd2hlbiBpdCdzIG9ubHkgemVyb2VzXG4gKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIC0gZGVzaXJlZCBwcmVjaXNpb24gb2YgdGhlIG1hbnRpc3NhXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHRyaW0gLSBpZiBgdHJ1ZWAsIHRyYWlsaW5nIHplcm9lcyBhcmUgcmVtb3ZlZCBmcm9tIHRoZSBtYW50aXNzYVxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzZXRNYW50aXNzYVByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbE1hbnRpc3NhLCBwcmVjaXNpb24sIHRyaW0pIHtcbiAgICBpZiAocHJlY2lzaW9uID09PSAtMSkge1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSB0b0ZpeGVkKHZhbHVlLCBwcmVjaXNpb24pO1xuICAgIGxldCBbY3VycmVudENoYXJhY3RlcmlzdGljLCBjdXJyZW50TWFudGlzc2EgPSBcIlwiXSA9IHJlc3VsdC50b1N0cmluZygpLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmIChjdXJyZW50TWFudGlzc2EubWF0Y2goL14wKyQvKSAmJiAob3B0aW9uYWxNYW50aXNzYSB8fCB0cmltKSkge1xuICAgICAgICByZXR1cm4gY3VycmVudENoYXJhY3RlcmlzdGljO1xuICAgIH1cblxuICAgIGxldCBoYXNUcmFpbGluZ1plcm9lcyA9IGN1cnJlbnRNYW50aXNzYS5tYXRjaCgvMCskLyk7XG4gICAgaWYgKHRyaW0gJiYgaGFzVHJhaWxpbmdaZXJvZXMpIHtcbiAgICAgICAgcmV0dXJuIGAke2N1cnJlbnRDaGFyYWN0ZXJpc3RpY30uJHtjdXJyZW50TWFudGlzc2EudG9TdHJpbmcoKS5zbGljZSgwLCBoYXNUcmFpbGluZ1plcm9lcy5pbmRleCl9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0LnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IE9VVFBVVCB3aXRoIGEgY2hhcmFjdGVyaXN0aWMgcHJlY2lzaW9uIG9mIFBSRUNJU0lPTi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMgLSBgdHJ1ZWAgaWYgdGhlIGNoYXJhY3RlcmlzdGljIGlzIG9taXR0ZWQgd2hlbiBpdCdzIG9ubHkgemVyb2VzXG4gKiBAcGFyYW0ge251bWJlcn0gcHJlY2lzaW9uIC0gZGVzaXJlZCBwcmVjaXNpb24gb2YgdGhlIGNoYXJhY3RlcmlzdGljXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHNldENoYXJhY3RlcmlzdGljUHJlY2lzaW9uKG91dHB1dCwgdmFsdWUsIG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMsIHByZWNpc2lvbikge1xuICAgIGxldCByZXN1bHQgPSBvdXRwdXQ7XG4gICAgbGV0IFtjdXJyZW50Q2hhcmFjdGVyaXN0aWMsIGN1cnJlbnRNYW50aXNzYV0gPSByZXN1bHQudG9TdHJpbmcoKS5zcGxpdChcIi5cIik7XG5cbiAgICBpZiAoY3VycmVudENoYXJhY3RlcmlzdGljLm1hdGNoKC9eLT8wJC8pICYmIG9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMpIHtcbiAgICAgICAgaWYgKCFjdXJyZW50TWFudGlzc2EpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50Q2hhcmFjdGVyaXN0aWMucmVwbGFjZShcIjBcIiwgXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYCR7Y3VycmVudENoYXJhY3RlcmlzdGljLnJlcGxhY2UoXCIwXCIsIFwiXCIpfS4ke2N1cnJlbnRNYW50aXNzYX1gO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoIDwgcHJlY2lzaW9uKSB7XG4gICAgICAgIGxldCBtaXNzaW5nWmVyb3MgPSBwcmVjaXNpb24gLSBjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pc3NpbmdaZXJvczsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBgMCR7cmVzdWx0fWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0LnRvU3RyaW5nKCk7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBpbmRleGVzIHdoZXJlIGFyZSB0aGUgZ3JvdXAgc2VwYXJhdGlvbnMgYWZ0ZXIgc3BsaXR0aW5nXG4gKiBgdG90YWxMZW5ndGhgIGluIGdyb3VwIG9mIGBncm91cFNpemVgIHNpemUuXG4gKiBJbXBvcnRhbnQ6IHdlIHN0YXJ0IGdyb3VwaW5nIGZyb20gdGhlIHJpZ2h0IGhhbmQgc2lkZS5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdG90YWxMZW5ndGggLSB0b3RhbCBsZW5ndGggb2YgdGhlIGNoYXJhY3RlcmlzdGljIHRvIHNwbGl0XG4gKiBAcGFyYW0ge251bWJlcn0gZ3JvdXBTaXplIC0gbGVuZ3RoIG9mIGVhY2ggZ3JvdXBcbiAqIEByZXR1cm4ge1tudW1iZXJdfVxuICovXG5mdW5jdGlvbiBpbmRleGVzT2ZHcm91cFNwYWNlcyh0b3RhbExlbmd0aCwgZ3JvdXBTaXplKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBjb3VudGVyID0gMDtcbiAgICBmb3IgKGxldCBpID0gdG90YWxMZW5ndGg7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaWYgKGNvdW50ZXIgPT09IGdyb3VwU2l6ZSkge1xuICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQoaSk7XG4gICAgICAgICAgICBjb3VudGVyID0gMDtcbiAgICAgICAgfVxuICAgICAgICBjb3VudGVyKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXBsYWNlIHRoZSBkZWNpbWFsIHNlcGFyYXRvciB3aXRoIERFQ0lNQUxTRVBBUkFUT1IgYW5kIGluc2VydCB0aG91c2FuZFxuICogc2VwYXJhdG9ycy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHRob3VzYW5kU2VwYXJhdGVkIC0gYHRydWVgIGlmIHRoZSBjaGFyYWN0ZXJpc3RpYyBtdXN0IGJlIHNlcGFyYXRlZFxuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZWNpbWFsU2VwYXJhdG9yIC0gc3RyaW5nIHRvIHVzZSBhcyBkZWNpbWFsIHNlcGFyYXRvclxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiByZXBsYWNlRGVsaW1pdGVycyhvdXRwdXQsIHZhbHVlLCB0aG91c2FuZFNlcGFyYXRlZCwgc3RhdGUsIGRlY2ltYWxTZXBhcmF0b3IpIHtcbiAgICBsZXQgZGVsaW1pdGVycyA9IHN0YXRlLmN1cnJlbnREZWxpbWl0ZXJzKCk7XG4gICAgbGV0IHRob3VzYW5kU2VwYXJhdG9yID0gZGVsaW1pdGVycy50aG91c2FuZHM7XG4gICAgZGVjaW1hbFNlcGFyYXRvciA9IGRlY2ltYWxTZXBhcmF0b3IgfHwgZGVsaW1pdGVycy5kZWNpbWFsO1xuICAgIGxldCB0aG91c2FuZHNTaXplID0gZGVsaW1pdGVycy50aG91c2FuZHNTaXplIHx8IDM7XG5cbiAgICBsZXQgcmVzdWx0ID0gb3V0cHV0LnRvU3RyaW5nKCk7XG4gICAgbGV0IGNoYXJhY3RlcmlzdGljID0gcmVzdWx0LnNwbGl0KFwiLlwiKVswXTtcbiAgICBsZXQgbWFudGlzc2EgPSByZXN1bHQuc3BsaXQoXCIuXCIpWzFdO1xuXG4gICAgaWYgKHRob3VzYW5kU2VwYXJhdGVkKSB7XG4gICAgICAgIGlmICh2YWx1ZSA8IDApIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbWludXMgc2lnblxuICAgICAgICAgICAgY2hhcmFjdGVyaXN0aWMgPSBjaGFyYWN0ZXJpc3RpYy5zbGljZSgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbmRleGVzVG9JbnNlcnRUaG91c2FuZERlbGltaXRlcnMgPSBpbmRleGVzT2ZHcm91cFNwYWNlcyhjaGFyYWN0ZXJpc3RpYy5sZW5ndGgsIHRob3VzYW5kc1NpemUpO1xuICAgICAgICBpbmRleGVzVG9JbnNlcnRUaG91c2FuZERlbGltaXRlcnMuZm9yRWFjaCgocG9zaXRpb24sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLnNsaWNlKDAsIHBvc2l0aW9uICsgaW5kZXgpICsgdGhvdXNhbmRTZXBhcmF0b3IgKyBjaGFyYWN0ZXJpc3RpYy5zbGljZShwb3NpdGlvbiArIGluZGV4KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHZhbHVlIDwgMCkge1xuICAgICAgICAgICAgLy8gQWRkIGJhY2sgdGhlIG1pbnVzIHNpZ25cbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljID0gYC0ke2NoYXJhY3RlcmlzdGljfWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW1hbnRpc3NhKSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljICsgZGVjaW1hbFNlcGFyYXRvciArIG1hbnRpc3NhO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgcHJvdmlkZWQgQUJCUkVWSUFUSU9OIGF0IHRoZSBlbmQgb2YgT1VUUFVULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtzdHJpbmd9IGFiYnJldmlhdGlvbiAtIGFiYnJldmlhdGlvbiB0byBhcHBlbmRcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbikge1xuICAgIHJldHVybiBvdXRwdXQgKyBhYmJyZXZpYXRpb247XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwb3NpdGl2ZS9uZWdhdGl2ZSBzaWduIGFjY29yZGluZyB0byB0aGUgTkVHQVRJVkUgZmxhZy5cbiAqIElmIHRoZSB2YWx1ZSBpcyBuZWdhdGl2ZSBidXQgc3RpbGwgb3V0cHV0IGFzIDAsIHRoZSBuZWdhdGl2ZSBzaWduIGlzIHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtzdHJpbmd9IG5lZ2F0aXZlIC0gZmxhZyBmb3IgdGhlIG5lZ2F0aXZlIGZvcm0gKFwic2lnblwiIG9yIFwicGFyZW50aGVzaXNcIilcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydFNpZ24ob3V0cHV0LCB2YWx1ZSwgbmVnYXRpdmUpIHtcbiAgICBpZiAodmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBpZiAoK291dHB1dCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb3V0cHV0LnJlcGxhY2UoXCItXCIsIFwiXCIpO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSA+IDApIHtcbiAgICAgICAgcmV0dXJuIGArJHtvdXRwdXR9YDtcbiAgICB9XG5cbiAgICBpZiAobmVnYXRpdmUgPT09IFwic2lnblwiKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGAoJHtvdXRwdXQucmVwbGFjZShcIi1cIiwgXCJcIil9KWA7XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwcm92aWRlZCBQUkVGSVggYXQgdGhlIHN0YXJ0IG9mIE9VVFBVVC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXggLSBhYmJyZXZpYXRpb24gdG8gcHJlcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0UHJlZml4KG91dHB1dCwgcHJlZml4KSB7XG4gICAgcmV0dXJuIHByZWZpeCArIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHByb3ZpZGVkIFBPU1RGSVggYXQgdGhlIGVuZCBvZiBPVVRQVVQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gcG9zdGZpeCAtIGFiYnJldmlhdGlvbiB0byBhcHBlbmRcbiAqIEByZXR1cm4geyp9XG4gKi9cbmZ1bmN0aW9uIGluc2VydFBvc3RmaXgob3V0cHV0LCBwb3N0Zml4KSB7XG4gICAgcmV0dXJuIG91dHB1dCArIHBvc3RmaXg7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIG51bWJlciB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICogVGhpcyBpcyB0aGUga2V5IG1ldGhvZCBvZiB0aGUgZnJhbWV3b3JrIVxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IFtwcm92aWRlZEZvcm1hdF0gLSBzcGVjaWZpY2F0aW9uIGZvciBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge2dsb2JhbFN0YXRlfSBzdGF0ZSAtIHNoYXJlZCBzdGF0ZSBvZiB0aGUgbGlicmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IGRlY2ltYWxTZXBhcmF0b3IgLSBzdHJpbmcgdG8gdXNlIGFzIGRlY2ltYWwgc2VwYXJhdG9yXG4gKiBAcGFyYW0ge3t9fSBkZWZhdWx0cyAtIFNldCBvZiBkZWZhdWx0IHZhbHVlcyB1c2VkIGZvciBmb3JtYXR0aW5nXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE51bWJlcih7aW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSA9IGdsb2JhbFN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yLCBkZWZhdWx0cyA9IHN0YXRlLmN1cnJlbnREZWZhdWx0cygpfSkge1xuICAgIGxldCB2YWx1ZSA9IGluc3RhbmNlLl92YWx1ZTtcblxuICAgIGlmICh2YWx1ZSA9PT0gMCAmJiBzdGF0ZS5oYXNaZXJvRm9ybWF0KCkpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmdldFplcm9Gb3JtYXQoKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzRmluaXRlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBkZWZhdWx0cywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgbGV0IHRvdGFsTGVuZ3RoID0gb3B0aW9ucy50b3RhbExlbmd0aDtcbiAgICBsZXQgY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gPSB0b3RhbExlbmd0aCA/IDAgOiBvcHRpb25zLmNoYXJhY3RlcmlzdGljO1xuICAgIGxldCBvcHRpb25hbENoYXJhY3RlcmlzdGljID0gb3B0aW9ucy5vcHRpb25hbENoYXJhY3RlcmlzdGljO1xuICAgIGxldCBmb3JjZUF2ZXJhZ2UgPSBvcHRpb25zLmZvcmNlQXZlcmFnZTtcbiAgICBsZXQgYXZlcmFnZSA9ICEhdG90YWxMZW5ndGggfHwgISFmb3JjZUF2ZXJhZ2UgfHwgb3B0aW9ucy5hdmVyYWdlO1xuXG4gICAgLy8gZGVmYXVsdCB3aGVuIGF2ZXJhZ2luZyBpcyB0byBjaG9wIG9mZiBkZWNpbWFsc1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IHRvdGFsTGVuZ3RoID8gLTEgOiAoYXZlcmFnZSAmJiBwcm92aWRlZEZvcm1hdC5tYW50aXNzYSA9PT0gdW5kZWZpbmVkID8gMCA6IG9wdGlvbnMubWFudGlzc2EpO1xuICAgIGxldCBvcHRpb25hbE1hbnRpc3NhID0gdG90YWxMZW5ndGggPyBmYWxzZSA6IChwcm92aWRlZEZvcm1hdC5vcHRpb25hbE1hbnRpc3NhID09PSB1bmRlZmluZWQgPyBtYW50aXNzYVByZWNpc2lvbiA9PT0gLTEgOiBvcHRpb25zLm9wdGlvbmFsTWFudGlzc2EpO1xuICAgIGxldCB0cmltTWFudGlzc2EgPSBvcHRpb25zLnRyaW1NYW50aXNzYTtcbiAgICBsZXQgdGhvdXNhbmRTZXBhcmF0ZWQgPSBvcHRpb25zLnRob3VzYW5kU2VwYXJhdGVkO1xuICAgIGxldCBzcGFjZVNlcGFyYXRlZCA9IG9wdGlvbnMuc3BhY2VTZXBhcmF0ZWQ7XG4gICAgbGV0IG5lZ2F0aXZlID0gb3B0aW9ucy5uZWdhdGl2ZTtcbiAgICBsZXQgZm9yY2VTaWduID0gb3B0aW9ucy5mb3JjZVNpZ247XG4gICAgbGV0IGV4cG9uZW50aWFsID0gb3B0aW9ucy5leHBvbmVudGlhbDtcblxuICAgIGxldCBhYmJyZXZpYXRpb24gPSBcIlwiO1xuXG4gICAgaWYgKGF2ZXJhZ2UpIHtcbiAgICAgICAgbGV0IGRhdGEgPSBjb21wdXRlQXZlcmFnZSh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGZvcmNlQXZlcmFnZSxcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbnM6IHN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCksXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZDogc3BhY2VTZXBhcmF0ZWQsXG4gICAgICAgICAgICB0b3RhbExlbmd0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YWx1ZSA9IGRhdGEudmFsdWU7XG4gICAgICAgIGFiYnJldmlhdGlvbiArPSBkYXRhLmFiYnJldmlhdGlvbjtcblxuICAgICAgICBpZiAodG90YWxMZW5ndGgpIHtcbiAgICAgICAgICAgIG1hbnRpc3NhUHJlY2lzaW9uID0gZGF0YS5tYW50aXNzYVByZWNpc2lvbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHBvbmVudGlhbCkge1xuICAgICAgICBsZXQgZGF0YSA9IGNvbXB1dGVFeHBvbmVudGlhbCh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhbHVlID0gZGF0YS52YWx1ZTtcbiAgICAgICAgYWJicmV2aWF0aW9uID0gZGF0YS5hYmJyZXZpYXRpb24gKyBhYmJyZXZpYXRpb247XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IHNldE1hbnRpc3NhUHJlY2lzaW9uKHZhbHVlLnRvU3RyaW5nKCksIHZhbHVlLCBvcHRpb25hbE1hbnRpc3NhLCBtYW50aXNzYVByZWNpc2lvbiwgdHJpbU1hbnRpc3NhKTtcbiAgICBvdXRwdXQgPSBzZXRDaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbENoYXJhY3RlcmlzdGljLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbik7XG4gICAgb3V0cHV0ID0gcmVwbGFjZURlbGltaXRlcnMob3V0cHV0LCB2YWx1ZSwgdGhvdXNhbmRTZXBhcmF0ZWQsIHN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yKTtcblxuICAgIGlmIChhdmVyYWdlIHx8IGV4cG9uZW50aWFsKSB7XG4gICAgICAgIG91dHB1dCA9IGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKGZvcmNlU2lnbiB8fCB2YWx1ZSA8IDApIHtcbiAgICAgICAgb3V0cHV0ID0gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJZiBGT1JNQVQgaXMgbm9uLW51bGwgYW5kIG5vdCBqdXN0IGFuIG91dHB1dCwgcmV0dXJuIEZPUk1BVC5cbiAqIFJldHVybiBERUZBVUxURk9STUFUIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZWRGb3JtYXRcbiAqIEBwYXJhbSBkZWZhdWx0Rm9ybWF0XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZGVmYXVsdEZvcm1hdCkge1xuICAgIGlmICghcHJvdmlkZWRGb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwcm92aWRlZEZvcm1hdCk7XG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFwib3V0cHV0XCIpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3ZpZGVkRm9ybWF0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChudW1icm8pID0+ICh7XG4gICAgZm9ybWF0OiAoLi4uYXJncykgPT4gZm9ybWF0KC4uLmFyZ3MsIG51bWJybyksXG4gICAgZ2V0Qnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXRCeXRlVW5pdCguLi5hcmdzLCBudW1icm8pLFxuICAgIGdldEJpbmFyeUJ5dGVVbml0OiAoLi4uYXJncykgPT4gZ2V0QmluYXJ5Qnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBnZXREZWNpbWFsQnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXREZWNpbWFsQnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBmb3JtYXRPckRlZmF1bHRcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGVuVVMgPSByZXF1aXJlKFwiLi9lbi1VU1wiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmxldCBzdGF0ZSA9IHt9O1xuXG5sZXQgY3VycmVudExhbmd1YWdlVGFnID0gdW5kZWZpbmVkO1xubGV0IGxhbmd1YWdlcyA9IHt9O1xuXG5sZXQgemVyb0Zvcm1hdCA9IG51bGw7XG5cbmxldCBnbG9iYWxEZWZhdWx0cyA9IHt9O1xuXG5mdW5jdGlvbiBjaG9vc2VMYW5ndWFnZSh0YWcpIHsgY3VycmVudExhbmd1YWdlVGFnID0gdGFnOyB9XG5cbmZ1bmN0aW9uIGN1cnJlbnRMYW5ndWFnZURhdGEoKSB7IHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlVGFnXTsgfVxuXG4vKipcbiAqIFJldHVybiBhbGwgdGhlIHJlZ2lzdGVyIGxhbmd1YWdlc1xuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5sYW5ndWFnZXMgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBsYW5ndWFnZXMpO1xuXG4vL1xuLy8gQ3VycmVudCBsYW5ndWFnZSBhY2Nlc3NvcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIHRhZ1xuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuc3RhdGUuY3VycmVudExhbmd1YWdlID0gKCkgPT4gY3VycmVudExhbmd1YWdlVGFnO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRDdXJyZW5jeSA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgYWJicmV2aWF0aW9ucyBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLmFiYnJldmlhdGlvbnM7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRlbGltaXRlcnMgZGF0YVxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50RGVsaW1pdGVycyA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5kZWxpbWl0ZXJzO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBvcmRpbmFsIGZ1bmN0aW9uXG4gKlxuICogQHJldHVybiB7ZnVuY3Rpb259XG4gKi9cbnN0YXRlLmN1cnJlbnRPcmRpbmFsID0gKCkgPT4gY3VycmVudExhbmd1YWdlRGF0YSgpLm9yZGluYWw7XG5cbi8vXG4vLyBEZWZhdWx0c1xuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgZm9ybWF0dGluZyBkZWZhdWx0cy5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIGdsb2JhbGx5IGRlZmluZWQgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnREZWZhdWx0cyA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5kZWZhdWx0cywgZ2xvYmFsRGVmYXVsdHMpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgb3JkaW5hbCBkZWZhdWx0LWZvcm1hdC5cbiAqIFVzZSBmaXJzdCB1c2VzIHRoZSBjdXJyZW50IGxhbmd1YWdlIG9yZGluYWwgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudE9yZGluYWxEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5vcmRpbmFsRm9ybWF0KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGJ5dGUgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBieXRlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuYnl0ZUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwZXJjZW50YWdlIGRlZmF1bHQtZm9ybWF0LlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgcGVyY2VudGFnZSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50UGVyY2VudGFnZURlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLnBlcmNlbnRhZ2VGb3JtYXQpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVuY3kgZGVmYXVsdC1mb3JtYXQuXG4gKiBVc2UgZmlyc3QgdXNlcyB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0aW1lIGRlZmF1bHQtZm9ybWF0LlxuICogVXNlIGZpcnN0IHVzZXMgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgY3VycmVuY3kgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudFRpbWVEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS50aW1lRm9ybWF0KTtcblxuLyoqXG4gKiBTZXQgdGhlIGdsb2JhbCBmb3JtYXR0aW5nIGRlZmF1bHRzLlxuICpcbiAqIEBwYXJhbSB7e318c3RyaW5nfSBmb3JtYXQgLSBmb3JtYXR0aW5nIG9wdGlvbnMgdG8gdXNlIGFzIGRlZmF1bHRzXG4gKi9cbnN0YXRlLnNldERlZmF1bHRzID0gKGZvcm1hdCkgPT4ge1xuICAgIGZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQoZm9ybWF0KTtcbiAgICBpZiAodmFsaWRhdGluZy52YWxpZGF0ZUZvcm1hdChmb3JtYXQpKSB7XG4gICAgICAgIGdsb2JhbERlZmF1bHRzID0gZm9ybWF0O1xuICAgIH1cbn07XG5cbi8vXG4vLyBaZXJvIGZvcm1hdFxuLy9cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGZvcm1hdCBzdHJpbmcgZm9yIDAuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5zdGF0ZS5nZXRaZXJvRm9ybWF0ID0gKCkgPT4gemVyb0Zvcm1hdDtcblxuLyoqXG4gKiBTZXQgYSBTVFJJTkcgdG8gb3V0cHV0IHdoZW4gdGhlIHZhbHVlIGlzIDAuXG4gKlxuICogQHBhcmFtIHt7fXxzdHJpbmd9IHN0cmluZyAtIHN0cmluZyB0byBzZXRcbiAqL1xuc3RhdGUuc2V0WmVyb0Zvcm1hdCA9IChzdHJpbmcpID0+IHplcm9Gb3JtYXQgPSB0eXBlb2Yoc3RyaW5nKSA9PT0gXCJzdHJpbmdcIiA/IHN0cmluZyA6IG51bGw7XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgYSBmb3JtYXQgZm9yIDAgaGFzIGJlZW4gc2V0IGFscmVhZHkuXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuc3RhdGUuaGFzWmVyb0Zvcm1hdCA9ICgpID0+IHplcm9Gb3JtYXQgIT09IG51bGw7XG5cbi8vXG4vLyBHZXR0ZXJzL1NldHRlcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYW5ndWFnZSBkYXRhIGZvciB0aGUgcHJvdmlkZWQgVEFHLlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGRhdGEgaWYgbm8gdGFnIGlzIHByb3ZpZGVkLlxuICpcbiAqIFRocm93IGFuIGVycm9yIGlmIHRoZSB0YWcgZG9lc24ndCBtYXRjaCBhbnkgcmVnaXN0ZXJlZCBsYW5ndWFnZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW3RhZ10gLSBsYW5ndWFnZSB0YWcgb2YgYSByZWdpc3RlcmVkIGxhbmd1YWdlXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUubGFuZ3VhZ2VEYXRhID0gKHRhZykgPT4ge1xuICAgIGlmICh0YWcpIHtcbiAgICAgICAgaWYgKGxhbmd1YWdlc1t0YWddKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFuZ3VhZ2VzW3RhZ107XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRhZyBcIiR7dGFnfVwiYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnJlbnRMYW5ndWFnZURhdGEoKTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgdGhlIHByb3ZpZGVkIERBVEEgYXMgYSBsYW5ndWFnZSBpZiBhbmQgb25seSBpZiB0aGUgZGF0YSBpcyB2YWxpZC5cbiAqIElmIHRoZSBkYXRhIGlzIG5vdCB2YWxpZCwgYW4gZXJyb3IgaXMgdGhyb3duLlxuICpcbiAqIFdoZW4gVVNFTEFOR1VBR0UgaXMgdHJ1ZSwgdGhlIHJlZ2lzdGVyZWQgbGFuZ3VhZ2UgaXMgdGhlbiB1c2VkLlxuICpcbiAqIEBwYXJhbSB7e319IGRhdGEgLSBsYW5ndWFnZSBkYXRhIHRvIHJlZ2lzdGVyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFt1c2VMYW5ndWFnZV0gLSBgdHJ1ZWAgaWYgdGhlIHByb3ZpZGVkIGRhdGEgc2hvdWxkIGJlY29tZSB0aGUgY3VycmVudCBsYW5ndWFnZVxuICovXG5zdGF0ZS5yZWdpc3Rlckxhbmd1YWdlID0gKGRhdGEsIHVzZUxhbmd1YWdlID0gZmFsc2UpID0+IHtcbiAgICBpZiAoIXZhbGlkYXRpbmcudmFsaWRhdGVMYW5ndWFnZShkYXRhKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGxhbmd1YWdlIGRhdGFcIik7XG4gICAgfVxuXG4gICAgbGFuZ3VhZ2VzW2RhdGEubGFuZ3VhZ2VUYWddID0gZGF0YTtcblxuICAgIGlmICh1c2VMYW5ndWFnZSkge1xuICAgICAgICBjaG9vc2VMYW5ndWFnZShkYXRhLmxhbmd1YWdlVGFnKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY3VycmVudCBsYW5ndWFnZSBhY2NvcmRpbmcgdG8gVEFHLlxuICogSWYgVEFHIGRvZXNuJ3QgbWF0Y2ggYSByZWdpc3RlcmVkIGxhbmd1YWdlLCBhbm90aGVyIGxhbmd1YWdlIG1hdGNoaW5nXG4gKiB0aGUgXCJsYW5ndWFnZVwiIHBhcnQgb2YgdGhlIHRhZyAoYWNjb3JkaW5nIHRvIEJDUDQ3OiBodHRwczovL3Rvb2xzLmlldGYub3JnL3JmYy9iY3AvYmNwNDcudHh0KS5cbiAqIElmIG5vbmUsIHRoZSBGQUxMQkFDS1RBRyBpcyB1c2VkLiBJZiB0aGUgRkFMTEJBQ0tUQUcgZG9lc24ndCBtYXRjaCBhIHJlZ2lzdGVyIGxhbmd1YWdlLFxuICogYGVuLVVTYCBpcyBmaW5hbGx5IHVzZWQuXG4gKlxuICogQHBhcmFtIHRhZ1xuICogQHBhcmFtIGZhbGxiYWNrVGFnXG4gKi9cbnN0YXRlLnNldExhbmd1YWdlID0gKHRhZywgZmFsbGJhY2tUYWcgPSBlblVTLmxhbmd1YWdlVGFnKSA9PiB7XG4gICAgaWYgKCFsYW5ndWFnZXNbdGFnXSkge1xuICAgICAgICBsZXQgc3VmZml4ID0gdGFnLnNwbGl0KFwiLVwiKVswXTtcblxuICAgICAgICBsZXQgbWF0Y2hpbmdMYW5ndWFnZVRhZyA9IE9iamVjdC5rZXlzKGxhbmd1YWdlcykuZmluZChlYWNoID0+IHtcbiAgICAgICAgICAgIHJldHVybiBlYWNoLnNwbGl0KFwiLVwiKVswXSA9PT0gc3VmZml4O1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWxhbmd1YWdlc1ttYXRjaGluZ0xhbmd1YWdlVGFnXSkge1xuICAgICAgICAgICAgY2hvb3NlTGFuZ3VhZ2UoZmFsbGJhY2tUYWcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hvb3NlTGFuZ3VhZ2UobWF0Y2hpbmdMYW5ndWFnZVRhZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaG9vc2VMYW5ndWFnZSh0YWcpO1xufTtcblxuc3RhdGUucmVnaXN0ZXJMYW5ndWFnZShlblVTKTtcbmN1cnJlbnRMYW5ndWFnZVRhZyA9IGVuVVMubGFuZ3VhZ2VUYWc7XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGU7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBMb2FkIGxhbmd1YWdlcyBtYXRjaGluZyBUQUdTLiBTaWxlbnRseSBwYXNzIG92ZXIgdGhlIGZhaWxpbmcgbG9hZC5cbiAqXG4gKiBXZSBhc3N1bWUgaGVyZSB0aGF0IHdlIGFyZSBpbiBhIG5vZGUgZW52aXJvbm1lbnQsIHNvIHdlIGRvbid0IGNoZWNrIGZvciBpdC5cbiAqIEBwYXJhbSB7W1N0cmluZ119IHRhZ3MgLSBsaXN0IG9mIHRhZ3MgdG8gbG9hZFxuICogQHBhcmFtIHtOdW1icm99IG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKi9cbmZ1bmN0aW9uIGxvYWRMYW5ndWFnZXNJbk5vZGUodGFncywgbnVtYnJvKSB7XG4gICAgdGFncy5mb3JFYWNoKCh0YWcpID0+IHtcbiAgICAgICAgbGV0IGRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkYXRhID0gcmVxdWlyZShgLi4vbGFuZ3VhZ2VzLyR7dGFnfWApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFibGUgdG8gbG9hZCBcIiR7dGFnfVwiLiBObyBtYXRjaGluZyBsYW5ndWFnZSBmaWxlIGZvdW5kLmApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBudW1icm8ucmVnaXN0ZXJMYW5ndWFnZShkYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChudW1icm8pID0+ICh7XG4gICAgbG9hZExhbmd1YWdlc0luTm9kZTogKHRhZ3MpID0+IGxvYWRMYW5ndWFnZXNJbk5vZGUodGFncywgbnVtYnJvKVxufSk7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgQmlnTnVtYmVyID0gcmVxdWlyZShcImJpZ251bWJlci5qc1wiKTtcblxuLyoqXG4gKiBBZGQgYSBudW1iZXIgb3IgYSBudW1icm8gdG8gTi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIGF1Z2VuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIGFkZGVuZFxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBhZGQobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5wbHVzKG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogU3VidHJhY3QgYSBudW1iZXIgb3IgYSBudW1icm8gZnJvbSBOLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbWludWVuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIHN1YnRyYWhlbmRcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gc3VidHJhY3Qobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5taW51cyhvdGhlclZhbHVlKS50b051bWJlcigpO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIE11bHRpcGx5IE4gYnkgYSBudW1iZXIgb3IgYSBudW1icm8uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBtdWx0aXBsaWNhbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBtdWx0aXBsaWVyXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7TnVtYnJvfSBuXG4gKi9cbmZ1bmN0aW9uIG11bHRpcGx5KG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUudGltZXMob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBEaXZpZGUgTiBieSBhIG51bWJlciBvciBhIG51bWJyby5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIGRpdmlkZW5kXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyIC0gZGl2aXNvclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBkaXZpZGUobiwgb3RoZXIsIG51bWJybykge1xuICAgIGxldCB2YWx1ZSA9IG5ldyBCaWdOdW1iZXIobi5fdmFsdWUpO1xuICAgIGxldCBvdGhlclZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICBvdGhlclZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG90aGVyVmFsdWUgPSBuZXcgQmlnTnVtYmVyKG90aGVyVmFsdWUpO1xuXG4gICAgbi5fdmFsdWUgPSB2YWx1ZS5kaXZpZGVkQnkob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBTZXQgTiB0byB0aGUgT1RIRVIgKG9yIHRoZSB2YWx1ZSBvZiBPVEhFUiB3aGVuIGl0J3MgYSBudW1icm8gaW5zdGFuY2UpLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbnVtYnJvIGluc3RhbmNlIHRvIG11dGF0ZVxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIG5ldyB2YWx1ZSB0byBhc3NpZ24gdG8gTlxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBzZXQgKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBvdGhlcjtcblxuICAgIGlmIChudW1icm8uaXNOdW1icm8ob3RoZXIpKSB7XG4gICAgICAgIHZhbHVlID0gb3RoZXIuX3ZhbHVlO1xuICAgIH1cblxuICAgIG4uX3ZhbHVlID0gdmFsdWU7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIE4gYW5kIE9USEVSLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBkaWZmZXJlbmNlKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgY2xvbmUgPSBudW1icm8obi5fdmFsdWUpO1xuICAgIHN1YnRyYWN0KGNsb25lLCBvdGhlciwgbnVtYnJvKTtcblxuICAgIHJldHVybiBNYXRoLmFicyhjbG9uZS5fdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG51bWJybyA9PiAoe1xuICAgIGFkZDogKG4sIG90aGVyKSA9PiBhZGQobiwgb3RoZXIsIG51bWJybyksXG4gICAgc3VidHJhY3Q6IChuLCBvdGhlcikgPT4gc3VidHJhY3Qobiwgb3RoZXIsIG51bWJybyksXG4gICAgbXVsdGlwbHk6IChuLCBvdGhlcikgPT4gbXVsdGlwbHkobiwgb3RoZXIsIG51bWJybyksXG4gICAgZGl2aWRlOiAobiwgb3RoZXIpID0+IGRpdmlkZShuLCBvdGhlciwgbnVtYnJvKSxcbiAgICBzZXQ6IChuLCBvdGhlcikgPT4gc2V0KG4sIG90aGVyLCBudW1icm8pLFxuICAgIGRpZmZlcmVuY2U6IChuLCBvdGhlcikgPT4gZGlmZmVyZW5jZShuLCBvdGhlciwgbnVtYnJvKVxufSk7XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgVkVSU0lPTiA9IFwiMi4xLjJcIjtcblxuY29uc3QgZ2xvYmFsU3RhdGUgPSByZXF1aXJlKFwiLi9nbG9iYWxTdGF0ZVwiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRpbmdcIik7XG5jb25zdCBsb2FkZXIgPSByZXF1aXJlKFwiLi9sb2FkaW5nXCIpKG51bWJybyk7XG5jb25zdCB1bmZvcm1hdHRlciA9IHJlcXVpcmUoXCIuL3VuZm9ybWF0dGluZ1wiKTtcbmxldCBmb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi9mb3JtYXR0aW5nXCIpKG51bWJybyk7XG5sZXQgbWFuaXB1bGF0ZSA9IHJlcXVpcmUoXCIuL21hbmlwdWxhdGluZ1wiKShudW1icm8pO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmNsYXNzIE51bWJybyB7XG4gICAgY29uc3RydWN0b3IobnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVtYmVyO1xuICAgIH1cblxuICAgIGNsb25lKCkgeyByZXR1cm4gbnVtYnJvKHRoaXMuX3ZhbHVlKTsgfVxuXG4gICAgZm9ybWF0KGZvcm1hdCA9IHt9KSB7IHJldHVybiBmb3JtYXR0ZXIuZm9ybWF0KHRoaXMsIGZvcm1hdCk7IH1cblxuICAgIGZvcm1hdEN1cnJlbmN5KGZvcm1hdCkge1xuICAgICAgICBpZiAodHlwZW9mIGZvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZm9ybWF0ID0gcGFyc2luZy5wYXJzZUZvcm1hdChmb3JtYXQpO1xuICAgICAgICB9XG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdHRlci5mb3JtYXRPckRlZmF1bHQoZm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICBmb3JtYXQub3V0cHV0ID0gXCJjdXJyZW5jeVwiO1xuICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIGZvcm1hdFRpbWUoZm9ybWF0ID0ge30pIHtcbiAgICAgICAgZm9ybWF0Lm91dHB1dCA9IFwidGltZVwiO1xuICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIGJpbmFyeUJ5dGVVbml0cygpIHsgcmV0dXJuIGZvcm1hdHRlci5nZXRCaW5hcnlCeXRlVW5pdCh0aGlzKTt9XG5cbiAgICBkZWNpbWFsQnl0ZVVuaXRzKCkgeyByZXR1cm4gZm9ybWF0dGVyLmdldERlY2ltYWxCeXRlVW5pdCh0aGlzKTt9XG5cbiAgICBieXRlVW5pdHMoKSB7IHJldHVybiBmb3JtYXR0ZXIuZ2V0Qnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgZGlmZmVyZW5jZShvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5kaWZmZXJlbmNlKHRoaXMsIG90aGVyKTsgfVxuXG4gICAgYWRkKG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLmFkZCh0aGlzLCBvdGhlcik7IH1cblxuICAgIHN1YnRyYWN0KG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLnN1YnRyYWN0KHRoaXMsIG90aGVyKTsgfVxuXG4gICAgbXVsdGlwbHkob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUubXVsdGlwbHkodGhpcywgb3RoZXIpOyB9XG5cbiAgICBkaXZpZGUob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUuZGl2aWRlKHRoaXMsIG90aGVyKTsgfVxuXG4gICAgc2V0KGlucHV0KSB7IHJldHVybiBtYW5pcHVsYXRlLnNldCh0aGlzLCBub3JtYWxpemVJbnB1dChpbnB1dCkpOyB9XG5cbiAgICB2YWx1ZSgpIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG5cbiAgICB2YWx1ZU9mKCkgeyByZXR1cm4gdGhpcy5fdmFsdWU7IH1cbn1cblxuLyoqXG4gKiBNYWtlIGl0cyBiZXN0IHRvIGNvbnZlcnQgaW5wdXQgaW50byBhIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge251bWJyb3xzdHJpbmd8bnVtYmVyfSBpbnB1dCAtIElucHV0IHRvIGNvbnZlcnRcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplSW5wdXQoaW5wdXQpIHtcbiAgICBsZXQgcmVzdWx0ID0gaW5wdXQ7XG4gICAgaWYgKG51bWJyby5pc051bWJybyhpbnB1dCkpIHtcbiAgICAgICAgcmVzdWx0ID0gaW5wdXQuX3ZhbHVlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJlc3VsdCA9IG51bWJyby51bmZvcm1hdChpbnB1dCk7XG4gICAgfSBlbHNlIGlmIChpc05hTihpbnB1dCkpIHtcbiAgICAgICAgcmVzdWx0ID0gTmFOO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIG51bWJybyhpbnB1dCkge1xuICAgIHJldHVybiBuZXcgTnVtYnJvKG5vcm1hbGl6ZUlucHV0KGlucHV0KSk7XG59XG5cbm51bWJyby52ZXJzaW9uID0gVkVSU0lPTjtcblxubnVtYnJvLmlzTnVtYnJvID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIE51bWJybztcbn07XG5cbi8vXG4vLyBgbnVtYnJvYCBzdGF0aWMgbWV0aG9kc1xuLy9cblxubnVtYnJvLmxhbmd1YWdlID0gZ2xvYmFsU3RhdGUuY3VycmVudExhbmd1YWdlO1xubnVtYnJvLnJlZ2lzdGVyTGFuZ3VhZ2UgPSBnbG9iYWxTdGF0ZS5yZWdpc3Rlckxhbmd1YWdlO1xubnVtYnJvLnNldExhbmd1YWdlID0gZ2xvYmFsU3RhdGUuc2V0TGFuZ3VhZ2U7XG5udW1icm8ubGFuZ3VhZ2VzID0gZ2xvYmFsU3RhdGUubGFuZ3VhZ2VzO1xubnVtYnJvLmxhbmd1YWdlRGF0YSA9IGdsb2JhbFN0YXRlLmxhbmd1YWdlRGF0YTtcbm51bWJyby56ZXJvRm9ybWF0ID0gZ2xvYmFsU3RhdGUuc2V0WmVyb0Zvcm1hdDtcbm51bWJyby5kZWZhdWx0Rm9ybWF0ID0gZ2xvYmFsU3RhdGUuY3VycmVudERlZmF1bHRzO1xubnVtYnJvLnNldERlZmF1bHRzID0gZ2xvYmFsU3RhdGUuc2V0RGVmYXVsdHM7XG5udW1icm8uZGVmYXVsdEN1cnJlbmN5Rm9ybWF0ID0gZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdDtcbm51bWJyby52YWxpZGF0ZSA9IHZhbGlkYXRvci52YWxpZGF0ZTtcbm51bWJyby5sb2FkTGFuZ3VhZ2VzSW5Ob2RlID0gbG9hZGVyLmxvYWRMYW5ndWFnZXNJbk5vZGU7XG5udW1icm8udW5mb3JtYXQgPSB1bmZvcm1hdHRlci51bmZvcm1hdDtcblxubW9kdWxlLmV4cG9ydHMgPSBudW1icm87XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIHByZWZpeC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VQcmVmaXgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL157KFtefV0qKX0vKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnByZWZpeCA9IG1hdGNoWzFdO1xuICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIHBvc3RmaXguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlUG9zdGZpeChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYXRjaCA9IHN0cmluZy5tYXRjaCgveyhbXn1dKil9JC8pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgICByZXN1bHQucG9zdGZpeCA9IG1hdGNoWzFdO1xuXG4gICAgICAgIHJldHVybiBzdHJpbmcuc2xpY2UoMCwgLW1hdGNoWzBdLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgb3V0cHV0IHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICovXG5mdW5jdGlvbiBwYXJzZU91dHB1dChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIiRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImN1cnJlbmN5XCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIlXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJwZXJjZW50XCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJiZFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwiYnl0ZVwiO1xuICAgICAgICByZXN1bHQuYmFzZSA9IFwiZ2VuZXJhbFwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwiYnl0ZVwiO1xuICAgICAgICByZXN1bHQuYmFzZSA9IFwiYmluYXJ5XCI7XG4gICAgICAgIHJldHVybjtcblxuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcImRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImRlY2ltYWxcIjtcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiOlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwidGltZVwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwib1wiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwib3JkaW5hbFwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgdGhvdXNhbmQgc2VwYXJhdGVkIHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZVRob3VzYW5kU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiLFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LnRob3VzYW5kU2VwYXJhdGVkID0gdHJ1ZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHNwYWNlIHNlcGFyYXRlZCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VTcGFjZVNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIiBcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5zcGFjZVNlcGFyYXRlZCA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSB0b3RhbCBsZW5ndGguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlVG90YWxMZW5ndGgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL1sxLTldK1swLTldKi8pO1xuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC50b3RhbExlbmd0aCA9ICttYXRjaFswXTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIGNoYXJhY3RlcmlzdGljIGxlbmd0aC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHN0cmluZy5zcGxpdChcIi5cIilbMF07XG4gICAgbGV0IG1hdGNoID0gY2hhcmFjdGVyaXN0aWMubWF0Y2goLzArLyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC5jaGFyYWN0ZXJpc3RpYyA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIG1hbnRpc3NhIGxlbmd0aC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VNYW50aXNzYShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYW50aXNzYSA9IHN0cmluZy5zcGxpdChcIi5cIilbMV07XG4gICAgaWYgKG1hbnRpc3NhKSB7XG4gICAgICAgIGxldCBtYXRjaCA9IG1hbnRpc3NhLm1hdGNoKC8wKy8pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHJlc3VsdC5tYW50aXNzYSA9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgYXZlcmFnZSB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmF2ZXJhZ2UgPSB0cnVlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciBhIGZvcmNlZCBhdmVyYWdlIHByZWNpc2lvbi4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VGb3JjZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJLXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJ0aG91c2FuZFwiO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nLmluZGV4T2YoXCJNXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJtaWxsaW9uXCI7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcuaW5kZXhPZihcIkJcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcImJpbGxpb25cIjtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5pbmRleE9mKFwiVFwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlQXZlcmFnZSA9IFwidHJpbGxpb25cIjtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgZmluZGluZyBpZiB0aGUgbWFudGlzc2EgaXMgb3B0aW9uYWwuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlT3B0aW9uYWxNYW50aXNzYShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcubWF0Y2goL1xcW1xcLl0vKSkge1xuICAgICAgICByZXN1bHQub3B0aW9uYWxNYW50aXNzYSA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcubWF0Y2goL1xcLi8pKSB7XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbE1hbnRpc3NhID0gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGZpbmRpbmcgaWYgdGhlIGNoYXJhY3RlcmlzdGljIGlzIG9wdGlvbmFsLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU9wdGlvbmFsQ2hhcmFjdGVyaXN0aWMoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIuXCIpICE9PSAtMSkge1xuICAgICAgICBsZXQgY2hhcmFjdGVyaXN0aWMgPSBzdHJpbmcuc3BsaXQoXCIuXCIpWzBdO1xuICAgICAgICByZXN1bHQub3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLmluZGV4T2YoXCIwXCIpID09PSAtMTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIG5lZ2F0aXZlIGZvcm1hdC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VOZWdhdGl2ZShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcubWF0Y2goL15cXCs/XFwoW14pXSpcXCkkLykpIHtcbiAgICAgICAgcmVzdWx0Lm5lZ2F0aXZlID0gXCJwYXJlbnRoZXNpc1wiO1xuICAgIH1cbiAgICBpZiAoc3RyaW5nLm1hdGNoKC9eXFwrPy0vKSkge1xuICAgICAgICByZXN1bHQubmVnYXRpdmUgPSBcInNpZ25cIjtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgZmluZGluZyBpZiB0aGUgc2lnbiBpcyBtYW5kYXRvcnkuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKi9cbmZ1bmN0aW9uIHBhcnNlRm9yY2VTaWduKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXlxcKy8pKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZVNpZ24gPSB0cnVlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBhbmQgYWNjdW11bGF0aW5nIHRoZSB2YWx1ZXMgaWUgUkVTVUxULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge051bWJyb0Zvcm1hdH0gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VGb3JtYXQoc3RyaW5nLCByZXN1bHQgPSB7fSkge1xuICAgIGlmICh0eXBlb2Ygc3RyaW5nICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgfVxuXG4gICAgc3RyaW5nID0gcGFyc2VQcmVmaXgoc3RyaW5nLCByZXN1bHQpO1xuICAgIHN0cmluZyA9IHBhcnNlUG9zdGZpeChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VPdXRwdXQoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlVG90YWxMZW5ndGgoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlQ2hhcmFjdGVyaXN0aWMoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlT3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUZvcmNlQXZlcmFnZShzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VNYW50aXNzYShzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VPcHRpb25hbE1hbnRpc3NhKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVRob3VzYW5kU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVNwYWNlU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU5lZ2F0aXZlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUZvcmNlU2lnbihzdHJpbmcsIHJlc3VsdCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZUZvcm1hdFxufTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5jb25zdCBhbGxTdWZmaXhlcyA9IFtcbiAgICB7a2V5OiBcIlppQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDcpfSxcbiAgICB7a2V5OiBcIlpCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNyl9LFxuICAgIHtrZXk6IFwiWWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgOCl9LFxuICAgIHtrZXk6IFwiWUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA4KX0sXG4gICAge2tleTogXCJUaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA0KX0sXG4gICAge2tleTogXCJUQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDQpfSxcbiAgICB7a2V5OiBcIlBpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDUpfSxcbiAgICB7a2V5OiBcIlBCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNSl9LFxuICAgIHtrZXk6IFwiTWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgMil9LFxuICAgIHtrZXk6IFwiTUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCAyKX0sXG4gICAge2tleTogXCJLaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCAxKX0sXG4gICAge2tleTogXCJLQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDEpfSxcbiAgICB7a2V5OiBcIkdpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDMpfSxcbiAgICB7a2V5OiBcIkdCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgMyl9LFxuICAgIHtrZXk6IFwiRWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgNil9LFxuICAgIHtrZXk6IFwiRUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA2KX0sXG4gICAge2tleTogXCJCXCIsIGZhY3RvcjogMX1cbl07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBSZWdFeHAgd2hlcmUgUyBnZXQgYWxsIFJlZ0V4cCBzcGVjaWZpYyBjaGFyYWN0ZXJzIGVzY2FwZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHMgLSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgUmVnRXhwXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWy0vXFxcXF4kKis/LigpfFtcXF17fV0vZywgXCJcXFxcJCZcIik7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgY29tcHV0ZSB0aGUgdW5mb3JtYXR0ZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gb3JkaW5hbCAtIGZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgYW4gb3JkaW5hbCBvdXQgb2YgYSBudW1iZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6ZXJvRm9ybWF0IC0gc3RyaW5nIHJlcHJlc2VudGluZyB6ZXJvXG4gKiBAcGFyYW0geyp9IGFiYnJldmlhdGlvbnMgLSBhYmJyZXZpYXRpb25zIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sID0gXCJcIiwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSB7XG4gICAgaWYgKCFpc05hTigraW5wdXRTdHJpbmcpKSB7XG4gICAgICAgIHJldHVybiAraW5wdXRTdHJpbmc7XG4gICAgfVxuXG4gICAgbGV0IHN0cmlwcGVkID0gXCJcIjtcbiAgICAvLyBOZWdhdGl2ZVxuXG4gICAgbGV0IG5ld0lucHV0ID0gaW5wdXRTdHJpbmcucmVwbGFjZSgvKF5bXihdKilcXCgoLiopXFwpKFteKV0qJCkvLCBcIiQxJDIkM1wiKTtcblxuICAgIGlmIChuZXdJbnB1dCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIC0xICogY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUobmV3SW5wdXQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIC8vIEJ5dGVcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsU3VmZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IGFsbFN1ZmZpeGVzW2ldO1xuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2Uoc3VmZml4LmtleSwgXCJcIik7XG5cbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHN0cmlwcGVkLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSAqIHN1ZmZpeC5mYWN0b3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQZXJjZW50XG5cbiAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UoXCIlXCIsIFwiXCIpO1xuXG4gICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpIC8gMTAwO1xuICAgIH1cblxuICAgIC8vIE9yZGluYWxcblxuICAgIGxldCBwb3NzaWJsZU9yZGluYWxWYWx1ZSA9IHBhcnNlRmxvYXQoaW5wdXRTdHJpbmcpO1xuXG4gICAgaWYgKGlzTmFOKHBvc3NpYmxlT3JkaW5hbFZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGxldCBvcmRpbmFsU3RyaW5nID0gb3JkaW5hbChwb3NzaWJsZU9yZGluYWxWYWx1ZSk7XG4gICAgaWYgKG9yZGluYWxTdHJpbmcgJiYgb3JkaW5hbFN0cmluZyAhPT0gXCIuXCIpIHsgLy8gaWYgb3JkaW5hbCBpcyBcIi5cIiBpdCB3aWxsIGJlIGNhdWdodCBuZXh0IHJvdW5kIGluIHRoZSAraW5wdXRTdHJpbmdcbiAgICAgICAgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKG5ldyBSZWdFeHAoYCR7ZXNjYXBlUmVnRXhwKG9yZGluYWxTdHJpbmcpfSRgKSwgXCJcIik7XG5cbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHN0cmlwcGVkLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEF2ZXJhZ2VcblxuICAgIGxldCBpbnZlcnNlZEFiYnJldmlhdGlvbnMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhhYmJyZXZpYXRpb25zKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgaW52ZXJzZWRBYmJyZXZpYXRpb25zW2FiYnJldmlhdGlvbnNba2V5XV0gPSBrZXk7XG4gICAgfSk7XG5cbiAgICBsZXQgYWJicmV2aWF0aW9uVmFsdWVzID0gT2JqZWN0LmtleXMoaW52ZXJzZWRBYmJyZXZpYXRpb25zKS5zb3J0KCkucmV2ZXJzZSgpO1xuICAgIGxldCBudW1iZXJPZkFiYnJldmlhdGlvbnMgPSBhYmJyZXZpYXRpb25WYWx1ZXMubGVuZ3RoO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZkFiYnJldmlhdGlvbnM7IGkrKykge1xuICAgICAgICBsZXQgdmFsdWUgPSBhYmJyZXZpYXRpb25WYWx1ZXNbaV07XG4gICAgICAgIGxldCBrZXkgPSBpbnZlcnNlZEFiYnJldmlhdGlvbnNbdmFsdWVdO1xuXG4gICAgICAgIHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZSh2YWx1ZSwgXCJcIik7XG4gICAgICAgIGlmIChzdHJpcHBlZCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgICAgIGxldCBmYWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBzd2l0Y2ggKGtleSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGRlZmF1bHQtY2FzZVxuICAgICAgICAgICAgICAgIGNhc2UgXCJ0aG91c2FuZFwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgMyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJtaWxsaW9uXCI6XG4gICAgICAgICAgICAgICAgICAgIGZhY3RvciA9IE1hdGgucG93KDEwLCA2KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImJpbGxpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwidHJpbGxpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDEyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpICogZmFjdG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGluIG9uZSBwYXNzIGFsbCBmb3JtYXR0aW5nIHN5bWJvbHMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nU3ltYm9scyhpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wgPSBcIlwiKSB7XG4gICAgLy8gQ3VycmVuY3lcblxuICAgIGxldCBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UoY3VycmVuY3lTeW1ib2wsIFwiXCIpO1xuXG4gICAgLy8gVGhvdXNhbmQgc2VwYXJhdG9yc1xuXG4gICAgc3RyaXBwZWQgPSBzdHJpcHBlZC5yZXBsYWNlKG5ldyBSZWdFeHAoYChbMC05XSkke2VzY2FwZVJlZ0V4cChkZWxpbWl0ZXJzLnRob3VzYW5kcyl9KFswLTldKWAsIFwiZ1wiKSwgXCIkMSQyXCIpO1xuXG4gICAgLy8gRGVjaW1hbFxuXG4gICAgc3RyaXBwZWQgPSBzdHJpcHBlZC5yZXBsYWNlKGRlbGltaXRlcnMuZGVjaW1hbCwgXCIuXCIpO1xuXG4gICAgcmV0dXJuIHN0cmlwcGVkO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHBhcmFtIHsqfSBkZWxpbWl0ZXJzIC0gRGVsaW1pdGVycyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtjdXJyZW5jeVN5bWJvbF0gLSBzeW1ib2wgdXNlZCBmb3IgY3VycmVuY3kgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9yZGluYWwgLSBmdW5jdGlvbiB1c2VkIHRvIGdlbmVyYXRlIGFuIG9yZGluYWwgb3V0IG9mIGEgbnVtYmVyXG4gKiBAcGFyYW0ge3N0cmluZ30gemVyb0Zvcm1hdCAtIHN0cmluZyByZXByZXNlbnRpbmcgemVyb1xuICogQHBhcmFtIHsqfSBhYmJyZXZpYXRpb25zIC0gYWJicmV2aWF0aW9ucyB1c2VkIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge251bWJlcnx1bmRlZmluZWR9XG4gKi9cbmZ1bmN0aW9uIHVuZm9ybWF0VmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sID0gXCJcIiwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSB7XG4gICAgaWYgKGlucHV0U3RyaW5nID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gWmVybyBGb3JtYXRcblxuICAgIGlmIChpbnB1dFN0cmluZyA9PT0gemVyb0Zvcm1hdCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBsZXQgdmFsdWUgPSByZW1vdmVGb3JtYXR0aW5nU3ltYm9scyhpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wpO1xuICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZSh2YWx1ZSwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCk7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIElOUFVUU1RSSU5HIHJlcHJlc2VudHMgYSB0aW1lLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byBjaGVja1xuICogQHBhcmFtIHsqfSBkZWxpbWl0ZXJzIC0gRGVsaW1pdGVycyB1c2VkIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBtYXRjaGVzVGltZShpbnB1dFN0cmluZywgZGVsaW1pdGVycykge1xuICAgIGxldCBzZXBhcmF0b3JzID0gaW5wdXRTdHJpbmcuaW5kZXhPZihcIjpcIikgJiYgZGVsaW1pdGVycy50aG91c2FuZHMgIT09IFwiOlwiO1xuXG4gICAgaWYgKCFzZXBhcmF0b3JzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgc2VnbWVudHMgPSBpbnB1dFN0cmluZy5zcGxpdChcIjpcIik7XG4gICAgaWYgKHNlZ21lbnRzLmxlbmd0aCAhPT0gMykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGhvdXJzID0gK3NlZ21lbnRzWzBdO1xuICAgIGxldCBtaW51dGVzID0gK3NlZ21lbnRzWzFdO1xuICAgIGxldCBzZWNvbmRzID0gK3NlZ21lbnRzWzJdO1xuXG4gICAgcmV0dXJuICFpc05hTihob3VycykgJiYgIWlzTmFOKG1pbnV0ZXMpICYmICFpc05hTihzZWNvbmRzKTtcbn1cblxuLyoqXG4gKiBVbmZvcm1hdCBhIG51bWJyby1nZW5lcmF0ZWQgc3RyaW5nIHJlcHJlc2VudGluZyBhIHRpbWUgdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiB1bmZvcm1hdFRpbWUoaW5wdXRTdHJpbmcpIHtcbiAgICBsZXQgc2VnbWVudHMgPSBpbnB1dFN0cmluZy5zcGxpdChcIjpcIik7XG5cbiAgICBsZXQgaG91cnMgPSArc2VnbWVudHNbMF07XG4gICAgbGV0IG1pbnV0ZXMgPSArc2VnbWVudHNbMV07XG4gICAgbGV0IHNlY29uZHMgPSArc2VnbWVudHNbMl07XG5cbiAgICByZXR1cm4gc2Vjb25kcyArIDYwICogbWludXRlcyArIDM2MDAgKiBob3Vycztcbn1cblxuLyoqXG4gKiBVbmZvcm1hdCBhIG51bWJyby1nZW5lcmF0ZWQgc3RyaW5nIHRvIHJldHJpZXZlIHRoZSBvcmlnaW5hbCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCAgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gdW5mb3JtYXQoaW5wdXRTdHJpbmcsIGZvcm1hdCkge1xuICAgIC8vIEF2b2lkIGNpcmN1bGFyIHJlZmVyZW5jZXNcbiAgICBjb25zdCBnbG9iYWxTdGF0ZSA9IHJlcXVpcmUoXCIuL2dsb2JhbFN0YXRlXCIpO1xuXG4gICAgbGV0IGRlbGltaXRlcnMgPSBnbG9iYWxTdGF0ZS5jdXJyZW50RGVsaW1pdGVycygpO1xuICAgIGxldCBjdXJyZW5jeVN5bWJvbCA9IGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeSgpLnN5bWJvbDtcbiAgICBsZXQgb3JkaW5hbCA9IGdsb2JhbFN0YXRlLmN1cnJlbnRPcmRpbmFsKCk7XG4gICAgbGV0IHplcm9Gb3JtYXQgPSBnbG9iYWxTdGF0ZS5nZXRaZXJvRm9ybWF0KCk7XG4gICAgbGV0IGFiYnJldmlhdGlvbnMgPSBnbG9iYWxTdGF0ZS5jdXJyZW50QWJicmV2aWF0aW9ucygpO1xuXG4gICAgbGV0IHZhbHVlID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKHR5cGVvZiBpbnB1dFN0cmluZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAobWF0Y2hlc1RpbWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHVuZm9ybWF0VGltZShpbnB1dFN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHVuZm9ybWF0VmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXRTdHJpbmcgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdmFsdWUgPSBpbnB1dFN0cmluZztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB1bmZvcm1hdFxufTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5sZXQgdW5mb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi91bmZvcm1hdHRpbmdcIik7XG5cbi8vIFNpbXBsaWZpZWQgcmVnZXhwIHN1cHBvcnRpbmcgb25seSBgbGFuZ3VhZ2VgLCBgc2NyaXB0YCwgYW5kIGByZWdpb25gXG5jb25zdCBiY3A0N1JlZ0V4cCA9IC9eW2Etel17MiwzfSgtW2EtekEtWl17NH0pPygtKFtBLVpdezJ9fFswLTldezN9KSk/JC87XG5cbmNvbnN0IHZhbGlkT3V0cHV0VmFsdWVzID0gW1xuICAgIFwiY3VycmVuY3lcIixcbiAgICBcInBlcmNlbnRcIixcbiAgICBcImJ5dGVcIixcbiAgICBcInRpbWVcIixcbiAgICBcIm9yZGluYWxcIixcbiAgICBcIm51bWJlclwiXG5dO1xuXG5jb25zdCB2YWxpZEZvcmNlQXZlcmFnZVZhbHVlcyA9IFtcbiAgICBcInRyaWxsaW9uXCIsXG4gICAgXCJiaWxsaW9uXCIsXG4gICAgXCJtaWxsaW9uXCIsXG4gICAgXCJ0aG91c2FuZFwiXG5dO1xuXG5jb25zdCB2YWxpZEN1cnJlbmN5UG9zaXRpb24gPSBbXG4gICAgXCJwcmVmaXhcIixcbiAgICBcImluZml4XCIsXG4gICAgXCJwb3N0Zml4XCJcbl07XG5cbmNvbnN0IHZhbGlkTmVnYXRpdmVWYWx1ZXMgPSBbXG4gICAgXCJzaWduXCIsXG4gICAgXCJwYXJlbnRoZXNpc1wiXG5dO1xuXG5jb25zdCB2YWxpZE1hbmRhdG9yeUFiYnJldmlhdGlvbnMgPSB7XG4gICAgdHlwZTogXCJvYmplY3RcIixcbiAgICBjaGlsZHJlbjoge1xuICAgICAgICB0aG91c2FuZDoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBtaWxsaW9uOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGJpbGxpb246IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgdHJpbGxpb246IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfVxuICAgIH0sXG4gICAgbWFuZGF0b3J5OiB0cnVlXG59O1xuXG5jb25zdCB2YWxpZEFiYnJldmlhdGlvbnMgPSB7XG4gICAgdHlwZTogXCJvYmplY3RcIixcbiAgICBjaGlsZHJlbjoge1xuICAgICAgICB0aG91c2FuZDogXCJzdHJpbmdcIixcbiAgICAgICAgbWlsbGlvbjogXCJzdHJpbmdcIixcbiAgICAgICAgYmlsbGlvbjogXCJzdHJpbmdcIixcbiAgICAgICAgdHJpbGxpb246IFwic3RyaW5nXCJcbiAgICB9XG59O1xuXG5jb25zdCB2YWxpZEJhc2VWYWx1ZXMgPSBbXG4gICAgXCJkZWNpbWFsXCIsXG4gICAgXCJiaW5hcnlcIixcbiAgICBcImdlbmVyYWxcIlxuXTtcblxuY29uc3QgdmFsaWRGb3JtYXQgPSB7XG4gICAgb3V0cHV0OiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZE91dHB1dFZhbHVlc1xuICAgIH0sXG4gICAgYmFzZToge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICB2YWxpZFZhbHVlczogdmFsaWRCYXNlVmFsdWVzLFxuICAgICAgICByZXN0cmljdGlvbjogKG51bWJlciwgZm9ybWF0KSA9PiBmb3JtYXQub3V0cHV0ID09PSBcImJ5dGVcIixcbiAgICAgICAgbWVzc2FnZTogXCJgYmFzZWAgbXVzdCBiZSBwcm92aWRlZCBvbmx5IHdoZW4gdGhlIG91dHB1dCBpcyBgYnl0ZWBcIixcbiAgICAgICAgbWFuZGF0b3J5OiAoZm9ybWF0KSA9PiBmb3JtYXQub3V0cHV0ID09PSBcImJ5dGVcIlxuICAgIH0sXG4gICAgY2hhcmFjdGVyaXN0aWM6IHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIpID0+IG51bWJlciA+PSAwLFxuICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgIH0sXG4gICAgcHJlZml4OiBcInN0cmluZ1wiLFxuICAgIHBvc3RmaXg6IFwic3RyaW5nXCIsXG4gICAgZm9yY2VBdmVyYWdlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEZvcmNlQXZlcmFnZVZhbHVlc1xuICAgIH0sXG4gICAgYXZlcmFnZTogXCJib29sZWFuXCIsXG4gICAgY3VycmVuY3lQb3NpdGlvbjoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICB2YWxpZFZhbHVlczogdmFsaWRDdXJyZW5jeVBvc2l0aW9uXG4gICAgfSxcbiAgICBjdXJyZW5jeVN5bWJvbDogXCJzdHJpbmdcIixcbiAgICB0b3RhbExlbmd0aDoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICByZXN0cmljdGlvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbjogKG51bWJlcikgPT4gbnVtYmVyID49IDAsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJ2YWx1ZSBtdXN0IGJlIHBvc2l0aXZlXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIsIGZvcm1hdCkgPT4gIWZvcm1hdC5leHBvbmVudGlhbCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcImB0b3RhbExlbmd0aGAgaXMgaW5jb21wYXRpYmxlIHdpdGggYGV4cG9uZW50aWFsYFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIG1hbnRpc3NhOiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyKSA9PiBudW1iZXIgPj0gMCxcbiAgICAgICAgbWVzc2FnZTogXCJ2YWx1ZSBtdXN0IGJlIHBvc2l0aXZlXCJcbiAgICB9LFxuICAgIG9wdGlvbmFsTWFudGlzc2E6IFwiYm9vbGVhblwiLFxuICAgIHRyaW1NYW50aXNzYTogXCJib29sZWFuXCIsXG4gICAgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYzogXCJib29sZWFuXCIsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBhYmJyZXZpYXRpb25zOiB2YWxpZEFiYnJldmlhdGlvbnMsXG4gICAgbmVnYXRpdmU6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkTmVnYXRpdmVWYWx1ZXNcbiAgICB9LFxuICAgIGZvcmNlU2lnbjogXCJib29sZWFuXCIsXG4gICAgZXhwb25lbnRpYWw6IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCJcbiAgICB9LFxuICAgIHByZWZpeFN5bWJvbDoge1xuICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIsIGZvcm1hdCkgPT4gZm9ybWF0Lm91dHB1dCA9PT0gXCJwZXJjZW50XCIsXG4gICAgICAgIG1lc3NhZ2U6IFwiYHByZWZpeFN5bWJvbGAgY2FuIGJlIHByb3ZpZGVkIG9ubHkgd2hlbiB0aGUgb3V0cHV0IGlzIGBwZXJjZW50YFwiXG4gICAgfVxufTtcblxuY29uc3QgdmFsaWRMYW5ndWFnZSA9IHtcbiAgICBsYW5ndWFnZVRhZzoge1xuICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICBtYW5kYXRvcnk6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAodGFnKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGFnLm1hdGNoKGJjcDQ3UmVnRXhwKTtcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZTogXCJ0aGUgbGFuZ3VhZ2UgdGFnIG11c3QgZm9sbG93IHRoZSBCQ1AgNDcgc3BlY2lmaWNhdGlvbiAoc2VlIGh0dHBzOi8vdG9vbHMuaWVmdC5vcmcvaHRtbC9iY3A0NylcIlxuICAgIH0sXG4gICAgZGVsaW1pdGVyczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgdGhvdXNhbmRzOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVjaW1hbDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIHRob3VzYW5kc1NpemU6IFwibnVtYmVyXCJcbiAgICAgICAgfSxcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBhYmJyZXZpYXRpb25zOiB2YWxpZE1hbmRhdG9yeUFiYnJldmlhdGlvbnMsXG4gICAgc3BhY2VTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIG9yZGluYWw6IHtcbiAgICAgICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICB9LFxuICAgIGN1cnJlbmN5OiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICBzeW1ib2w6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGNvZGU6IFwic3RyaW5nXCJcbiAgICAgICAgfSxcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBkZWZhdWx0czogXCJmb3JtYXRcIixcbiAgICBvcmRpbmFsRm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIGJ5dGVGb3JtYXQ6IFwiZm9ybWF0XCIsXG4gICAgcGVyY2VudGFnZUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICBjdXJyZW5jeUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICB0aW1lRGVmYXVsdHM6IFwiZm9ybWF0XCIsXG4gICAgZm9ybWF0czoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgZm91ckRpZ2l0czoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsczoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsc05vQ3VycmVuY3k6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImZvcm1hdFwiLFxuICAgICAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bGxXaXRoTm9EZWNpbWFsczoge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIENoZWNrIHRoZSB2YWxpZGl0eSBvZiB0aGUgcHJvdmlkZWQgaW5wdXQgYW5kIGZvcm1hdC5cbiAqIFRoZSBjaGVjayBpcyBOT1QgbGF6eS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8TnVtYnJvfSBpbnB1dCAtIGlucHV0IHRvIGNoZWNrXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIHdoZW4gZXZlcnl0aGluZyBpcyBjb3JyZWN0XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlKGlucHV0LCBmb3JtYXQpIHtcbiAgICBsZXQgdmFsaWRJbnB1dCA9IHZhbGlkYXRlSW5wdXQoaW5wdXQpO1xuICAgIGxldCBpc0Zvcm1hdFZhbGlkID0gdmFsaWRhdGVGb3JtYXQoZm9ybWF0KTtcblxuICAgIHJldHVybiB2YWxpZElucHV0ICYmIGlzRm9ybWF0VmFsaWQ7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBudW1icm8gaW5wdXQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfE51bWJyb30gaW5wdXQgLSBpbnB1dCB0byBjaGVja1xuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSB3aGVuIGV2ZXJ5dGhpbmcgaXMgY29ycmVjdFxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUlucHV0KGlucHV0KSB7XG4gICAgbGV0IHZhbHVlID0gdW5mb3JtYXR0ZXIudW5mb3JtYXQoaW5wdXQpO1xuXG4gICAgcmV0dXJuICEhdmFsdWU7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBwcm92aWRlZCBmb3JtYXQgVE9WQUxJREFURSBhZ2FpbnN0IFNQRUMuXG4gKlxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHRvVmFsaWRhdGUgLSBmb3JtYXQgdG8gY2hlY2tcbiAqIEBwYXJhbSB7Kn0gc3BlYyAtIHNwZWNpZmljYXRpb24gYWdhaW5zdCB3aGljaCB0byBjaGVja1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIHByZWZpeCB1c2UgZm9yIGVycm9yIG1lc3NhZ2VzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBNYW5kYXRvcnlDaGVjayAtIGB0cnVlYCB3aGVuIHRoZSBjaGVjayBmb3IgbWFuZGF0b3J5IGtleSBtdXN0IGJlIHNraXBwZWRcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgd2hlbiBldmVyeXRoaW5nIGlzIGNvcnJlY3RcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTcGVjKHRvVmFsaWRhdGUsIHNwZWMsIHByZWZpeCwgc2tpcE1hbmRhdG9yeUNoZWNrID0gZmFsc2UpIHtcbiAgICBsZXQgcmVzdWx0cyA9IE9iamVjdC5rZXlzKHRvVmFsaWRhdGUpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICghc3BlY1trZXldKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gSW52YWxpZCBrZXk6ICR7a2V5fWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB2YWx1ZSA9IHRvVmFsaWRhdGVba2V5XTtcbiAgICAgICAgbGV0IGRhdGEgPSBzcGVjW2tleV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBkYXRhID0ge3R5cGU6IGRhdGF9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEudHlwZSA9PT0gXCJmb3JtYXRcIikgeyAvLyBhbGwgZm9ybWF0cyBhcmUgcGFydGlhbCAoYS5rLmEgd2lsbCBiZSBtZXJnZWQgd2l0aCBzb21lIGRlZmF1bHQgdmFsdWVzKSB0aHVzIG5vIG5lZWQgdG8gY2hlY2sgbWFuZGF0b3J5IHZhbHVlc1xuICAgICAgICAgICAgbGV0IHZhbGlkID0gdmFsaWRhdGVTcGVjKHZhbHVlLCB2YWxpZEZvcm1hdCwgYFtWYWxpZGF0ZSAke2tleX1dYCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmICghdmFsaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gdHlwZSBtaXNtYXRjaGVkOiBcIiR7ZGF0YS50eXBlfVwiIGV4cGVjdGVkLCBcIiR7dHlwZW9mIHZhbHVlfVwiIHByb3ZpZGVkYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucmVzdHJpY3Rpb25zICYmIGRhdGEucmVzdHJpY3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgbGV0IGxlbmd0aCA9IGRhdGEucmVzdHJpY3Rpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQge3Jlc3RyaWN0aW9uLCBtZXNzYWdlfSA9IGRhdGEucmVzdHJpY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmICghcmVzdHJpY3Rpb24odmFsdWUsIHRvVmFsaWRhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSAke2tleX0gaW52YWxpZCB2YWx1ZTogJHttZXNzYWdlfWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnJlc3RyaWN0aW9uICYmICFkYXRhLnJlc3RyaWN0aW9uKHZhbHVlLCB0b1ZhbGlkYXRlKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiAke2RhdGEubWVzc2FnZX1gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS52YWxpZFZhbHVlcyAmJiBkYXRhLnZhbGlkVmFsdWVzLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiBtdXN0IGJlIGFtb25nICR7SlNPTi5zdHJpbmdpZnkoZGF0YS52YWxpZFZhbHVlcyl9LCBcIiR7dmFsdWV9XCIgcHJvdmlkZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5jaGlsZHJlbikge1xuICAgICAgICAgICAgbGV0IHZhbGlkID0gdmFsaWRhdGVTcGVjKHZhbHVlLCBkYXRhLmNoaWxkcmVuLCBgW1ZhbGlkYXRlICR7a2V5fV1gKTtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgaWYgKCFza2lwTWFuZGF0b3J5Q2hlY2spIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKC4uLk9iamVjdC5rZXlzKHNwZWMpLm1hcCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBsZXQgZGF0YSA9IHNwZWNba2V5XTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGRhdGEgPSB7dHlwZTogZGF0YX07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkYXRhLm1hbmRhdG9yeSkge1xuICAgICAgICAgICAgICAgIGxldCBtYW5kYXRvcnkgPSBkYXRhLm1hbmRhdG9yeTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hbmRhdG9yeSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hbmRhdG9yeSA9IG1hbmRhdG9yeSh0b1ZhbGlkYXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobWFuZGF0b3J5ICYmIHRvVmFsaWRhdGVba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSBNaXNzaW5nIG1hbmRhdG9yeSBrZXkgXCIke2tleX1cImApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cy5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4ge1xuICAgICAgICByZXR1cm4gYWNjICYmIGN1cnJlbnQ7XG4gICAgfSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHByb3ZpZGVkIEZPUk1BVC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gZm9ybWF0IC0gZm9ybWF0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpIHtcbiAgICByZXR1cm4gdmFsaWRhdGVTcGVjKGZvcm1hdCwgdmFsaWRGb3JtYXQsIFwiW1ZhbGlkYXRlIGZvcm1hdF1cIik7XG59XG5cbi8qKlxuICogQ2hlY2sgdGhlIHByb3ZpZGVkIExBTkdVQUdFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvTGFuZ3VhZ2V9IGxhbmd1YWdlIC0gbGFuZ3VhZ2UgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgICByZXR1cm4gdmFsaWRhdGVTcGVjKGxhbmd1YWdlLCB2YWxpZExhbmd1YWdlLCBcIltWYWxpZGF0ZSBsYW5ndWFnZV1cIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHZhbGlkYXRlLFxuICAgIHZhbGlkYXRlRm9ybWF0LFxuICAgIHZhbGlkYXRlSW5wdXQsXG4gICAgdmFsaWRhdGVMYW5ndWFnZVxufTtcbiJdfQ==
