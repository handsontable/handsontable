import { calculatorFactory } from '../../../src/viewport/calculatorFactory';
import { PositionCache } from '../../../src/axisSizing/positionCache';
import {
  FullyVisibleColumnsCalculationType,
  PartiallyVisibleColumnsCalculationType,
  RenderedColumnsCalculationType,
} from '../../../src/calculator';

/**
 * `createColumnsCalculator` hands the room the SCROLLABLE columns have to the calculator. The frozen start
 * columns take their width off the room and move the scroll offset; the frozen end columns (`fixedColumnsEnd`)
 * cover the inline-end edge of the viewport, as the frozen bottom rows cover the bottom one, so they take
 * their width off the room and leave the offset alone.
 *
 * The method is a mixin function that reads `this`, so it is exercised with a stub `this` - no DOM.
 */

const COLUMN_WIDTH = 50;

type CalculationTypeFactory = () => unknown;

/**
 * Builds the stub `this` of the Viewport.
 *
 * @param {object} options The scenario.
 * @param {number} [options.viewportWidth=500] The width of the viewport.
 * @param {number} [options.totalColumns=20] The total number of columns.
 * @param {number} [options.fixedColumnsStart=0] The number of start columns.
 * @param {number} [options.fixedColumnsEnd=0] The (clamped) number of end columns.
 * @param {boolean} [options.endCloneExists=true] Whether the end overlay has a clone.
 * @param {number} [options.scroll=0] The horizontal scroll position.
 * @returns {object}
 */
function createViewportStub({
  viewportWidth = 500,
  totalColumns = 20,
  fixedColumnsStart = 0,
  fixedColumnsEnd = 0,
  endCloneExists = true,
  scroll = 0,
} = {}) {
  const sumCellSizes = (from: number, to: number) => (to - from) * COLUMN_WIDTH;
  const columnWidthCache = new PositionCache({
    totalItemsFn: () => totalColumns,
    sizeFn: () => COLUMN_WIDTH,
    defaultSizeFn: () => COLUMN_WIDTH,
  });

  columnWidthCache.build();

  const settings: Record<string, unknown> = {
    totalColumns,
    fixedColumnsStart,
    fixedColumnsEnd,
  };

  return {
    wtSettings: {
      getSetting: (key: string) => settings[key],
      getSettingPure: () => null,
    },
    wtTable: {},
    deps: {
      getInlineStartOverlay: () => ({
        getScrollPosition: () => scroll,
        getTableParentOffset: () => 0,
        sumCellSizes,
      }),
      getInlineEndOverlay: () => ({
        clone: endCloneExists ? {} : null,
        sumCellSizes,
      }),
    },
    usesLayoutSnapshotForCalculators: () => true,
    getLayout: () => ({ renderViewportWidth: viewportWidth, visibleViewportWidth: viewportWidth }),
    columnsCalculatorTypes: new Map<string, CalculationTypeFactory>([
      ['rendered', () => new RenderedColumnsCalculationType()],
      ['fullyVisible', () => new FullyVisibleColumnsCalculationType()],
      ['partiallyVisible', () => new PartiallyVisibleColumnsCalculationType()],
    ]),
    columnWidthCache,
    columnHeaderHeight: 0,
    columnHeaderHeightFraction: 0,
  };
}

/**
 * Runs the mixin against the stub.
 *
 * @param {object} stub The stub `this`.
 * @returns {object} The calculator.
 */
function createColumnsCalculator(stub: object) {
  type Calculator = {
    viewportWidth: number,
    scrollOffset: number,
    getResultsFor: (type: string) => { startColumn: number | null, endColumn: number | null, count: number },
  };
  const create = calculatorFactory.createColumnsCalculator as unknown as (this: object, types?: string[]) => Calculator;

  return create.call(stub, ['fullyVisible', 'partiallyVisible']);
}

describe('createColumnsCalculator with fixedColumnsEnd', () => {
  it('should leave the viewport alone when there is no end band', () => {
    const calculator = createColumnsCalculator(createViewportStub({ viewportWidth: 500 }));

    expect(calculator.viewportWidth).toBe(500);
    expect(calculator.getResultsFor('fullyVisible').endColumn).toBe(9);
  });

  it('should take the width of the end band off the room of the scrollable columns', () => {
    const calculator = createColumnsCalculator(createViewportStub({ viewportWidth: 500, fixedColumnsEnd: 2 }));

    expect(calculator.viewportWidth).toBe(400);
    // 8 columns of 50px fit in the 400px that the end band does not cover.
    expect(calculator.getResultsFor('fullyVisible').endColumn).toBe(7);
    expect(calculator.getResultsFor('fullyVisible').count).toBe(8);
  });

  it('should not move the scroll offset, unlike the start band', () => {
    const calculator = createColumnsCalculator(createViewportStub({ scroll: 100, fixedColumnsEnd: 2 }));

    expect(calculator.scrollOffset).toBe(100);
  });

  it('should take both bands off the room, and only the start band off the offset', () => {
    const calculator = createColumnsCalculator(
      createViewportStub({ viewportWidth: 500, scroll: 100, fixedColumnsStart: 1, fixedColumnsEnd: 2 })
    );

    expect(calculator.viewportWidth).toBe(500 - (3 * COLUMN_WIDTH));
    expect(calculator.scrollOffset).toBe(100 + COLUMN_WIDTH);
  });

  it('should not subtract anything while the end overlay has no clone', () => {
    const calculator = createColumnsCalculator(
      createViewportStub({ viewportWidth: 500, fixedColumnsEnd: 2, endCloneExists: false })
    );

    expect(calculator.viewportWidth).toBe(500);
  });
});
