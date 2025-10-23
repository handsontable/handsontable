import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;

  // Suppress Handsontable legacy theme deprecation warning.
  // TODO: Remove when Handsontable 17.0.0 is released.
  const originalWarn = console.warn;

  console.warn = (message) => {
    if (typeof message === 'string' && message.includes('Handsontable classic') && message.includes('legacy')) {
      return; // Suppress this specific warning
    }

    originalWarn(message);
  };
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
