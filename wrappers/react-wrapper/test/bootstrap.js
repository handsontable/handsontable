/* eslint-disable no-restricted-globals */
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';
import { initCryptoPolyfill } from '../../../handsontable/test/__mocks__/cryptoPolyfill';

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = jest.fn();

  // Initialize crypto polyfill so Handsontable's randomString() works in the test DOM
  initCryptoPolyfill();
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
