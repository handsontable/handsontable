import { IntersectionObserverMock } from './__mocks__/intersectionObserverMock';
import { ResizeObserverMock } from './__mocks__/resizeObserverMock';

beforeAll(() => {
  window.IntersectionObserver = IntersectionObserverMock;
  window.ResizeObserver = ResizeObserverMock;
});

afterAll(() => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
});
