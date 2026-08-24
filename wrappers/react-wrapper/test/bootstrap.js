/* eslint-disable no-restricted-globals */
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';
import { initCSSPolyfill, clearComputedStyleCache } from '../../../handsontable/test/__mocks__/cssPolyfill';
import { initCryptoPolyfill } from '../../../handsontable/test/__mocks__/cryptoPolyfill';

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = jest.fn();

  // Initialize CSS polyfill to support modern CSS features in jsdom
  initCSSPolyfill();
  // Initialize crypto polyfill so Handsontable's randomString() works in jsdom
  initCryptoPolyfill();
});

beforeEach(() => {
  clearComputedStyleCache();
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
