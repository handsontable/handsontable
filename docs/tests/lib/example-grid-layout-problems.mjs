/**
 * The judgement half of `./example-grid-layout.ts`: turns the layout it measured into one line per broken
 * fact. Plain JavaScript with no imports, so `__tests__/example-grid-layout-problems.test.mjs` runs in the
 * root tooling suite, whose job installs nothing. What each fact means, and why it exists, is the header
 * of `./example-grid-layout.ts`.
 */

/**
 * @typedef {object} GridLayout
 * @property {number} holderHeight The master `.wtHolder`'s `offsetHeight`.
 * @property {number} holderWidth The master `.wtHolder`'s `offsetWidth`.
 * @property {number} rootWidth The grid root's `offsetWidth`.
 * @property {number} rowCount How many body rows the grid rendered.
 * @property {boolean} showsARow Whether the holder shows at least one whole body row.
 * @property {number} cutOffLeft Pixels the example wrapper cuts off the root's left edge.
 * @property {number} cutOffRight Pixels the example wrapper cuts off the root's right edge.
 */

/**
 * @typedef {object} ExampleLayoutEntry
 * @property {string} example The example's id.
 * @property {GridLayout[]} grids One entry per grid the example rendered.
 */

/**
 * Lists what is wrong with the measured examples, one line per broken fact.
 *
 * @param {ExampleLayoutEntry[]} examples The measurements, in document order.
 * @returns {string[]} The problems; empty when every example laid out its grid.
 */
export function layoutProblems(examples) {
  if (examples.length === 0) {
    return ['no example on the page'];
  }

  return examples.flatMap(({ example, grids }) => {
    if (grids.length === 0) {
      return [`${example}: no grid rendered`];
    }

    return grids.flatMap(({ holderHeight, holderWidth, rootWidth, rowCount, showsARow, cutOffLeft, cutOffRight }) => {
      const problems = [];

      if (holderHeight === 0) {
        problems.push(`${example}: the master .wtHolder is 0px tall`);
      } else if (rowCount > 0 && !showsARow) {
        problems.push(`${example}: the master .wtHolder is ${holderHeight}px tall, too short to show a whole row`);
      }
      if (holderWidth > rootWidth) {
        problems.push(`${example}: the master .wtHolder is ${holderWidth}px wide in a ${rootWidth}px grid root`);
      }
      if (cutOffLeft > 0) {
        problems.push(`${example}: the example wrapper cuts ${cutOffLeft}px off the grid's left edge`);
      }
      if (cutOffRight > 0) {
        problems.push(`${example}: the example wrapper cuts ${cutOffRight}px off the grid's right edge`);
      }

      return problems;
    });
  });
}
