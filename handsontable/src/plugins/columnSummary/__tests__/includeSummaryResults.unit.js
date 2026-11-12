import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary, TrimRows } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerAllCellTypes();
registerPlugin(ColumnSummary);
registerPlugin(TrimRows);

// Physical rows: 0 total | 1, 2 leaves | 3 subtotal | 4, 5, 6 leaves. Column 1 holds the values.
const createData = () => [
  ['Line 1', null], ['Line 2', 5], ['Line 3', 6], ['Line 4', null],
  ['Line 5', 7], ['Line 6', 8], ['Line 7', 9],
];
const endpoint = (destinationRow, ranges, extra = {}) => ({
  destinationRow, destinationColumn: 1, sourceColumn: 1, type: 'sum', ranges, ...extra,
});

describe('ColumnSummary `includeSummaryResults` option', () => {
  let container;
  let hot;
  let originalScrollIntoView;
  let originalScrollTo;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    originalScrollTo = window.scrollTo;
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.scrollTo = () => {};
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.scrollTo = originalScrollTo;
  });

  function buildGrid(columnSummary, settings = {}) {
    return new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY, data: createData(), columnSummary, ...settings,
    });
  }

  it('parses `includeSummaryResults` as `false` by default and keeps a declared `true`', () => {
    hot = buildGrid([endpoint(3, [[4, 6]]), endpoint(0, [[1, 3]], { includeSummaryResults: true })]);
    const endpoints = hot.getPlugin('columnSummary').endpoints.getAllEndpoints();

    expect(endpoints[0].includeSummaryResults).toBe(false);
    expect(endpoints[1].includeSummaryResults).toBe(true);
  });

  it('exports the option with the endpoint settings', () => {
    hot = buildGrid([endpoint(3, [[4, 6]]), endpoint(0, [[1, 3]], { includeSummaryResults: true })]);

    expect(hot.getPlugin('columnSummary').exportEndpointSettings()[1].includeSummaryResults).toBe(true);
  });

  it('keeps skipping a summary result when the option is off (control)', () => {
    hot = buildGrid([endpoint(3, [[4, 6]]), endpoint(0, [[1, 3]])]);

    expect(hot.getDataAtCell(3, 1)).toBe(24);
    expect(hot.getDataAtCell(0, 1)).toBe(11);
  });

  describe('with `includeSummaryResults: true`', () => {
    const nested = (order = 'parentFirst') => {
      const parent = endpoint(0, [[1, 3]], { includeSummaryResults: true });
      const child = endpoint(3, [[4, 6]]);

      return order === 'parentFirst' ? [parent, child] : [child, parent];
    };

    it.each(['parentFirst', 'childFirst'])('adds a nested subtotal into the parent (%s)', (order) => {
      hot = buildGrid(nested(order));

      expect(hot.getDataAtCell(3, 1)).toBe(24);
      expect(hot.getDataAtCell(0, 1)).toBe(35);
    });

    it('follows two consecutive leaf edits', () => {
      hot = buildGrid(nested());
      hot.setDataAtCell(5, 1, 100);
      expect(hot.getDataAtCol(1)).toEqual([127, 5, 6, 116, 7, 100, 9]);
      hot.setDataAtCell(6, 1, 1);
      expect(hot.getDataAtCol(1)).toEqual([119, 5, 6, 108, 7, 100, 1]);
    });

    it('counts a subtotal as one entry for `count`, `average`, `min`, and `max`', () => {
      const results = {};

      ['count', 'average', 'min', 'max'].forEach((type) => {
        hot = buildGrid([
          endpoint(3, [[4, 6]], { type }),
          endpoint(0, [[1, 3]], { type, includeSummaryResults: true }),
        ]);
        results[type] = hot.getDataAtCell(0, 1);
        hot.destroy();
        hot = null;
      });

      // count: 2 leaves + subtotal 3 as one numeric entry -> 3. average: (5 + 6 + 8) / 3.
      expect(results.count).toBe(3);
      expect(results.average).toBeCloseTo(19 / 3, 10);
      expect(results.min).toBe(5); // min(5, 6, child min 7)
      expect(results.max).toBe(9); // max(5, 6, child max 9)
    });

    it('works with settings declared as a function', () => {
      hot = buildGrid(() => nested());
      expect(hot.getDataAtCell(0, 1)).toBe(35);
      hot.setDataAtCell(5, 1, 100);
      expect(hot.getDataAtCell(0, 1)).toBe(127);
    });

    it('uses the fresh result of a dependency whose destination row is trimmed', () => {
      hot = buildGrid(nested(), { trimRows: true });
      hot.getPlugin('trimRows').trimRow(3);

      expect(hot.toVisualRow(5)).toBe(4);

      hot.setDataAtCell(hot.toVisualRow(5), 1, 100);

      expect(hot.getDataAtCell(0, 1)).toBe(127);
    });

    it('uses the rounded value the dependency cell receives', () => {
      hot = buildGrid([
        endpoint(3, [[4, 6]], { type: 'average', roundFloat: 0 }), // 8
        endpoint(0, [[1, 3]], { includeSummaryResults: true }),
      ]);
      hot.setDataAtCell(4, 1, 7.4); // average 8.133 -> 8

      // `roundFloat: 0` formats the result with `toFixed()`, so the subtotal cell holds the string '8'.
      expect(Number(hot.getDataAtCell(3, 1))).toBe(8);
      expect(hot.getDataAtCell(0, 1)).toBe(19);
    });

    it('adds nothing for a dependency that has not enough data, and does not throw', () => {
      const data = createData();

      data[4][1] = null; data[5][1] = null; data[6][1] = null;

      expect(() => {
        hot = buildGrid([
          endpoint(3, [[4, 6]], { type: 'max' }),
          endpoint(0, [[1, 3]], { includeSummaryResults: true, suppressDataTypeErrors: false }),
        ], { data });
      }).not.toThrow();
      expect(hot.getDataAtCell(3, 1)).toBe('Not enough data');
      expect(hot.getDataAtCell(0, 1)).toBe(11);
    });

    it('warns once and stays finite when two endpoints include each other', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      hot = buildGrid([
        endpoint(0, [[1, 3]], { includeSummaryResults: true }),
        endpoint(3, [[0, 0], [4, 6]], { includeSummaryResults: true }),
      ]);

      expect(Number.isFinite(hot.getDataAtCell(0, 1))).toBe(true);
      expect(Number.isFinite(hot.getDataAtCell(3, 1))).toBe(true);
      expect(warnSpy.mock.calls.filter(([message]) => /ColumnSummary/.test(message)).length).toBe(1);
      warnSpy.mockRestore();
    });

    it('does not double count with a whole-subtree range when the option is off (control)', () => {
      hot = buildGrid([endpoint(3, [[4, 6]]), endpoint(0, [[1, 6]])]);

      expect(hot.getDataAtCell(0, 1)).toBe(35);
    });

    it('reads its own destination inside its own range as before, without a loop warning', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const totals = {};

      [false, true].forEach((includeSummaryResults) => {
        hot = buildGrid([endpoint(3, [[1, 6]], { includeSummaryResults })]);
        totals[includeSummaryResults] = [hot.getDataAtCell(3, 1)];
        hot.setDataAtCell(5, 1, 100);
        totals[includeSummaryResults].push(hot.getDataAtCell(3, 1));
        hot.destroy();
        hot = null;
      });

      expect(totals.false).toEqual([35, 127]);
      expect(totals.true).toEqual(totals.false);
      expect(warnSpy.mock.calls.filter(([message]) => /ColumnSummary/.test(message)).length).toBe(0);
      warnSpy.mockRestore();
    });

    it('reads its own destination as before when a nested pass replaced the function-form endpoints', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      hot = buildGrid(() => [endpoint(3, [[1, 6]], { includeSummaryResults: true })]);

      const plugin = hot.getPlugin('columnSummary');
      const originalGetCellValue = plugin.getCellValue;
      let swapped = false;

      // A nested refresh (a Formulas resync run from a cell read) re-reads the settings function and
      // caches new endpoint objects while the outer endpoint is still being calculated.
      plugin.getCellValue = function(...args) {
        if (!swapped) {
          swapped = true;
          this.endpoints.cacheSummaryDestinations(this.endpoints.getAllEndpoints());
        }

        return originalGetCellValue.apply(this, args);
      };

      hot.setDataAtCell(5, 1, 100);

      expect(swapped).toBe(true);
      expect(hot.getDataAtCell(3, 1)).toBe(127);
      expect(warnSpy.mock.calls.filter(([message]) => /ColumnSummary/.test(message)).length).toBe(0);
      warnSpy.mockRestore();
    });

    it('keeps the nested total after a row is inserted above the subtotal', () => {
      hot = buildGrid(nested());
      hot.alter('insert_row_above', 2);
      hot.setDataAtCell(2, 1, 10);

      expect(hot.getDataAtCell(0, 1)).toBe(45);
    });
  });

  describe('dependency in another source column', () => {
    // Column 2 holds the leaf values of the subtotal; its result is written into column 1.
    const createCrossData = () => [
      ['Line 1', null, null], ['Line 2', 5, null], ['Line 3', 6, null], ['Line 4', null, null],
      ['Line 5', null, 7], ['Line 6', null, 8], ['Line 7', null, 9],
    ];
    const crossEndpoints = () => [
      endpoint(0, [[1, 3]], { includeSummaryResults: true }),
      endpoint(3, [[4, 6]], { sourceColumn: 2 }),
    ];

    it('updates the parent when only the dependency\'s source column changes', () => {
      hot = buildGrid(crossEndpoints(), { data: createCrossData() });
      expect(hot.getDataAtCell(0, 1)).toBe(35);

      hot.setDataAtCell(5, 2, 100);

      expect(hot.getDataAtCell(3, 1)).toBe(116);
      expect(hot.getDataAtCell(0, 1)).toBe(127);
    });

    it('updates a grandparent through two levels', () => {
      const data = [...createCrossData(), ['Grand total', null, null]];

      hot = buildGrid([
        endpoint(7, [[0, 0]], { includeSummaryResults: true }),
        ...crossEndpoints(),
      ], { data });
      hot.setDataAtCell(5, 2, 100);

      expect(hot.getDataAtCell(7, 1)).toBe(127);
    });

    it('updates the parent through refreshEndpointsBySourceColumns too', () => {
      hot = buildGrid(crossEndpoints(), { data: createCrossData() });
      hot.setSourceDataAtCell(5, 2, 100);
      hot.getPlugin('columnSummary').endpoints.refreshEndpointsBySourceColumns([2]);

      expect(hot.getDataAtCell(3, 1)).toBe(116);
      expect(hot.getDataAtCell(0, 1)).toBe(127);
    });

    it('terminates when endpoints include each other and a source column changes', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      hot = buildGrid([
        endpoint(0, [[1, 3]], { includeSummaryResults: true }),
        endpoint(3, [[0, 0], [4, 6]], { sourceColumn: 2, includeSummaryResults: true }),
      ], { data: createCrossData() });

      expect(() => hot.setDataAtCell(5, 2, 100)).not.toThrow();
      warnSpy.mockRestore();
    });

    it('does not refresh an endpoint without the option when another column changes (control)', () => {
      hot = buildGrid(
        [endpoint(0, [[1, 3]]), endpoint(3, [[4, 6]], { sourceColumn: 2 })],
        { data: createCrossData() }
      );
      const calculate = jest.spyOn(hot.getPlugin('columnSummary'), 'calculate');

      hot.setDataAtCell(5, 2, 100);

      expect(calculate.mock.calls.map(([e]) => e.destinationRow)).toEqual([3]);
    });
  });
});
