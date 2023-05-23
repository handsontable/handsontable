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
/******/ 	return __webpack_require__(__webpack_require__.s = 14);
/******/ })
/************************************************************************/
/******/ ({

/***/ 14:
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
    NA: '#N/D',
    NAME: '#NOME?',
    NUM: '#NÚM!',
    REF: '#REF!',
    SPILL: '#TRANSPOSIÇÃO!',
    VALUE: '#VALOR!'
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
    AND: 'E',
    ASIN: 'ASEN',
    ASINH: 'ASENH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'MÉDIA',
    AVERAGEA: 'MÉDIAA',
    AVERAGEIF: 'MÉDIASE',
    BASE: 'BASE',
    BIN2DEC: 'BINADEC',
    BIN2HEX: 'BINAHEX',
    BIN2OCT: 'BINAOCT',
    BITAND: 'ELÓGICO',
    BITLSHIFT: 'DESLOCESQBIT',
    BITOR: 'OULÓGICO',
    BITRSHIFT: 'DESLOCDIRBIT',
    BITXOR: 'OUEXCLLÓGICO',
    CEILING: 'TETO',
    CHAR: 'CARACT',
    CHOOSE: 'ESCOLHER',
    CLEAN: 'TIRAR',
    CODE: 'CÓDIGO',
    COLUMN: 'COL',
    COLUMNS: 'COLS',
    CONCATENATE: 'CONCATENAR',
    CORREL: 'CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'CONT.NÚM',
    COUNTA: 'CONT.VALORES',
    COUNTBLANK: 'CONTAR.VAZIO',
    COUNTIF: 'CONT.SE',
    COUNTIFS: 'CONT.SES',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'COSEC',
    CSCH: 'COSECH',
    CUMIPMT: 'PGTOJURACUM',
    CUMPRINC: 'PGTOCAPACUM',
    DATE: 'DATA',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DATA.VALOR',
    DAY: 'DIA',
    DAYS360: 'DIAS360',
    DAYS: 'DIAS',
    DB: 'BD',
    DDB: 'BDD',
    DEC2BIN: 'DECABIN',
    DEC2HEX: 'DECAHEX',
    DEC2OCT: 'DECAOCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRAUS',
    DELTA: 'DELTA',
    DOLLARDE: 'MOEDADEC',
    DOLLARFR: 'MOEDAFRA',
    EDATE: 'DATAM',
    EFFECT: "EFETIVA",
    EOMONTH: 'FIMMÊS',
    ERF: 'FUNERRO',
    ERFC: 'FUNERROCOMPL',
    EVEN: 'PAR',
    EXACT: 'EXATO',
    EXP: 'EXP',
    FALSE: 'FALSO',
    FIND: 'PROCURAR',
    FORMULATEXT: 'FÓRMULA.TEXTO',
    FV: 'VF',
    FVSCHEDULE: 'VFPLANO',
    HEX2BIN: 'HEXABIN',
    HEX2DEC: 'HEXADEC',
    HEX2OCT: 'HEXAOCT',
    HLOOKUP: 'PROCH',
    HOUR: 'HORA',
    IF: 'SE',
    IFERROR: 'SEERRO',
    IFNA: 'SENA',
    INDEX: 'ÍNDICE',
    INT: 'INT',
    INTERVAL: 'INTERVAL',
    IPMT: 'IPGTO',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ÉCÉL.VAZIA',
    ISERR: 'ÉERRO',
    ISERROR: 'ÉERROS',
    ISEVEN: 'ÉPAR',
    ISFORMULA: 'ÉFÓRMULA',
    ISLOGICAL: 'ÉLÓGICO',
    ISNA: 'É.NÃO.DISP',
    ISNONTEXT: 'É.NÃO.TEXTO',
    ISNUMBER: 'ÉNÚM',
    ISODD: 'ÉIMPAR',
    ISOWEEKNUM: 'NUMSEMISO',
    ISPMT: 'ÉPGTO',
    ISREF: 'ÉREF',
    ISTEXT: 'ÉTEXTO',
    LEFT: 'ESQUERDA',
    LEN: 'NÚM.CARACT',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'MINÚSCULA',
    MATCH: 'CORRESP',
    MAX: 'MÁXIMO',
    MAXA: 'MÁXIMOA',
    MAXIFS: 'MÁXIMOSES',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MED',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'EXT.TEXTO',
    MIN: 'MÍNIMO',
    MINA: 'MÍNIMOA',
    MINIFS: 'MÍNIMOSES',
    MINUTE: 'MINUTO',
    MIRR: 'MTIR',
    MMULT: 'MATRIZ.MULT',
    MOD: 'MOD',
    MONTH: 'MÊS',
    NA: 'NÃO.DISP',
    NETWORKDAYS: 'DIATRABALHOTOTAL',
    'NETWORKDAYS.INTL': 'DIATRABALHOTOTAL.INTL',
    NOMINAL: 'NOMINAL',
    NOT: 'NÃO',
    NOW: 'AGORA',
    NPER: 'NPER',
    NPV: 'VPL',
    OCT2BIN: 'OCTABIN',
    OCT2DEC: 'OCTADEC',
    OCT2HEX: 'OCTAHEX',
    ODD: 'ÍMPAR',
    OFFSET: 'DESLOC',
    OR: 'OU',
    PDURATION: 'DURAÇÃOP',
    PI: 'PI',
    PMT: 'PGTO',
    PRODUCT: 'MULT',
    POWER: 'POTÊNCIA',
    PPMT: 'PPGTO',
    PROPER: 'PRI.MAIÚSCULA',
    PV: 'VP',
    RADIANS: 'RADIANOS',
    RAND: 'ALEATÓRIO',
    RATE: 'TAXA',
    REPLACE: 'MUDAR',
    REPT: 'REPT',
    RIGHT: 'DIREITA',
    ROUND: 'ARRED',
    ROUNDDOWN: 'ARREDONDAR.PARA.BAIXO',
    ROUNDUP: 'ARREDONDAR.PARA.CIMA',
    ROW: 'LIN',
    ROWS: 'LINS',
    RRI: 'RRI',
    SEARCH: 'LOCALIZAR',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEGUNDO',
    SHEET: 'PLANILHA',
    SHEETS: 'PLANILHAS',
    SIN: 'SEN',
    SINH: 'SENH',
    SLN: 'DPD',
    SPLIT: 'SPLIT',
    SQRT: 'RAIZ',
    STDEVA: 'DESVPADA',
    'STDEV.P': 'DESVPAD.P',
    STDEVPA: 'DESVPADPA',
    'STDEV.S': 'DESVPAD.A',
    SUBSTITUTE: 'SUBSTITUIR',
    SUBTOTAL: 'SUBTOTAL',
    SUM: 'SOMA',
    SUMIF: 'SOMASE',
    SUMIFS: 'SOMASES',
    SUMPRODUCT: 'SOMARPRODUTO',
    SUMSQ: 'SOMAQUAD',
    SWITCH: '',
    SYD: 'SDA',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'OTN',
    TBILLPRICE: 'OTNVALOR',
    TBILLYIELD: 'OTNLUCRO',
    TEXT: 'TEXTO',
    TIME: 'TEMPO',
    TIMEVALUE: 'VALOR.TEMPO',
    TODAY: 'HOJE',
    TRANSPOSE: 'TRANSPOR',
    TRIM: 'ARRUMAR',
    TRUE: 'VERDADEIRO',
    TRUNC: 'TRUNCAR',
    UNICHAR: 'CARACTUNI',
    UNICODE: 'UNICODE',
    UPPER: 'MAIÚSCULA',
    VARA: 'VARA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.A',
    VLOOKUP: 'PROCV',
    WEEKDAY: 'DIA.DA.SEMANA',
    WEEKNUM: 'NÚMSEMANA',
    WORKDAY: 'DIATRABALHO',
    'WORKDAY.INTL': 'DIATRABALHO.INTL',
    XNPV: 'XVPL',
    XOR: 'OUEXCL',
    YEAR: 'ANO',
    YEARFRAC: 'FRAÇÃOANO',
    ROMAN: 'ROMANO',
    ARABIC: 'CARDINAL',
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
    STDEV: 'DESVPAD',
    STDEVP: 'DESVPADP',
    FACT: 'FATORIAL',
    FACTDOUBLE: 'FATDUPLO',
    COMBIN: 'COMBIN',
    COMBINA: 'COMBINA',
    GCD: 'MDC',
    LCM: 'MMC',
    MROUND: 'MARRED',
    MULTINOMIAL: 'MULTINOMIAL',
    QUOTIENT: 'QUOCIENTE',
    RANDBETWEEN: 'ALEATÓRIOENTRE',
    SERIESSUM: 'SOMASEQÜÊNCIA',
    SIGN: 'SINAL',
    SQRTPI: 'RAIZPI',
    SUMX2MY2: 'SOMAX2DY2',
    SUMX2PY2: 'SOMAX2SY2',
    SUMXMY2: 'SOMAXMY2',
    'EXPON.DIST': 'DISTR.EXPON',
    EXPONDIST: 'DISTEXPON',
    FISHER: 'FISHER',
    FISHERINV: 'FISHERINV',
    GAMMA: 'GAMA',
    'GAMMA.DIST': 'DIST.GAMA',
    'GAMMA.INV': 'INV.GAMA',
    GAMMADIST: 'DISTGAMA',
    GAMMAINV: 'INVGAMA',
    GAMMALN: 'LNGAMA',
    'GAMMALN.PRECISE': 'LNGAMA.PRECISO',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'DIST.BETA',
    BETADIST: 'DISTBETA',
    'BETA.INV': 'INV.BETA',
    BETAINV: 'BETA.ACUM.INV',
    'BINOM.DIST': 'DISTR.BINOM',
    BINOMDIST: 'DISTRBINOM',
    'BINOM.INV': 'INV.BINOM',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'DIST.QUI',
    CHIINV: 'INV.QUI',
    'CHISQ.DIST': 'DIST.QUIQUA',
    'CHISQ.DIST.RT': 'DIST.QUIQUA.CD',
    'CHISQ.INV': 'INV.QUIQUA',
    'CHISQ.INV.RT': 'INV.QUIQUA.CD',
    'F.DIST': 'DIST.F',
    'F.DIST.RT': 'DIST.F.CD',
    'F.INV': 'INV.F',
    'F.INV.RT': 'INV.F.CD',
    FDIST: 'DISTF',
    FINV: 'INVF',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'DIST.WEIBULL',
    POISSON: 'POISSON',
    'POISSON.DIST': 'DIST.POISSON',
    'HYPGEOM.DIST': 'DIST.HIPERGEOM.N',
    HYPGEOMDIST: 'DIST.HIPERGEOM',
    'T.DIST': 'DIST.T',
    'T.DIST.2T': 'DIST.T.BC',
    'T.DIST.RT': 'DIST.T.CD',
    'T.INV': 'INV.T',
    'T.INV.2T': 'INV.T.BC',
    TDIST: 'DISTT',
    TINV: 'INVT',
    LOGINV: 'INVLOG',
    'LOGNORM.DIST': 'DIST.LOGNORMAL.N',
    'LOGNORM.INV': 'INV.LOGNORMAL',
    LOGNORMDIST: 'DIST.LOGNORMAL',
    'NORM.DIST': 'DIST.NORM.N',
    'NORM.INV': 'INV.NORM.N',
    'NORM.S.DIST': 'DIST.NORMP.N',
    'NORM.S.INV': 'INV.NORMP.N',
    NORMDIST: 'DISTNORM',
    NORMINV: 'INV.NORM',
    NORMSDIST: 'DISTNORMP',
    NORMSINV: 'INV.NORMP',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'DIST.BIN.NEG.N',
    NEGBINOMDIST: 'DIST.BIN.NEG',
    COMPLEX: 'COMPLEXO',
    IMABS: 'IMABS',
    IMAGINARY: 'IMAGINÁRIO',
    IMARGUMENT: 'IMARG',
    IMCONJUGATE: 'IMCONJ',
    IMCOS: 'IMCOS',
    IMCOSH: 'IMCOSH',
    IMCOT: 'IMCOT',
    IMCSC: 'IMCOSEC',
    IMCSCH: 'IMCOSECH',
    IMDIV: 'IMDIV',
    IMEXP: 'IMEXP',
    IMLN: 'IMLN',
    IMLOG10: 'IMLOG10',
    IMLOG2: 'IMLOG2',
    IMPOWER: 'IMPOT',
    IMPRODUCT: 'IMPROD',
    IMREAL: 'IMREAL',
    IMSEC: 'IMSEC',
    IMSECH: 'IMSECH',
    IMSIN: 'IMSENO',
    IMSINH: 'IMSENH',
    IMSQRT: 'IMRAIZ',
    IMSUB: 'IMSUBTR',
    IMSUM: 'IMSOMA',
    IMTAN: 'IMTAN',
    LARGE: 'MAIOR',
    SMALL: 'MENOR',
    AVEDEV: 'DESV.MÉDIO',
    CONFIDENCE: 'INT.CONFIANÇA',
    'CONFIDENCE.NORM': 'INT.CONFIANÇA.NORM',
    'CONFIDENCE.T': 'INT.CONFIANÇA.T',
    DEVSQ: 'DESVQ',
    GEOMEAN: 'MÉDIA.GEOMÉTRICA',
    HARMEAN: 'MÉDIA.HARMÔNICA',
    CRITBINOM: 'CRIT.BINOM',
    PEARSON: 'PEARSON',
    RSQ: 'RQUAD',
    STANDARDIZE: 'PADRONIZAR',
    'Z.TEST': 'TESTE.Z',
    ZTEST: 'TESTEZ',
    'F.TEST': 'TESTE.F',
    FTEST: 'TESTEF',
    STEYX: 'EPADYX',
    SLOPE: 'INCLINAÇÃO',
    COVAR: 'COVAR',
    'COVARIANCE.P': 'COVARIAÇÃO.P',
    'COVARIANCE.S': 'COVARIAÇÃO.S',
    'CHISQ.TEST': 'TESTE.QUIQUA',
    CHITEST: 'TESTE.QUI',
    'T.TEST': 'TESTE.T',
    TTEST: 'TESTET',
    SKEW: 'DISTORÇÃO',
    'SKEW.P': 'DISTORÇÃO.P',
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
    'CEILING.MATH': 'ARRED.CIMA',
    FLOOR: 'ARREDMULTB',
    'FLOOR.MATH': 'ARRED.BAIXO',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'ptPT',
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