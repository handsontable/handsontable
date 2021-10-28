import {
  getParent,
  getFrameElement,
  getParentWindow,
  hasAccessToParentWindow,
  closest,
  closestDown,
  isChildOf,
  index,
  overlayContainsElement,
  hasClass,
  addClass,
  removeClass,
  removeTextNodes,
  empty,
  fastInnerHTML,
  fastInnerText,
  isVisible,
  offset,
  getWindowScrollTop,
  getWindowScrollLeft,
  getScrollTop,
  getScrollLeft,
  getScrollableElement,
  getTrimmingContainer,
  getStyle,
  matchesCSSRules,
  getComputedStyle,
  outerWidth,
  outerHeight,
  innerHeight,
  innerWidth,
  addEvent,
  removeEvent,
  getCaretPosition,
  getSelectionEndPosition,
  getSelectionText,
  clearTextSelection,
  setCaretPosition,
  getScrollbarWidth,
  hasVerticalScrollbar,
  hasHorizontalScrollbar,
  setOverlayPosition,
  getCssTransform,
  resetCssTransform,
  isInput,
  isOutsideInput,
  selectElementIfAllowed,
  isDetached,
  HTML_CHARACTERS,
} from './element';
import {
  stopImmediatePropagation,
  isImmediatePropagationStopped,
  isRightClick,
  isLeftClick,
} from './event';

export interface Dom {
  HTML_CHARACTERS: RegExp;
  addClass: typeof addClass;
  addEvent: typeof addEvent;
  clearTextSelection: typeof clearTextSelection;
  closest: typeof closest;
  closestDown: typeof closestDown;
  empty: typeof empty;
  fastInnerHTML: typeof fastInnerHTML;
  fastInnerText: typeof fastInnerText;
  getCaretPosition: typeof getCaretPosition;
  getComputedStyle: typeof getComputedStyle;
  getCssTransform: typeof getCssTransform;
  getFrameElement: typeof getFrameElement;
  getParent: typeof getParent;
  getParentWindow: typeof getParentWindow;
  getScrollableElement: typeof getScrollableElement;
  getScrollbarWidth: typeof getScrollbarWidth;
  getScrollLeft: typeof getScrollLeft;
  getScrollTop: typeof getScrollTop;
  getSelectionEndPosition: typeof getSelectionEndPosition;
  getSelectionText: typeof getSelectionText;
  getStyle: typeof getStyle;
  getTrimmingContainer: typeof getTrimmingContainer;
  getWindowScrollLeft: typeof getWindowScrollLeft;
  getWindowScrollTop: typeof getWindowScrollTop;
  hasAccessToParentWindow: typeof hasAccessToParentWindow;
  hasClass: typeof hasClass;
  hasHorizontalScrollbar: typeof hasHorizontalScrollbar;
  hasVerticalScrollbar: typeof hasVerticalScrollbar;
  index: typeof index;
  innerHeight: typeof innerHeight;
  innerWidth: typeof innerWidth;
  isChildOf: typeof isChildOf;
  isDetached: typeof isDetached;
  isImmediatePropagationStopped: typeof isImmediatePropagationStopped;
  isInput: typeof isInput;
  isLeftClick: typeof isLeftClick;
  isOutsideInput: typeof isOutsideInput;
  isRightClick: typeof isRightClick;
  isVisible: typeof isVisible;
  matchesCSSRules: typeof matchesCSSRules;
  offset: typeof offset;
  outerHeight: typeof outerHeight;
  outerWidth: typeof outerWidth;
  overlayContainsElement: typeof overlayContainsElement;
  removeClass: typeof removeClass;
  removeEvent: typeof removeEvent;
  removeTextNodes: typeof removeTextNodes;
  resetCssTransform: typeof resetCssTransform;
  selectElementIfAllowed: typeof selectElementIfAllowed;
  setCaretPosition: typeof setCaretPosition;
  setOverlayPosition: typeof setOverlayPosition;
  stopImmediatePropagation: typeof stopImmediatePropagation;
}
