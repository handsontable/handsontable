import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { mockElementDimensions, renderHotTableWithProps } from './_helpers';
import { HotTableProps, HotTableRef } from '../src/types';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

type HotInstance = NonNullable<HotTableRef['hotInstance']>;

const COL_WIDTHS = [100, 150, 200];

/**
 * Builds the grid props. Each call makes new props, as a render of the parent component does. The rows are the
 * array the grid holds, which `alter()` changes in place, the way an app keeps its data in state.
 *
 * @param {Array} data The rows.
 * @param {object} [extra] Props merged over the defaults.
 * @returns {HotTableProps}
 */
function buildProps(data: string[][], extra: HotTableProps = {}): HotTableProps {
  return {
    licenseKey: TEST_LICENSE_KEY,
    data,
    width: 600,
    height: 300,
    autoColumnSize: false,
    colWidths: COL_WIDTHS,
    init() {
      mockElementDimensions(this.rootElement, 600, 300);
    },
    ...extra,
  };
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
 * The wrapper compares the `colWidths` prop with the grid's live `getSettings().colWidths`. Core keeps that value
 * the array the prop passed when columns are inserted or removed, so a later render finds nothing to forward,
 * and the widths stay on their columns.
 */
describe('An array `colWidths` prop after columns are inserted or removed', () => {
  it('should not send the prop again on the next render', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const data = [['a', 'b', 'c']];

    renderHotTableWithProps(buildProps(data), false, hotTableRef);

    const hot = hotTableRef.current!.hotInstance!;

    act(() => {
      hot.alter('insert_col_start', 1);
    });

    expect(columnWidths(hot)).toEqual([100, 50, 150, 200]);

    const updateSettings = jest.spyOn(hot, 'updateSettings');

    await act(async() => {
      renderHotTableWithProps(buildProps(data, { readOnly: true }), false, hotTableRef);
    });

    expect(updateSettings).toHaveBeenCalled();
    expect(updateSettings.mock.calls.some(([settings]) => 'colWidths' in settings)).toBe(false);
    expect(hot.getSettings().colWidths).toBe(COL_WIDTHS);
    expect(columnWidths(hot)).toEqual([100, 50, 150, 200]);

    act(() => {
      hot.alter('remove_col', 0);
    });

    await act(async() => {
      renderHotTableWithProps(buildProps(data, { readOnly: false }), false, hotTableRef);
    });

    expect(columnWidths(hot)).toEqual([50, 150, 200]);
  });

  it('should apply a new array passed after columns were inserted', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const data = [['a', 'b', 'c']];

    renderHotTableWithProps(buildProps(data), false, hotTableRef);

    const hot = hotTableRef.current!.hotInstance!;

    act(() => {
      hot.alter('insert_col_start', 1);
    });

    await act(async() => {
      renderHotTableWithProps(buildProps(data, { colWidths: [30, 31, 32, 33] }), false, hotTableRef);
    });

    expect(columnWidths(hot)).toEqual([30, 31, 32, 33]);
  });
});
