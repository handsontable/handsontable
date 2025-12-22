import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';

// Mock handsontable/base to inject themeName, preventing dynamic themeAPI import
// The dynamic import() in initializeThemeAPI fails in Jest without --experimental-vm-modules
jest.mock('handsontable/base', () => {
  const actual = jest.requireActual('handsontable/base');
  const OriginalCore = actual.default.Core;

  // Wrap the Core constructor to inject themeName which bypasses themeAPI dynamic imports
  actual.default.Core = function(element, userSettings) {
    // Inject themeName to skip the async themeAPI initialization
    // When themeName is set, Handsontable uses CSS-based theming instead of dynamic imports
    const modifiedSettings = {
      ...userSettings,
      themeName: userSettings.themeName ?? 'ht-theme-main',
    };

    return new OriginalCore(element, modifiedSettings);
  };

  // Copy static properties and prototype
  Object.keys(OriginalCore).forEach((key) => {
    actual.default.Core[key] = OriginalCore[key];
  });

  return actual;
});

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;

  // Suppress Handsontable legacy theme deprecation warning.
  // TODO: Remove when Handsontable 17.0.0 is released.
  // eslint-disable-next-line no-console
  const originalWarn = console.warn;

  // eslint-disable-next-line no-console
  console.warn = (message) => {
    if (typeof message === 'string' && message.includes('Deprecated:') && message.includes('stylesheet')) {
      return; // Suppress this specific warning
    }

    originalWarn(message);
  };
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
