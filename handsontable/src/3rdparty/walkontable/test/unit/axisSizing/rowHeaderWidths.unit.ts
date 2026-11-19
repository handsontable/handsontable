import { resolveRowHeaderWidths } from 'walkontable/axisSizing/rowHeaderWidths';
import ColumnUtils from 'walkontable/axisSizing/columnUtils';
import { workspaceSize } from 'walkontable/viewport/workspaceSize';
import type { Viewport } from 'walkontable/viewport/viewport';
import type { TableDeps } from 'walkontable/table/baseTable';

const DEFAULT_WIDTH = 50;

type HeaderWidth = number | Array<number | null | undefined> | null | undefined;

/**
 * Builds the settings the row header width resolution reads.
 *
 * @param {object} options The settings.
 * @param {*} options.rowHeaderWidth The `rowHeaderWidth` setting.
 * @param {number} options.levels How many row header levels are rendered.
 * @param {Function} [options.onModify] The `onModifyRowHeaderWidth` setting.
 * @param {boolean} [options.hookUnset] Leaves `onModifyRowHeaderWidth` at the Walkontable default (`null`).
 * @returns {object}
 */
function createSettings({
  rowHeaderWidth,
  levels,
  onModify,
  hookUnset = false,
}: {
  rowHeaderWidth: HeaderWidth,
  levels: number,
  onModify?: (width: HeaderWidth) => HeaderWidth,
  hookUnset?: boolean,
}) {
  const rowHeaders = Array.from({ length: levels }, () => () => {});

  return {
    getSetting: (key: string, param1?: unknown) => {
      switch (key) {
        case 'rowHeaderWidth':
          return rowHeaderWidth;
        case 'rowHeaders':
          return rowHeaders;
        case 'defaultColumnWidth':
          return DEFAULT_WIDTH;
        case 'onModifyRowHeaderWidth':
          if (hookUnset) {
            return null;
          }

          return onModify ? onModify(param1 as HeaderWidth) : param1;
        default:
          return undefined;
      }
    },
  };
}

/**
 * A handler shaped like the RowSelection plugin's: a number is one width per level, and the
 * plugin's own level gets the checkbox width.
 *
 * @param {number} checkboxLevel The level the plugin owns.
 * @param {number} checkboxWidth The width of that level.
 * @param {number} levels How many levels are rendered.
 * @returns {Function}
 */
function perLevelHandler(checkboxLevel: number, checkboxWidth: number, levels: number) {
  return (width: HeaderWidth) => {
    const widths = Array.isArray(width) ? width.slice() : new Array(levels).fill(width);

    widths[checkboxLevel] = checkboxWidth;

    return widths;
  };
}

describe('resolveRowHeaderWidths', () => {
  it('should hand the hook the per-level number, never the total of the levels', () => {
    const onModify = jest.fn((width: HeaderWidth) => width);

    resolveRowHeaderWidths(createSettings({ rowHeaderWidth: 50, levels: 2, onModify }));

    expect(onModify).toHaveBeenCalledTimes(1);
    expect(onModify).toHaveBeenCalledWith(50);
  });

  it('should hand the hook the per-level array as configured', () => {
    const onModify = jest.fn((width: HeaderWidth) => width);

    resolveRowHeaderWidths(createSettings({ rowHeaderWidth: [60, 40], levels: 2, onModify }));

    expect(onModify).toHaveBeenCalledTimes(1);
    expect(onModify).toHaveBeenCalledWith([60, 40]);
  });

  it('should give every level a number answer', () => {
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: 50, levels: 3 }))).toEqual([50, 50, 50]);
    expect(resolveRowHeaderWidths(createSettings({
      rowHeaderWidth: 50,
      levels: 2,
      onModify: () => 80,
    }))).toEqual([80, 80]);
  });

  it('should read an array answer level by level', () => {
    expect(resolveRowHeaderWidths(createSettings({
      rowHeaderWidth: 50,
      levels: 2,
      onModify: perLevelHandler(1, 33, 2),
    }))).toEqual([50, 33]);
  });

  it('should read only the levels the draw renders', () => {
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: [60, 80, 200], levels: 2 })))
      .toEqual([60, 80]);
  });

  it('should fall back to the default column width for a level the answer does not cover', () => {
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: [80], levels: 2 }))).toEqual([80, DEFAULT_WIDTH]);
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: [80, null], levels: 2 })))
      .toEqual([80, DEFAULT_WIDTH]);
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: [null, 40], levels: 2 })))
      .toEqual([DEFAULT_WIDTH, 40]);
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: [80, undefined], levels: 2 })))
      .toEqual([80, DEFAULT_WIDTH]);
  });

  it('should keep the configured width when no hook is set', () => {
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: 80, levels: 2, hookUnset: true })))
      .toEqual([80, 80]);
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: [60, 40], levels: 2, hookUnset: true })))
      .toEqual([60, 40]);
  });

  it('should keep the configured width when the hook gives no answer', () => {
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: 80, levels: 2, onModify: () => null })))
      .toEqual([80, 80]);
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: 80, levels: 2, onModify: () => undefined })))
      .toEqual([80, 80]);
  });

  it('should fall back to the default column width when the answer is not a usable width', () => {
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: 80, levels: 2, onModify: () => NaN })))
      .toEqual([DEFAULT_WIDTH, DEFAULT_WIDTH]);
  });

  it('should resolve no widths when no row header is rendered', () => {
    expect(resolveRowHeaderWidths(createSettings({ rowHeaderWidth: 50, levels: 0 }))).toEqual([]);
    expect(resolveRowHeaderWidths(createSettings({
      rowHeaderWidth: 50,
      levels: 0,
      onModify: (width: HeaderWidth) => (width as number) + 10,
    }))).toEqual([]);
  });
});

/**
 * Builds the smallest viewport double `getRowHeaderWidth` reads.
 *
 * @param {object} settings The settings double.
 * @returns {Viewport}
 */
function createViewport(settings: ReturnType<typeof createSettings>): Viewport {
  return {
    rowHeaderWidth: NaN,
    wtSettings: settings,
    wtTable: { TABLE: document.createElement('table') },
    deps: { geometryReader: { outerWidth: () => 999 } },
  } as unknown as Viewport;
}

/**
 * Builds the `col` widths `ColumnUtils` gives the row header levels.
 *
 * @param {object} settings The settings double.
 * @returns {number[]}
 */
function columnHeaderWidths(settings: ReturnType<typeof createSettings>): number[] {
  const columnUtils = new ColumnUtils({
    wtSettings: settings,
    columnSizeSource: {},
  } as unknown as TableDeps);

  columnUtils.calculateWidths();

  return Array.from(columnUtils.headerWidths.values());
}

/**
 * The viewport and `ColumnUtils` both read `modifyRowHeaderWidth`. The `col` elements are sized by
 * `ColumnUtils`, and the viewport sizes the hider and places the inline-end overlay from its own total,
 * so the total has to be the sum of exactly the widths the `col` elements get.
 */
describe('Viewport#getRowHeaderWidth', () => {
  const cases: Array<[string, Parameters<typeof createSettings>[0], number]> = [
    ['a number setting', { rowHeaderWidth: 50, levels: 2 }, 100],
    ['an array setting', { rowHeaderWidth: [60, 40], levels: 2 }, 100],
    ['a per-level handler on a number setting', {
      rowHeaderWidth: 50, levels: 2, onModify: perLevelHandler(1, 33, 2),
    }, 83],
    ['a per-level handler on an array setting', {
      rowHeaderWidth: [80, 40], levels: 2, onModify: perLevelHandler(1, 33, 2),
    }, 113],
    ['a per-level handler on a short array setting', {
      rowHeaderWidth: [80], levels: 2, onModify: perLevelHandler(1, 33, 2),
    }, 113],
    ['a handler widening a number setting', {
      rowHeaderWidth: 50, levels: 2, onModify: (width: HeaderWidth) => (width as number) + 10,
    }, 120],
    ['a short array setting', { rowHeaderWidth: [80], levels: 2 }, 80 + DEFAULT_WIDTH],
    ['an array setting with a hole', { rowHeaderWidth: [null, 40], levels: 2 }, DEFAULT_WIDTH + 40],
  ];

  cases.forEach(([name, options, expected]) => {
    it(`should add up the widths the col elements get for ${name}`, () => {
      const viewport = createViewport(createSettings(options));

      expect(workspaceSize.getRowHeaderWidth.call(viewport)).toBe(expected);
      expect(columnHeaderWidths(createSettings(options)).reduce((sum, width) => sum + width, 0)).toBe(expected);
    });
  });

  it('should be 0 with no row header, whatever the hook answers', () => {
    const viewport = createViewport(createSettings({
      rowHeaderWidth: 50,
      levels: 0,
      onModify: (width: HeaderWidth) => (width as number) + 10,
    }));

    expect(workspaceSize.getRowHeaderWidth.call(viewport)).toBe(0);
  });

  it('should run the hook once', () => {
    const onModify = jest.fn((width: HeaderWidth) => width);
    const viewport = createViewport(createSettings({ rowHeaderWidth: [80], levels: 2, onModify }));

    workspaceSize.getRowHeaderWidth.call(viewport);

    expect(onModify).toHaveBeenCalledTimes(1);
  });
});
