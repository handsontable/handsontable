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
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ({

/***/ 8:
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
    DIV_BY_ZERO: '#ZÉRÓOSZTÓ!',
    ERROR: '#ERROR!',
    NA: '#HIÁNYZIK',
    NAME: '#NÉV?',
    NUM: '#SZÁM!',
    REF: '#HIV!',
    SPILL: '#KIBONTÁS!',
    VALUE: '#ÉRTÉK!'
  },
  functions: {
    FILTER: 'FILTER',
    'ARRAY_CONSTRAIN': 'ARRAY_CONSTRAIN',
    ARRAYFORMULA: 'ARRAYFORMULA',
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ARCCOT',
    ACOTH: 'ARCCOTH',
    AND: 'ÉS',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'ÁTLAG',
    AVERAGEA: 'ÁTLAGA',
    AVERAGEIF: 'ÁTLAGHA',
    BASE: 'ALAP',
    BIN2DEC: 'BIN.DEC',
    BIN2HEX: 'BIN.HEX',
    BIN2OCT: 'BIN.OKT',
    BITAND: 'BIT.ÉS',
    BITLSHIFT: 'BIT.BAL.ELTOL',
    BITOR: 'BIT.VAGY',
    BITRSHIFT: 'BIT.JOBB.ELTOL',
    BITXOR: 'BIT.XVAGY',
    CEILING: 'PLAFON',
    CHAR: 'KARAKTER',
    CHOOSE: 'VÁLASZT',
    CLEAN: 'TISZTÍT',
    CODE: 'KÓD',
    COLUMN: 'OSZLOP',
    COLUMNS: 'OSZLOPOK',
    CONCATENATE: 'ÖSSZEFŰZ',
    CORREL: 'KORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'DARAB',
    COUNTA: 'DARAB2',
    COUNTBLANK: 'DARABÜRES',
    COUNTIF: 'DARABTELI',
    COUNTIFS: 'DARABHATÖBB',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'ÖSSZES.KAMAT',
    CUMPRINC: 'ÖSSZES.TŐKERÉSZ',
    DATE: 'DÁTUM',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DÁTUMÉRTÉK',
    DAY: 'NAP',
    DAYS360: 'DAYS360',
    DAYS: 'NAPOK',
    DB: 'DB',
    DDB: 'KCSA',
    DEC2BIN: 'DEC.BIN',
    DEC2HEX: 'DEC.HEX',
    DEC2OCT: 'DEC.OKT',
    DECIMAL: 'TIZEDES',
    DEGREES: 'FOK',
    DELTA: 'DELTA',
    DOLLARDE: 'FORINT.DEC',
    DOLLARFR: 'FORINT.TÖRT',
    EDATE: 'KALK.DÁTUM',
    EFFECT: "TÉNYLEGES",
    EOMONTH: 'HÓNAP.UTOLSÓ.NAP',
    ERF: 'HIBAF',
    ERFC: 'HIBAF.KOMPLEMENTER',
    EVEN: 'PÁROS',
    EXACT: 'AZONOS',
    EXP: 'KITEVŐ',
    FALSE: 'HAMIS',
    FIND: 'SZÖVEG.TALÁL',
    FORMULATEXT: 'KÉPLETSZÖVEG',
    FV: 'JBÉ',
    FVSCHEDULE: 'KJÉ',
    HEX2BIN: 'HEX.BIN',
    HEX2DEC: 'HEX.DEC',
    HEX2OCT: 'HEX.OKT',
    HLOOKUP: 'VKERES',
    HOUR: 'ÓRA',
    IF: 'HA',
    IFERROR: 'HAHIBA',
    IFNA: 'HAHIÁNYZIK',
    INDEX: 'INDEX',
    INT: 'INT',
    INTERVAL: 'INTERVAL',
    IPMT: 'RRÉSZLET',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ÜRES',
    ISERR: 'HIBA.E',
    ISERROR: 'HIBÁS',
    ISEVEN: 'PÁROSE',
    ISFORMULA: 'KÉPLET',
    ISLOGICAL: 'LOGIKAI',
    ISNA: 'NINCS',
    ISNONTEXT: 'NEM.SZÖVEG',
    ISNUMBER: 'SZÁM',
    ISODD: 'PÁRATLANE',
    ISOWEEKNUM: 'ISO.HÉT.SZÁMA',
    ISPMT: 'LRÉSZLETKAMAT',
    ISREF: 'HIVATKOZÁS',
    ISTEXT: 'SZÖVEG.E',
    LEFT: 'BAL',
    LEN: 'HOSSZ',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'KISBETŰ',
    MATCH: 'HOL.VAN',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXIFS: 'MAXHA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIÁN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'KÖZÉP',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MINHA',
    MINUTE: 'PERCEK',
    MIRR: 'MEGTÉRÜLÉS',
    MMULT: 'MSZORZAT',
    MOD: 'MARADÉK',
    MONTH: 'HÓNAP',
    NA: 'HIÁNYZIK',
    NETWORKDAYS: 'ÖSSZ.MUNKANAP',
    'NETWORKDAYS.INTL': 'ÖSSZ.MUNKANAP.INTL',
    NOMINAL: 'NÉVLEGES',
    NOT: 'NEM',
    NOW: 'MOST',
    NPER: 'PER.SZÁM',
    NPV: 'NMÉ',
    OCT2BIN: 'OKT.BIN',
    OCT2DEC: 'OKT.DEC',
    OCT2HEX: 'OKT.HEX',
    ODD: 'PÁRATLAN',
    OFFSET: 'ELTOLÁS',
    OR: 'VAGY',
    PDURATION: 'KAMATÉRZ.PER',
    PI: 'PI',
    PMT: 'RÉSZLET',
    PRODUCT: 'SZORZAT',
    POWER: 'HATVÁNY',
    PPMT: 'PRÉSZLET',
    PROPER: 'TNÉV',
    PV: 'MÉ',
    RADIANS: 'RADIÁN',
    RAND: 'VÉL',
    RATE: 'RÁTA',
    REPLACE: 'CSERE',
    REPT: 'SOKSZOR',
    RIGHT: 'JOBB',
    ROUND: 'KEREKÍTÉS',
    ROUNDDOWN: 'KEREK.LE',
    ROUNDUP: 'KEREK.FEL',
    ROW: 'SOR',
    ROWS: 'SOROK',
    RRI: 'MR',
    SEARCH: 'SZÖVEG.KERES',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'MPERC',
    SHEET: 'LAP',
    SHEETS: 'LAPOK',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LCSA',
    SPLIT: 'SPLIT',
    SQRT: 'GYÖK',
    STDEVA: 'SZÓRÁSA',
    'STDEV.P': 'SZÓR.S',
    STDEVPA: 'SZÓRÁSPA',
    'STDEV.S': 'SZÓR.M',
    SUBSTITUTE: 'HELYETTE',
    SUBTOTAL: 'RÉSZÖSSZEG',
    SUM: 'SZUM',
    SUMIF: 'SZUMHA',
    SUMIFS: 'SZUMHATÖBB',
    SUMPRODUCT: 'SZORZATÖSSZEG',
    SUMSQ: 'NÉGYZETÖSSZEG',
    SWITCH: '',
    SYD: 'ÉSZÖ',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'KJEGY.EGYENÉRT',
    TBILLPRICE: 'KJEGY.ÁR',
    TBILLYIELD: 'KJEGY.HOZAM',
    TEXT: 'SZÖVEG',
    TIME: 'IDŐ',
    TIMEVALUE: 'IDŐÉRTÉK',
    TODAY: 'MA',
    TRANSPOSE: 'TRANSZPONÁLÁS',
    TRIM: 'KIMETSZ',
    TRUE: 'IGAZ',
    TRUNC: 'CSONK',
    UNICHAR: 'UNIKARAKTER',
    UNICODE: 'UNICODE',
    UPPER: 'NAGYBETŰS',
    VARA: 'VARA',
    'VAR.P': 'VAR.S',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.M',
    VLOOKUP: 'FKERES',
    WEEKDAY: 'HÉT.NAPJA',
    WEEKNUM: 'HÉT.SZÁMA',
    WORKDAY: 'KALK.MUNKANAP',
    'WORKDAY.INTL': 'KALK.MUNKANAP.INTL',
    XNPV: 'XNJÉ',
    XOR: 'XVAGY',
    YEAR: 'ÉV',
    YEARFRAC: 'TÖRTÉV',
    ROMAN: 'RÓMAI',
    ARABIC: 'ARAB',
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
    VAR: 'VAR',
    VARP: 'VARP',
    STDEV: 'SZÓRÁS',
    STDEVP: 'SZÓRÁSP',
    FACT: 'FAKT',
    FACTDOUBLE: 'FAKTDUPLA',
    COMBIN: 'KOMBINÁCIÓK',
    COMBINA: 'KOMBINÁCIÓK.ISM',
    GCD: 'LKO',
    LCM: 'LKT',
    MROUND: 'TÖBBSZ.KEREKÍT',
    MULTINOMIAL: 'SZORHÁNYFAKT',
    QUOTIENT: 'KVÓCIENS',
    RANDBETWEEN: 'VÉLETLEN.KÖZÖTT',
    SERIESSUM: 'SORÖSSZEG',
    SIGN: 'ELŐJEL',
    SQRTPI: 'GYÖKPI',
    SUMX2MY2: 'SZUMX2BŐLY2',
    SUMX2PY2: 'SZUMX2MEGY2',
    SUMXMY2: 'SZUMXBŐLY2',
    'EXPON.DIST': 'EXP.ELOSZL',
    EXPONDIST: 'EXP.ELOSZLÁS',
    FISHER: 'FISHER',
    FISHERINV: 'INVERZ.FISHER',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.ELOSZL',
    'GAMMA.INV': 'GAMMA.INVERZ',
    GAMMADIST: 'GAMMA.ELOSZLÁS',
    GAMMAINV: 'INVERZ.GAMMA',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.PONTOS',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BÉTA.ELOSZL',
    BETADIST: 'BÉTA.ELOSZLÁS',
    'BETA.INV': 'BÉTA.INVERZ',
    BETAINV: 'INVERZ.BÉTA',
    'BINOM.DIST': 'BINOM.ELOSZL',
    BINOMDIST: 'BINOM.ELOSZLÁS',
    'BINOM.INV': 'BINOM.INVERZ',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'KHI.ELOSZLÁS',
    CHIINV: 'INVERZ.KHI',
    'CHISQ.DIST': 'KHINÉGYZET.ELOSZLÁS',
    'CHISQ.DIST.RT': 'KHINÉGYZET.ELOSZLÁS.JOBB',
    'CHISQ.INV': 'KHINÉGYZET.INVERZ',
    'CHISQ.INV.RT': 'KHINÉGYZET.INVERZ.JOBB',
    'F.DIST': 'F.ELOSZL',
    'F.DIST.RT': 'F.ELOSZLÁS.JOBB',
    'F.INV': 'F.INVERZ',
    'F.INV.RT': 'F.INVERZ.JOBB',
    FDIST: 'F.ELOSZLÁS',
    FINV: 'INVERZ.F',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.ELOSZLÁS',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.ELOSZLÁS',
    'HYPGEOM.DIST': 'HIPGEOM.ELOSZLÁS',
    HYPGEOMDIST: 'HIPERGEOM.ELOSZLÁS',
    'T.DIST': 'T.ELOSZL',
    'T.DIST.2T': 'T.ELOSZLÁS.2SZ',
    'T.DIST.RT': 'T.ELOSZLÁS.JOBB',
    'T.INV': 'T.INVERZ',
    'T.INV.2T': 'T.INVERZ.2SZ',
    TDIST: 'T.ELOSZLÁS',
    TINV: 'INVERZ.T',
    LOGINV: 'INVERZ.LOG.ELOSZLÁS',
    'LOGNORM.DIST': 'LOGNORM.ELOSZLÁS',
    'LOGNORM.INV': 'LOGNORM.INVERZ',
    LOGNORMDIST: 'LOG.ELOSZLÁS',
    'NORM.DIST': 'NORM.ELOSZLÁS',
    'NORM.INV': 'NORM.INVERZ',
    'NORM.S.DIST': 'NORM.S.ELOSZLÁS',
    'NORM.S.INV': 'NORM.S.INVERZ',
    NORMDIST: 'NORM.ELOSZL',
    NORMINV: 'INVERZ.NORM',
    NORMSDIST: 'STNORMELOSZL',
    NORMSINV: 'INVERZ.STNORM',
    PHI: 'FI',
    'NEGBINOM.DIST': 'NEGBINOM.ELOSZLÁS',
    NEGBINOMDIST: 'NEGBINOM.ELOSZL',
    COMPLEX: 'KOMPLEX',
    IMABS: 'KÉPZ.ABSZ',
    IMAGINARY: 'KÉPZETES',
    IMARGUMENT: 'KÉPZ.ARGUMENT',
    IMCONJUGATE: 'KÉPZ.KONJUGÁLT',
    IMCOS: 'KÉPZ.COS',
    IMCOSH: 'KÉPZ.COSH',
    IMCOT: 'KÉPZ.COT',
    IMCSC: 'KÉPZ.CSC',
    IMCSCH: 'KÉPZ.CSCH',
    IMDIV: 'KÉPZ.HÁNYAD',
    IMEXP: 'KÉPZ.EXP',
    IMLN: 'KÉPZ.LN',
    IMLOG10: 'KÉPZ.LOG10',
    IMLOG2: 'KÉPZ.LOG2',
    IMPOWER: 'KÉPZ.HATV',
    IMPRODUCT: 'KÉPZ.SZORZAT',
    IMREAL: 'KÉPZ.VALÓS',
    IMSEC: 'KÉPZ.SEC',
    IMSECH: 'KÉPZ.SECH',
    IMSIN: 'KÉPZ.SIN',
    IMSINH: 'KÉPZ.SINH',
    IMSQRT: 'KÉPZ.GYÖK',
    IMSUB: 'KÉPZ.KÜL',
    IMSUM: 'KÉPZ.ÖSSZEG',
    IMTAN: 'KÉPZ.TAN',
    LARGE: 'NAGY',
    SMALL: 'KICSI',
    AVEDEV: 'ÁTL.ELTÉRÉS',
    CONFIDENCE: 'MEGBÍZHATÓSÁG',
    'CONFIDENCE.NORM': 'MEGBÍZHATÓSÁG.NORM',
    'CONFIDENCE.T': 'MEGBÍZHATÓSÁG.T',
    DEVSQ: 'SQ',
    GEOMEAN: 'MÉRTANI.KÖZÉP',
    HARMEAN: 'HARM.KÖZÉP',
    CRITBINOM: 'KRITBINOM',
    PEARSON: 'PEARSON',
    RSQ: 'RNÉGYZET',
    STANDARDIZE: 'NORMALIZÁLÁS',
    'Z.TEST': 'Z.PRÓB',
    ZTEST: 'Z.PRÓBA',
    'F.TEST': 'F.PRÓB',
    FTEST: 'F.PRÓBA',
    STEYX: 'STHIBAYX',
    SLOPE: 'MEREDEKSÉG',
    COVAR: 'KOVAR',
    'COVARIANCE.P': 'KOVARIANCIA.S',
    'COVARIANCE.S': 'KOVARIANCIA.M',
    'CHISQ.TEST': 'KHINÉGYZET.PRÓBA',
    CHITEST: 'KHI.PRÓBA',
    'T.TEST': 'T.PRÓB',
    TTEST: 'T.PRÓBA',
    SKEW: 'FERDESÉG',
    'SKEW.P': 'FERDESÉG.P',
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
    'CEILING.MATH': 'PLAFON.MAT',
    FLOOR: 'PADLÓ',
    'FLOOR.MATH': 'PADLÓ.MAT',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'huHU',
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