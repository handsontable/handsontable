import Handsontable from 'handsontable/base';

/**
 * A promise with its settle functions exposed.
 */
export function deferred<T = unknown>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Lets the plugin's flush (a microtask after the request settled) and a zero-delay timeout run.
 */
export function settle() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * The products every grid of these tests starts with.
 */
export function products() {
  return [
    { id: 'a', sku: 'A', name: 'old A', price: 1 },
    { id: 'b', sku: 'B', name: 'old B', price: 2 },
    { id: 'c', sku: 'C', name: 'old C', price: 3 },
    { id: 'd', sku: 'D', name: 'old D', price: 4 },
  ];
}

/**
 * Builds a grid of products whose `name` column is filled asynchronously.
 */
export function createGrid(settings: Record<string, unknown> = {}) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: products(),
    columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price' }],
    asyncValues: true,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  return {
    hot,
    plugin: hot.getPlugin('asyncValues'),
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}
