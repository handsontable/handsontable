/**
 * Creates an 2D array.
 *
 * @param {number} rows Number of rows to generate.
 * @param {number} columns Numbers of columns to generate.
 * @returns {string[][]}
 */
export function createSampleData(rows: number, columns: number): Array<string>[] {
  const data = [];

  for (let i = 0; i < rows; i++) {
    data.push([]);

    for (let j = 0; j < columns; j++) {
      data[i][j] = `${i}-${j}`;
    }
  }

  return data;
}

/**
 * Mocks the element `clientWidth` and `clientHeight` props to trick the Handsontable that
 * it is injected into the specific container size.
 *
 * @param {HTMLElement} element DOM element to mock.
 * @param {number} width The container width.
 * @param {number} height The container height.
 */
export function mockClientDimensions(element: HTMLElement, width: number, height: number) {
  Object.defineProperty(element, 'clientWidth', {
    value: width,
  });
  Object.defineProperty(element, 'clientHeight', {
    value: height,
  });
}
