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
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ({

/***/ 7:
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
    NAME: '#NOM?',
    NUM: '#NOMBRE!',
    REF: '#REF!',
    SPILL: '#EPARS!',
    VALUE: '#VALEUR!'
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
    AND: 'ET',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'MOYENNE',
    AVERAGEA: 'AVERAGEA',
    AVERAGEIF: 'MOYENNE.SI',
    BASE: 'BASE',
    BIN2DEC: 'BINDEC',
    BIN2HEX: 'BINHEX',
    BIN2OCT: 'BINOCT',
    BITAND: 'BITET',
    BITLSHIFT: 'BITDECALG',
    BITOR: 'BITOU',
    BITRSHIFT: 'BITDECALD',
    BITXOR: 'BITOUEXCLUSIF',
    CEILING: 'PLAFOND',
    CHAR: 'CAR',
    CHOOSE: 'CHOISIR',
    CLEAN: 'EPURAGE',
    CODE: 'CODE',
    COLUMN: 'COLONNE',
    COLUMNS: 'COLONNES',
    CONCATENATE: 'CONCATENER',
    CORREL: 'COEFFICIENT.CORRELATION',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'NB',
    COUNTA: 'NBVAL',
    COUNTBLANK: 'NB.VIDE',
    COUNTIF: 'NB.SI',
    COUNTIFS: 'NB.SI.ENS',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'CUMUL.INTER',
    CUMPRINC: 'CUMUL.PRINCPER',
    DATE: 'DATE',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DATEVAL',
    DAY: 'JOUR',
    DAYS360: 'JOURS360',
    DAYS: 'JOURS',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DECBIN',
    DEC2HEX: 'DECHEX',
    DEC2OCT: 'DECOCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'DEGRES',
    DELTA: 'DELTA',
    DOLLARDE: 'PRIX.DEC',
    DOLLARFR: 'PRIX.FRAC',
    EDATE: 'MOIS.DECALER',
    EFFECT: "TAUX.EFFECTIF",
    EOMONTH: 'FIN.MOIS',
    ERF: 'ERF',
    ERFC: 'ERFC',
    EVEN: 'PAIR',
    EXACT: 'EXACT',
    EXP: 'EXP',
    FALSE: 'FAUX',
    FIND: 'TROUVE',
    FORMULATEXT: 'FORMULETEXTE',
    FV: 'VC',
    FVSCHEDULE: 'VC.PAIEMENTS',
    HEX2BIN: 'HEXBIN',
    HEX2DEC: 'HEXDEC',
    HEX2OCT: 'HEXOCT',
    HLOOKUP: 'RECHERCHEH',
    HOUR: 'HEURE',
    IF: 'SI',
    IFERROR: 'SIERREUR',
    IFNA: 'SI.NON.DISP',
    INDEX: 'INDEX',
    INT: 'ENT',
    INTERVAL: 'INTERVAL',
    IPMT: 'INTPER',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ESTVIDE',
    ISERR: 'ESTERR',
    ISERROR: 'ESTERREUR',
    ISEVEN: 'EST.PAIR',
    ISFORMULA: 'ESTFORMULE',
    ISLOGICAL: 'ESTLOGIQUE',
    ISNA: 'ESTNA',
    ISNONTEXT: 'ESTNONTEXTE',
    ISNUMBER: 'ESTNUM',
    ISODD: 'EST.IMPAIR',
    ISOWEEKNUM: 'NO.SEMAINE.ISO',
    ISPMT: 'ISPMT',
    ISREF: 'ESTREF',
    ISTEXT: 'ESTTEXTE',
    LEFT: 'GAUCHE',
    LEN: 'NBCAR',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'MINUSCULE',
    MATCH: 'EQUIV',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXIFS: 'MAX.SI',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIANE',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'STXT',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MIN.SI',
    MINUTE: 'MINUTE',
    MIRR: 'TRIM',
    MMULT: 'PRODUITMAT',
    MOD: 'MOD',
    MONTH: 'MOIS',
    NA: 'NA',
    NETWORKDAYS: 'NB.JOURS.OUVRES',
    'NETWORKDAYS.INTL': 'NB.JOURS.OUVRES.INTL',
    NOMINAL: 'TAUX.NOMINAL',
    NOT: 'NON',
    NOW: 'MAINTENANT',
    NPER: 'NPM',
    NPV: 'VAN',
    OCT2BIN: 'OCTBIN',
    OCT2DEC: 'OCTDEC',
    OCT2HEX: 'OCTHEX',
    ODD: 'IMPAIR',
    OFFSET: 'DECALER',
    OR: 'OU',
    PDURATION: 'PDUREE',
    PI: 'PI',
    PMT: 'VPM',
    PRODUCT: 'PRODUIT',
    POWER: 'PUISSANCE',
    PPMT: 'PRINCPER',
    PROPER: 'NOMPROPRE',
    PV: 'VA',
    RADIANS: 'RADIANS',
    RAND: 'ALEA',
    RATE: 'TAUX',
    REPLACE: 'REMPLACER',
    REPT: 'REPT',
    RIGHT: 'DROITE',
    ROUND: 'ARRONDI',
    ROUNDDOWN: 'ARRONDI.INF',
    ROUNDUP: 'ARRONDI.SUP',
    ROW: 'LIGNE',
    ROWS: 'LIGNES',
    RRI: 'TAUX.INT.EQUIV',
    SEARCH: 'CHERCHE',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SECONDE',
    SHEET: 'FEUILLE',
    SHEETS: 'FEUILLES',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'AMORLIN',
    SPLIT: 'SPLIT',
    SQRT: 'RACINE',
    STDEVA: 'STDEVA',
    'STDEV.P': 'ECARTYPE.PEARSON',
    STDEVPA: 'STDEVPA',
    'STDEV.S': 'ECARTYPE.STANDARD',
    SUBSTITUTE: 'SUBSTITUE',
    SUBTOTAL: 'SOUS.TOTAL',
    SUM: 'SOMME',
    SUMIF: 'SOMME.SI',
    SUMIFS: 'SOMME.SI.ENS',
    SUMPRODUCT: 'SOMMEPROD',
    SUMSQ: 'SOMME.CARRES',
    SWITCH: '',
    SYD: 'SYD',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'TAUX.ESCOMPTE.R',
    TBILLPRICE: 'PRIX.BON.TRESOR',
    TBILLYIELD: 'RENDEMENT.BON.TRESOR',
    TEXT: 'TEXTE',
    TIME: 'TEMPS',
    TIMEVALUE: 'TEMPSVAL',
    TODAY: 'AUJOURDHUI',
    TRANSPOSE: 'TRANSPOSE',
    TRIM: 'SUPPRESPACE',
    TRUE: 'VRAI',
    TRUNC: 'TRONQUE',
    UNICHAR: 'UNICAR',
    UNICODE: 'UNICODE',
    UPPER: 'MAJUSCULE',
    VARA: 'VARA',
    'VAR.P': 'VAR.P.N',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'RECHERCHEV',
    WEEKDAY: 'JOURSEM',
    WEEKNUM: 'NO.SEMAINE',
    WORKDAY: 'SERIE.JOUR.OUVRE',
    'WORKDAY.INTL': 'SERIE.JOUR.OUVRE.INTL',
    XNPV: 'VAN.PAIEMENTS',
    XOR: 'OUX',
    YEAR: 'ANNEE',
    YEARFRAC: 'FRACTION.ANNEE',
    ROMAN: 'ROMAIN',
    ARABIC: 'ARABE',
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
    VARP: 'VAR.P',
    STDEV: 'ECARTYPE',
    STDEVP: 'ECARTYPEP',
    FACT: 'FACT',
    FACTDOUBLE: 'FACTDOUBLE',
    COMBIN: 'COMBIN',
    COMBINA: 'COMBINA',
    GCD: 'PGCD',
    LCM: 'PPCM',
    MROUND: 'ARRONDI.AU.MULTIPLE',
    MULTINOMIAL: 'MULTINOMIALE',
    QUOTIENT: 'QUOTIENT',
    RANDBETWEEN: 'ALEA.ENTRE.BORNES',
    SERIESSUM: 'SOMME.SERIES',
    SIGN: 'SIGNE',
    SQRTPI: 'RACINE.PI',
    SUMX2MY2: 'SOMME.X2MY2',
    SUMX2PY2: 'SOMME.X2PY2',
    SUMXMY2: 'SOMME.XMY2',
    'EXPON.DIST': 'LOI.EXPONENTIELLE.N',
    EXPONDIST: 'LOI.EXPONENTIELLE',
    FISHER: 'FISHER',
    FISHERINV: 'FISHER.INVERSE',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'LOI.GAMMA.N',
    'GAMMA.INV': 'LOI.GAMMA.INVERSE.N',
    GAMMADIST: 'LOI.GAMMA',
    GAMMAINV: 'LOI.GAMMA.INVERSE',
    GAMMALN: 'LNGAMMA',
    'GAMMALN.PRECISE': 'LNGAMMA.PRECIS',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'LOI.BETA.N',
    BETADIST: 'LOI.BETA',
    'BETA.INV': 'BETA.INVERSE.N',
    BETAINV: 'BETA.INVERSE',
    'BINOM.DIST': 'LOI.BINOMIALE.N',
    BINOMDIST: 'LOI.BINOMIALE',
    'BINOM.INV': 'LOI.BINOMIALE.INVERSE',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'LOI.KHIDEUX',
    CHIINV: 'KHIDEUX.INVERSE',
    'CHISQ.DIST': 'LOI.KHIDEUX.N',
    'CHISQ.DIST.RT': 'LOI.KHIDEUX.DROITE',
    'CHISQ.INV': 'LOI.KHIDEUX.INVERSE',
    'CHISQ.INV.RT': 'LOI.KHIDEUX.INVERSE.DROITE',
    'F.DIST': 'LOI.F.N',
    'F.DIST.RT': 'LOI.F.DROITE',
    'F.INV': 'INVERSE.LOI.F.N',
    'F.INV.RT': 'INVERSE.LOI.F.DROITE',
    FDIST: 'LOI.F.',
    FINV: 'INVERSE.LOI.F.',
    WEIBULL: 'LOI.WEIBULL',
    'WEIBULL.DIST': 'LOI.WEIBULL.N',
    POISSON: 'LOI.POISSON',
    'POISSON.DIST': 'LOI.POISSON.N',
    'HYPGEOM.DIST': 'LOI.HYPERGEOMETRIQUE.N',
    HYPGEOMDIST: 'LOI.HYPERGEOMETRIQUE',
    'T.DIST': 'LOI.STUDENT.N',
    'T.DIST.2T': 'LOI.STUDENT.BILATERALE',
    'T.DIST.RT': 'LOI.STUDENT.DROITE',
    'T.INV': 'LOI.STUDENT.INVERSE.N',
    'T.INV.2T': 'LOI.STUDENT.INVERSE.BILATERALE',
    TDIST: 'LOI.STUDENT',
    TINV: 'LOI.STUDENT.INVERSE',
    LOGINV: 'LOI.LOGNORMALE.INVERSE',
    'LOGNORM.DIST': 'LOI.LOGNORMALE.N',
    'LOGNORM.INV': 'LOI.LOGNORMALE.INVERSE.N',
    LOGNORMDIST: 'LOI.LOGNORMALE',
    'NORM.DIST': 'LOI.NORMALE.N',
    'NORM.INV': 'LOI.NORMALE.INVERSE.N',
    'NORM.S.DIST': 'LOI.NORMALE.STANDARD.N',
    'NORM.S.INV': 'LOI.NORMALE.STANDARD.INVERSE.N',
    NORMDIST: 'LOI.NORMALE',
    NORMINV: 'LOI.NORMALE.INVERSE',
    NORMSDIST: 'LOI.NORMALE.STANDARD',
    NORMSINV: 'LOI.NORMALE.STANDARD.INVERSE',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'LOI.BINOMIALE.NEG.N',
    NEGBINOMDIST: 'LOI.BINOMIALE.NEG',
    COMPLEX: 'COMPLEXE',
    IMABS: 'COMPLEXE.MODULE',
    IMAGINARY: 'COMPLEXE.IMAGINAIRE',
    IMARGUMENT: 'COMPLEXE.ARGUMENT',
    IMCONJUGATE: 'COMPLEXE.CONJUGUE',
    IMCOS: 'COMPLEXE.COS',
    IMCOSH: 'COMPLEXE.COSH',
    IMCOT: 'COMPLEXE.COT',
    IMCSC: 'COMPLEXE.CSC',
    IMCSCH: 'COMPLEXE.CSCH',
    IMDIV: 'COMPLEXE.DIV',
    IMEXP: 'COMPLEXE.EXP',
    IMLN: 'COMPLEXE.LN',
    IMLOG10: 'COMPLEXE.LOG10',
    IMLOG2: 'COMPLEXE.LOG2',
    IMPOWER: 'COMPLEXE.PUISSANCE',
    IMPRODUCT: 'COMPLEXE.PRODUIT',
    IMREAL: 'COMPLEXE.REEL',
    IMSEC: 'COMPLEXE.SEC',
    IMSECH: 'COMPLEXE.SECH',
    IMSIN: 'COMPLEXE.SIN',
    IMSINH: 'COMPLEXE.SINH',
    IMSQRT: 'COMPLEXE.RACINE',
    IMSUB: 'COMPLEXE.DIFFERENCE',
    IMSUM: 'COMPLEXE.SOMME',
    IMTAN: 'COMPLEXE.TAN',
    LARGE: 'GRANDE.VALEUR',
    SMALL: 'PETITE.VALEUR',
    AVEDEV: 'ECART.MOYEN',
    CONFIDENCE: 'INTERVALLE.CONFIANCE',
    'CONFIDENCE.NORM': 'INTERVALLE.CONFIANCE.NORMAL',
    'CONFIDENCE.T': 'INTERVALLE.CONFIANCE.STUDENT',
    DEVSQ: 'SOMME.CARRES.ECARTS',
    GEOMEAN: 'MOYENNE.GEOMETRIQUE',
    HARMEAN: 'MOYENNE.HARMONIQUE',
    CRITBINOM: 'CRITERE.LOI.BINOMIALE',
    PEARSON: 'PEARSON',
    RSQ: 'COEFFICIENT.DETERMINATION',
    STANDARDIZE: 'CENTREE.REDUITE',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'TEST.Z',
    'F.TEST': 'F.TEST',
    FTEST: 'TEST.F',
    STEYX: 'ERREUR.TYPE.XY',
    SLOPE: 'PENTE',
    COVAR: 'COVARIANCE',
    'COVARIANCE.P': 'COVARIANCE.PEARSON',
    'COVARIANCE.S': 'COVARIANCE.STANDARD',
    'CHISQ.TEST': 'CHISQ.TEST',
    CHITEST: 'TEST.KHIDEUX',
    'T.TEST': 'T.TEST',
    TTEST: 'TEST.STUDENT',
    SKEW: 'COEFFICIENT.ASYMETRIE',
    'SKEW.P': 'COEFFICIENT.ASYMETRIE.P',
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
    'CEILING.MATH': 'PLAFOND.MATH',
    FLOOR: 'PLANCHER',
    'FLOOR.MATH': 'PLANCHER.MATH',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'frFR',
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