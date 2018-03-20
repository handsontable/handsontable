import * as Handsontable from 'handsontable';

const domElement = new HTMLElement();
const domEvent = new Event('foo');

const htmlCharacters = Handsontable.dom.HTML_CHARACTERS;

Handsontable.dom.addEvent(domElement, "eventName", () => {});
Handsontable.dom.addClass(domElement, ['foo', 'bar']);
Handsontable.dom.addEvent(domElement, 'foo', () => {});
Handsontable.dom.closest(domElement, ['foo'], domElement);
Handsontable.dom.closestDown(domElement, ['foo', 'bar'], domElement);
Handsontable.dom.empty(domElement);
Handsontable.dom.fastInnerHTML(domElement, 'foo');
Handsontable.dom.fastInnerText(domElement, 'foo');
Handsontable.dom.getCaretPosition(domElement);
Handsontable.dom.getComputedStyle(domElement);
Handsontable.dom.getCssTransform(domElement);
Handsontable.dom.getParent(domElement, 1);
Handsontable.dom.getScrollLeft(domElement);
Handsontable.dom.getScrollTop(domElement);
Handsontable.dom.getScrollableElement(domElement);
Handsontable.dom.getScrollbarWidth();
Handsontable.dom.getSelectionEndPosition(domElement);
Handsontable.dom.getSelectionText();
Handsontable.dom.getStyle(domElement, 'foo');
Handsontable.dom.getTrimmingContainer(domElement);
Handsontable.dom.getWindowScrollLeft();
Handsontable.dom.getWindowScrollTop();
Handsontable.dom.hasClass(domElement, 'foo');
Handsontable.dom.hasHorizontalScrollbar(domElement);
Handsontable.dom.hasVerticalScrollbar(domElement);
Handsontable.dom.index(domElement);
Handsontable.dom.innerHeight(domElement);
Handsontable.dom.innerWidth(domElement);
Handsontable.dom.isChildOf(domElement, 'foo');
Handsontable.dom.isChildOfWebComponentTable(domElement);
Handsontable.dom.isImmediatePropagationStopped(domEvent);
Handsontable.dom.isInput(domElement);
Handsontable.dom.isLeftClick(domEvent);
Handsontable.dom.isOutsideInput(domElement);
Handsontable.dom.isRightClick(domEvent);
Handsontable.dom.isVisible(domElement);
Handsontable.dom.offset(domElement);
Handsontable.dom.outerHeight(domElement);
Handsontable.dom.outerWidth(domElement);
Handsontable.dom.overlayContainsElement('foo', domElement);
Handsontable.dom.pageX(domEvent);
Handsontable.dom.pageY(domEvent);
Handsontable.dom.polymerUnwrap(domElement);
Handsontable.dom.polymerWrap(domElement);
Handsontable.dom.removeClass(domElement, ['foo', 'bar']);
Handsontable.dom.removeEvent(domElement, 'foo', () => {});
Handsontable.dom.removeTextNodes(domElement, domElement);
Handsontable.dom.resetCssTransform(domElement);
Handsontable.dom.setCaretPosition(domElement, 0, 0);
Handsontable.dom.setOverlayPosition(domElement, 0, 0);
Handsontable.dom.stopImmediatePropagation(domEvent);
Handsontable.dom.stopPropagation(domEvent);
//
//   Handsontable.helper.arrayAvg([1, 3, 4]);
//   Handsontable.helper.arrayEach([1, 2, 3], (value, index, array) => {});
//   Handsontable.helper.arrayFilter([1, 'foo', true], (value, index, array) => {});
//   Handsontable.helper.arrayFlatten([1, 'foo', true]);
//   Handsontable.helper.arrayIncludes([1, 'foo', true], 'foo', 1);
//   Handsontable.helper.arrayMap([1, 'foo', true], (value, index, array) => {});
//   Handsontable.helper.arrayMax([1, 'foo', true]);
//   Handsontable.helper.arrayMin([1, 'foo', true]);
//   Handsontable.helper.arrayReduce([1, 'foo', true], (value, index, array) => {}, 'foo', false);
//   Handsontable.helper.arraySum([1, 'foo', true]);
//   Handsontable.helper.arrayUnique([1, 'foo', true]);
//   Handsontable.helper.cancelAnimationFrame(1);
//   Handsontable.helper.cellMethodLookupFactory('foo', true);
//   Handsontable.helper.clone({key: 'foo'});
//   Handsontable.helper.columnFactory(gridSettingsObj, [1, 'foo', true]);
//   Handsontable.helper.createEmptySpreadsheetData(0, 0);
//   Handsontable.helper.createObjectPropListener('foo', 'bar');
//   Handsontable.helper.createSpreadsheetData(0, 0);
//   Handsontable.helper.createSpreadsheetObjectData(0, 0);
//   Handsontable.helper.curry(() => {});
//   Handsontable.helper.curryRight(() => {});
//   Handsontable.helper.debounce(() => {}, 1);
//   Handsontable.helper.deepClone({key: 'foo'});
//   Handsontable.helper.deepExtend({key: 'foo'}, {key2: 'foo'});
//   Handsontable.helper.deepObjectSize({key: 'foo'});
//   Handsontable.helper.defineGetter({key: 'foo'}, 'key', 'bar', {});
//   Handsontable.helper.duckSchema({});
//   Handsontable.helper.endsWith('foo', 'bar');
//   Handsontable.helper.equalsIgnoreCase('foo', 'bar');
//   Handsontable.helper.extend({key: 'foo'}, {key2: 'foo'});
//   Handsontable.helper.extendArray([1, 'foo'], [true]);
//   Handsontable.helper.getComparisonFunction('en', {});
//   Handsontable.helper.getNormalizedDate('YYYY-mm-dd');
//   Handsontable.helper.getProperty({key: 'foo'}, 'key');
//   Handsontable.helper.getPrototypeOf({key: 'foo'});
//   Handsontable.helper.hasCaptionProblem();
//   Handsontable.helper.inherit({key: 'foo'}, {key2: 'bar'});
//   Handsontable.helper.isChrome();
//   Handsontable.helper.isCtrlKey(1);
//   Handsontable.helper.isDefined(1);
//   Handsontable.helper.isEmpty(1);
//   Handsontable.helper.isFunction(1);
//   Handsontable.helper.isIE8();
//   Handsontable.helper.isIE9();
//   Handsontable.helper.isKey(1, 'foo');
//   Handsontable.helper.isMetaKey(1);
//   Handsontable.helper.isMobileBrowser('foo');
//   Handsontable.helper.isNumeric(true);
//   Handsontable.helper.isObject('foo');
//   Handsontable.helper.isObjectEqual([1, 2, 3], {});
//   Handsontable.helper.isPercentValue('1');
//   Handsontable.helper.isPrintableChar(1);
//   Handsontable.helper.isSafari();
//   Handsontable.helper.isTouchSupported();
//   Handsontable.helper.isUndefined(null);
//   Handsontable.helper.isWebComponentSupportedNatively();
//   Handsontable.helper.mixin({}, {key: 'foo'}, {key2: 'bar'});
//   Handsontable.helper.objectEach({key: 'foo'}, (value, key, object) => {});
//   Handsontable.helper.padStart('foo', 1, 'bar');
//   Handsontable.helper.partial(() => {}, 1, 'foo', true);
//   Handsontable.helper.pipe(() => {}, () => {});
//   Handsontable.helper.pivot([1, 'foo', true]);
//   Handsontable.helper.randomString();
//   Handsontable.helper.rangeEach(0, 0, (index) => {});
//   Handsontable.helper.rangeEachReverse(0, 0, (index) => {});
//   Handsontable.helper.requestAnimationFrame(() => {});
//   Handsontable.helper.spreadsheetColumnIndex('foo');
//   Handsontable.helper.spreadsheetColumnLabel(1);
//   Handsontable.helper.startsWith('foo', 'bar');
//   Handsontable.helper.stringify(1);
//   Handsontable.helper.stripTags('<a>foo</a>');
//   Handsontable.helper.substitute('foo', {});
//   Handsontable.helper.throttle(() => {}, 1);
//   Handsontable.helper.throttleAfterHits(() => {}, 0, 1);
//   Handsontable.helper.to2dArray([1, 'foo', true]);
//   Handsontable.helper.toUpperCaseFirst('foo');
//   Handsontable.helper.translateRowsToColumns([1, 'foo', true]);
//   Handsontable.helper.valueAccordingPercent(1, 90);
// }
//
// class PasswordEditor extends Handsontable.editors.TextEditor {
//   createElements() {
//     // Call the original createElements method
//     super.createElements.apply(this, arguments);
//
//     // Create password input and update relevant properties
//     this.TEXTAREA = document.createElement('input');
//     this.TEXTAREA.setAttribute('type', 'password');
//     this.TEXTAREA.className = 'handsontableInput';
//     this.textareaStyle =  this.TEXTAREA.style;
//     this.textareaStyle.width = '0';
//     this.textareaStyle.height = '0';
//
//     //replace textarea with password input
//     Handsontable.dom.empty(this.TEXTAREA_PARENT);
//     this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
//   }
// }
