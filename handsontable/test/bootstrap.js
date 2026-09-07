import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import './helpers/custom-matchers';
import * as jasmineHelpers from './helpers/jasmine-helpers';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

beforeAll(() => {
  window.IntersectionObserver = window.IntersectionObserver ?? IntersectionObserverMock;
  window.ResizeObserver = window.ResizeObserver ?? ResizeObserverMock;
  // jsdom implements no `scrollIntoView`. The window-scroll strategies call it on the target cell
  // once `scrollViewportTo` decides the page must move, and they reach that decision in jsdom now
  // that `getScrollTop(window)` returns a number there (it used to return `undefined`, which made
  // every comparison false and kept this path dead). A no-op, like the observers above.
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
});

beforeEach(() => {
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();

  } else if (!document.activeElement) { // IE
    document.body.focus();
  }
});

afterEach(() => {
  /* eslint-disable no-unused-expressions */
  (window.scrollTo || window.scrollTo(0, 0));
});

/**
 * Function exporting all of the helpers from the provided object to globals. Needed to use helper functions in the unit
 * tests.
 *
 * @param {object} helpersHolder Object with the jasmine helpers.
 */
const exportToGlobal = (helpersHolder) => {
  Object.keys(helpersHolder).forEach((key) => {
    if (key === '__esModule') {
      return;
    }

    if (global[key] !== undefined) {
      // eslint-disable-next-line handsontable/no-native-error-throw
      throw new Error(`Cannot export "${key}" helper because this name is already assigned.`);
    }

    global[key] = helpersHolder[key];
  });
};

exportToGlobal(jasmineHelpers);
