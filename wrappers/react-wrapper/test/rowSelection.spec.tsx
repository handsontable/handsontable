import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  mountComponentWithRef,
  renderHotTableWithProps,
} from './_helpers';
import { HotTableProps, HotTableRef } from '../src/types';

// register Handsontable's modules
registerAllModules();

/**
 * Returns the row selection checkbox rendered in the row header of a visual row.
 *
 * @param {HotTableRef} hotTableRef The HotTable ref.
 * @param {number} row The visual row index.
 * @returns {HTMLInputElement | null}
 */
function getRowHeaderCheckbox(hotTableRef: HotTableRef, row: number): HTMLInputElement | null {
  const rowHeader = hotTableRef.hotInstance!.getCell(row, -1);

  return rowHeader?.querySelector<HTMLInputElement>('input.htRowSelectionCheckbox') ?? null;
}

describe('HotTable `rowSelection` option', () => {
  const baseSettings: HotTableProps = {
    licenseKey: 'non-commercial-and-evaluation',
    id: 'hot',
    data: createSpreadsheetData(5, 3),
    rowHeaders: true,
    colHeaders: true,
    rowSelection: true,
    autoRowSize: false,
    autoColumnSize: false,
  };

  it('should enable the plugin and expose its API through the component ref', async() => {
    const hotTableRef = renderHotTableWithProps(baseSettings, false);
    const plugin = hotTableRef.current!.hotInstance!.getPlugin('rowSelection');

    expect(plugin.isEnabled()).toBe(true);
    expect(getRowHeaderCheckbox(hotTableRef.current!, 1)).not.toBeNull();
    expect(getRowHeaderCheckbox(hotTableRef.current!, 1)!.checked).toBe(false);

    act(() => {
      plugin.selectRows([1]);
    });

    expect(plugin.getSelectedRows()).toEqual([1]);
    expect(getRowHeaderCheckbox(hotTableRef.current!, 1)!.checked).toBe(true);
    expect(getRowHeaderCheckbox(hotTableRef.current!, 0)!.checked).toBe(false);
  });

  it('should keep the row selection when the component re-renders with unchanged props', async() => {
    const hotTableRef = renderHotTableWithProps(baseSettings, false);
    const plugin = hotTableRef.current!.hotInstance!.getPlugin('rowSelection');

    act(() => {
      plugin.selectRows([1, 3]);
    });

    const afterUpdateSettings = jest.fn();

    hotTableRef.current!.hotInstance!.addHook('afterUpdateSettings', afterUpdateSettings);

    renderHotTableWithProps({ ...baseSettings }, false, hotTableRef);

    // the wrapper re-sends its settings, which runs the plugin's `updatePlugin()`
    expect(afterUpdateSettings).toHaveBeenCalled();
    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getSelectedRows()).toEqual([1, 3]);
    expect(getRowHeaderCheckbox(hotTableRef.current!, 3)!.checked).toBe(true);
  });

  it('should keep the row selection when the `rowSelection` prop changes to an object form', async() => {
    const hotTableRef = renderHotTableWithProps(baseSettings, false);
    const plugin = hotTableRef.current!.hotInstance!.getPlugin('rowSelection');

    act(() => {
      plugin.selectRows([2]);
    });

    renderHotTableWithProps({
      ...baseSettings,
      rowSelection: { headerCheckbox: false },
    }, false, hotTableRef);

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getSelectedRows()).toEqual([2]);
    expect(getRowHeaderCheckbox(hotTableRef.current!, 2)!.checked).toBe(true);
  });

  it('should disable the plugin when the `rowSelection` prop changes to `false`', async() => {
    const hotTableRef = renderHotTableWithProps(baseSettings, false);
    const plugin = hotTableRef.current!.hotInstance!.getPlugin('rowSelection');

    renderHotTableWithProps({ ...baseSettings, rowSelection: false }, false, hotTableRef);

    expect(plugin.isEnabled()).toBe(false);
    expect(getRowHeaderCheckbox(hotTableRef.current!, 1)).toBeNull();
  });
});

describe('HotTable `headerCheckbox` column option', () => {
  it('should render the header checkbox for a checkbox column configured through HotColumn', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        id="test-hot"
        data={[{ name: 'A', active: true }, { name: 'B', active: false }]}
        colHeaders={true}
        autoRowSize={false}
        autoColumnSize={false}
      >
        <HotColumn data="name" />
        <HotColumn data="active" type="checkbox" headerCheckbox={true} />
      </HotTable>
    ), false).hotInstance!;

    expect(hotInstance.getCell(-1, 0)!.querySelector('input.htCheckboxHeaderInput')).toBeNull();

    const headerInput = hotInstance.getCell(-1, 1)!.querySelector<HTMLInputElement>('input.htCheckboxHeaderInput');

    expect(headerInput).not.toBeNull();
    expect(headerInput!.indeterminate).toBe(true);
  });

  it('should render the header checkbox for a checkbox column configured through the `columns` prop', async() => {
    const hotTableRef = renderHotTableWithProps({
      licenseKey: 'non-commercial-and-evaluation',
      id: 'hot',
      data: [{ active: true }, { active: true }],
      colHeaders: true,
      columns: [{ data: 'active', type: 'checkbox', headerCheckbox: true }],
      autoRowSize: false,
      autoColumnSize: false,
    }, false);
    const headerInput = hotTableRef.current!.hotInstance!.getCell(-1, 0)!
      .querySelector<HTMLInputElement>('input.htCheckboxHeaderInput');

    expect(headerInput).not.toBeNull();
    expect(headerInput!.checked).toBe(true);
  });
});
