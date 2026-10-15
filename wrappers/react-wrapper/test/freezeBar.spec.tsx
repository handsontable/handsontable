import React from 'react';
import { act } from 'react-dom/test-utils';
import { HotTableRef } from '../src/types';
import {
  createSpreadsheetData,
  mockElementDimensions,
  renderHotTableWithProps,
  sleep,
} from './_helpers';

// The freezeBar plugin writes the count of frozen columns on the grid, not on the settings the application
// passed in. A wrapper re-sends every prop on each render, so an unchanged prop must not revert the count
// the user dragged to, and a prop that really changes must still win.
describe('freezeBar prop', () => {
  const props = {
    licenseKey: 'non-commercial-and-evaluation',
    data: createSpreadsheetData(5, 10),
    width: 300,
    height: 300,
    rowHeights: 23,
    colWidths: 50,
    autoRowSize: false,
    autoColumnSize: false,
    freezeBar: true,
    fixedColumnsStart: 2,
    init() {
      mockElementDimensions(this.rootElement, 300, 300);
    },
  };

  it('should enable the plugin', async() => {
    const ref = renderHotTableWithProps({ ...props }, false);

    await sleep(100);

    expect(ref.current!.hotInstance!.getPlugin('freezeBar').isEnabled()).toBe(true);
  });

  it('should keep the count the user changed when the same prop is sent again', async() => {
    const ref = React.createRef<HotTableRef>();

    renderHotTableWithProps({ ...props }, false, ref);
    await sleep(100);

    act(() => {
      ref.current!.hotInstance!.getPlugin('freezeBar').setFreezeCount('start', 3);
    });

    renderHotTableWithProps({ ...props }, false, ref);
    await sleep(100);

    expect(ref.current!.hotInstance!.getPlugin('freezeBar').getFreezeCount('start')).toBe(3);
  });

  it('should apply a prop that really changes', async() => {
    const ref = React.createRef<HotTableRef>();

    renderHotTableWithProps({ ...props }, false, ref);
    await sleep(100);

    act(() => {
      ref.current!.hotInstance!.getPlugin('freezeBar').setFreezeCount('start', 3);
    });

    renderHotTableWithProps({ ...props, fixedColumnsStart: 1 }, false, ref);
    await sleep(100);

    expect(ref.current!.hotInstance!.getPlugin('freezeBar').getFreezeCount('start')).toBe(1);
  });

  it('should hand the new count to the application in afterFreezeChange', async() => {
    const afterFreezeChange = jest.fn();
    const ref = renderHotTableWithProps({ ...props, afterFreezeChange }, false);

    await sleep(100);
    act(() => {
      ref.current!.hotInstance!.getPlugin('freezeBar').setFreezeCount('start', 3);
    });

    expect(afterFreezeChange).toHaveBeenCalledWith('start', 3, 2, 'api');
  });
});
