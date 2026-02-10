import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initCSSPolyfill } = require('../../../../handsontable/test/__mocks__/cssPolyfill');

setupZoneTestEnv();

/**
* Setup Jest mock helpers
**/

const IntersectionObserverMock = function () {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
  };
};

export class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

beforeAll(() => {
  (window as any).IntersectionObserver = IntersectionObserverMock;
  (window as any).ResizeObserver = ResizeObserverMock;

  Object.defineProperty(window, 'scrollTo', { value: jest.fn() });

  // Initialize CSS polyfill to support modern CSS features in jsdom
  initCSSPolyfill();
});

beforeEach(() => {
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as any).blur();
  } else if (!document.activeElement) {
    // IE
    document.body.focus();
  }
});

afterEach(() => {
  if (window.scrollTo) {
    window.scrollTo(0, 0);
  }
});
