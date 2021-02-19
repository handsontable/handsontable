export function wait(amount, body, resolveFunc) {
  if (!resolveFunc) {
    resolveFunc = body;
    body = () => {
    };
  }
  return new Promise((resolve, reject) => {
    body();
    setTimeout(() => {
      resolve();
    }, amount);
  }).then(resolveFunc);
}

export function createSampleData(rows, columns) {
  const data = [];
  for (let i = 0; i < rows; i++) {
    data.push([]);
    for (let j = 0; j < columns; j++) {
      data[i][j] = `${i}-${j}`;
    }
  }
  return data;
}

export function mockClientDimensions(element, width, height) {
  Object.defineProperty(element, 'clientWidth', {
    value: width
  });
  Object.defineProperty(element, 'clientHeight', {
    value: height
  });
}

/**
 * Create a temporary DOM container for the components to be placed in.
 * It should be replaced with the actual mounted component from `@vue/test-utils`, so there's no need to remove it
 * after the test case is finished.
 */
export function createDomContainer() {
  const container = document.createElement('div');

  if (document.body) {
    document.body.appendChild(container);
  }

  return container;
}
