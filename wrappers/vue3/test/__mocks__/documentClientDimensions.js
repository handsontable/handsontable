export function mockDocumentClientDimensions() {
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: window.innerHeight
  });

  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: window.innerWidth
  });
}
