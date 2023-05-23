(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ({

/***/ 3:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.default = void 0;
/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */
const dictionary = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DIV/0!',
    ERROR: '#ERROR!',
    NA: '#N/A',
    NAME: '#NAME?',
    NUM: '#NUM!',
    REF: '#REF!',
    SPILL: '#SPILL!',
    VALUE: '#VALUE!'
  },
  functions: {
    FILTER: 'FILTER',
    'ARRAY_CONSTRAIN': 'ARRAY_CONSTRAIN',
    ARRAYFORMULA: 'ARRAYFORMULA',
    ABS: 'ABS',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'AND',
    ARABIC: 'ARABIC',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'AVERAGE',
    AVERAGEA: 'AVERAGEA',
    AVERAGEIF: 'AVERAGEIF',
    BASE: 'BASE',
    BIN2DEC: 'BIN2DEC',
    BIN2HEX: 'BIN2HEX',
    BIN2OCT: 'BIN2OCT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'CEILING',
    CHAR: 'CHAR',
    CHOOSE: 'CHOOSE',
    CLEAN: 'CLEAN',
    CODE: 'CODE',
    COLUMN: 'COLUMN',
    COLUMNS: 'COLUMNS',
    CONCATENATE: 'CONCATENATE',
    CORREL: 'CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'COUNT',
    COUNTA: 'COUNTA',
    COUNTBLANK: 'COUNTBLANK',
    COUNTIF: 'COUNTIF',
    COUNTIFS: 'COUNTIFS',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'CUMIPMT',
    CUMPRINC: 'CUMPRINC',
    DATE: 'DATE',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DATEVALUE',
    DAY: 'DAY',
    DAYS360: 'DAYS360',
    DAYS: 'DAYS',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DEC2BIN',
    DEC2HEX: 'DEC2HEX',
    DEC2OCT: 'DEC2OCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'DEGREES',
    DELTA: 'DELTA',
    DOLLARDE: 'DOLLARDE',
    DOLLARFR: 'DOLLARFR',
    EDATE: 'EDATE',
    EFFECT: 'EFFECT',
    EOMONTH: 'EOMONTH',
    ERF: 'ERF',
    ERFC: 'ERFC',
    EVEN: 'EVEN',
    EXACT: 'EXACT',
    EXP: 'EXP',
    FALSE: 'FALSE',
    FIND: 'FIND',
    FORMULATEXT: 'FORMULATEXT',
    FV: 'FV',
    FVSCHEDULE: 'FVSCHEDULE',
    HEX2BIN: 'HEX2BIN',
    HEX2DEC: 'HEX2DEC',
    HEX2OCT: 'HEX2OCT',
    HLOOKUP: 'HLOOKUP',
    HOUR: 'HOUR',
    IF: 'IF',
    IFERROR: 'IFERROR',
    IFNA: 'IFNA',
    INDEX: 'INDEX',
    INT: 'INT',
    INTERVAL: 'INTERVAL',
    IPMT: 'IPMT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ISBLANK',
    ISERR: 'ISERR',
    ISERROR: 'ISERROR',
    ISEVEN: 'ISEVEN',
    ISFORMULA: 'ISFORMULA',
    ISLOGICAL: 'ISLOGICAL',
    ISNA: 'ISNA',
    ISNONTEXT: 'ISNONTEXT',
    ISNUMBER: 'ISNUMBER',
    ISODD: 'ISODD',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'ISPMT',
    ISREF: 'ISREF',
    ISTEXT: 'ISTEXT',
    LEFT: 'LEFT',
    LEN: 'LEN',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'LOWER',
    MATCH: 'MATCH',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXIFS: 'MAXIFS',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'MID',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MINIFS',
    MINUTE: 'MINUTE',
    MIRR: 'MIRR',
    MMULT: 'MMULT',
    MOD: 'MOD',
    MONTH: 'MONTH',
    NA: 'NA',
    NETWORKDAYS: 'NETWORKDAYS',
    'NETWORKDAYS.INTL': 'NETWORKDAYS.INTL',
    NOMINAL: 'NOMINAL',
    NOT: 'NOT',
    NOW: 'NOW',
    NPER: 'NPER',
    NPV: 'NPV',
    OCT2BIN: 'OCT2BIN',
    OCT2DEC: 'OCT2DEC',
    OCT2HEX: 'OCT2HEX',
    ODD: 'ODD',
    OFFSET: 'OFFSET',
    OR: 'OR',
    PI: 'PI',
    PMT: 'PMT',
    PDURATION: 'PDURATION',
    PRODUCT: 'PRODUCT',
    POWER: 'POWER',
    PPMT: 'PPMT',
    PROPER: 'PROPER',
    PV: 'PV',
    RADIANS: 'RADIANS',
    RAND: 'RAND',
    RATE: 'RATE',
    REPLACE: 'REPLACE',
    REPT: 'REPT',
    RIGHT: 'RIGHT',
    ROMAN: 'ROMAN',
    ROUND: 'ROUND',
    ROUNDDOWN: 'ROUNDDOWN',
    ROUNDUP: 'ROUNDUP',
    ROW: 'ROW',
    ROWS: 'ROWS',
    RRI: 'RRI',
    SEARCH: 'SEARCH',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SECOND',
    SHEET: 'SHEET',
    SHEETS: 'SHEETS',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'SLN',
    SPLIT: 'SPLIT',
    SQRT: 'SQRT',
    STDEVA: 'STDEVA',
    'STDEV.P': 'STDEV.P',
    STDEVPA: 'STDEVPA',
    'STDEV.S': 'STDEV.S',
    SUBSTITUTE: 'SUBSTITUTE',
    SUBTOTAL: 'SUBTOTAL',
    SUM: 'SUM',
    SUMIF: 'SUMIF',
    SUMIFS: 'SUMIFS',
    SUMPRODUCT: 'SUMPRODUCT',
    SUMSQ: 'SUMSQ',
    SWITCH: 'SWITCH',
    SYD: 'SYD',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'TBILLEQ',
    TBILLPRICE: 'TBILLPRICE',
    TBILLYIELD: 'TBILLYIELD',
    TEXT: 'TEXT',
    TIME: 'TIME',
    TIMEVALUE: 'TIMEVALUE',
    TODAY: 'TODAY',
    TRANSPOSE: 'TRANSPOSE',
    TRIM: 'TRIM',
    TRUE: 'TRUE',
    TRUNC: 'TRUNC',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'UPPER',
    VARA: 'VARA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'VLOOKUP',
    WEEKDAY: 'WEEKDAY',
    WEEKNUM: 'WEEKNUM',
    WORKDAY: 'WORKDAY',
    'WORKDAY.INTL': 'WORKDAY.INTL',
    XNPV: 'XNPV',
    XOR: 'XOR',
    YEAR: 'YEAR',
    YEARFRAC: 'YEARFRAC',
    'HF.ADD': 'HF.ADD',
    'HF.CONCAT': 'HF.CONCAT',
    'HF.DIVIDE': 'HF.DIVIDE',
    'HF.EQ': 'HF.EQ',
    'HF.GT': 'HF.GT',
    'HF.GTE': 'HF.GTE',
    'HF.LT': 'HF.LT',
    'HF.LTE': 'HF.LTE',
    'HF.MINUS': 'HF.MINUS',
    'HF.MULTIPLY': 'HF.MULTIPLY',
    'HF.NE': 'HF.NE',
    'HF.POW': 'HF.POW',
    'HF.UMINUS': 'HF.UMINUS',
    'HF.UNARY_PERCENT': 'HF.UNARY_PERCENT',
    'HF.UPLUS': 'HF.UPLUS',
    VARP: 'VARP',
    VAR: 'VAR',
    STDEVP: 'STDEVP',
    STDEV: 'STDEV',
    'EXPON.DIST': 'EXPON.DIST',
    FISHER: 'FISHER',
    FISHERINV: 'FISHERINV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.DIST',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.PRECISE',
    'GAMMA.INV': 'GAMMA.INV',
    GAUSS: 'GAUSS',
    FACT: 'FACT',
    FACTDOUBLE: 'FACTDOUBLE',
    COMBIN: 'COMBIN',
    COMBINA: 'COMBINA',
    GCD: 'GCD',
    LCM: 'LCM',
    MROUND: 'MROUND',
    MULTINOMIAL: 'MULTINOMIAL',
    QUOTIENT: 'QUOTIENT',
    RANDBETWEEN: 'RANDBETWEEN',
    SERIESSUM: 'SERIESSUM',
    SIGN: 'SIGN',
    SQRTPI: 'SQRTPI',
    SUMX2MY2: 'SUMX2MY2',
    SUMX2PY2: 'SUMX2PY2',
    SUMXMY2: 'SUMXMY2',
    'EXPONDIST': 'EXPONDIST',
    GAMMADIST: 'GAMMADIST',
    GAMMAINV: 'GAMMAINV',
    'BETA.DIST': 'BETA.DIST',
    BETADIST: 'BETADIST',
    'BETA.INV': 'BETA.INV',
    BETAINV: 'BETAINV',
    'BINOM.DIST': 'BINOM.DIST',
    BINOMDIST: 'BINOMDIST',
    'BINOM.INV': 'BINOM.INV',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    'CHISQ.DIST': 'CHISQ.DIST',
    'CHISQ.DIST.RT': 'CHISQ.DIST.RT',
    'CHISQ.INV': 'CHISQ.INV',
    'CHISQ.INV.RT': 'CHISQ.INV.RT',
    CHIDIST: 'CHIDIST',
    CHIINV: 'CHIINV',
    'F.DIST': 'F.DIST',
    'F.DIST.RT': 'F.DIST.RT',
    'F.INV': 'F.INV',
    'F.INV.RT': 'F.INV.RT',
    FDIST: 'FDIST',
    FINV: 'FINV',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.DIST',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.DIST',
    'HYPGEOM.DIST': 'HYPGEOM.DIST',
    HYPGEOMDIST: 'HYPGEOMDIST',
    'T.DIST': 'T.DIST',
    'T.DIST.2T': 'T.DIST.2T',
    'T.DIST.RT': 'T.DIST.RT',
    'T.INV': 'T.INV',
    'T.INV.2T': 'T.INV.2T',
    TDIST: 'TDIST',
    TINV: 'TINV',
    LOGINV: 'LOGINV',
    'LOGNORM.DIST': 'LOGNORM.DIST',
    'LOGNORM.INV': 'LOGNORM.INV',
    LOGNORMDIST: 'LOGNORMDIST',
    'NORM.DIST': 'NORM.DIST',
    'NORM.INV': 'NORM.INV',
    'NORM.S.DIST': 'NORM.S.DIST',
    'NORM.S.INV': 'NORM.S.INV',
    NORMDIST: 'NORMDIST',
    NORMINV: 'NORMINV',
    NORMSDIST: 'NORMSDIST',
    NORMSINV: 'NORMSINV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.DIST',
    'NEGBINOMDIST': 'NEGBINOMDIST',
    COMPLEX: 'COMPLEX',
    IMABS: 'IMABS',
    IMAGINARY: 'IMAGINARY',
    IMARGUMENT: 'IMARGUMENT',
    IMCONJUGATE: 'IMCONJUGATE',
    IMCOS: 'IMCOS',
    IMCOSH: 'IMCOSH',
    IMCOT: 'IMCOT',
    IMCSC: 'IMCSC',
    IMCSCH: 'IMCSCH',
    IMDIV: 'IMDIV',
    IMEXP: 'IMEXP',
    IMLN: 'IMLN',
    IMLOG10: 'IMLOG10',
    IMLOG2: 'IMLOG2',
    IMPOWER: 'IMPOWER',
    IMPRODUCT: 'IMPRODUCT',
    IMREAL: 'IMREAL',
    IMSEC: 'IMSEC',
    IMSECH: 'IMSECH',
    IMSIN: 'IMSIN',
    IMSINH: 'IMSINH',
    IMSQRT: 'IMSQRT',
    IMSUB: 'IMSUB',
    IMSUM: 'IMSUM',
    IMTAN: 'IMTAN',
    LARGE: 'LARGE',
    SMALL: 'SMALL',
    AVEDEV: 'AVEDEV',
    CONFIDENCE: 'CONFIDENCE',
    'CONFIDENCE.NORM': 'CONFIDENCE.NORM',
    'CONFIDENCE.T': 'CONFIDENCE.T',
    DEVSQ: 'DEVSQ',
    GEOMEAN: 'GEOMEAN',
    HARMEAN: 'HARMEAN',
    CRITBINOM: 'CRITBINOM',
    'COVARIANCE.P': 'COVARIANCE.P',
    'COVARIANCE.S': 'COVARIANCE.S',
    'COVAR': 'COVAR',
    PEARSON: 'PEARSON',
    RSQ: 'RSQ',
    STANDARDIZE: 'STANDARDIZE',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'ZTEST',
    'F.TEST': 'F.TEST',
    FTEST: 'FTEST',
    STEYX: 'STEYX',
    SLOPE: 'SLOPE',
    'CHISQ.TEST': 'CHISQ.TEST',
    CHITEST: 'CHITEST',
    'T.TEST': 'T.TEST',
    TTEST: 'TTEST',
    SKEW: 'SKEW',
    'SKEW.P': 'SKEW.P',
    WEIBULLDIST: 'WEIBULLDIST',
    VARS: 'VARS',
    TINV2T: 'TINV2T',
    TDISTRT: 'TDISTRT',
    TDIST2T: 'TDIST2T',
    STDEVS: 'STDEVS',
    FINVRT: 'FINVRT',
    FDISTRT: 'FDISTRT',
    CHIDISTRT: 'CHIDISTRT',
    CHIINVRT: 'CHIINVRT',
    COVARIANCEP: 'COVARIANCEP',
    COVARIANCES: 'COVARIANCES',
    LOGNORMINV: 'LOGNORMINV',
    POISSONDIST: 'POISSONDIST',
    SKEWP: 'SKEWP',
    'CEILING.MATH': 'CEILING.MATH',
    FLOOR: 'FLOOR',
    'FLOOR.MATH': 'FLOOR.MATH',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'enGB',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet'
  }
};
if (!HyperFormula.languages) {
  HyperFormula.languages = {};
}
HyperFormula.languages[dictionary.langCode] = dictionary;
var _default = dictionary;
exports.default = _default;

/***/ })

/******/ })["___"];
});