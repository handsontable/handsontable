import {
  addClass,
  addEvent,
  clearTextSelection,
  closest,
  closestDown,
  empty,
  fastInnerHTML,
  fastInnerText,
  getCaretPosition,
  getCssTransform,
  getFrameElement,
  getFractionalScalingCompensation,
  getParent,
  getParentWindow,
  getScrollLeft,
  getScrollTop,
  getScrollableElement,
  getScrollbarWidth,
  getSelectionEndPosition,
  getSelectionText,
  getStyle,
  getTrimmingContainer,
  getWindowScrollLeft,
  getWindowScrollTop,
  hasAccessToParentWindow,
  hasClass,
  hasHorizontalScrollbar,
  hasVerticalScrollbar,
  hasZeroHeight,
  HTML_CHARACTERS,
  index,
  innerHeight,
  innerWidth,
  isChildOf,
  isDetached,
  isHTMLElement,
  isInput,
  isOutsideInput,
  isVisible,
  matchesCSSRules,
  offset,
  outerHeight,
  outerWidth,
  overlayContainsElement,
  removeClass,
  removeEvent,
  removeTextNodes,
  resetCssTransform,
  selectElementIfAllowed,
  setCaretPosition,
  setOverlayPosition,
} from 'handsontable/helpers/dom/element';

import {
  isImmediatePropagationStopped,
  isLeftClick,
  isRightClick,
  isTouchEvent,
  offsetRelativeTo,
  stopImmediatePropagation,
} from 'handsontable/helpers/dom/event';

const domElement = new HTMLElement();
const inputElement = new HTMLInputElement();
const domEvent = new Event('foo');
const cssRule = new CSSRule();

const htmlCharacters = HTML_CHARACTERS;

addEvent(domElement, 'foo', () => {});
addClass(domElement, ['foo', 'bar']);
clearTextSelection();
clearTextSelection(window);
closest(domElement, ['foo']);
closest(domElement, ['foo'], domElement);
closestDown(domElement, [domElement, domElement]);
closestDown(domElement, [domElement], domElement);
empty(domElement);
fastInnerHTML(domElement, 'foo');
fastInnerText(domElement, 'foo');
getCaretPosition(inputElement);
getCssTransform(domElement);
getFrameElement(window);
getParent(domElement, 1);
getParentWindow(window);
getScrollLeft(domElement);
getScrollLeft(domElement, window);
getScrollTop(domElement);
getScrollTop(domElement, window);
getScrollableElement(domElement);
getFractionalScalingCompensation();
getFractionalScalingCompensation(document);
getScrollbarWidth();
getScrollbarWidth(document);
getSelectionEndPosition(inputElement);
getSelectionText();
getSelectionText(window);
getStyle(domElement, 'foo');
getStyle(domElement, 'foo', window);
getTrimmingContainer(domElement);
getWindowScrollLeft();
getWindowScrollLeft(window);
getWindowScrollTop();
getWindowScrollTop(window);
hasAccessToParentWindow(window);
hasClass(domElement, 'foo');
hasHorizontalScrollbar(domElement);
hasVerticalScrollbar(domElement);
hasZeroHeight(domElement);
index(domElement);
innerHeight(domElement);
innerWidth(domElement);
isChildOf(domElement, 'foo');
isDetached(domElement);
isImmediatePropagationStopped(domEvent);
isInput(domElement);
isLeftClick(domEvent);
isOutsideInput(domElement);
isRightClick(domEvent);
isTouchEvent(domEvent);
isVisible(domElement);
matchesCSSRules(domElement, cssRule);
offset(domElement);
offsetRelativeTo(domEvent, domElement);
outerHeight(domElement);
outerWidth(domElement);
overlayContainsElement('top', domElement, domElement);
removeClass(domElement, ['foo', 'bar']);
removeEvent(domElement, 'foo', () => {});
removeTextNodes(domElement);
resetCssTransform(domElement);
setCaretPosition(inputElement, 0, 0);
setOverlayPosition(domElement, 0, 0);
selectElementIfAllowed(domElement);
stopImmediatePropagation(domEvent);
isHTMLElement(domElement);
