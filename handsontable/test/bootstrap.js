import './helpers/custom-matchers';
import * as jasmineHelpers from './helpers/jasmine-helpers';
import ResizeObserver from 'resize-observer-polyfill';

global.ResizeObserver = ResizeObserver;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

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

    if (global[key] !== void 0) {
      throw Error(`Cannot export "${key}" helper because this name is already assigned.`);
    }

    global[key] = helpersHolder[key];
  });
};

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

exportToGlobal(jasmineHelpers);
