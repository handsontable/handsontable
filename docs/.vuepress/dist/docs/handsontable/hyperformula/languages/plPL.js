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
/******/ 	return __webpack_require__(__webpack_require__.s = 13);
/******/ })
/************************************************************************/
/******/ ({

/***/ 13:
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
    CYCLE: '#CYKL!',
    DIV_BY_ZERO: '#DZIEL/0!',
    ERROR: '#BŁĄD!',
    NA: '#N/A',
    NAME: '#NAZWA?',
    NUM: '#LICZBA!',
    REF: '#ADR!',
    SPILL: '#ROZLANIE!',
    VALUE: '#ARG!'
  },
  functions: {
    FILTER: 'FILTER',
    'ARRAY_CONSTRAIN': 'ARRAY_CONSTRAIN',
    ARRAYFORMULA: 'ARRAYFORMULA',
    ABS: 'WART.BEZWGL',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'ORAZ',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'ŚREDNIA',
    AVERAGEA: 'ŚREDNIA.A',
    AVERAGEIF: 'ŚREDNIA.JEŻELI',
    BASE: 'PODSTAWA',
    BIN2DEC: 'DWÓJK.NA.DZIES',
    BIN2HEX: 'DWÓJK.NA.SZESN',
    BIN2OCT: 'DWÓJK.NA.ÓSM',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'ZAOKR.W.GÓRĘ',
    CHAR: 'ZNAK',
    CHOOSE: 'WYBIERZ',
    CLEAN: 'OCZYŚĆ',
    CODE: 'KOD',
    COLUMN: 'NR.KOLUMNY',
    COLUMNS: 'LICZBA.KOLUMN',
    CONCATENATE: 'ZŁĄCZ.TEKST',
    CORREL: 'WSP.KORELACJI',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'COUNT',
    COUNTA: 'COUNTA',
    COUNTBLANK: 'LICZ.PUSTE',
    COUNTIF: 'LICZ.JEŻELI',
    COUNTIFS: 'LICZ.WARUNKI',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'SPŁAC.ODS',
    CUMPRINC: 'SPŁAC.KAPIT',
    DATE: 'DATA',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DATA.WARTOŚĆ',
    DAY: 'DZIEŃ',
    DAYS360: 'DNI.360',
    DAYS: 'DNI',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DZIES.NA.DWÓJK',
    DEC2HEX: 'DZIES.NA.SZESN',
    DEC2OCT: 'DZIES.NA.ÓSM',
    DECIMAL: 'DZIESIĘTNA',
    DEGREES: 'STOPNIE',
    DELTA: 'DELTA',
    DOLLARDE: 'CENA.DZIES',
    DOLLARFR: 'CENA.UŁAM',
    EDATE: 'NR.SER.DATY',
    EFFECT: "EFEKTYWNA",
    EOMONTH: 'NR.SER.OST.DN.MIEŚ',
    ERF: 'FUNKCJA.BŁ',
    ERFC: 'KOMP.FUNKCJA.BŁ',
    EVEN: 'ZAOKR.DO.PARZ',
    EXACT: 'PORÓWNAJ',
    EXP: 'EXP',
    FALSE: 'FAŁSZ',
    FIND: 'ZNAJDŹ',
    FORMULATEXT: 'FORMUŁA.TEKST',
    FV: 'FV',
    FVSCHEDULE: 'WART.PRZYSZŁ.KAP',
    HEX2BIN: 'SZESN.NA.DWÓJK',
    HEX2DEC: 'SZESN.NA.DZIES',
    HEX2OCT: 'SZESN.NA.ÓSM',
    HLOOKUP: 'WYSZUKAJ.POZIOMO',
    HOUR: 'GODZINA',
    IF: 'JEŻELI',
    IFERROR: 'JEŻELI.BŁĄD',
    IFNA: 'JEŻELI.ND',
    INDEX: 'INDEKS',
    INT: 'ZAOKR.DO.CAŁK',
    INTERVAL: 'INTERVAL',
    IPMT: 'IPMT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'CZY.PUSTA',
    ISERR: 'CZY.BŁ',
    ISERROR: 'CZY.BŁĄD',
    ISEVEN: 'CZY.PARZYSTE',
    ISFORMULA: 'CZY.FORMUŁA',
    ISLOGICAL: 'CZY.LOGICZNA',
    ISNA: 'CZY.BRAK',
    ISNONTEXT: 'CZY.NIE.TEKST',
    ISNUMBER: 'CZY.LICZBA',
    ISODD: 'CZY.NIEPARZYSTE',
    ISOWEEKNUM: 'ISO.NUM.TYG',
    ISPMT: 'ISPMT',
    ISREF: 'CZY.ADR',
    ISTEXT: 'CZY.TEKST',
    LEFT: 'LEWY',
    LEN: 'DŁ',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'LITERY.MAŁE',
    MATCH: 'PODAJ.POZYCJĘ',
    MAX: 'MAKS',
    MAXA: 'MAX.A',
    MAXIFS: 'MAKS.WARUNKÓW',
    MAXPOOL: 'MAKS.Z.PULI',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANA.Z.PULI',
    MID: 'FRAGMENT.TEKSTU',
    MIN: 'MIN',
    MINA: 'MIN.A',
    MINIFS: 'MIN.WARUNKÓW',
    MINUTE: 'MINUTA',
    MIRR: 'MIRR',
    MMULT: 'MACIERZ.ILOCZYN',
    MOD: 'MOD',
    MONTH: 'MIESIĄC',
    NA: 'BRAK',
    NETWORKDAYS: 'DNI.ROBOCZE',
    'NETWORKDAYS.INTL': 'DNI.ROBOCZE.NIESTAND',
    NOMINAL: 'NOMINALNA',
    NOT: 'NIE',
    NOW: 'TERAZ',
    NPER: 'NPER',
    NPV: 'NPV',
    OCT2BIN: 'ÓSM.NA.DWÓJK',
    OCT2DEC: 'ÓSM.NA.DZIES',
    OCT2HEX: 'ÓSM.NA.SZESN',
    ODD: 'ZAOKR.DO.NPARZ',
    OFFSET: 'PRZESUNIĘCIE',
    OR: 'LUB',
    PDURATION: 'ROCZ.PRZYCH',
    PI: 'PI',
    PMT: 'PMT',
    PRODUCT: 'ILOCZYN',
    POWER: 'POTĘGA',
    PPMT: 'PPMT',
    PROPER: 'Z.WIELKIEJ.LITERY',
    PV: 'PV',
    RADIANS: 'RADIANY',
    RAND: 'LOSUJ',
    RATE: 'RATE',
    REPLACE: 'ZASTĄP',
    REPT: 'POWT',
    RIGHT: 'PRAWY',
    ROUND: 'ZAOKR',
    ROUNDDOWN: 'ZAOKR.DÓŁ',
    ROUNDUP: 'ZAOKR.GÓRA',
    ROW: 'WIERSZ',
    ROWS: 'ILE.WIERSZY',
    RRI: 'RÓWNOW.STOPA.PROC',
    SEARCH: 'SZUKAJ.TEKST',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUNDA',
    SHEET: 'ARKUSZ',
    SHEETS: 'ARKUSZE',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'SLN',
    SPLIT: 'PODZIEL.TEKST',
    SQRT: 'PIERWIASTEK',
    STDEVA: 'ODCH.STANDARDOWE.A',
    'STDEV.P': 'ODCH.STAND.POPUL',
    STDEVPA: 'ODCH.STANDARD.POPUL.A',
    'STDEV.S': 'ODCH.STANDARD.PRÓBKI',
    SUBSTITUTE: 'PODSTAW',
    SUBTOTAL: 'SUMY.CZĘŚCIOWE',
    SUM: 'SUMA',
    SUMIF: 'SUMA.JEŻELI',
    SUMIFS: 'SUMY.JEŻELI',
    SUMPRODUCT: 'SUMA.ILOCZYNÓW',
    SUMSQ: 'SUMSQ',
    SWITCH: 'PRZEŁĄCZ',
    SYD: 'SYD',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'RENT.EKW.BS',
    TBILLPRICE: 'CENA.BS',
    TBILLYIELD: 'RENT.BS',
    TEXT: 'TEKST',
    TIME: 'CZAS',
    TIMEVALUE: 'CZAS.WARTOŚĆ',
    TODAY: 'DZIŚ',
    TRANSPOSE: 'TRANSPONUJ',
    TRIM: 'USUŃ.ZBĘDNE.ODSTĘPY',
    TRUE: 'PRAWDA',
    TRUNC: 'LICZBA.CAŁK',
    UNICHAR: 'ZNAK.UNICODE',
    UNICODE: 'UNICODE',
    UPPER: 'LITERY.WIELKIE',
    VARA: 'WARIANCJA.A',
    'VAR.P': 'WARIANCJA.POP',
    VARPA: 'WARIANCJA.POPUL.A',
    'VAR.S': 'WARIANCJA.PRÓBKI',
    VLOOKUP: 'WYSZUKAJ.PIONOWO',
    WEEKDAY: 'DZIEŃ.TYG',
    WEEKNUM: 'NUM.TYG',
    WORKDAY: 'DZIEŃ.ROBOCZY',
    'WORKDAY.INTL': 'DZIEŃ.ROBOCZY.NIESTAND',
    XNPV: 'XNPV',
    XOR: 'XOR',
    YEAR: 'ROK',
    YEARFRAC: 'CZĘŚĆ.ROKU',
    ROMAN: 'RZYMSKIE',
    ARABIC: 'ARABSKA',
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
    VAR: 'WARIANCJA',
    VARP: 'WARIANCJA.POPUL',
    STDEV: 'ODCH.STANDARDOWE',
    STDEVP: 'ODCH.STANDARD.POPUL',
    FACT: 'SILNIA',
    FACTDOUBLE: 'SILNIA.DWUKR',
    COMBIN: 'KOMBINACJE',
    COMBINA: 'KOMBINACJE.A',
    GCD: 'NAJW.WSP.DZIEL',
    LCM: 'NAJMN.WSP.WIEL',
    MROUND: 'ZAOKR.DO.WIELOKR',
    MULTINOMIAL: 'WIELOMIAN',
    QUOTIENT: 'CZ.CAŁK.DZIELENIA',
    RANDBETWEEN: 'LOS.ZAKR',
    SERIESSUM: 'SUMA.SZER.POT',
    SIGN: 'ZNAK.LICZBY',
    SQRTPI: 'PIERW.PI',
    SUMX2MY2: 'SUMA.X2.M.Y2',
    SUMX2PY2: 'SUMA.X2.P.Y2',
    SUMXMY2: 'SUMA.XMY.2',
    'EXPON.DIST': 'ROZKŁ.EXP',
    EXPONDIST: 'ROZKŁAD.EXP',
    FISHER: 'ROZKŁAD.FISHER',
    FISHERINV: 'ROZKŁAD.FISHER.ODW',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'ROZKŁ.GAMMA',
    'GAMMA.INV': 'ROZKŁ.GAMMA.ODWR',
    GAMMADIST: 'ROZKŁAD.GAMMA',
    GAMMAINV: 'ROZKŁAD.GAMMA.ODW',
    GAMMALN: 'ROZKŁAD.LIN.GAMMA',
    'GAMMALN.PRECISE': 'ROZKŁAD.LIN.GAMMA.DOKŁ',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'ROZKŁ.BETA',
    BETADIST: 'ROZKŁAD.BETA',
    'BETA.INV': 'ROZKŁ.BETA.ODWR',
    BETAINV: 'ROZKŁAD.BETA.ODW',
    'BINOM.DIST': 'ROZKŁ.DWUM',
    BINOMDIST: 'ROZKŁAD.DWUM',
    'BINOM.INV': 'ROZKŁ.DWUM.ODWR',
    BESSELI: 'BESSEL.I',
    BESSELJ: 'BESSEL.J',
    BESSELK: 'BESSEL.K',
    BESSELY: 'BESSEL.Y',
    CHIDIST: 'ROZKŁAD.CHI',
    CHIINV: 'ROZKŁAD.CHI.ODW',
    'CHISQ.DIST': 'ROZKŁ.CHI',
    'CHISQ.DIST.RT': 'ROZKŁ.CHI.PŚ',
    'CHISQ.INV': 'ROZKŁ.CHI.ODWR',
    'CHISQ.INV.RT': 'ROZKŁ.CHI.ODWR.PŚ',
    'F.DIST': 'ROZKŁ.F',
    'F.DIST.RT': 'ROZKŁ.F.PŚ',
    'F.INV': 'ROZKŁ.F.ODWR',
    'F.INV.RT': 'ROZKŁ.F.ODWR.PŚ',
    FDIST: 'ROZKŁAD.F',
    FINV: 'ROZKŁAD.F.ODW',
    WEIBULL: 'ROZKŁAD.WEIBULL',
    'WEIBULL.DIST': 'ROZKŁ.WEIBULL',
    POISSON: 'ROZKŁAD.POISSON',
    'POISSON.DIST': 'ROZKŁ.POISSON',
    'HYPGEOM.DIST': 'ROZKŁ.HIPERGEOM',
    HYPGEOMDIST: 'ROZKŁAD.HIPERGEOM',
    'T.DIST': 'ROZKŁ.T.PS',
    'T.DIST.2T': 'ROZKŁ.T.DŚ',
    'T.DIST.RT': 'ROZKŁ.T.PŚ',
    'T.INV': 'ROZKŁ.T.ODWR',
    'T.INV.2T': 'ROZKŁ.T.ODWR.DŚ',
    TDIST: 'ROZKŁAD.T',
    TINV: 'ROZKŁAD.T.ODW',
    LOGINV: 'ROZKŁAD.LOG.ODW',
    'LOGNORM.DIST': 'ROZKŁ.LOG',
    'LOGNORM.INV': 'ROZKŁ.LOG.ODWR',
    LOGNORMDIST: 'ROZKŁAD.LOG',
    'NORM.DIST': 'ROZKŁ.NORMALNY',
    'NORM.INV': 'ROZKŁ.NORMALNY.ODWR',
    'NORM.S.DIST': 'ROZKŁ.NORMALNY.S',
    'NORM.S.INV': 'ROZKŁ.NORMALNY.S.ODWR',
    NORMDIST: 'ROZKŁAD.NORMALNY',
    NORMINV: 'ROZKŁAD.NORMALNY.ODW',
    NORMSDIST: 'ROZKŁAD.NORMALNY.S',
    NORMSINV: 'ROZKŁAD.NORMALNY.S.ODW',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'ROZKŁ.DWUM.PRZEC',
    NEGBINOMDIST: 'ROZKŁAD.DWUM.PRZEC',
    COMPLEX: 'LICZBA.ZESP',
    IMABS: 'MODUŁ.LICZBY.ZESP',
    IMAGINARY: 'CZ.UROJ.LICZBY.ZESP',
    IMARGUMENT: 'ARG.LICZBY.ZESP',
    IMCONJUGATE: 'SPRZĘŻ.LICZBY.ZESP',
    IMCOS: 'COS.LICZBY.ZESP',
    IMCOSH: 'COSH.LICZBY.ZESP',
    IMCOT: 'COT.LICZBY.ZESP',
    IMCSC: 'CSC.LICZBY.ZESP',
    IMCSCH: 'CSCH.LICZBY.ZESP',
    IMDIV: 'ILORAZ.LICZB.ZESP',
    IMEXP: 'EXP.LICZBY.ZESP',
    IMLN: 'LN.LICZBY.ZESP',
    IMLOG10: 'LOG10.LICZBY.ZESP',
    IMLOG2: 'LOG2.LICZBY.ZESP',
    IMPOWER: 'POTĘGA.LICZBY.ZESP',
    IMPRODUCT: 'ILOCZYN.LICZB.ZESP',
    IMREAL: 'CZ.RZECZ.LICZBY.ZESP',
    IMSEC: 'SEC.LICZBY.ZESP',
    IMSECH: 'SECH.LICZBY.ZESP',
    IMSIN: 'SIN.LICZBY.ZESP',
    IMSINH: 'SINH.LICZBY.ZESP',
    IMSQRT: 'PIERWIASTEK.LICZBY.ZESP',
    IMSUB: 'RÓŻN.LICZB.ZESP',
    IMSUM: 'SUMA.LICZB.ZESP',
    IMTAN: 'TAN.LICZBY.ZESP',
    LARGE: 'MAX.K',
    SMALL: 'MIN.K',
    AVEDEV: 'ODCH.ŚREDNIE',
    CONFIDENCE: 'UFNOŚĆ',
    'CONFIDENCE.NORM': 'UFNOŚĆ.NORM',
    'CONFIDENCE.T': 'UFNOŚĆ.T',
    DEVSQ: 'ODCH.KWADRATOWE',
    GEOMEAN: 'ŚREDNIA.GEOMETRYCZNA',
    HARMEAN: 'ŚREDNIA.HARMONICZNA',
    CRITBINOM: 'PRÓG.ROZKŁAD.DWUM',
    PEARSON: 'PEARSON',
    RSQ: 'R.KWADRAT',
    STANDARDIZE: 'NORMALIZUJ',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'TEST.Z',
    'F.TEST': 'F.TEST',
    FTEST: 'TEST.F',
    STEYX: 'REGBŁSTD',
    SLOPE: 'NACHYLENIE',
    COVAR: 'KOWARIANCJA',
    'COVARIANCE.P': 'KOWARIANCJA.POPUL',
    'COVARIANCE.S': 'KOWARIANCJA.PRÓBKI',
    'CHISQ.TEST': 'CHI.TEST',
    CHITEST: 'TEST.CHI',
    'T.TEST': 'T.TEST',
    TTEST: 'TEST.T',
    SKEW: 'SKOŚNOŚĆ',
    'SKEW.P': 'SKOŚNOŚĆ.P',
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
    'CEILING.MATH': 'ZAOKR.W.GÓRĘ.MATEMATYCZNE',
    FLOOR: 'ZAOKR.W.DÓŁ',
    'FLOOR.MATH': 'ZAOKR.W.DÓŁ.MATEMATYCZNE',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'plPL',
  ui: {
    NEW_SHEET_PREFIX: 'Arkusz'
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