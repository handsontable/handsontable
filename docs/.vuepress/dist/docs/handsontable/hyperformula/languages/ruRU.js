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
/******/ 	return __webpack_require__(__webpack_require__.s = 15);
/******/ })
/************************************************************************/
/******/ ({

/***/ 15:
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
    DIV_BY_ZERO: '#ДЕЛ/0!',
    ERROR: '#ERROR!',
    NA: '#Н/Д',
    NAME: '#ИМЯ?',
    NUM: '#ЧИСЛО!',
    REF: '#ССЫЛКА!',
    SPILL: '#ПЕРЕНОС!',
    VALUE: '#ЗНАЧ!'
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
    AND: 'И',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'СРЗНАЧ',
    AVERAGEA: 'СРЗНАЧА',
    AVERAGEIF: 'СРЗНАЧЕСЛИ',
    BASE: 'ОСНОВАНИЕ',
    BIN2DEC: 'ДВ.В.ДЕС',
    BIN2HEX: 'ДВ.В.ШЕСТН',
    BIN2OCT: 'ДВ.В.ВОСЬМ',
    BITAND: 'БИТ.И',
    BITLSHIFT: 'БИТ.СДВИГЛ',
    BITOR: 'БИТ.ИЛИ',
    BITRSHIFT: 'БИТ.СДВИГП',
    BITXOR: 'БИТ.ИСКЛИЛИ',
    CEILING: 'ОКРВВЕРХ',
    CHAR: 'СИМВОЛ',
    CHOOSE: 'ВЫБОР',
    CLEAN: 'ПЕЧСИМВ',
    CODE: 'КОДСИМВ',
    COLUMN: 'СТОЛБЕЦ',
    COLUMNS: 'ЧИСЛСТОЛБ',
    CONCATENATE: 'СЦЕПИТЬ',
    CORREL: 'КОРРЕЛ',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'СЧЁТ',
    COUNTA: 'СЧЁТЗ',
    COUNTBLANK: 'СЧИТАТЬПУСТОТЫ',
    COUNTIF: 'СЧЁТЕСЛИ',
    COUNTIFS: 'СЧЁТЕСЛИМН',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'ОБЩПЛАТ',
    CUMPRINC: 'ОБЩДОХОД',
    DATE: 'ДАТА',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'ДАТАЗНАЧ',
    DAY: 'ДЕНЬ',
    DAYS360: 'ДНЕЙ360',
    DAYS: 'ДНИ',
    DB: 'ФУО',
    DDB: 'ДДОБ',
    DEC2BIN: 'ДЕС.В.ДВ',
    DEC2HEX: 'ДЕС.В.ШЕСТН',
    DEC2OCT: 'ДЕС.В.ВОСЬМ',
    DECIMAL: 'ДЕС',
    DEGREES: 'ГРАДУСЫ',
    DELTA: 'ДЕЛЬТА',
    DOLLARDE: 'РУБЛЬ.ДЕС',
    DOLLARFR: 'РУБЛЬ.ДРОБЬ',
    EDATE: 'ДАТАМЕС',
    EFFECT: "ЭФФЕКТ",
    EOMONTH: 'КОНМЕСЯЦА',
    ERF: 'ФОШ',
    ERFC: 'ДФОШ',
    EVEN: 'ЧЁТН',
    EXACT: 'СОВПАД',
    EXP: 'EXP',
    FALSE: 'ЛОЖЬ',
    FIND: 'НАЙТИ',
    FORMULATEXT: 'Ф.ТЕКСТ',
    FV: 'БС',
    FVSCHEDULE: 'БЗРАСПИС',
    HEX2BIN: 'ШЕСТН.В.ДВ',
    HEX2DEC: 'ШЕСТН.В.ДЕС',
    HEX2OCT: 'ШЕСТН.В.ВОСЬМ',
    HLOOKUP: 'ГПР',
    HOUR: 'ЧАС',
    IF: 'ЕСЛИ',
    IFERROR: 'ЕСЛИОШИБКА',
    IFNA: 'ЕСНД',
    INDEX: 'ИНДЕКС',
    INT: 'ЦЕЛОЕ',
    INTERVAL: 'INTERVAL',
    IPMT: 'ПРПЛТ',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ЕПУСТО',
    ISERR: 'ЕОШ',
    ISERROR: 'ЕОШИБКА',
    ISEVEN: 'ЕЧЁТН',
    ISFORMULA: 'ЕФОРМУЛА',
    ISLOGICAL: 'ЕЛОГИЧ',
    ISNA: 'ЕНД',
    ISNONTEXT: 'ЕНЕТЕКСТ',
    ISNUMBER: 'ЕЧИСЛО',
    ISODD: 'ЕНЕЧЁТ',
    ISOWEEKNUM: 'НОМНЕДЕЛИ.ISO',
    ISPMT: 'ПРОЦПЛАТ',
    ISREF: 'ЕССЫЛКА',
    ISTEXT: 'ЕТЕКСТ',
    LEFT: 'ЛЕВСИМВ',
    LEN: 'ДЛСТР',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'СТРОЧН',
    MATCH: 'ПОИСКПОЗ',
    MAX: 'МАКС',
    MAXA: 'МАКСА',
    MAXIFS: 'МАКСЕСЛИ',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'МЕДИАНА',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'ПСТР',
    MIN: 'МИН',
    MINA: 'МИНА',
    MINIFS: 'МИНЕСЛИ',
    MINUTE: 'МИНУТЫ',
    MIRR: 'МВСД',
    MMULT: 'МУМНОЖ',
    MOD: 'ОСТАТ',
    MONTH: 'МЕСЯЦ',
    NA: 'НД',
    NETWORKDAYS: 'ЧИСТРАБДНИ',
    'NETWORKDAYS.INTL': 'ЧИСТРАБДНИ.МЕЖД',
    NOMINAL: 'НОМИНАЛ',
    NOT: 'НЕ',
    NOW: 'ТДАТА',
    NPER: 'КПЕР',
    NPV: 'ЧПС',
    OCT2BIN: 'ВОСЬМ.В.ДВ',
    OCT2DEC: 'ВОСЬМ.В.ДЕС',
    OCT2HEX: 'ВОСЬМ.В.ШЕСТН',
    ODD: 'НЕЧЁТ',
    OFFSET: 'СМЕЩ',
    OR: 'ИЛИ',
    PDURATION: 'ПДЛИТ',
    PI: 'ПИ',
    PMT: 'ПЛТ',
    PRODUCT: 'ПРОИЗВЕД',
    POWER: 'СТЕПЕНЬ',
    PPMT: 'ОСПЛТ',
    PROPER: 'ПРОПНАЧ',
    PV: 'ПС',
    RADIANS: 'РАДИАНЫ',
    RAND: 'СЛЧИС',
    RATE: 'СТАВКА',
    REPLACE: 'ЗАМЕНИТЬ',
    REPT: 'ПОВТОР',
    RIGHT: 'ПРАВСИМВ',
    ROUND: 'ОКРУГЛ',
    ROUNDDOWN: 'ОКРУГЛВНИЗ',
    ROUNDUP: 'ОКРУГЛВВЕРХ',
    ROW: 'СТРОКА',
    ROWS: 'ЧСТРОК',
    RRI: 'ЭКВ.СТАВКА',
    SEARCH: 'ПОИСК',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'СЕКУНДЫ',
    SHEET: 'ЛИСТ',
    SHEETS: 'ЛИСТЫ',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'АПЛ',
    SPLIT: 'SPLIT',
    SQRT: 'КОРЕНЬ',
    STDEVA: 'СТАНДОТКЛОНА',
    'STDEV.P': 'СТАНДОТКЛОН.Г',
    STDEVPA: 'СТАНДОТКЛОНПА',
    'STDEV.S': 'СТАНДОТКЛОН.В',
    SUBSTITUTE: 'ПОДСТАВИТЬ',
    SUBTOTAL: 'ПРОМЕЖУТОЧНЫЕ.ИТОГИ',
    SUM: 'СУММ',
    SUMIF: 'СУММЕСЛИ',
    SUMIFS: 'СУММЕСЛИМН',
    SUMPRODUCT: 'СУММПРОИЗВ',
    SUMSQ: 'СУММКВ',
    SWITCH: '',
    SYD: 'АСЧ',
    T: 'Т',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'РАВНОКЧЕК',
    TBILLPRICE: 'ЦЕНАКЧЕК',
    TBILLYIELD: 'ДОХОДКЧЕК',
    TEXT: 'ТЕКСТ',
    TIME: 'ВРЕМЯ',
    TIMEVALUE: 'ВРЕМЗНАЧ',
    TODAY: 'СЕГОДНЯ',
    TRANSPOSE: 'ТРАНСП',
    TRIM: 'СЖПРОБЕЛЫ',
    TRUE: 'ИСТИНА',
    TRUNC: 'ОТБР',
    UNICHAR: 'ЮНИСИМВ',
    UNICODE: 'UNICODE',
    UPPER: 'ПРОПИСН',
    VARA: 'ДИСПА',
    'VAR.P': 'ДИСП.Г',
    VARPA: 'ДИСПРА',
    'VAR.S': 'ДИСП.В',
    VLOOKUP: 'ВПР',
    WEEKDAY: 'ДЕНЬНЕД',
    WEEKNUM: 'НОМНЕДЕЛИ',
    WORKDAY: 'РАБДЕНЬ',
    'WORKDAY.INTL': 'РАБДЕНЬ.МЕЖД',
    XNPV: 'ЧИСТНЗ',
    XOR: 'ИСКЛИЛИ',
    YEAR: 'ГОД',
    YEARFRAC: 'ДОЛЯГОДА',
    ROMAN: 'РИМСКОЕ',
    ARABIC: 'АРАБСКОЕ',
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
    VAR: 'ДИСП',
    VARP: 'ДИСПР',
    STDEV: 'СТАНДОТКЛОН',
    STDEVP: 'СТАНДОТКЛОНП',
    FACT: 'ФАКТР',
    FACTDOUBLE: 'ДВФАКТР',
    COMBIN: 'ЧИСЛКОМБ',
    COMBINA: 'ЧИСЛКОМБА',
    GCD: 'НОД',
    LCM: 'НОК',
    MROUND: 'ОКРУГЛТ',
    MULTINOMIAL: 'МУЛЬТИНОМ',
    QUOTIENT: 'ЧАСТНОЕ',
    RANDBETWEEN: 'СЛУЧМЕЖДУ',
    SERIESSUM: 'РЯД.СУММ',
    SIGN: 'ЗНАК',
    SQRTPI: 'КОРЕНЬПИ',
    SUMX2MY2: 'СУММРАЗНКВ',
    SUMX2PY2: 'СУММСУММКВ',
    SUMXMY2: 'СУММКВРАЗН',
    'EXPON.DIST': 'ЭКСП.РАСП',
    EXPONDIST: 'ЭКСПРАСП',
    FISHER: 'ФИШЕР',
    FISHERINV: 'ФИШЕРОБР',
    GAMMA: 'ГАММА',
    'GAMMA.DIST': 'ГАММА.РАСП',
    'GAMMA.INV': 'ГАММА.ОБР',
    GAMMADIST: 'ГАММАРАСП',
    GAMMAINV: 'ГАММАОБР',
    GAMMALN: 'ГАММАНЛОГ',
    'GAMMALN.PRECISE': 'ГАММАНЛОГ.ТОЧН',
    GAUSS: 'ГАУСС',
    'BETA.DIST': 'БЕТА.РАСП',
    BETADIST: 'БЕТАРАСП',
    'BETA.INV': 'БЕТА.ОБР',
    BETAINV: 'БЕТАОБР',
    'BINOM.DIST': 'БИНОМ.РАСП',
    BINOMDIST: 'БИНОМРАСП',
    'BINOM.INV': 'БИНОМ.ОБР',
    BESSELI: 'БЕССЕЛЬ.I',
    BESSELJ: 'БЕССЕЛЬ.J',
    BESSELK: 'БЕССЕЛЬ.K',
    BESSELY: 'БЕССЕЛЬ.Y',
    CHIDIST: 'ХИ2РАСП',
    CHIINV: 'ХИ2ОБР',
    'CHISQ.DIST': 'ХИ2.РАСП',
    'CHISQ.DIST.RT': 'ХИ2.РАСП.ПХ',
    'CHISQ.INV': 'ХИ2.ОБР',
    'CHISQ.INV.RT': 'ХИ2.ОБР.ПХ',
    'F.DIST': 'F.РАСП',
    'F.DIST.RT': 'F.РАСП.ПХ',
    'F.INV': 'F.ОБР',
    'F.INV.RT': 'F.ОБР.ПХ',
    FDIST: 'FРАСП',
    FINV: 'FРАСПОБР',
    WEIBULL: 'ВЕЙБУЛЛ',
    'WEIBULL.DIST': 'ВЕЙБУЛЛ.РАСП',
    POISSON: 'ПУАССОН',
    'POISSON.DIST': 'ПУАССОН.РАСП',
    'HYPGEOM.DIST': 'ГИПЕРГЕОМ.РАСП',
    HYPGEOMDIST: 'ГИПЕРГЕОМЕТ',
    'T.DIST': 'СТЬЮДЕНТ.РАСП',
    'T.DIST.2T': 'СТЬЮДЕНТ.РАСП.2Х',
    'T.DIST.RT': 'СТЬЮДЕНТ.РАСП.ПХ',
    'T.INV': 'СТЬЮДЕНТ.ОБР',
    'T.INV.2T': 'СТЬЮДЕНТ.ОБР.2Х',
    TDIST: 'СТЬЮДРАСП',
    TINV: 'СТЬЮДРАСПОБР',
    LOGINV: 'ЛОГНОРМОБР',
    'LOGNORM.DIST': 'ЛОГНОРМ.РАСП',
    'LOGNORM.INV': 'ЛОГНОРМ.ОБР',
    LOGNORMDIST: 'ЛОГНОРМРАСП',
    'NORM.DIST': 'НОРМ.РАСП',
    'NORM.INV': 'НОРМ.ОБР',
    'NORM.S.DIST': 'НОРМ.СТ.РАСП',
    'NORM.S.INV': 'НОРМ.СТ.ОБР',
    NORMDIST: 'НОРМРАСП',
    NORMINV: 'НОРМОБР',
    NORMSDIST: 'НОРМСТРАСП',
    NORMSINV: 'НОРМСТОБР',
    PHI: 'ФИ',
    'NEGBINOM.DIST': 'ОТРБИНОМ.РАСП',
    NEGBINOMDIST: 'ОТРБИНОМРАСП',
    COMPLEX: 'КОМПЛЕКСН',
    IMABS: 'МНИМ.ABS',
    IMAGINARY: 'МНИМ.ЧАСТЬ',
    IMARGUMENT: 'МНИМ.АРГУМЕНТ',
    IMCONJUGATE: 'МНИМ.СОПРЯЖ',
    IMCOS: 'МНИМ.COS',
    IMCOSH: 'МНИМ.COSH',
    IMCOT: 'МНИМ.COT',
    IMCSC: 'МНИМ.CSC',
    IMCSCH: 'МНИМ.CSCH',
    IMDIV: 'МНИМ.ДЕЛ',
    IMEXP: 'МНИМ.EXP',
    IMLN: 'МНИМ.LN',
    IMLOG10: 'МНИМ.LOG10',
    IMLOG2: 'МНИМ.LOG2',
    IMPOWER: 'МНИМ.СТЕПЕНЬ',
    IMPRODUCT: 'МНИМ.ПРОИЗВЕД',
    IMREAL: 'МНИМ.ВЕЩ',
    IMSEC: 'МНИМ.SEC',
    IMSECH: 'МНИМ.SECH',
    IMSIN: 'МНИМ.SIN',
    IMSINH: 'МНИМ.SINH',
    IMSQRT: 'МНИМ.КОРЕНЬ',
    IMSUB: 'МНИМ.РАЗН',
    IMSUM: 'МНИМ.СУММ',
    IMTAN: 'МНИМ.TAN',
    LARGE: 'НАИБОЛЬШИЙ',
    SMALL: 'НАИМЕНЬШИЙ',
    AVEDEV: 'СРОТКЛ',
    CONFIDENCE: 'ДОВЕРИТ',
    'CONFIDENCE.NORM': 'ДОВЕРИТ.НОРМ',
    'CONFIDENCE.T': 'ДОВЕРИТ.СТЬЮДЕНТ',
    DEVSQ: 'КВАДРОТКЛ',
    GEOMEAN: 'СРГЕОМ',
    HARMEAN: 'СРГАРМ',
    CRITBINOM: 'КРИТБИНОМ',
    PEARSON: 'PEARSON',
    RSQ: 'КВПИРСОН',
    STANDARDIZE: 'НОРМАЛИЗАЦИЯ',
    'Z.TEST': 'Z.ТЕСТ',
    ZTEST: 'ZТЕСТ',
    'F.TEST': 'F.ТЕСТ',
    FTEST: 'ФТЕСТ',
    STEYX: 'СТОШYX',
    SLOPE: 'НАКЛОН',
    COVAR: 'КОВАР',
    'COVARIANCE.P': 'КОВАРИАЦИЯ.Г',
    'COVARIANCE.S': 'КОВАРИАЦИЯ.В',
    'CHISQ.TEST': 'ХИ2.ТЕСТ',
    CHITEST: 'ХИ2ТЕСТ',
    'T.TEST': 'СТЬЮДЕНТ.ТЕСТ',
    TTEST: 'ТТЕСТ',
    SKEW: 'СКОС',
    'SKEW.P': 'СКОС.Г',
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
    'CEILING.MATH': 'ОКРВВЕРХ.МАТ',
    FLOOR: 'ОКРВНИЗ',
    'FLOOR.MATH': 'ОКРВНИЗ.МАТ',
    'CEILING.PRECISE': 'CEILING.PRECISE',
    'FLOOR.PRECISE': 'FLOOR.PRECISE',
    'ISO.CEILING': 'ISO.CEILING'
  },
  langCode: 'ruRU',
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