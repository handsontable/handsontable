import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';
import { mockDocumentClientDimensions } from './__mocks__/documentClientDimensions';

beforeAll(() => {
  mockDocumentClientDimensions();
  
  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;
  Element.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
  delete Element.prototype.scrollIntoView;
});
