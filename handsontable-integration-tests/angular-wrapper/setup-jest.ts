import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

const IntersectionObserverMock = function () {
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  };
};

const SUPPRESSED_WARNINGS = [
  'ht-theme-main',                  // jsdom cannot load Handsontable CSS theme
  'NG0914',                         // zoneless + zone.js loaded simultaneously (expected in test env)
];

const SUPPRESSED_ERRORS = [
  'Could not parse CSS stylesheet',  // jsdom CSS parser does not support modern CSS
];

const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

beforeAll(() => {
  (window as any).IntersectionObserver = IntersectionObserverMock;
  (window as any).ResizeObserver = ResizeObserverMock;
  Object.defineProperty(window, 'scrollTo', { value: jest.fn() });
  console.warn = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (SUPPRESSED_WARNINGS.some((s) => msg.includes(s))) return;
    originalWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (SUPPRESSED_ERRORS.some((s) => msg.includes(s))) return;
    originalError(...args);
  };
});

beforeEach(() => {
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as HTMLElement).blur();
  }
});

afterEach(() => {
  if (window.scrollTo) {
    window.scrollTo(0, 0);
  }
});
