import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import './helpers/custom-matchers';
import * as jasmineHelpers from './helpers/jasmine-helpers';

if (typeof jest !== 'undefined') {
  jest.mock('handsontable/dataMap/metaManager/metaSchema', () => {
    const originalFactory = jest.requireActual('handsontable/dataMap/metaManager/metaSchema').default;

    return {
      __esModule: true,
      default: () => {
        const schema = originalFactory();

        schema.theme = undefined;

        return schema;
      },
    };
  });
}

// Patch jQuery.fn.handsontable to disable ThemeAPI in e2e tests (must run immediately on module load)
if (typeof jest === 'undefined' && typeof jQuery !== 'undefined' && jQuery.fn.handsontable) {
  const originalHandsontable = jQuery.fn.handsontable;

  jQuery.fn.handsontable = function(action, ...args) {
    // If action is an object (options) or undefined, inject theme: undefined
    if (typeof action !== 'string') {
      const options = action || {};

      if (!('theme' in options)) {
        options.theme = undefined;
      }

      return originalHandsontable.call(this, options, ...args);
    }

    return originalHandsontable.call(this, action, ...args);
  };
}

// Patch Handsontable constructors to disable ThemeAPI in e2e tests (must run immediately on module load)
if (typeof jest === 'undefined' && typeof Handsontable !== 'undefined') {
  // Store original constructors
  const OriginalHandsontable = Handsontable;
  const OriginalCore = Handsontable.Core;

  // Helper to patch options
  const patchOptions = (options) => {
    const patchedOptions = options || {};

    if (!('theme' in patchedOptions)) {
      patchedOptions.theme = undefined;
    }

    return patchedOptions;
  };

  // Patch the main Handsontable constructor (used with `new Handsontable(...)`)
  const PatchedHandsontable = function(element, options) {
    return new OriginalHandsontable(element, patchOptions(options));
  };

  // Copy all properties from original to patched
  Object.keys(OriginalHandsontable).forEach((key) => {
    PatchedHandsontable[key] = OriginalHandsontable[key];
  });

  // Patch Handsontable.Core
  PatchedHandsontable.Core = function(element, options) {
    return new OriginalCore(element, patchOptions(options));
  };

  // Copy static properties from Core
  Object.keys(OriginalCore).forEach((key) => {
    PatchedHandsontable.Core[key] = OriginalCore[key];
  });

  // Replace global Handsontable
  window.Handsontable = PatchedHandsontable;
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

beforeAll(() => {
  window.IntersectionObserver = window.IntersectionObserver ?? IntersectionObserverMock;
  window.ResizeObserver = window.ResizeObserver ?? ResizeObserverMock;
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
      throw Error(`Cannot export "${key}" helper because this name is already assigned.`);
    }

    global[key] = helpersHolder[key];
  });
};

exportToGlobal(jasmineHelpers);
