import React, { useState } from 'react';
import {
  mount,
  ReactWrapper
} from 'enzyme';
import {
  HotTable
} from '../src/hotTable';
import {
  mockElementDimensions,
  sleep,
  simulateMouseEvent
} from './_helpers';
import Handsontable from 'handsontable';


beforeEach(() => {
  let container = document.createElement('DIV');
  container.id = 'hotContainer';
  document.body.appendChild(container);
});

describe('Using hooks within HotTable renderers', () => {
  it('should be possible to use hook-enabled components as renderers', async (done) => {
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

    const wrapper: ReactWrapper<{}, {}, typeof HotTable> = mount(
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={Handsontable.helper.createSpreadsheetData(3, 3)}
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
      </HotTable>, {attachTo: document.body.querySelector('#hotContainer')}
    );

    await sleep(100);

    const hotInstance = wrapper.instance().hotInstance;

    expect(hotInstance.getCell(0,0).querySelectorAll('.hook-enabled-renderer-container').length).toEqual(1);
    expect(hotInstance.getCell(1,1).querySelectorAll('.hook-enabled-renderer-container').length).toEqual(1);

    simulateMouseEvent(hotInstance.getCell(0,0).querySelector('button'), 'click');
    simulateMouseEvent(hotInstance.getCell(0,0).querySelector('button'), 'click');
    simulateMouseEvent(hotInstance.getCell(0,0).querySelector('button'), 'click');

    expect(hotInstance.getCell(0,0).querySelector('span').innerHTML).toEqual('3');
    expect(hotInstance.getCell(1,1).querySelector('span').innerHTML).toEqual('0');

    wrapper.detach();
    done();
  });
});

/*
 Editor components cannot be used with React Hooks, as they need to be classes derived from BaseEditorComponent.
 */
