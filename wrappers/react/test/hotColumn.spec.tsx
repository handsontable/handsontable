import React from 'react';
import { act } from '@testing-library/react';
import Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  RendererComponent,
  mockElementDimensions,
  sleep,
  EditorComponent,
  simulateKeyboardEvent,
  simulateMouseEvent,
  mountComponentWithRef,
  customNativeRenderer,
  CustomNativeEditor,
  renderHotTableWithProps
} from './_helpers';
import {
  OBSOLETE_HOTEDITOR_WARNING,
  OBSOLETE_HOTRENDERER_WARNING,
  UNEXPECTED_HOTCOLUMN_CHILDREN_WARNING
} from '../src/helpers'
import { HotTableProps, HotTableRef, HotRendererProps } from '../src/types'

// register Handsontable's modules
registerAllModules();

describe('Passing column settings using HotColumn', () => {
  it('should apply the Handsontable settings passed as HotColumn arguments to the Handsontable instance', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        id="test-hot" data={[[2]]}
        readOnly={false}
      >
        <HotColumn title="test title"></HotColumn>
        <HotColumn readOnly={true}></HotColumn>
      </HotTable>
    )).hotInstance!;

    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[0].title).toEqual('test title');
    expect(hotInstance.getCellMeta(0, 0).readOnly).toEqual(false);

    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[1].title).toEqual(void 0);
    expect(hotInstance.getCellMeta(0, 1).readOnly).toEqual(true);

    expect(hotInstance.getSettings().licenseKey).toEqual('non-commercial-and-evaluation');
  });

  it('should allow to use data option as a string', async () => {
    const dataKeyCellValue = 'Value of key1 in row 0';
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        id="test-hot" data={[{ key1: dataKeyCellValue }]}
        readOnly={false}
      >
        <HotColumn data="key1"></HotColumn>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual(dataKeyCellValue);
  });
});

describe('Renderer configuration using React components', () => {
  it('should use the renderer component as Handsontable renderer, when it\'s passed as component to HotColumn renderer prop', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(100, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn renderer={RendererComponent}/>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('A1');
    expect(hotInstance.getCell(0, 1)!.innerHTML).toEqual('<div>value: B1</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      hotInstance.render();
    });

    await sleep(300);

    expect(hotInstance.getCell(99, 0)!.innerHTML).toEqual('A100');
    expect(hotInstance.getCell(99, 1)!.innerHTML).toEqual('<div>value: B100</div>');
  });

  it('should use the renderer component as Handsontable renderer, when it\'s passed inline to HotColumn renderer prop', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(100, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn renderer={(props) => <RendererComponent {...props} />}/>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('A1');
    expect(hotInstance.getCell(0, 1)!.innerHTML).toEqual('<div>value: B1</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      hotInstance.render();
    });

    await sleep(300);

    expect(hotInstance.getCell(99, 0)!.innerHTML).toEqual('A100');
    expect(hotInstance.getCell(99, 1)!.innerHTML).toEqual('<div>value: B100</div>');
  });

  it('should use the renderer function as native Handsontable renderer, when it\'s passed to HotColumn hotRenderer prop', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(100, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn hotRenderer={customNativeRenderer}/>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('A1');
    expect(hotInstance.getCell(0, 1)!.innerHTML).toEqual('value: B1');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      hotInstance.render();
    });

    await sleep(300);

    expect(hotInstance.getCell(99, 0)!.innerHTML).toEqual('A100');
    expect(hotInstance.getCell(99, 1)!.innerHTML).toEqual('value: B100');
  });

  it('should issue a warning when the renderer component is nested under HotColumn and assigned the \'hot-renderer\' attribute', async () => {
    console.warn = jasmine.createSpy('warn');

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(100, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn>
          {/* @ts-ignore */}
          <RendererComponent hot-renderer></RendererComponent>
        </HotColumn>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 1)!.innerHTML).not.toEqual('<div>value: B1</div>');

    expect(console.warn).toHaveBeenCalledWith(OBSOLETE_HOTRENDERER_WARNING);
  });
});

describe('Editor configuration using React components', () => {
  it('should use the editor component as Handsontable editor, when it\'s passed as component to HotColumn editor prop', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn editor={EditorComponent} />
      </HotTable>
    )).hotInstance!;

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async () => {
      hotInstance.selectCell(0, 1);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');
    expect(hotInstance.getDataAtCell(0, 1)).toEqual('B1');

    await act(async () => {
      simulateMouseEvent(document.querySelector('#editorComponentContainer button'), 'click');
    });

    expect(hotInstance.getDataAtCell(0, 1)).toEqual('new-value');

    hotInstance.getActiveEditor()!.close();

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });

  it('should use the editor component as Handsontable editor, when it\'s passed inline to HotColumn editor prop', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn editor={(props) => <EditorComponent {...props} />} />
      </HotTable>
    )).hotInstance!;

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async () => {
      hotInstance.selectCell(0, 1);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');
    expect(hotInstance.getDataAtCell(0, 1)).toEqual('B1');

    await act(async () => {
      simulateMouseEvent(document.querySelector('#editorComponentContainer button'), 'click');
    });

    expect(hotInstance.getDataAtCell(0, 1)).toEqual('new-value');

    hotInstance.getActiveEditor()!.close();

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });

  it('should use the editor class as native Handsontable editor, when it\'s passed to HotColumn hotEditor prop', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn/>
        <HotColumn hotEditor={CustomNativeEditor} />
      </HotTable>
    )).hotInstance!;

    await act(async () => {
      hotInstance.selectCell(0, 1);
      simulateKeyboardEvent('keydown', 13);
      (document.activeElement as HTMLInputElement).value = 'hello';
      hotInstance.getActiveEditor()!.finishEditing(false);
    });

    expect(hotInstance.getDataAtCell(0, 1)).toEqual('--hello--');
  });

  it('should be possible to reuse editor components between columns with different props passed to them', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <HotColumn editor={(props) => <EditorComponent background='red' {...props} />} />
        <HotColumn editor={(props) => <EditorComponent background='yellow' {...props} />} />
      </HotTable>
    )).hotInstance!;

    await act(async () => {
      hotInstance.selectCell(0, 0);
    });

    expect((document.querySelectorAll('#editorComponentContainer')[0] as any).style.backgroundColor).toEqual('red');

    await act(async () => {
      hotInstance.getActiveEditor()!.close();
      hotInstance.selectCell(0, 1);
    });

    expect((document.querySelectorAll('#editorComponentContainer')[1] as any).style.backgroundColor).toEqual('yellow');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelectorAll('#editorComponentContainer')[0] as any).style.backgroundColor).toEqual('red');

    hotInstance.getActiveEditor()!.close();
  });

  it('should issue a warning when the editor component is nested under HotColumn and assigned the \'hot-editor\' attribute', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponentWithRef<HotTableRef>((
        <HotTable licenseKey="non-commercial-and-evaluation"
                  id="test-hot"
                  data={createSpreadsheetData(3, 2)}
                  width={300}
                  height={300}
                  rowHeights={23}
                  colWidths={50}
                  init={function () {
                    mockElementDimensions(this.rootElement, 300, 300);
                  }}>
          <HotColumn/>
          <HotColumn>
            {/* @ts-ignore */}
            <EditorComponent hot-editor></EditorComponent>
          </HotColumn>
        </HotTable>
    ));

    expect(document.querySelector('#editorComponentContainer')).not.toBeTruthy();
    expect(console.warn).toHaveBeenCalledWith(OBSOLETE_HOTEDITOR_WARNING);
    expect(console.warn).not.toHaveBeenCalledWith(UNEXPECTED_HOTCOLUMN_CHILDREN_WARNING);
  });
});

describe('Dynamic HotColumn configuration changes', () => {
  it('should be possible to rearrange and change the column + editor + renderer configuration dynamically', async () => {
    function RendererComponent2(props: HotRendererProps) {
      return (
        <>r2: {props.value}</>
      );
    }

    const hotTableInstanceRef = React.createRef<HotTableRef>();

    const hotSettings: HotTableProps = {
      licenseKey: "non-commercial-and-evaluation",
      id: "test-hot",
      data: createSpreadsheetData(3, 2),
      width: 300,
      height: 300,
      rowHeights: 23,
      colWidths: 50,
      readOnly: false,
      autoRowSize: false,
      autoColumnSize: false,
      init: function () {
        mockElementDimensions(this.rootElement, 300, 300);
      },
      renderer: (props) => <RendererComponent {...props} key={'1'}/>,
      children: [
        <HotColumn title="test title" className="first-column-class-name" key={'2'}
                   editor={() => <EditorComponent className="editor-className-1" background='red' />} />,
        <HotColumn title="test title 2" key={'3'} renderer={RendererComponent2} />
      ]
    };

    renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);

    const hotInstance = hotTableInstanceRef.current!.hotInstance!;

    let editorElement = document.querySelector('#editorComponentContainer') as HTMLElement;

    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[0].title).toEqual('test title');
    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[0].className).toEqual('first-column-class-name');
    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>value: A1</div>');
    expect(hotInstance.getCell(1, 0)!.innerHTML).toEqual('<div>value: A2</div>');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      hotInstance.getActiveEditor()!.open();
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toEqual('CustomEditor');
    expect(editorElement.style.display).toEqual('block');
    expect(editorElement.style.background).toEqual('red');
    expect(editorElement.className.includes('editor-className-1')).toBe(true);

    await act(async () => {
      hotInstance.getActiveEditor()!.close();
    });

    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[1].title).toEqual('test title 2');
    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[1].className).toEqual(void 0);
    expect(hotInstance.getCell(0, 1)!.innerHTML).toEqual('<div>r2: B1</div>');
    expect(hotInstance.getCell(1, 1)!.innerHTML).toEqual('<div>r2: B2</div>');
    hotInstance.selectCell(0, 1);
    expect(hotInstance.getActiveEditor()!.constructor.name).toEqual('TextEditor');
    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    act(() => {
      hotSettings.editor = () => <EditorComponent className="editor-className-2" background='blue' key={'1'} />;
      hotSettings.children = [
        <HotColumn title="test title 2" key={'2'} renderer={RendererComponent2}/>,
        <HotColumn title="test title" className="first-column-class-name" key={'3'} renderer={RendererComponent}/>
      ];

      renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);
    });

    await sleep(100);

    editorElement = document.querySelector('#editorComponentContainer') as HTMLElement;

    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[0].title).toEqual('test title 2');
    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[0].className).toEqual(void 0);
    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>r2: A1</div>');
    expect(hotInstance.getCell(1, 0)!.innerHTML).toEqual('<div>r2: A2</div>');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      hotInstance.getActiveEditor()!.open();
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toEqual('CustomEditor');
    expect(editorElement.style.display).toEqual('block');
    expect(editorElement.style.background).toEqual('blue');
    expect(editorElement.className.includes('editor-className-2')).toBe(true);

    await act(async () => {
      hotInstance.getActiveEditor()!.close();
    });

    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[1].title).toEqual('test title');
    expect((hotInstance.getSettings().columns as Handsontable.ColumnSettings[])[1].className).toEqual('first-column-class-name');
    expect(hotInstance.getCell(0, 1)!.innerHTML).toEqual('<div>value: B1</div>');
    expect(hotInstance.getCell(1, 1)!.innerHTML).toEqual('<div>value: B2</div>');

    await act(async () => {
      hotInstance.selectCell(0, 1);
      hotInstance.getActiveEditor()!.open();
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toEqual('CustomEditor');
    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');

    await act(async () => {
      hotInstance.getActiveEditor()!.close();
    });

    expect(hotInstance.getSettings().licenseKey).toEqual('non-commercial-and-evaluation');
  });
});

describe('Miscellaneous scenarios with `HotColumn` config', () => {
  it('should validate all cells correctly in a `dropdown`-typed column after populating data through it', async () => {
    const onAfterValidate = jasmine.createSpy('warn');
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                data={[['yellow'], ['white'], ['orange']]}
                afterValidate={onAfterValidate}
      >
        <HotColumn type="dropdown" source={['yellow', 'red', 'orange']}/>
      </HotTable>
    )).hotInstance!;

    await act(async () => {
      hotInstance.populateFromArray(0, 0, [['test'], ['test2'], ['test3']]);
    });

    await sleep(300);

    expect(onAfterValidate).toHaveBeenCalledTimes(3);
    expect(onAfterValidate).toHaveBeenCalledWith(false, 'test3', 2, 0, 'populateFromArray');
    expect(onAfterValidate).toHaveBeenCalledWith(false, 'test2', 1, 0, 'populateFromArray');
    expect(onAfterValidate).toHaveBeenCalledWith(false, 'test', 0, 0, 'populateFromArray');
  });
});


describe('Passing children', () => {
  it('should issue a warning when anything is nested under HotColumn', async () => {
    console.warn = jasmine.createSpy('warn');

    mountComponentWithRef((
        <HotTable licenseKey="non-commercial-and-evaluation"
                  id="test-hot"
                  data={createSpreadsheetData(3, 2)}
                  width={300}
                  height={300}
                  rowHeights={23}
                  colWidths={50}
                  init={function () {
                    mockElementDimensions(this.rootElement, 300, 300);
                  }}>
          <HotColumn>
            <div>Something unexpected</div>
          </HotColumn>
        </HotTable>
    ));

    expect(console.warn).toHaveBeenCalledWith(UNEXPECTED_HOTCOLUMN_CHILDREN_WARNING);
  });
});
