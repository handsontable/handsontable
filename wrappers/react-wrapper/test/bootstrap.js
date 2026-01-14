import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = jest.fn();

  // Suppress Handsontable legacy theme deprecation warning.
  // TODO: Remove when Handsontable 17.0.0 is released.
  const originalWarn = console.warn;

  console.warn = (message) => {
    if (typeof message === 'string' && message.includes('Deprecated:') && message.includes('stylesheet')) {
      return; // Suppress this specific warning
    }
    // Suppress theme stylesheet missing warning (jsdom doesn't support modern CSS features)
    if (typeof message === 'string' && message.includes('theme is enabled') && message.includes('stylesheets are missing')) {
      return;
    }

    originalWarn(message);
  };

  // Suppress jsdom CSS parsing errors for modern CSS features (like light-dark())
  const originalError = console.error;

  console.error = (...args) => {
    const message = args[0];

    if (message instanceof Error && message.message === 'Could not parse CSS stylesheet') {
      return; // Suppress jsdom CSS parsing errors
    }
    if (typeof message === 'string' && message.includes('Could not parse CSS stylesheet')) {
      return; // Suppress jsdom CSS parsing errors (string format)
    }

    originalError(...args);
  };
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
