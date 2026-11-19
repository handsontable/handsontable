/* eslint-disable no-restricted-globals */
import { config } from '@vue/test-utils';
import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';
import { initCSSPolyfill } from '../../../handsontable/test/__mocks__/cssPolyfill';
import { initCryptoPolyfill } from '../../../handsontable/test/__mocks__/cryptoPolyfill';
import { TEST_LICENSE_KEY } from './licenseKey';

// Templates bind `:licenseKey="testLicenseKey"`, so the key never passes through an HTML attribute.
config.global.mocks = { ...config.global.mocks, testLicenseKey: TEST_LICENSE_KEY };

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;

  // Initialize CSS polyfill to support modern CSS features in jsdom
  initCSSPolyfill();
  // Initialize crypto polyfill so Handsontable's randomString() works in jsdom
  initCryptoPolyfill();
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
