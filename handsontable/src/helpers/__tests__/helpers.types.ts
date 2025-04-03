import Handsontable from 'handsontable';

const gridSettings: Handsontable.GridSettings = { };

Handsontable.helper.arrayAvg([1, 3, 4]);
Handsontable.helper.arrayEach([1, 2, 3], (value, index, array) => {});
Handsontable.helper.arrayFilter([1, 'foo', true], (value, index, array) => {});
Handsontable.helper.arrayFlatten([1, 'foo', true]);
Handsontable.helper.arrayMap([1, 'foo', true], (value, index, array) => {});
Handsontable.helper.arrayMax([1, 'foo', true]);
Handsontable.helper.arrayMin([1, 'foo', true]);
Handsontable.helper.arrayReduce([1, 'foo', true], (value, index, array) => {}, 'foo', false);
Handsontable.helper.arraySum([1, 'foo', true]);
Handsontable.helper.arrayUnique([1, 'foo', true]);
Handsontable.helper.cancelAnimationFrame(1);
Handsontable.helper.clamp(1, 2, 3);
Handsontable.helper.clone({key: 'foo'});
Handsontable.helper.countFirstRowKeys([[1, 2, 3]]);
Handsontable.helper.countFirstRowKeys([{a: 1, b: 2, c: 3}]);
Handsontable.helper.createEmptySpreadsheetData(0, 0);
Handsontable.helper.createObjectPropListener('foo', 'bar');
Handsontable.helper.createSpreadsheetData(0, 0);
Handsontable.helper.createSpreadsheetObjectData(0, 0);
Handsontable.helper.curry(() => {});
Handsontable.helper.curryRight(() => {});
Handsontable.helper.dataRowToChangesArray([1, 2, 'three', 'four']);
Handsontable.helper.dataRowToChangesArray({a: 1, b: 2, c: 'three', d: 'four'});
Handsontable.helper.dataRowToChangesArray([1, 2, 'three', 'four'], 33);
Handsontable.helper.dataRowToChangesArray({a: 1, b: 2, c: 'three', d: 'four'}, 33);
Handsontable.helper.debounce(() => {}, 1);
Handsontable.helper.deepClone({key: 'foo'});
Handsontable.helper.deepExtend({key: 'foo'}, {key2: 'foo'});
Handsontable.helper.deepObjectSize({key: 'foo'});
Handsontable.helper.defineGetter({key: 'foo'}, 'key', 'bar', {});
Handsontable.helper.duckSchema({});
Handsontable.helper.equalsIgnoreCase('foo', 'bar');
Handsontable.helper.extend({key: 'foo'}, {key2: 'foo'});
Handsontable.helper.extendArray([1, 'foo'], [true]);
Handsontable.helper.getComparisonFunction('en', {});
Handsontable.helper.getDifferenceOfArrays([1, 2, 3], [2, 3, 4]);
Handsontable.helper.getIntersectionOfArrays([1, 2, 3], [2, 3, 4]);
Handsontable.helper.getNormalizedDate('YYYY-mm-dd');
Handsontable.helper.getProperty({key: 'foo'}, 'key');
Handsontable.helper.getUnionOfArrays([1, 2, 3], [2, 3, 4]);
Handsontable.helper.hasCaptionProblem();
Handsontable.helper.inherit({key: 'foo'}, {key2: 'bar'});

const testInstanceToString: string = Handsontable.helper
  .instanceToHTML(new Handsontable(document.createElement('div'), {}));

Handsontable.helper.isChrome();
Handsontable.helper.isCtrlKey(1);
Handsontable.helper.isDefined(1);
Handsontable.helper.isEdge();
Handsontable.helper.isEmpty(1);
Handsontable.helper.isFunction(1);
Handsontable.helper.isIE();
Handsontable.helper.isIE9();
Handsontable.helper.isKey(1, 'foo');
Handsontable.helper.isMobileBrowser();
Handsontable.helper.isMSBrowser();
Handsontable.helper.isNumeric(true);
Handsontable.helper.isObject('foo');
Handsontable.helper.isObjectEqual([1, 2, 3], {});
Handsontable.helper.isPercentValue('1');
Handsontable.helper.isPrintableChar(1);
Handsontable.helper.isSafari();
Handsontable.helper.isTouchSupported();
Handsontable.helper.isUndefined(null);
Handsontable.helper.mixin({}, {key: 'foo'}, {key2: 'bar'});
Handsontable.helper.objectEach({key: 'foo'}, (value, key, object) => {});
Handsontable.helper.partial(() => {}, 1, 'foo', true);
Handsontable.helper.pipe(() => {}, () => {});
Handsontable.helper.pivot([1, 'foo', true]);
Handsontable.helper.randomString();
Handsontable.helper.rangeEach(0, 0, (index) => {});
Handsontable.helper.rangeEachReverse(0, 0, (index) => {});
Handsontable.helper.requestAnimationFrame(() => {});
Handsontable.helper.setProperty({}, 'test', true);
Handsontable.helper.spreadsheetColumnIndex('foo');
Handsontable.helper.spreadsheetColumnLabel(1);
Handsontable.helper.stringify(1);
Handsontable.helper.stringToArray('class-1 class-2 class-3');
Handsontable.helper.stripTags('<a>foo</a>');
Handsontable.helper.substitute('foo', {});

const testTableToSettings: Handsontable.GridSettings = Handsontable.helper
  .htmlToGridSettings('');
const testTableToSettings2: Handsontable.GridSettings = Handsontable.helper
  .htmlToGridSettings(document.createElement('table'));

Handsontable.helper.throttle(() => {}, 1);
Handsontable.helper.throttleAfterHits(() => {}, 0, 1);
Handsontable.helper.to2dArray([1, 'foo', true]);
Handsontable.helper.toUpperCaseFirst('foo');
Handsontable.helper.valueAccordingPercent(1, 90);
