import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

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

  // Set up the theme for Handsontable tests
  document.body.classList.add('ht-theme-main');

  Object.defineProperty(window, 'scrollTo', { value: jest.fn() });
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
