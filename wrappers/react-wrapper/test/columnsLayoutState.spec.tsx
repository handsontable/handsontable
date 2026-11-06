import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotColumn } from '../src/hotColumn';
import { mockElementDimensions, renderHotTableWithProps } from './_helpers';
import { HotTableProps, HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

type HotInstance = NonNullable<HotTableRef['hotInstance']>;

const MANUAL_WIDTH = 222;
const ALL_COLUMNS = ['a', 'b', 'c', 'd'];
const WITHOUT_FIRST = ['b', 'c', 'd'];

/**
 * Builds the rows for the given property names, in a new array of new objects.
 *
 * The wrapper forwards `data` with every `updateSettings()` call, so each render sends a new array, whatever changed.
 *
 * @param {string[]} props The property names.
 * @returns {object[]}
 */
function buildData(props: string[]): Record<string, string>[] {
  return [3, 1, 2].map(rank => Object.fromEntries(props.map(prop => [prop, `${prop}${rank}`])));
}

/**
 * Builds the settings of a grid that keeps width, hidden columns, and sorting in column index maps.
 *
 * @param {string[]} props The property names.
 * @param {object} [extra] Settings merged over the defaults.
 * @returns {HotTableProps}
 */
function buildSettings(props: string[], extra: HotTableProps = {}): HotTableProps {
  return {
    licenseKey: TEST_LICENSE_KEY,
    data: buildData(props),
    width: 600,
    height: 300,
    autoRowSize: false,
    autoColumnSize: false,
    manualColumnResize: true,
    hiddenColumns: true,
    columnSorting: true,
    init() {
      mockElementDimensions(this.rootElement, 600, 300);
    },
    ...extra,
  };
}

/**
 * Sets a width, a hidden column, or a sort on the column at the given visual index.
 *
 * @param {object} hot The Handsontable instance.
 * @param {'width'|'hidden'|'sort'} state The state to set.
 * @param {number} column The column index.
 */
function setColumnState(hot: HotInstance, state: 'width' | 'hidden' | 'sort', column: number) {
  act(() => {
    if (state === 'width') {
      hot.getPlugin('manualColumnResize').setManualSize(column, MANUAL_WIDTH);
    } else if (state === 'hidden') {
      hot.getPlugin('hiddenColumns').hideColumn(column);
    } else {
      hot.getPlugin('columnSorting').sort({ column, sortOrder: 'asc' });
    }
  });
}

/**
 * Collects the widths the grid uses, in visual column order.
 *
 * @param {object} hot The Handsontable instance.
 * @returns {number[]}
 */
function columnWidths(hot: HotInstance): number[] {
  return Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
}

/**
 * A change of the `columns` prop, or of the `<HotColumn>` children, reaches the core as `{ data, columns }`. The
 * column index state (manual widths, hidden columns, sorting) must start over when a column before it is removed,
 * as it does for `{ columns }` alone, instead of landing on the column that took its place.
 */
describe('Column state when the columns of the React wrapper change', () => {
  describe.each([
    ['the `columns` prop', (props: string[], extra: HotTableProps) => ({
      ...buildSettings(props, extra),
      columns: props.map(data => ({ data })),
    })],
    ['`<HotColumn>` children', (props: string[], extra: HotTableProps) => ({
      ...buildSettings(props, extra),
      children: props.map(data => <HotColumn key={data} data={data} />),
    })],
  ])('through %s', (_name, build) => {
    it('should start a manual width over when a column before it is removed', async() => {
      const hotTableRef = React.createRef<HotTableRef>();

      renderHotTableWithProps(build(ALL_COLUMNS, {}), false, hotTableRef);

      const hot = hotTableRef.current!.hotInstance!;

      setColumnState(hot, 'width', 2);

      // The control state: the width sits on column C before the removal.
      expect(hot.getColWidth(2)).toBe(MANUAL_WIDTH);

      await act(async() => {
        renderHotTableWithProps(build(WITHOUT_FIRST, {}), false, hotTableRef);
      });

      expect(hot.countCols()).toBe(3);
      expect(columnWidths(hot)).not.toContain(MANUAL_WIDTH);
    });

    it('should start a hidden column over when a column before it is removed', async() => {
      const hotTableRef = React.createRef<HotTableRef>();

      renderHotTableWithProps(build(ALL_COLUMNS, {}), false, hotTableRef);

      const hot = hotTableRef.current!.hotInstance!;

      setColumnState(hot, 'hidden', 2);

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);

      await act(async() => {
        renderHotTableWithProps(build(WITHOUT_FIRST, {}), false, hotTableRef);
      });

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
    });

    it('should start the sorting over when a column before it is removed', async() => {
      const hotTableRef = React.createRef<HotTableRef>();

      renderHotTableWithProps(build(ALL_COLUMNS, {}), false, hotTableRef);

      const hot = hotTableRef.current!.hotInstance!;

      setColumnState(hot, 'sort', 2);

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);

      await act(async() => {
        renderHotTableWithProps(build(WITHOUT_FIRST, {}), false, hotTableRef);
      });

      // The indicator and the row order go together.
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);
      expect(hot.getDataAtCol(0)).toEqual(['b3', 'b1', 'b2']);
    });

    it('should keep the state when a column is appended', async() => {
      const hotTableRef = React.createRef<HotTableRef>();
      const withAppended = [...ALL_COLUMNS, 'e'];

      renderHotTableWithProps(build(ALL_COLUMNS, {}), false, hotTableRef);

      const hot = hotTableRef.current!.hotInstance!;

      setColumnState(hot, 'width', 2);
      setColumnState(hot, 'hidden', 1);
      setColumnState(hot, 'sort', 2);

      await act(async() => {
        renderHotTableWithProps(build(withAppended, {}), false, hotTableRef);
      });

      expect(hot.countCols()).toBe(5);
      expect(hot.getColWidth(2)).toBe(MANUAL_WIDTH);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
    });

    it('should keep the state of the other columns when the last column is removed', async() => {
      const hotTableRef = React.createRef<HotTableRef>();

      renderHotTableWithProps(build(ALL_COLUMNS, {}), false, hotTableRef);

      const hot = hotTableRef.current!.hotInstance!;

      setColumnState(hot, 'width', 1);
      setColumnState(hot, 'hidden', 0);
      setColumnState(hot, 'sort', 1);

      await act(async() => {
        renderHotTableWithProps(build(['a', 'b', 'c'], {}), false, hotTableRef);
      });

      expect(hot.countCols()).toBe(3);
      expect(hot.getColWidth(1)).toBe(MANUAL_WIDTH);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([0]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    });

    it('should keep the state when the columns render again unchanged', async() => {
      const hotTableRef = React.createRef<HotTableRef>();

      renderHotTableWithProps(build(ALL_COLUMNS, {}), false, hotTableRef);

      const hot = hotTableRef.current!.hotInstance!;

      setColumnState(hot, 'width', 2);
      setColumnState(hot, 'hidden', 1);
      setColumnState(hot, 'sort', 2);

      // Each render sends a new `data` array, new column objects, and a new inline function, so a reset keyed on a
      // reference would lose the state here.
      await act(async() => {
        renderHotTableWithProps(build(ALL_COLUMNS, { cells: () => ({}) }), false, hotTableRef);
      });
      await act(async() => {
        renderHotTableWithProps(build(ALL_COLUMNS, { cells: () => ({}) }), false, hotTableRef);
      });

      expect(hot.getColWidth(2)).toBe(MANUAL_WIDTH);
      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([1]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
    });
  });
});
