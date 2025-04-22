/**
 * Mock the `documentElement`'s `clientHeight` and `clientWidth` properties to return the window's inner height and width.
 */
export function mockDocumentClientDimensions() {
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: window.innerHeight
  });

  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: window.innerWidth
  });
}
