import React from 'react';
import { HotTableRef } from '../src/types';
import {
  createSpreadsheetData,
  mockElementDimensions,
  renderHotTableWithProps,
  sleep,
} from './_helpers';

// The `fixedColumnsEnd` option is a core setting. The wrapper forwards every prop to the core without a
// whitelist, so the option must reach the instance on mount and on a later prop change.
describe('fixedColumnsEnd prop', () => {
  const props = {
    licenseKey: 'non-commercial-and-evaluation',
    data: createSpreadsheetData(5, 6),
    width: 300,
    height: 300,
    rowHeights: 23,
    colWidths: 50,
    autoRowSize: false,
    autoColumnSize: false,
    init() {
      mockElementDimensions(this.rootElement, 300, 300);
    },
  };

  it('should pass the option to the Handsontable instance', async() => {
    const ref = renderHotTableWithProps({ ...props, fixedColumnsEnd: 2 }, false);

    await sleep(100);

    expect(ref.current!.hotInstance!.getSettings().fixedColumnsEnd).toBe(2);
  });

  it('should default to 0 when the prop is not set', async() => {
    const ref = renderHotTableWithProps({ ...props }, false);

    await sleep(100);

    expect(ref.current!.hotInstance!.getSettings().fixedColumnsEnd).toBe(0);
  });

  it('should apply a changed prop to the instance', async() => {
    const ref = React.createRef<HotTableRef>();

    renderHotTableWithProps({ ...props, fixedColumnsEnd: 2 }, false, ref);
    await sleep(100);
    renderHotTableWithProps({ ...props, fixedColumnsEnd: 1 }, false, ref);
    await sleep(100);

    expect(ref.current!.hotInstance!.getSettings().fixedColumnsEnd).toBe(1);
  });

  it('should render the inline-end overlay for the frozen end columns', async() => {
    renderHotTableWithProps({ ...props, fixedColumnsEnd: 2 }, false);
    await sleep(100);

    expect(document.querySelector('.ht_clone_inline_end')).not.toBeNull();
  });
});
