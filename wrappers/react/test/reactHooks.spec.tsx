import React, { useState } from 'react';
import { act } from '@testing-library/react';
import {
  HotTable
} from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  simulateMouseEvent,
  mountComponentWithRef
} from './_helpers';

describe('Using hooks within HotTable renderers', () => {
  it('should be possible to use hook-enabled components as renderers', async () => {
    function HookEnabledRenderer(props) {
      const [count, setCount] = useState(0);

      return (
        <div className={'hook-enabled-renderer-container'}>
          <p>{props.value}</p>: <span>{count}</span>
          <button onClick={() => setCount(count + 1)}>
            Click me
          </button>
        </div>
      );
    }

    const hotInstance = mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HookEnabledRenderer hot-renderer></HookEnabledRenderer>
      </HotTable>
    )).hotInstance;

    expect(hotInstance.getCell(0, 0).querySelectorAll('.hook-enabled-renderer-container').length).toEqual(1);
    expect(hotInstance.getCell(1, 1).querySelectorAll('.hook-enabled-renderer-container').length).toEqual(1);

    await act(async () => {
      simulateMouseEvent(hotInstance.getCell(0, 0).querySelector('button'), 'click');
    });
    await act(async () => {
      simulateMouseEvent(hotInstance.getCell(0, 0).querySelector('button'), 'click');
    });
    await act(async () => {
      simulateMouseEvent(hotInstance.getCell(0, 0).querySelector('button'), 'click');
    });

    expect(hotInstance.getCell(0, 0).querySelector('span').innerHTML).toEqual('3');
    expect(hotInstance.getCell(1, 1).querySelector('span').innerHTML).toEqual('0');
  });
});

/*
 Editor components cannot be used with React Hooks, as they need to be classes derived from BaseEditorComponent.
 */
