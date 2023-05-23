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
/******/ 	return __webpack_require__(__webpack_require__.s = 11);
/******/ })
/************************************************************************/
/******/ ({

/***/ 11:
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
    NA: '#I/T',
    NAME: '#NAVN?',
    NUM: '#NUM!',
    REF: '#REF!',
    SPILL: '#OVERFLYT!',
    VALUE: '#VERDI!'
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
    AND: 'OG',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'GJENNOMSNITT',
    AVERAGEA: 'GJENNOMSNITTA',
    AVERAGEIF: 'GJENNOMSNITTHVIS',
    BASE: 'BASE',
    BIN2DEC: 'BINTILDES',
    BIN2HEX: 'BINTILHEKS',
    BIN2OCT: 'BINTILOKT',
    BITAND: 'BITOG',
    BITLSHIFT: 'BITVFORSKYV',
    BITOR: 'BITELLER',
    BITRSHIFT: 'BITHFORSKYV',
    BITXOR: 'BITEKSKLUSIVELLER',
    CEILING: 'AVRUND.GJELDENDE.MULTIPLUM',
    CHAR: 'TEGNKODE',
    CHOOSE: 'VELG',
    CLEAN: 'RENSK',
    CODE: 'KODE',
    COLUMN: 'KOLONNE',
    COLUMNS: 'KOLONNER',
    CONCATENATE: 'KJEDE.SAMMEN',
    CORREL: 'KORRELASJON',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'ANTALL',
    COUNTA: 'ANTALLA',
    COUNTBLANK: 'TELLBLANKE',
    COUNTIF: 'ANTALL.HVIS',
    COUNTIFS: 'ANTALL.HVIS.SETT',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'SAMLET.RENTE',
    CUMPRINC: 'SAMLET.HOVEDSTOL',
    DATE: 'DATO',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DATOVERDI',
    DAY: 'DAG',
    DAYS360: 'DAGER360',
    DAYS: 'DAGER',
    DB: 'DAVSKR',
    DDB: 'DEGRAVS',
    DEC2BIN: 'DESTILBIN',
    DEC2HEX: 'DESTILHEKS',
    DEC2OCT: 'DESTILOKT',
    DECIMAL: 'DESIMAL',
    DEGREES: 'GRADER',
    DELTA: 'DELTA',
    DOLLARDE: 'DOLLARDE',
    DOLLARFR: 'DOLLARBR',
    EDATE: 'DAG.ETTER',
    EFFECT: "EFFEKTIV.RENTE",
    EOMONTH: 'MÅNEDSSLUTT',
    ERF: 'FEILF',
    ERFC: 'FEILFK',
    EVEN: 'AVRUND.TIL.PARTALL',
    EXACT: 'EKSAKT',
    EXP: 'EKSP',
    FALSE: 'USANN',
    FIND: 'FINN',
    FORMULATEXT: 'FORMELTEKST',
    FV: 'SLUTTVERDI',
    FVSCHEDULE: 'SVPLAN',
    HEX2BIN: 'HEKSTILBIN',
    HEX2DEC: 'HEKSTILDES',
    HEX2OCT: 'HEKSTILOKT',
    HLOOKUP: 'FINN.KOLONNE',
    HOUR: 'TIME',
    IF: 'HVIS',
    IFERROR: 'HVISFEIL',
    IFNA: 'HVIS.IT',
    INDEX: 'INDEKS',
    INT: 'HELTALL',
    INTERVAL: 'INTERVAL',
    IPMT: 'RAVDRAG',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ERTOM',
    ISERR: 'ERF',
    ISERROR: 'ERFEIL',
    ISEVEN: 'ERPARTALL',
    ISFORMULA: 'ERFORMEL',
    ISLOGICAL: 'ERLOGISK',
    ISNA: 'ERIT',
    ISNONTEXT: 'ERIKKETEKST',
    ISNUMBER: 'ERTALL',
    ISODD: 'ERODDE',
    ISOWEEKNUM: 'ISOUKENR',
    ISPMT: 'ER.AVDRAG',
    ISREF: 'ERREF',
    ISTEXT: 'ERTEKST',
    LEFT: 'VENSTRE',
    LEN: 'LENGDE',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'SMÅ',
    MATCH: 'SAMMENLIGNE',
    MAX: 'STØRST',
    MAXA: 'MAKSA',
    MAXIFS: 'MAKS.HVIS.SETT',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'DELTEKST',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MIN.HVIS.SETT',
    MINUTE: 'MINUTT',
    MIRR: 'MODIR',
    MMULT: 'MMULT',
    MOD: 'REST',
    MONTH: 'MÅNED',
    NA: 'IT',
    NETWORKDAYS: 'NETT.ARBEIDSDAGER',
    'NETWORKDAYS.INTL': 'NETT.ARBEIDSDAGER.INTL',
    NOMINAL: 'NOMINELL',
    NOT: 'IKKE',
    NOW: 'NÅ',
    NPER: 'PERIODER',
    NPV: 'NNV',
    OCT2BIN: 'OKTTILBIN',
    OCT2DEC: 'OKTTILDES',
    OCT2HEX: 'OKTTILHEKS',
    ODD: 'AVRUND.TIL.ODDETALL',
    OFFSET: 'FORSKYVNING',
    OR: 'ELLER',
    PDURATION: 'PVARIGHET',
    PI: 'PI',
    PMT: 'AVDRAG',
    PRODUCT: 'PRODUKT',
    POWER: 'OPPHØYD.I',
    PPMT: 'AMORT',
    PROPER: 'STOR.FORBOKSTAV',
    PV: 'NÅVERDI',
    RADIANS: 'RADIANER',
    RAND: 'TILFELDIG',
    RATE: 'RENTE',
    REPLACE: 'ERSTATT',
    REPT: 'GJENTA',
    RIGHT: 'HØYRE',
    ROUND: 'AVRUND',
    ROUNDDOWN: 'AVRUND.NED',
    ROUNDUP: 'AVRUND.OPP',
    ROW: 'RAD',
    ROWS: 'RADER',
    RRI: 'REALISERT.AVKASTNING',
    SEARCH: 'SØK',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUND',
    SHEET: 'ARK',
    SHEETS: 'SHEETS',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LINAVS',
    SPLIT: 'SPLIT',
    SQRT: 'ROT',
    STDEVA: 'STDAVVIKA',
    'STDEV.P': 'STDAV.P',
    STDEVPA: 'STDAVVIKPA',
    'STDEV.S': 'STDAV.S',
    SUBSTITUTE: 'BYTT.UT',
    SUBTOTAL: 'DELSUM',
    SUM: 'SUMMER',
    SUMIF: 'SUMMERHVIS',
    SUMIFS: 'SUMMER.HVIS.SETT',
    SUMPRODUCT: 'SUMMERPRODUKT',
    SUMSQ: 'SUMMERKVADRAT',
    SWITCH: '',
    SYD: 'ÅRSAVS',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'TBILLEKV',
    TBILLPRICE: 'TBILLPRIS',
    TBILLYIELD: 'TBILLAVKASTNING',
    TEXT: 'TEKST',
    TIME: 'TID',
    TIMEVALUE: 'TIDSVERDI',
    TODAY: 'IDAG',
    TRANSPOSE: 'TRANSPONER',
    TRIM: 'TRIMME',
    TRUE: 'SANN',
    TRUNC: 'AVKORT',
    UNICHAR: 'UNICODETEGN',
    UNICODE: 'UNICODE',
    UPPER: 'STORE',
    VARA: 'VARIANSA',
    'VAR.P': 'VARIANS.P',
    VARPA: 'VARIANSPA',
    'VAR.S': 'VARIANS.S',
    VLOOKUP: 'FINN.RAD',
    WEEKDAY: 'UKEDAG',
    WEEKNUM: 'UKENR',
    WORKDAY: 'ARBEIDSDAG',
    'WORKDAY.INTL': 'ARBEIDSDAG.INTL',
    XNPV: 'XNNV',
    XOR: 'EKSKLUSIVELLER',
    YEAR: 'ÅR',
    YEARFRAC: 'ÅRDEL',
    ROMAN: 'ROMERTALL',
    ARABIC: 'ARABISK',
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
    FACTDOUBLE: 'DOBBELFAKT',
    COMBIN: 'KOMBINASJON',
    COMBINA: 'KOMBINASJONA',
    GCD: 'SFF',
    LCM: 'MFM',
    MROUND: 'MRUND',
    MULTINOMIAL: 'MULTINOMINELL',
    QUOTIENT: 'KVOTIENT',
    RANDBETWEEN: 'TILFELDIGMELLOM',
    SERIESSUM: 'SUMMER.REKKE',
    SIGN: 'FORTEGN',
    SQRTPI: 'ROTPI',
    SUMX2MY2: 'SUMMERX2MY2',
    SUMX2PY2: 'SUMMERX2PY2',
    SUMXMY2: 'SUMMERXMY2',
    'EXPON.DIST': 'EKSP.FORDELING.N',
    EXPONDIST: 'EKSP.FORDELING',
    FISHER: 'FISHER',
    FISHERINV: 'FISHERINV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.FORDELING',
    'GAMMA.INV': 'GAMMA.INV',
    GAMMADIST: 'GAMMAFORDELING',
    GAMMAINV: 'GAMMAINV',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.PRESIS',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BETA.FORDELING.N',
    BETADIST: 'BETA.FORDELING',
    'BETA.INV': 'BETA.INV',
    BETAINV: 'INVERS.BETA.FORDELING',
    'BINOM.DIST': 'BINOM.FORDELING.N',
    BINOMDIST: 'BINOM.FORDELING',
    'BINOM.INV': 'BINOM.INV',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'KJI.FORDELING',
    CHIINV: 'INVERS.KJI.FORDELING',
    'CHISQ.DIST': 'KJIKVADRAT.FORDELING',
    'CHISQ.DIST.RT': 'KJIKVADRAT.FORDELING.H',
    'CHISQ.INV': 'KJIKVADRAT.INV',
    'CHISQ.INV.RT': 'KJIKVADRAT.INV.H',
    'F.DIST': 'F.FORDELING',
    'F.DIST.RT': 'F.FORDELING.H',
    'F.INV': 'F.INV',
    'F.INV.RT': 'F.INV.H',
    FDIST: 'FFORDELING',
    FINV: 'FFORDELING.INVERS',
    WEIBULL: 'WEIBULL.FORDELING',
    'WEIBULL.DIST': 'WEIBULL.DIST.N',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.FORDELING',
    'HYPGEOM.DIST': 'HYPGEOM.FORDELING.N',
    HYPGEOMDIST: 'HYPGEOM.FORDELING',
    'T.DIST': 'T.FORDELING',
    'T.DIST.2T': 'T.FORDELING.2T',
    'T.DIST.RT': 'T.FORDELING.H',
    'T.INV': 'T.INV',
    'T.INV.2T': 'T.INV.2T',
    TDIST: 'TFORDELING',
    TINV: 'TINV',
    LOGINV: 'LOGINV',
    'LOGNORM.DIST': 'LOGNORM.FORDELING',
    'LOGNORM.INV': 'LOGNORM.INV',
    LOGNORMDIST: 'LOGNORMFORD',
    'NORM.DIST': 'NORM.FORDELING',
    'NORM.INV': 'NORM.INV',
    'NORM.S.DIST': 'NORM.S.FORDELING',
    'NORM.S.INV': 'NORM.S.INV',
    NORMDIST: 'NORMALFORDELING',
    NORMINV: 'NORMINV',
    NORMSDIST: 'NORMSFORDELING',
    NORMSINV: 'NORMSINV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.FORDELING.N',
    NEGBINOMDIST: 'NEGBINOM.FORDELING',
    COMPLEX: 'KOMPLEKS',
    IMABS: 'IMABS',
    IMAGINARY: 'IMAGINÆR',
    IMARGUMENT: 'IMARGUMENT',
    IMCONJUGATE: 'IMKONJUGERT',
    IMCOS: 'IMCOS',
    IMCOSH: 'IMCOSH',
    IMCOT: 'IMCOT',
    IMCSC: 'IMCSC',
    IMCSCH: 'IMCSCH',
    IMDIV: 'IMDIV',
    IMEXP: 'IMEKSP',
    IMLN: 'IMLN',
    IMLOG10: 'IMLOG10',
    IMLOG2: 'IMLOG2',
    IMPOWER: 'IMOPPHØY',
    IMPRODUCT: 'IMPRODUKT',
    IMREAL: 'IMREELL',
    IMSEC: 'IMSEC',
    IMSECH: 'IMSECH',
    IMSIN: 'IMSIN',
    IMSINH: 'IMSINH',
    IMSQRT: 'IMROT',
    IMSUB: 'IMSUB',
    IMSUM: 'IMSUMMER',
    IMTAN: 'IMTAN',
    LARGE: 'N.STØRST',
    SMALL: 'N.MINST',
    AVEDEV: 'GJENNOMSNITTSAVVIK',
    CONFIDENCE: 'KONFIDENS',
    'CONFIDENCE.NORM': 'KONFIDENS.NORM',
    'CONFIDENCE.T': 'KONFIDENS.T',
    DEVSQ: 'AVVIK.KVADRERT',
    GEOMEAN: 'GJENNOMSNITT.GEOMETRISK',
    HARMEAN: 'GJENNOMSNITT.HARMONISK',
    CRITBINOM: 'GRENSE.BINOM',
    PEARSON: 'PEARSON',
    RSQ: 'RKVADRAT',
    STANDARDIZE: 'NORMALISER',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'ZTEST',
    'F.TEST': 'F.TEST',
    FTEST: 'FTEST',
    STEYX: 'STANDARDFEIL',
    SLOPE: 'STIGNINGSTALL',
    COVAR: 'KOVARIANS',
    'COVARIANCE.P': 'KOVARIANS.P',
    'COVARIANCE.S': 'KOVARIANS.S',
    'CHISQ.TEST': 'KJIKVADRAT.TEST',
    CHITEST: 'KJI.TEST',
    'T.TEST': 'T.TEST',
    TTEST: 'TTEST',
    SKEW: 'SKJEVFORDELING',
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
    'CEILING.MATH': 'AVRUND.GJELDENDE.MULTIPLUM.OPP.MATEMATISK',
    FLOOR: 'AVRUND.GJELDENDE.MULTIPLUM.NED',
    'FLOOR.MATH': 'AVRUND.GJELDENDE.MULTIPLUM.NED.MATEMATISK',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'nbNO',
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