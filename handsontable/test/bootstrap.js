import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import './helpers/custom-matchers';
import * as jasmineHelpers from './helpers/jasmine-helpers';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

beforeAll(() => {
  // A `@jest-environment node` spec file (e.g. one round-tripping xlsx zip buffers) has neither
  // `window` nor `Element`; every hook below is a no-op there instead of a crash.
  if (typeof window === 'undefined') {
    return;
  }

  window.IntersectionObserver = window.IntersectionObserver ?? IntersectionObserverMock;
  window.ResizeObserver = window.ResizeObserver ?? ResizeObserverMock;
  // jsdom implements no `scrollIntoView`. The window-scroll strategies call it on the target cell
  // once `scrollViewportTo` decides the page must move, and they reach that decision in jsdom now
  // that `getScrollTop(window)` returns a number there (it used to return `undefined`, which made
  // every comparison false and kept this path dead). A no-op, like the observers above.
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});

  // jsdom loads no theme stylesheet, so every grid built here warns "The "ht-theme-main" theme is
  // enabled, but its stylesheets are missing" (`Core#onThemeChange` probes `--ht-line-height` on
  // the themed wrapper). Declare that one variable for every `ht-theme-*` element, the way the real
  // stylesheets do. Only this variable: `#calculateRowHeight()`, NestedHeaders, and the multi-select
  // dropdown each need a second variable as well, so with only this one defined they resolve to the
  // same `NaN`/`undefined` they resolve to today, and no measurement changes.
  if (!document.getElementById('ht-jsdom-theme-vars')) {
    const themeVars = document.createElement('style');

    themeVars.id = 'ht-jsdom-theme-vars';
    themeVars.textContent = '[class*="ht-theme-"] { --ht-line-height: 22px; }';
    document.head.appendChild(themeVars);
  }
});

beforeEach(() => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();

  } else if (!document.activeElement) { // IE
    document.body.focus();
  }
});

afterEach(() => {
  if (typeof window === 'undefined') {
    return;
  }

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
