import { calculatorFactory, directionalBandOverscan } from '../../../src/viewport/calculatorFactory';
import { RenderedAllRowsCalculationType, RenderedRowsCalculationType } from '../../../src/calculator';

describe('directionalBandOverscan', () => {
  const NO_PREVIOUS_OVERSCAN = { startOffset: 0, endOffset: 0 };

  describe('scroll toward the end (positive delta)', () => {
    it('should extend the end side by half the band size', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 6 }); // ceil(11 / 2) = 6
    });

    it('should cap the extension at the axis maximum', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 10, end: 39, count: 30 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 8 }); // ceil(30 / 2) = 15, capped at 8
    });

    it('should clamp the extension to the tracks left before the dataset end', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 86, end: 96, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 3 }); // only tracks 97-99 remain
    });

    it('should apply no overscan when the band already touches the dataset end', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 89, end: 99, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });
  });

  describe('scroll toward the start (negative delta)', () => {
    it('should extend the start side by half the band size', () => {
      const plan = directionalBandOverscan(
        -250, NO_PREVIOUS_OVERSCAN, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: -1, extension: 6 });
    });

    it('should clamp the extension to the tracks left before the dataset start', () => {
      const plan = directionalBandOverscan(
        -250, NO_PREVIOUS_OVERSCAN, { start: 3, end: 13, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: -1, extension: 3 });
    });

    it('should apply no overscan when the band already touches the dataset start', () => {
      const plan = directionalBandOverscan(
        -250, NO_PREVIOUS_OVERSCAN, { start: 0, end: 10, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });
  });

  describe('zero delta (the other axis scrolled)', () => {
    it('should preserve an existing start-side overscan', () => {
      const plan = directionalBandOverscan(
        0, { startOffset: 5, endOffset: 1 }, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: -1, extension: 6 });
    });

    it('should preserve an existing end-side overscan', () => {
      const plan = directionalBandOverscan(
        0, { startOffset: 1, endOffset: 5 }, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 6 });
    });

    it('should not invent an overscan side for a band that was never overscanned', () => {
      const plan = directionalBandOverscan(
        0, NO_PREVIOUS_OVERSCAN, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });

    it('should not read the asymmetric offsets of the clamped `auto` override (0/1 at a ' +
       'dataset edge) as an existing overscan', () => {
      // At scroll position 0 the ±1 'auto' override records offsets 0 (clamped start) and 1 —
      // only an offset greater than 1 proves a previous overscan.
      const plan = directionalBandOverscan(
        0, { startOffset: 0, endOffset: 1 }, { start: 0, end: 10, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });

    it('should apply no overscan when the preserved side has no tracks left', () => {
      const plan = directionalBandOverscan(
        0, { startOffset: 5, endOffset: 1 }, { start: 0, end: 10, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });
  });
});

describe('extendRenderedRowsBandTo', () => {
  const ROW_HEIGHT = 23;

  function createRenderedBand({ startRow, endRow }) {
    const band = new RenderedRowsCalculationType();

    band.startRow = startRow;
    band.endRow = endRow;
    band.count = endRow - startRow + 1;
    band.startPosition = startRow * ROW_HEIGHT;

    return band;
  }

  function createViewportStub(band, { totalRows = 100 } = {}) {
    return {
      rowsRenderCalculator: band,
      rowHeightCache: { getOffset: row => row * ROW_HEIGHT },
      wtSettings: { getSetting: () => totalRows },
    };
  }

  function extendBandTo(viewport, startRow, endRow) {
    calculatorFactory.extendRenderedRowsBandTo.call(viewport, startRow, endRow);
  }

  it('should extend the start edge to cover an earlier row and keep the derived fields consistent', () => {
    const band = createRenderedBand({ startRow: 10, endRow: 20 });
    const viewport = createViewportStub(band);

    extendBandTo(viewport, 5, 15);

    expect(band.startRow).toBe(5);
    expect(band.endRow).toBe(20);
    expect(band.count).toBe(16);
    expect(band.rowStartOffset).toBe(5);
    expect(band.rowEndOffset).toBe(0);
    expect(band.startPosition).toBe(5 * ROW_HEIGHT);
  });

  it('should union both edges when the range sticks out on both sides', () => {
    // The refill call site can only move the start edge (it declines any proposal whose bottom
    // edge does not already exceed the previous band's), but the method's contract is the full
    // union — this pins the defensive end-edge branch directly.
    const band = createRenderedBand({ startRow: 10, endRow: 20 });
    const viewport = createViewportStub(band);

    extendBandTo(viewport, 8, 25);

    expect(band.startRow).toBe(8);
    expect(band.endRow).toBe(25);
    expect(band.count).toBe(18);
    expect(band.rowStartOffset).toBe(2);
    expect(band.rowEndOffset).toBe(5);
    expect(band.startPosition).toBe(8 * ROW_HEIGHT);
  });

  it('should clamp the end edge to the last row of the dataset', () => {
    const band = createRenderedBand({ startRow: 90, endRow: 95 });
    const viewport = createViewportStub(band, { totalRows: 100 });

    extendBandTo(viewport, 90, 200);

    expect(band.startRow).toBe(90);
    expect(band.endRow).toBe(99);
    expect(band.count).toBe(10);
    expect(band.rowEndOffset).toBe(4);
  });

  it('should not shrink the band when the range lies inside it', () => {
    const band = createRenderedBand({ startRow: 10, endRow: 20 });
    const viewport = createViewportStub(band);

    extendBandTo(viewport, 12, 18);

    expect(band.startRow).toBe(10);
    expect(band.endRow).toBe(20);
    expect(band.count).toBe(11);
    expect(band.rowStartOffset).toBe(0);
    expect(band.rowEndOffset).toBe(0);
    expect(band.startPosition).toBe(10 * ROW_HEIGHT);
  });

  it('should ignore a negative start row (the pre-first-render range query answer)', () => {
    const band = createRenderedBand({ startRow: 10, endRow: 20 });
    const viewport = createViewportStub(band);

    extendBandTo(viewport, -1, 15);

    expect(band.startRow).toBe(10);
    expect(band.count).toBe(11);
    expect(band.rowStartOffset).toBe(0);
  });

  it('should be a no-op for a band that renders all rows', () => {
    const band = new RenderedAllRowsCalculationType();

    band.startRow = 0;
    band.endRow = 99;
    band.count = 100;

    // `totalRows: 200` with a range that sticks out past the band's end: without the `instanceof`
    // guard the end-edge branch would grow `endRow` to 150 (and NaN the offsets), so these inputs
    // actually observe the guard.
    const viewport = createViewportStub(band, { totalRows: 200 });

    extendBandTo(viewport, 0, 150);

    expect(band.startRow).toBe(0);
    expect(band.endRow).toBe(99);
    expect(band.count).toBe(100);
  });

  it('should be a no-op for an empty band (null edges)', () => {
    const band = new RenderedRowsCalculationType();
    const viewport = createViewportStub(band);

    extendBandTo(viewport, 0, 10);

    expect(band.startRow).toBeNull();
    expect(band.endRow).toBeNull();
    expect(band.count).toBe(0);
  });
});

describe('createRowsCalculator `proposeOnly` option', () => {
  const ROW_HEIGHT = 23;

  function createFactoryViewportStub() {
    return {
      rowHeaderWidth: 120,
      wtSettings: {
        getSetting: key => ({ totalRows: 100, fixedRowsTop: 0, fixedRowsBottom: 0 })[key],
        getSettingPure: () => null,
      },
      wtTable: { holder: {} },
      deps: {
        getTopOverlay: () => ({ getScrollPosition: () => 0, getTableParentOffset: () => 0 }),
        getBottomOverlay: () => ({ clone: null }),
        geometryReader: {
          clientHeight: () => 300,
          offsetHeight: () => 300,
          getScrollbarWidth: () => 15,
        },
        rootDocument: {},
      },
      usesLayoutSnapshotForCalculators: () => false,
      getViewportHeight: () => 300,
      rowsCalculatorTypes: new Map([['rendered', () => new RenderedRowsCalculationType()]]),
      rowHeightCache: {
        findIndexAtOffset: offset => Math.floor(offset / ROW_HEIGHT),
        getOffset: row => row * ROW_HEIGHT,
        getSizeAt: () => ROW_HEIGHT,
      },
    };
  }

  it('should reset the `rowHeaderWidth` memo on a default build', () => {
    const viewport = createFactoryViewportStub();

    calculatorFactory.createRowsCalculator.call(viewport, ['rendered'], 'visible');

    expect(viewport.rowHeaderWidth).toBeNaN();
  });

  it('should leave the `rowHeaderWidth` memo untouched on a propose-only build', () => {
    const viewport = createFactoryViewportStub();

    const calculator = calculatorFactory.createRowsCalculator
      .call(viewport, ['rendered'], 'visible', { proposeOnly: true });

    expect(viewport.rowHeaderWidth).toBe(120);
    // The build itself still computes a real band.
    expect(calculator.getResultsFor('rendered').endRow).not.toBeNull();
  });
});
