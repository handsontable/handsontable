import React from 'react';
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
import { HotRendererProps, HotTableRef } from '../src/types'

describe('Using hooks within HotTable', () => {
  it('should be possible to use hook-enabled components as renderers', async () => {
    function HookEnabledRenderer(props: HotRendererProps) {
      const [count, setCount] = React.useState(0);

      return (
        <div className={'hook-enabled-renderer-container'}>
          <p>{props.value}</p>: <span>{count}</span>
          <button onClick={() => setCount(count + 1)}>
            Click me
          </button>
        </div>
      );
    }

    const hotInstance = mountComponentWithRef<HotTableRef>((
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
                }}
                renderer={HookEnabledRenderer}/>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.querySelectorAll('.hook-enabled-renderer-container').length).toEqual(1);
    expect(hotInstance.getCell(1, 1)!.querySelectorAll('.hook-enabled-renderer-container').length).toEqual(1);

    await act(async () => {
      simulateMouseEvent(hotInstance.getCell(0, 0)!.querySelector('button'), 'click');
    });
    await act(async () => {
      simulateMouseEvent(hotInstance.getCell(0, 0)!.querySelector('button'), 'click');
    });
    await act(async () => {
      simulateMouseEvent(hotInstance.getCell(0, 0)!.querySelector('button'), 'click');
    });

    expect(hotInstance.getCell(0, 0)!.querySelector('span')!.innerHTML).toEqual('3');
    expect(hotInstance.getCell(1, 1)!.querySelector('span')!.innerHTML).toEqual('0');
  });

  /*
   Editor components are always used with React Hooks as they need to use useHotEditorHooks - tested everywhere else.
   */
});

