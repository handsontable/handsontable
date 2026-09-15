import {
  arrayAvg, arrayEach, arrayFilter, arrayFlatten, arrayMap, arrayMax, arrayMin, arrayReduce,
  arraySum, arrayUnique, extendArray, getDifferenceOfArrays, getIntersectionOfArrays,
  getUnionOfArrays, pivot, stringToArray, to2dArray
} from 'handsontable/helpers/array';
import {
  equalsIgnoreCase, isPercentValue, randomString, stripTags, substitute, toUpperCaseFirst
} from 'handsontable/helpers/string';
import {
  clone, createObjectPropListener, deepClone, deepExtend, deepObjectSize, defineGetter,
  duckSchema, extend, getProperty, inherit, isObject, isObjectEqual, mixin, objectEach, setProperty
} from 'handsontable/helpers/object';
import { clamp, isNumeric, rangeEach, rangeEachReverse, valueAccordingPercent } from 'handsontable/helpers/number';
import { isDefined, isEmpty, isUndefined, stringify } from 'handsontable/helpers/mixed';
import {
  curry, curryRight, debounce, isFunction, partial, pipe, throttle, throttleAfterHits
} from 'handsontable/helpers/function';
import {
  getComparisonFunction, isTouchSupported, requestAnimationFrame, cancelAnimationFrame
} from 'handsontable/helpers/feature';
import { isChrome, isEdge, isMobileBrowser, isSafari } from 'handsontable/helpers/browser';
import {
  countFirstRowKeys, createEmptySpreadsheetData, createSpreadsheetData, createSpreadsheetObjectData,
  dataRowToChangesArray, spreadsheetColumnIndex, spreadsheetColumnLabel
} from 'handsontable/helpers/data';
import { getNormalizedDate } from 'handsontable/helpers/date';
import { isCtrlKey, isKey, isPrintableChar } from 'handsontable/helpers/unicode';
import { instanceToHTML, htmlToGridSettings } from 'handsontable/utils/parseTable';
import Handsontable from 'handsontable/base';
import type { GridSettings, HotInstance } from 'handsontable';

const gridSettings: GridSettings = { };

arrayAvg([1, 3, 4]);
arrayEach([1, 2, 3], (value: unknown, index: number, array: unknown[]) => {});
arrayFilter([1, 'foo', true], (value: unknown, index: number, array: unknown[]) => {});
arrayFlatten([[1, 'foo', true]]);
arrayMap([1, 'foo', true], (value: unknown, index: number, array: unknown[]) => {});
arrayMax([1, 2, 3]);
arrayMin([1, 2, 3]);
arrayReduce([1, 'foo', true], (acc, value) => String(acc) + String(value), 'foo', false);
arraySum([1, 2, 3]);
arrayUnique([1, 'foo', true]);
cancelAnimationFrame(1);
clamp(1, 2, 3);
clone({ key: 'foo' });
countFirstRowKeys([[1, 2, 3]]);
countFirstRowKeys([{ a: 1, b: 2, c: 3 }]);
createEmptySpreadsheetData(0, 0);
createObjectPropListener('foo', 'bar');
createSpreadsheetData(0, 0);
createSpreadsheetObjectData(0, 0);
curry(() => {});
curryRight(() => {});
dataRowToChangesArray([1, 2, 'three', 'four']);
dataRowToChangesArray({ a: 1, b: 2, c: 'three', d: 'four' });
dataRowToChangesArray([1, 2, 'three', 'four'], 33);
dataRowToChangesArray({ a: 1, b: 2, c: 'three', d: 'four' }, 33);
debounce(() => {}, 1);
deepClone({ key: 'foo' });
deepExtend({ key: 'foo' }, { key2: 'foo' });
deepObjectSize({ key: 'foo' });
defineGetter({ key: 'foo' }, 'key', 'bar', {});
duckSchema({});
equalsIgnoreCase('foo', 'bar');
extend({ key: 'foo' }, { key2: 'foo' });
extendArray([1, 'foo'], [true]);
getComparisonFunction('en', {});
getDifferenceOfArrays([1, 2, 3], [2, 3, 4]);
getIntersectionOfArrays([1, 2, 3], [2, 3, 4]);
getNormalizedDate('YYYY-mm-dd');
getProperty({ key: 'foo' }, 'key');
getUnionOfArrays([1, 2, 3], [2, 3, 4]);
inherit({ key: 'foo' } as any, { key2: 'bar' } as any);

const hot: HotInstance = Handsontable(document.createElement('div'), {});
const testInstanceToString: string = instanceToHTML(hot);

isChrome();
isCtrlKey(1);
isDefined(1);
isEdge();
isEmpty(1);
isFunction(1);
isKey(1, 'foo');
isMobileBrowser();
isNumeric(true);
isObject('foo');
isObjectEqual([1, 2, 3], {});
isPercentValue('1');
isPrintableChar(1);
isSafari();
isTouchSupported();
isUndefined(null);
mixin(class {}, { key: 'foo' }, { key2: 'bar' });
objectEach({ key: 'foo' }, (value: unknown, key: unknown, object: object) => {});

// Wave 8: objectEach key is now string — no cast needed in callbacks
objectEach({ a: 1, b: 2 }, (value: unknown, key: string) => {
  const _k: string = key; // must be string without cast
});
// Wave 8: objectEach accepts any object — no as Record<> cast needed
const plainObj: { x: number } = { x: 1 };

objectEach(plainObj, (value: unknown, key: string) => {});
partial(() => {}, 1, 'foo', true);
pipe(() => {}, () => {});
pivot([[1, 'foo', true]]);
randomString();
rangeEach(0, 0, (index: number) => {});
rangeEachReverse(0, 0, (index: number) => {});
requestAnimationFrame(() => {});
setProperty({}, 'test', true);
spreadsheetColumnIndex('foo');
spreadsheetColumnLabel(1);
stringify(1);
stringToArray('class-1 class-2 class-3');
stripTags('<a>foo</a>');
substitute('foo', {});

const testTableToSettings: GridSettings = htmlToGridSettings('') as GridSettings;
const testTableToSettings2: GridSettings =
  htmlToGridSettings(document.createElement('table') as unknown as HTMLTableElement) as GridSettings;

throttle(() => {}, 1);
throttleAfterHits(() => {}, 0, 1);
to2dArray([1, 'foo', true]);
toUpperCaseFirst('foo');
valueAccordingPercent(1, 90);

// Generic inference tests — verify no caller-side cast is needed
const clonedArr: string[] = deepClone(['a', 'b', 'c']);
const clonedObj: { x: number } = deepClone({ x: 1 });
const propVal: number = getProperty<number>({ count: 42 }, 'count')!;
const mappedLengths: number[] = arrayMap(['a', 'bb', 'ccc'], s => s.length);
const filteredNums: number[] = arrayFilter([1, 2, 3, 4], n => n > 2);
const sumResult: number = arrayReduce<number, number>([1, 2, 3], (acc, n) => acc + n, 0);

// getCellMeta<M> and runHooks<R> generic inference via HotInstance
// Default fallback: Record<string, unknown> (backward-compatible)
const defaultMeta: Record<string, unknown> = hot.getCellMeta(0, 0);

// Explicit type arg: narrowed to caller-specified shape
interface TestMeta { rowId: number }
const narrowedMeta: TestMeta = hot.getCellMeta<TestMeta>(0, 0);
// runHooks: default is unknown
const hookDefault: unknown = hot.runHooks('afterInit');
// runHooks: explicit R eliminates caller cast
const hookBool: boolean = hot.runHooks<boolean>('beforeChange', [], 'edit');
