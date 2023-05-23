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
/******/ 	return __webpack_require__(__webpack_require__.s = 16);
/******/ })
/************************************************************************/
/******/ ({

/***/ 16:
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
    DIV_BY_ZERO: '#DIVISION/0!',
    ERROR: '#ERROR!',
    NA: '#SAKNAS!',
    NAME: '#NAMN?',
    NUM: '#OGILTIGT!',
    REF: '#REFERENS!',
    SPILL: '#SPILL!',
    VALUE: '#VÄRDEFEL!'
  },
  functions: {
    FILTER: 'FILTER',
    'ARRAY_CONSTRAIN': 'ARRAY_CONSTRAIN',
    ARRAYFORMULA: 'ARRAYFORMULA',
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'OCH',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'MEDEL',
    AVERAGEA: 'AVERAGEA',
    AVERAGEIF: 'MEDEL.OM',
    BASE: 'BASE',
    BIN2DEC: 'BIN.TILL.DEC',
    BIN2HEX: 'BIN.TILL.HEX',
    BIN2OCT: 'BIN.TILL.OKT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'RUNDA.UPP',
    CHAR: 'TECKENKOD',
    CHOOSE: 'VÄLJ',
    CLEAN: 'STÄDA',
    CODE: 'KOD',
    COLUMN: 'KOLUMN',
    COLUMNS: 'KOLUMNER',
    CONCATENATE: 'SAMMANFOGA',
    CORREL: 'KORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'ANTAL',
    COUNTA: 'ANTALV',
    COUNTBLANK: 'ANTAL.TOMMA',
    COUNTIF: 'ANTAL.OM',
    COUNTIFS: 'ANTAL.OMF',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'KUMRÄNTA',
    CUMPRINC: 'KUMPRIS',
    DATE: 'DATUM',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DATUMVÄRDE',
    DAY: 'DAG',
    DAYS360: 'DAGAR360',
    DAYS: 'DAYS',
    DB: 'DB',
    DDB: 'DEGAVSKR',
    DEC2BIN: 'DEC.TILL.BIN',
    DEC2HEX: 'DEC.TILL.HEX',
    DEC2OCT: 'DEC.TILL.OKT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRADER',
    DELTA: 'DELTA',
    DOLLARDE: 'DECTAL',
    DOLLARFR: 'BRÅK',
    EDATE: 'EDATUM',
    EFFECT: "EFFRÄNTA",
    EOMONTH: 'SLUTMÅNAD',
    ERF: 'FELF',
    ERFC: 'FELFK',
    EVEN: 'JÄMN',
    EXACT: 'EXAKT',
    EXP: 'EXP',
    FALSE: 'FALSKT',
    FIND: 'HITTA',
    FORMULATEXT: 'FORMELTEXT',
    FV: 'SLUTVÄRDE',
    FVSCHEDULE: 'FÖRRÄNTNING',
    HEX2BIN: 'HEX.TILL.BIN',
    HEX2DEC: 'HEX.TILL.DEC',
    HEX2OCT: 'HEX.TILL.OKT',
    HLOOKUP: 'LETAKOLUMN',
    HOUR: 'TIMME',
    IF: 'OM',
    IFERROR: 'OMFEL',
    IFNA: 'IFNA',
    INDEX: 'INDEX',
    INT: 'HELTAL',
    INTERVAL: 'INTERVAL',
    IPMT: 'RBETALNING',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ÄRTOM',
    ISERR: 'ÄRF',
    ISERROR: 'ÄRFEL',
    ISEVEN: 'ÄRJÄMN',
    ISFORMULA: 'ISFORMEL',
    ISLOGICAL: 'ÄRLOGISK',
    ISNA: 'ÄRSAKNAD',
    ISNONTEXT: 'ÄREJTEXT',
    ISNUMBER: 'ÄRTAL',
    ISODD: 'ÄRUDDA',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'RALÅN',
    ISREF: 'ÄRREF',
    ISTEXT: 'ÄRTEXT',
    LEFT: 'VÄNSTER',
    LEN: 'LÄNGD',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'GEMENER',
    MATCH: 'PASSA',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXIFS: 'MAXIFS',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'EXTEXT',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MINIFS',
    MINUTE: 'MINUT',
    MIRR: 'MODIR',
    MMULT: 'MMULT',
    MOD: 'REST',
    MONTH: 'MÅNAD',
    NA: 'SAKNAS',
    NETWORKDAYS: 'NETTOARBETSDAGAR',
    'NETWORKDAYS.INTL': 'NETTOARBETSDAGAR.INT',
    NOMINAL: 'NOMRÄNTA',
    NOT: 'ICKE',
    NOW: 'NU',
    NPER: 'PERIODER',
    NPV: 'NETNUVÄRDE',
    OCT2BIN: 'OKT.TILL.BIN',
    OCT2DEC: 'OKT.TILL.DEC',
    OCT2HEX: 'OKT.TILL.HEX',
    ODD: 'UDDA',
    OFFSET: 'FÖRSKJUTNING',
    OR: 'ELLER',
    PDURATION: 'PDURATION',
    PI: 'PI',
    PMT: 'BETALNING',
    PRODUCT: 'PRODUKT',
    POWER: 'UPPHÖJT.TILL',
    PPMT: 'AMORT',
    PROPER: 'INITIAL',
    PV: 'NUVÄRDE',
    RADIANS: 'RADIANER',
    RAND: 'SLUMP',
    RATE: 'RÄNTA',
    REPLACE: 'ERSÄTT',
    REPT: 'REP',
    RIGHT: 'HÖGER',
    ROUND: 'AVRUNDA',
    ROUNDDOWN: 'AVRUNDA.NEDÅT',
    ROUNDUP: 'AVRUNDA.UPPÅT',
    ROW: 'RAD',
    ROWS: 'RADER',
    RRI: 'RRI',
    SEARCH: 'SÖK',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUND',
    SHEET: 'SHEET',
    SHEETS: 'SHEETS',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LINAVSKR',
    SPLIT: 'SPLIT',
    SQRT: 'ROT',
    STDEVA: 'STDEVA',
    'STDEV.P': 'STDAV.P',
    STDEVPA: 'STDEVPA',
    'STDEV.S': 'STDAV.S',
    SUBSTITUTE: 'BYT.UT',
    SUBTOTAL: 'DELSUMMA',
    SUM: 'SUMMA',
    SUMIF: 'SUMMA.OM',
    SUMIFS: 'SUMMA.OMF',
    SUMPRODUCT: 'PRODUKTSUMMA',
    SUMSQ: 'KVADRATSUMMA',
    SWITCH: '',
    SYD: 'ÅRSAVSKR',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'SSVXEKV',
    TBILLPRICE: 'SSVXPRIS',
    TBILLYIELD: 'SSVXRÄNTA',
    TEXT: 'TEXT',
    TIME: 'KLOCKSLAG',
    TIMEVALUE: 'TIDVÄRDE',
    TODAY: 'IDAG',
    TRANSPOSE: 'TRANSPONERA',
    TRIM: 'RENSA',
    TRUE: 'SANT',
    TRUNC: 'AVKORTA',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'VERSALER',
    VARA: 'VARA',
    'VAR.P': 'VARIANS.P',
    VARPA: 'VARPA',
    'VAR.S': 'VARIANS.S',
    VLOOKUP: 'LETARAD',
    WEEKDAY: 'VECKODAG',
    WEEKNUM: 'VECKONR',
    WORKDAY: 'ARBETSDAGAR',
    'WORKDAY.INTL': 'ARBETSDAGAR.INT',
    XNPV: 'XNUVÄRDE',
    XOR: 'XOR',
    YEAR: 'ÅR',
    YEARFRAC: 'ÅRDEL',
    ROMAN: 'ROMERSK',
    ARABIC: 'ARABIC',
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
    VAR: 'VARIANS',
    VARP: 'VARIANSP',
    STDEV: 'STDAV',
    STDEVP: 'STDAVP',
    FACT: 'FAKULTET',
    FACTDOUBLE: 'DUBBELFAKULTET',
    COMBIN: 'KOMBIN',
    COMBINA: 'COMBINA',
    GCD: 'SGD',
    LCM: 'MGM',
    MROUND: 'MAVRUNDA',
    MULTINOMIAL: 'MULTINOMIAL',
    QUOTIENT: 'KVOT',
    RANDBETWEEN: 'SLUMP.MELLAN',
    SERIESSUM: 'SERIESUMMA',
    SIGN: 'TECKEN',
    SQRTPI: 'ROTPI',
    SUMX2MY2: 'SUMMAX2MY2',
    SUMX2PY2: 'SUMMAX2PY2',
    SUMXMY2: 'SUMMAXMY2',
    'EXPON.DIST': 'EXPON.FÖRD',
    EXPONDIST: 'EXPONFÖRD',
    FISHER: 'FISHER',
    FISHERINV: 'FISHERINV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.FÖRD',
    'GAMMA.INV': 'GAMMA.INV',
    GAMMADIST: 'GAMMAFÖRD',
    GAMMAINV: 'GAMMAINV',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.EXAKT',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BETA.FÖRD',
    BETADIST: 'BETAFÖRD',
    'BETA.INV': 'BETA.INV',
    BETAINV: 'BETAINV',
    'BINOM.DIST': 'BINOM.FÖRD',
    BINOMDIST: 'BINOMFÖRD',
    'BINOM.INV': 'BINOM.INV',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'CHI2FÖRD',
    CHIINV: 'CHI2INV',
    'CHISQ.DIST': 'CHI2.FÖRD',
    'CHISQ.DIST.RT': 'CHI2.FÖRD.RT',
    'CHISQ.INV': 'CHI2.INV',
    'CHISQ.INV.RT': 'CHI2.INV.RT',
    'F.DIST': 'F.FÖRD',
    'F.DIST.RT': 'F.FÖRD.RT',
    'F.INV': 'F.INV',
    'F.INV.RT': 'F.INV.RT',
    FDIST: 'FFÖRD',
    FINV: 'FINV',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.FÖRD',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.FÖRD',
    'HYPGEOM.DIST': 'HYPGEOM.FÖRD',
    HYPGEOMDIST: 'HYPGEOMFÖRD',
    'T.DIST': 'T.FÖRD',
    'T.DIST.2T': 'T.FÖRD.2T',
    'T.DIST.RT': 'T.FÖRD.RT',
    'T.INV': 'T.INV',
    'T.INV.2T': 'T.INV.2T',
    TDIST: 'TFÖRD',
    TINV: 'TINV',
    LOGINV: 'LOGINV',
    'LOGNORM.DIST': 'LOGNORM.FÖRD',
    'LOGNORM.INV': 'LOGNORM.INV',
    LOGNORMDIST: 'LOGNORMFÖRD',
    'NORM.DIST': 'NORM.FÖRD',
    'NORM.INV': 'NORM.INV',
    'NORM.S.DIST': 'NORM.S.FÖRD',
    'NORM.S.INV': 'NORM.S.INV',
    NORMDIST: 'NORMFÖRD',
    NORMINV: 'NORMINV',
    NORMSDIST: 'NORMSFÖRD',
    NORMSINV: 'NORMSINV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.FÖRD',
    NEGBINOMDIST: 'NEGBINOMFÖRD',
    COMPLEX: 'KOMPLEX',
    IMABS: 'IMABS',
    IMAGINARY: 'IMAGINÄR',
    IMARGUMENT: 'IMARGUMENT',
    IMCONJUGATE: 'IMKONJUGAT',
    IMCOS: 'IMCOS',
    IMCOSH: 'IMCOSH',
    IMCOT: 'IMCOT',
    IMCSC: 'IMCSC',
    IMCSCH: 'IMCSCH',
    IMDIV: 'IMDIV',
    IMEXP: 'IMEUPPHÖJT',
    IMLN: 'IMLN',
    IMLOG10: 'IMLOG10',
    IMLOG2: 'IMLOG2',
    IMPOWER: 'IMUPPHÖJT',
    IMPRODUCT: 'IMPRODUKT',
    IMREAL: 'IMREAL',
    IMSEC: 'IMSEC',
    IMSECH: 'IMSECH',
    IMSIN: 'IMSIN',
    IMSINH: 'IMSINH',
    IMSQRT: 'IMROT',
    IMSUB: 'IMDIFF',
    IMSUM: 'IMSUM',
    IMTAN: 'IMTAN',
    LARGE: 'STÖRSTA',
    SMALL: 'MINSTA',
    AVEDEV: 'MEDELAVV',
    CONFIDENCE: 'KONFIDENS',
    'CONFIDENCE.NORM': 'KONFIDENS.NORM',
    'CONFIDENCE.T': 'KONFIDENS.T',
    DEVSQ: 'KVADAVV',
    GEOMEAN: 'GEOMEDEL',
    HARMEAN: 'HARMMEDEL',
    CRITBINOM: 'KRITBINOM',
    PEARSON: 'PEARSON',
    RSQ: 'RKV',
    STANDARDIZE: 'STANDARDISERA',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'ZTEST',
    'F.TEST': 'F.TEST',
    FTEST: 'FTEST',
    STEYX: 'STDFELYX',
    SLOPE: 'LUTNING',
    COVAR: 'KOVAR',
    'COVARIANCE.P': 'KOVARIANS.P',
    'COVARIANCE.S': 'KOVARIANS.S',
    'CHISQ.TEST': 'CHI2.TEST',
    CHITEST: 'CHI2TEST',
    'T.TEST': 'T.TEST',
    TTEST: 'TTEST',
    SKEW: 'SNEDHET',
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
    FLOOR: 'RUNDA.NER',
    'FLOOR.MATH': 'FLOOR.MATH',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'svSE',
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