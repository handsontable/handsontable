import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';

beforeAll(() => {
  mockDocumentClientDimensions();

  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
