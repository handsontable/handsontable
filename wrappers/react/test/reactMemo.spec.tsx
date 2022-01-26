import React from 'react';
import {
  HotTable
} from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponent,
  sleep,
} from './_helpers';

const SPEC = {
  container: null
};

beforeEach(() => {
  let container = document.createElement('DIV');
  container.id = 'hotContainer';
  document.body.appendChild(container);

  SPEC.container = container;
});

afterEach(() => {
  const container = document.querySelector('#hotContainer');
  container.parentNode.removeChild(container);

  SPEC.container = null;
});

/**
 * Worth noting, that although it's possible to use React.memo on renderer components, it doesn't do much, as currently they're recreated on every
 * Handsontable's `render`.
 */
describe('React.memo', () => {
  it('should be possible to use React.memo on renderer components.', async () => {
    function RendererComponent2 (props) {
      return (
        <>
        value: {props.value}
        </>
      );
    }

    const MemoizedRendererComponent2 = React.memo(RendererComponent2);

    const hotInstance = mountComponent((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(1, 1)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <MemoizedRendererComponent2 hot-renderer/>
      </HotTable>
    ), SPEC.container).hotInstance;

    hotInstance.render();

    await sleep(100);

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>value: A1</div>');
  });

  /*
    Editors cannot use React.memo, as they're derived from the BaseEditorComponent class, thus not being function components.
   */
});
