import React from 'react';
import { act } from '@testing-library/react';
import {
  HotTable
} from '../src/hotTable';
import {
  createSpreadsheetData,
  RendererComponent,
  EditorComponent,
  mockElementDimensions,
  mountComponentWithRef,
  sleep,
  simulateKeyboardEvent,
  simulateMouseEvent
} from './_helpers';
import { HotTableRef } from '../src/types'

/**
 * Worth noting, that although it's possible to use React.memo on renderer components, it doesn't do much, as currently they're recreated on every
 * Handsontable's `render`.
 */
describe('React.memo', () => {
  it('should be possible to use React.memo on renderer components.', async () => {
    const MemoizedRendererComponent = React.memo(RendererComponent);

    const hotInstance = mountComponentWithRef<HotTableRef>((
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
                }}
                renderer={MemoizedRendererComponent}/>
    )).hotInstance!;

    await act(async () => {
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>value: A1</div>');
  });

  it('should be possible to use React.memo on editor components.', async () => {
    const MemoizedEditorComponent = React.memo(EditorComponent);

    const hotInstance = mountComponentWithRef<HotTableRef>((
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
                }}
                editor={MemoizedEditorComponent}/>
    )).hotInstance!;

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');
    expect(hotInstance.getDataAtCell(0, 0)).toEqual('A1');

    await act(async () => {
      simulateMouseEvent(document.querySelector('#editorComponentContainer button'), 'click');
    });

    expect(hotInstance.getDataAtCell(0, 0)).toEqual('new-value');

    await act(async () => {
      hotInstance.getActiveEditor()!.close();
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });
});
