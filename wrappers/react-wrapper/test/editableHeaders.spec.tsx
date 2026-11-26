import React from 'react';
import { act } from 'react-dom/test-utils';
import { HotTableRef } from '../src/types';
import {
  createSpreadsheetData,
  mockElementDimensions,
  renderHotTableWithProps,
  sleep,
} from './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

// The EditableHeaders plugin keeps the names users gave headers itself, not in `colHeaders`. A wrapper
// re-sends a changed prop on a render, which runs the plugin's update: the renames must survive it.
describe('editableHeaders prop', () => {
  const props = {
    licenseKey: TEST_LICENSE_KEY,
    data: createSpreadsheetData(3, 3),
    colHeaders: ['Name', 'Price', 'Stock'],
    width: 300,
    height: 300,
    autoRowSize: false,
    autoColumnSize: false,
    editableHeaders: true,
    init() {
      mockElementDimensions(this.rootElement, 300, 300);
    },
  };

  it('should keep a renamed header when the prop changes on a render', async() => {
    const ref = React.createRef<HotTableRef>();

    renderHotTableWithProps({ ...props }, false, ref);
    await sleep(100);

    act(() => {
      ref.current!.hotInstance!.getPlugin('editableHeaders').setHeader('column', 1, 'Cost');
    });

    renderHotTableWithProps({ ...props, editableHeaders: { columnHeaders: true, rowHeaders: true } }, false, ref);
    await sleep(100);

    expect(ref.current!.hotInstance!.getColHeader(1)).toBe('Cost');
    // The update reached the plugin: it reads the new object.
    expect(ref.current!.hotInstance!.getPlugin('editableHeaders').getSetting('rowHeaders')).toBe(true);
  });

  it('should hand the new name to the application in afterHeaderChange', async() => {
    const afterHeaderChange = jest.fn();
    const ref = renderHotTableWithProps({ ...props, afterHeaderChange }, false);

    await sleep(100);
    act(() => {
      ref.current!.hotInstance!.getPlugin('editableHeaders').setHeader('column', 0, 'Item');
    });

    expect(afterHeaderChange).toHaveBeenCalledWith('column', 0, 'Item', 'Name');
  });
});
