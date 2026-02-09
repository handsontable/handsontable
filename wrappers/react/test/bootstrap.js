/* eslint-disable no-restricted-globals */
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';
import { initCSSPolyfill } from '../../../handsontable/test/__mocks__/cssPolyfill';

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = jest.fn();

  // Initialize CSS polyfill to support modern CSS features in jsdom
  initCSSPolyfill();
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
  delete Element.prototype.scrollIntoView;
});
