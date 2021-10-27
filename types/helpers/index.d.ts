import {
  arrayAvg,
  arrayEach,
  arrayFilter,
  arrayFlatten,
  arrayMap,
  arrayMax,
  arrayMin,
  arrayReduce,
  arraySum,
  arrayUnique,
  extendArray,
  getDifferenceOfArrays,
  getIntersectionOfArrays,
  getUnionOfArrays,
  pivot,
  stringToArray,
  to2dArray,
} from './array';
import {
  isChrome,
  isChromeWebKit,
  isEdge,
  isEdgeWebKit,
  isFirefox,
  isFirefoxWebKit,
  isIE,
  isIE9,
  isIOS,
  isIpadOS,
  isLinuxOS,
  isMacOS,
  isMobileBrowser,
  isMSBrowser,
  isSafari,
  isWindowsOS,
  setBrowserMeta,
  setPlatformMeta,
} from './browser';
import {
  error,
  info,
  log,
  warn,
} from './console';
import {
  cellMethodLookupFactory,
  countFirstRowKeys,
  createEmptySpreadsheetData,
  createSpreadsheetData,
  createSpreadsheetObjectData,
  dataRowToChangesArray,
  isArrayOfArrays,
  isArrayOfObjects,
  spreadsheetColumnIndex,
  spreadsheetColumnLabel,
  translateRowsToColumns,
} from './data';
import {
  getNormalizedDate,
} from './date';
import {
  cancelAnimationFrame,
  getComparisonFunction,
  hasCaptionProblem,
  isClassListSupported,
  isGetComputedStyleSupported,
  isPassiveEventSupported,
  isTextContentSupported,
  isTouchSupported,
  requestAnimationFrame,
} from './feature';
import {
  curry,
  curryRight,
  debounce,
  fastCall,
  isFunction,
  partial,
  pipe,
  throttle,
  throttleAfterHits,
} from './function';
import {
  isDefined,
  isEmpty,
  isRegExp,
  isUndefined,
  stringify,
} from './mixed';
import {
  isNumeric,
  isNumericLike,
  rangeEach,
  rangeEachReverse,
  valueAccordingPercent,
} from './number';
import {
  clone,
  createObjectPropListener,
  deepClone,
  deepExtend,
  deepObjectSize,
  defineGetter,
  duckSchema,
  extend,
  getProperty,
  hasOwnProperty,
  inherit,
  isObject,
  isObjectEqual,
  mixin,
  objectEach,
  setProperty,
} from './object';
import {
  equalsIgnoreCase,
  isPercentValue,
  randomString,
  sanitize,
  stripTags,
  substitute,
  toUpperCaseFirst,
} from './string';
import {
  toSingleLine,
} from './templateLiteralTag';
import {
  isCtrlKey,
  isCtrlMetaKey,
  isFunctionKey,
  isKey,
  isPrintableChar,
  KEY_CODES,
} from './unicode';

export interface Helper {
  KEY_CODES: KEY_CODES;
  arrayAvg: typeof arrayAvg;
  arrayEach: typeof arrayEach;
  arrayFilter: typeof arrayFilter;
  arrayFlatten: typeof arrayFlatten;
  arrayMap: typeof arrayMap;
  arrayMax: typeof arrayMax;
  arrayMin: typeof arrayMin;
  arrayReduce: typeof arrayReduce;
  arraySum: typeof arraySum;
  arrayUnique: typeof arrayUnique;
  cancelAnimationFrame: typeof cancelAnimationFrame;
  cellMethodLookupFactory: typeof cellMethodLookupFactory;
  clone: typeof clone;
  countFirstRowKeys: typeof countFirstRowKeys;
  createEmptySpreadsheetData: typeof createEmptySpreadsheetData;
  createObjectPropListener: typeof createObjectPropListener;
  createSpreadsheetData: typeof createSpreadsheetData;
  createSpreadsheetObjectData: typeof createSpreadsheetObjectData;
  curry: typeof curry;
  curryRight: typeof curryRight;
  dataRowToChangesArray: typeof dataRowToChangesArray;
  debounce: typeof debounce;
  deepClone: typeof deepClone;
  deepExtend: typeof deepExtend;
  deepObjectSize: typeof deepObjectSize;
  defineGetter: typeof defineGetter;
  duckSchema: typeof duckSchema;
  equalsIgnoreCase: typeof equalsIgnoreCase;
  error: typeof error;
  extend: typeof extend;
  extendArray: typeof extendArray;
  fastCall: typeof fastCall;
  getComparisonFunction: typeof getComparisonFunction;
  getDifferenceOfArrays: typeof getDifferenceOfArrays;
  getIntersectionOfArrays: typeof getIntersectionOfArrays;
  getNormalizedDate: typeof getNormalizedDate;
  getProperty: typeof getProperty;
  getUnionOfArrays: typeof getUnionOfArrays;
  hasCaptionProblem: typeof hasCaptionProblem;
  hasOwnProperty: typeof hasOwnProperty;
  info: typeof info;
  inherit: typeof inherit;
  isArrayOfArrays: typeof isArrayOfArrays;
  isArrayOfObjects: typeof isArrayOfObjects;
  isChrome: typeof isChrome;
  isChromeWebKit: typeof isChromeWebKit;
  isClassListSupported: typeof isClassListSupported;
  isCtrlKey: typeof isCtrlKey;
  isCtrlMetaKey: typeof isCtrlMetaKey;
  isDefined: typeof isDefined;
  isEdge: typeof isEdge;
  isEdgeWebKit: typeof isEdgeWebKit;
  isEmpty: typeof isEmpty;
  isFirefox: typeof isFirefox;
  isFirefoxWebKit: typeof isFirefoxWebKit;
  isFunction: typeof isFunction;
  isFunctionKey: typeof isFunctionKey;
  isGetComputedStyleSupported: typeof isGetComputedStyleSupported;
  isIE: typeof isIE;
  isIE9: typeof isIE9;
  isIOS: typeof isIOS;
  isIpadOS: typeof isIpadOS;
  isKey: typeof isKey;
  isLinuxOS: typeof isLinuxOS;
  isMacOS: typeof isMacOS;
  isMobileBrowser: typeof isMobileBrowser;
  isMSBrowser: typeof isMSBrowser;
  isNumeric: typeof isNumeric;
  isNumericLike: typeof isNumericLike;
  isObject: typeof isObject;
  isObjectEqual: typeof isObjectEqual;
  isPassiveEventSupported: typeof isPassiveEventSupported;
  isPercentValue: typeof isPercentValue;
  isPrintableChar: typeof isPrintableChar;
  isRegExp: typeof isRegExp;
  isSafari: typeof isSafari;
  isTextContentSupported: typeof isTextContentSupported;
  isTouchSupported: typeof isTouchSupported;
  isUndefined: typeof isUndefined;
  isWindowsOS: typeof isWindowsOS;
  log: typeof log;
  mixin: typeof mixin;
  objectEach: typeof objectEach;
  partial: typeof partial;
  pipe: typeof pipe;
  pivot: typeof pivot;
  randomString: typeof randomString;
  rangeEach: typeof rangeEach;
  rangeEachReverse: typeof rangeEachReverse;
  requestAnimationFrame: typeof requestAnimationFrame;
  sanitize: typeof sanitize;
  setBrowserMeta: typeof setBrowserMeta;
  setPlatformMeta: typeof setPlatformMeta;
  setProperty: typeof setProperty;
  spreadsheetColumnIndex: typeof spreadsheetColumnIndex;
  spreadsheetColumnLabel: typeof spreadsheetColumnLabel;
  stringify: typeof stringify;
  stringToArray: typeof stringToArray;
  stripTags: typeof stripTags;
  substitute: typeof substitute;
  throttle: typeof throttle;
  throttleAfterHits: typeof throttleAfterHits;
  to2dArray: typeof to2dArray;
  toSingleLine: typeof toSingleLine;
  toUpperCaseFirst: typeof toUpperCaseFirst;
  translateRowsToColumns: typeof translateRowsToColumns;
  valueAccordingPercent: typeof valueAccordingPercent;
  warn: typeof warn;
}
