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
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ({

/***/ 5:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.dictionary = exports.default = void 0;
/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */
const dictionary = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#¡DIV/0!',
    ERROR: '#ERROR!',
    NA: '#N/D',
    NAME: '#¿NOMBRE?',
    NUM: '#¡NUM!',
    REF: '#¡REF!',
    SPILL: '#¡DESBORDAMIENTO!',
    VALUE: '#¡VALOR!'
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
    AND: 'Y',
    ASIN: 'ASENO',
    ASINH: 'ASENOH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'PROMEDIO',
    AVERAGEA: 'PROMEDIOA',
    AVERAGEIF: 'PROMEDIO.SI',
    BASE: 'BASE',
    BIN2DEC: 'BIN.A.DEC',
    BIN2HEX: 'BIN.A.HEX',
    BIN2OCT: 'BIN.A.OCT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'MULTIPLO.SUPERIOR',
    CHAR: 'CARACTER',
    CHOOSE: 'ELEGIR',
    CLEAN: 'LIMPIAR',
    CODE: 'CODIGO',
    COLUMN: 'COLUMNA',
    COLUMNS: 'COLUMNAS',
    CONCATENATE: 'CONCATENAR',
    CORREL: 'COEF.DE.CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'CONTAR',
    COUNTA: 'CONTARA',
    COUNTBLANK: 'CONTAR.BLANCO',
    COUNTIF: 'CONTAR.SI',
    COUNTIFS: 'CONTAR.SI.CONJUNTO',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'PAGO.INT.ENTRE',
    CUMPRINC: 'PAGO.PRINC.ENTRE',
    DATE: 'FECHA',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'FECHANUMERO',
    DAY: 'DIA',
    DAYS360: 'DIAS360',
    DAYS: 'DÍAS',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DEC.A.BIN',
    DEC2HEX: 'DEC.A.HEX',
    DEC2OCT: 'DEC.A.OCT',
    DECIMAL: 'CONV.DECIMAL',
    DEGREES: 'GRADOS',
    DELTA: 'DELTA',
    DOLLARDE: 'MONEDA.DEC',
    DOLLARFR: 'MONEDA.FRAC',
    EDATE: 'FECHA.MES',
    EFFECT: "INT.EFECTIVO",
    EOMONTH: 'FIN.MES',
    ERF: 'FUN.ERROR',
    ERFC: 'FUN.ERROR.COMPL',
    EVEN: 'REDONDEA.PAR',
    EXACT: 'IGUAL',
    EXP: 'EXP',
    FALSE: 'FALSO',
    FIND: 'ENCONTRAR',
    FORMULATEXT: 'FORMULATEXTO',
    FV: 'VF',
    FVSCHEDULE: 'VF.PLAN',
    HEX2BIN: 'HEX.A.BIN',
    HEX2DEC: 'HEX.A.DEC',
    HEX2OCT: 'HEX.A.OCT',
    HLOOKUP: 'BUSCARH',
    HOUR: 'HORA',
    IF: 'SI',
    IFERROR: 'SI.ERROR',
    IFNA: 'IFNA',
    INDEX: 'INDICE',
    INT: 'ENTERO',
    INTERVAL: 'INTERVAL',
    IPMT: 'PAGOINT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ESBLANCO',
    ISERR: 'ESERR',
    ISERROR: 'ESERROR',
    ISEVEN: 'ES.PAR',
    ISFORMULA: 'ISFORMULA',
    ISLOGICAL: 'ESLOGICO',
    ISNA: 'ESNOD',
    ISNONTEXT: 'ESNOTEXTO',
    ISNUMBER: 'ESNUMERO',
    ISODD: 'ES.IMPAR',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'INT.PAGO.DIR',
    ISREF: 'ESREF',
    ISTEXT: 'ESTEXTO',
    LEFT: 'IZQUIERDA',
    LEN: 'LARGO',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'MINUSC',
    MATCH: 'COINCIDIR',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXIFS: 'MAX.SI.CONJUNTO',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'EXTRAE',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MIN.SI.CONJUNTO',
    MINUTE: 'MINUTO',
    MIRR: 'TIRM',
    MMULT: 'MMULT',
    MOD: 'RESIDUO',
    MONTH: 'MES',
    NA: 'NOD',
    NETWORKDAYS: 'DIAS.LAB',
    'NETWORKDAYS.INTL': 'DIAS.LAB.INTL',
    NOMINAL: 'TASA.NOMINAL',
    NOT: 'NO',
    NOW: 'AHORA',
    NPER: 'NPER',
    NPV: 'VNA',
    OCT2BIN: 'OCT.A.BIN',
    OCT2DEC: 'OCT.A.DEC',
    OCT2HEX: 'OCT.A.HEX',
    ODD: 'REDONDEA.IMPAR',
    OFFSET: 'DESREF',
    OR: 'O',
    PDURATION: 'PDURATION',
    PI: 'PI',
    PMT: 'PAGO',
    PRODUCT: 'PRODUCTO',
    POWER: 'POTENCIA',
    PPMT: 'PAGOPRIN',
    PROPER: 'NOMPROPIO',
    PV: 'VA',
    RADIANS: 'RADIANES',
    RAND: 'ALEATORIO',
    RATE: 'TASA',
    REPLACE: 'REEMPLAZAR',
    REPT: 'REPETIR',
    RIGHT: 'DERECHA',
    ROUND: 'REDONDEAR',
    ROUNDDOWN: 'REDONDEAR.MENOS',
    ROUNDUP: 'REDONDEAR.MAS',
    ROW: 'FILA',
    ROWS: 'FILAS',
    RRI: 'RRI',
    SEARCH: 'HALLAR',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEGUNDO',
    SHEET: 'HOJA',
    SHEETS: 'HOJAS',
    SIN: 'SENO',
    SINH: 'SENOH',
    SLN: 'SLN',
    SPLIT: 'SPLIT',
    SQRT: 'RAIZ',
    STDEVA: 'DESVESTA',
    'STDEV.P': 'DESVEST.P',
    STDEVPA: 'DESVESTPA',
    'STDEV.S': 'DESVEST.M',
    SUBSTITUTE: 'SUSTITUIR',
    SUBTOTAL: 'SUBTOTALES',
    SUM: 'SUMA',
    SUMIF: 'SUMAR.SI',
    SUMIFS: 'SUMAR.SI.CONJUNTO',
    SUMPRODUCT: 'SUMAPRODUCTO',
    SUMSQ: 'SUMA.CUADRADOS',
    SWITCH: '',
    SYD: 'SYD',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'LETRA.DE.TEST.EQV.A.BONO',
    TBILLPRICE: 'LETRA.DE.TES.PRECIO',
    TBILLYIELD: 'LETRA.DE.TES.RENDTO',
    TEXT: 'TEXTO',
    TIME: 'NSHORA',
    TIMEVALUE: 'HORANUMERO',
    TODAY: 'HOY',
    TRANSPOSE: 'TRANSPONER',
    TRIM: 'ESPACIOS',
    TRUE: 'VERDADERO',
    TRUNC: 'TRUNCAR',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'MAYUSC',
    VARA: 'VARA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'BUSCARV',
    WEEKDAY: 'DIASEM',
    WEEKNUM: 'NUM.DE.SEMANA',
    WORKDAY: 'DIA.LAB',
    'WORKDAY.INTL': 'DIA.LAB.INTL',
    XNPV: 'VNA.NO.PER',
    XOR: 'XOR',
    YEAR: 'AÑO',
    YEARFRAC: 'FRAC.AÑO',
    ROMAN: 'NUMERO.ROMANO',
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
    VAR: 'VAR',
    VARP: 'VARP',
    STDEV: 'DESVEST',
    STDEVP: 'DESVESTP',
    FACT: 'FACT',
    FACTDOUBLE: 'FACT.DOBLE',
    COMBIN: 'COMBINAT',
    COMBINA: 'COMBINA',
    GCD: 'M.C.D',
    LCM: 'M.C.M',
    MROUND: 'REDOND.MULT',
    MULTINOMIAL: 'MULTINOMIAL',
    QUOTIENT: 'COCIENTE',
    RANDBETWEEN: 'ALEATORIO.ENTRE',
    SERIESSUM: 'SUMA.SERIES',
    SIGN: 'SIGNO',
    SQRTPI: 'RAIZ2PI',
    SUMX2MY2: 'SUMAX2MENOSY2',
    SUMX2PY2: 'SUMAX2MASY2',
    SUMXMY2: 'SUMAXMENOSY2',
    'EXPON.DIST': 'DISTR.EXP.N',
    EXPONDIST: 'DISTR.EXP',
    FISHER: 'FISHER',
    FISHERINV: 'PRUEBA.FISHER.INV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'DISTR.GAMMA.N',
    'GAMMA.INV': 'INV.GAMMA',
    GAMMADIST: 'DISTR.GAMMA',
    GAMMAINV: 'DISTR.GAMMA.INV',
    GAMMALN: 'GAMMA.LN',
    'GAMMALN.PRECISE': 'GAMMA.LN.EXACTO',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'DISTR.BETA.N',
    BETADIST: 'DISTR.BETA',
    'BETA.INV': 'INV.BETA.N',
    BETAINV: 'DISTR.BETA.INV',
    'BINOM.DIST': 'DISTR.BINOM.N',
    BINOMDIST: 'DISTR.BINOM',
    'BINOM.INV': 'INV.BINOM',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'DISTR.CHI',
    CHIINV: 'PRUEBA.CHI.INV',
    'CHISQ.DIST': 'DISTR.CHICUAD',
    'CHISQ.DIST.RT': 'DISTR.CHICUAD.CD',
    'CHISQ.INV': 'INV.CHICUAD',
    'CHISQ.INV.RT': 'INV.CHICUAD.CD',
    'F.DIST': 'DISTR.F.N',
    'F.DIST.RT': 'DISTR.F.CD',
    'F.INV': 'INV.F',
    'F.INV.RT': 'INV.F.CD',
    FDIST: 'DISTR.F',
    FINV: 'DISTR.F.INV',
    WEIBULL: 'DIST.WEIBULL',
    'WEIBULL.DIST': 'DISTR.WEIBULL',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.DIST',
    'HYPGEOM.DIST': 'DISTR.HIPERGEOM.N',
    HYPGEOMDIST: 'DISTR.HIPERGEOM',
    'T.DIST': 'DISTR.T.N',
    'T.DIST.2T': 'DISTR.T.2C',
    'T.DIST.RT': 'DISTR.T.CD',
    'T.INV': 'INV.T',
    'T.INV.2T': 'INV.T.2C',
    TDIST: 'DISTR.T',
    TINV: 'DISTR.T.INV',
    LOGINV: 'DISTR.LOG.INV',
    'LOGNORM.DIST': 'DISTR.LOGNORM',
    'LOGNORM.INV': 'INV.LOGNORM',
    LOGNORMDIST: 'DISTR.LOG.NORM',
    'NORM.DIST': 'DISTR.NORM.N',
    'NORM.INV': 'INV.NORM',
    'NORM.S.DIST': 'DISTR.NORM.ESTAND.N',
    'NORM.S.INV': 'INV.NORM.ESTAND',
    NORMDIST: 'DISTR.NORM',
    NORMINV: 'DISTR.NORM.INV',
    NORMSDIST: 'DISTR.NORM.ESTAND',
    NORMSINV: 'DISTR.NORM.ESTAND.INV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.DIST',
    NEGBINOMDIST: 'NEGBINOMDIST',
    COMPLEX: 'COMPLEJO',
    IMABS: 'IM.ABS',
    IMAGINARY: 'IMAGINARIO',
    IMARGUMENT: 'IM.ANGULO',
    IMCONJUGATE: 'IM.CONJUGADA',
    IMCOS: 'IM.COS',
    IMCOSH: 'IMCOSH',
    IMCOT: 'IMCOT',
    IMCSC: 'IMCSC',
    IMCSCH: 'IMCSCH',
    IMDIV: 'IM.DIV',
    IMEXP: 'IM.EXP',
    IMLN: 'IM.LN',
    IMLOG10: 'IM.LOG10',
    IMLOG2: 'IM.LOG2',
    IMPOWER: 'IM.POT',
    IMPRODUCT: 'IM.PRODUCT',
    IMREAL: 'IM.REAL',
    IMSEC: 'IMSEC',
    IMSECH: 'IMSECH',
    IMSIN: 'IM.SENO',
    IMSINH: 'IMSINH',
    IMSQRT: 'IM.RAIZ2',
    IMSUB: 'IM.SUSTR',
    IMSUM: 'IM.SUM',
    IMTAN: 'IMTAN',
    LARGE: 'K.ESIMO.MAYOR',
    SMALL: 'K.ESIMO.MENOR',
    AVEDEV: 'DESVPROM',
    CONFIDENCE: 'INTERVALO.CONFIANZA',
    'CONFIDENCE.NORM': 'INTERVALO.CONFIANZA.NORM',
    'CONFIDENCE.T': 'INTERVALO.CONFIANZA.T',
    DEVSQ: 'DESVIA2',
    GEOMEAN: 'MEDIA.GEOM',
    HARMEAN: 'MEDIA.ARMO',
    CRITBINOM: 'BINOM.CRIT',
    PEARSON: 'PEARSON',
    RSQ: 'COEFICIENTE.R2',
    STANDARDIZE: 'NORMALIZACION',
    'Z.TEST': 'PRUEBA.Z.N',
    ZTEST: 'PRUEBA.Z',
    'F.TEST': 'PRUEBA.F.N',
    FTEST: 'PRUEBA.F',
    STEYX: 'ERROR.TIPICO.XY',
    SLOPE: 'PENDIENTE',
    COVAR: 'COVAR',
    'COVARIANCE.P': 'COVARIANCE.P',
    'COVARIANCE.S': 'COVARIANZA.M',
    'CHISQ.TEST': 'PRUEBA.CHICUAD',
    CHITEST: 'PRUEBA.CHI',
    'T.TEST': 'PRUEBA.T.N',
    TTEST: 'PRUEBA.T',
    SKEW: 'COEFICIENTE.ASIMETRIA',
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
    FLOOR: 'MULTIPLO.INFERIOR',
    'FLOOR.MATH': 'FLOOR.MATH',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'esES',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet'
  }
};
exports.dictionary = dictionary;
if (!HyperFormula.languages) {
  HyperFormula.languages = {};
}
HyperFormula.languages[dictionary.langCode] = dictionary;
var _default = dictionary;
exports.default = _default;

/***/ })

/******/ })["___"];
});