import React from 'react';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import { registerAllModules } from 'handsontable/registry';
import {
  createSpreadsheetData,
  RendererComponent,
  mockElementDimensions,
  sleep,
  EditorComponent,
  simulateKeyboardEvent,
  simulateMouseEvent,
  mountComponentWithRef
} from './_helpers';

// register Handsontable's modules
registerAllModules();

describe('Passing column settings using HotColumn', () => {
  it('should apply the Handsontable settings passed as HotColumn arguments to the Handsontable instance', async () => {
    const hotInstance = mountComponentWithRef((
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        id="test-hot" data={[[2]]}
        readOnly={false}
      >
        <HotColumn title="test title"></HotColumn>
        <HotColumn readOnly={true}></HotColumn>
      </HotTable>
    )).hotInstance;

    expect(hotInstance.getSettings().columns[0].title).toEqual('test title');
    expect(hotInstance.getCellMeta(0, 0).readOnly).toEqual(false);

    expect(hotInstance.getSettings().columns[1].title).toEqual(void 0);
    expect(hotInstance.getCellMeta(0, 1).readOnly).toEqual(true);

    expect(hotInstance.getSettings().licenseKey).toEqual('non-commercial-and-evaluation');
  });

  it('should allow to use data option as a string', async () => {
    const dataKeyCellValue = 'Value of key1 in row 0';
    const hotInstance = mountComponentWithRef((
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        id="test-hot" data={[{ key1: dataKeyCellValue }]}
        readOnly={false}
      >
        <HotColumn data="key1"></HotColumn>
      </HotTable>
    )).hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual(dataKeyCellValue);
  });

  it('should apply column settings through the `settings` prop', async () => {
    const hotInstance = mountComponentWithRef((
      <HotTable
        licenseKey="non-commercial-and-evaluation"
        colHeaders={true}
      >
        <HotColumn settings={{ title: 'test', readOnly: true }}></HotColumn>
      </HotTable>
    )).hotInstance;

    expect(hotInstance.getCellMeta(0, 0).readOnly).toBe(true);
    expect(hotInstance.getCell(-1, 0).querySelector('span').innerHTML).toBe('test');
  });
});

describe('Renderer configuration using React components', () => {
  it('should use the renderer component as Handsontable renderer, when it\'s nested under HotColumn and assigned the \'hot-renderer\' attribute', async () => {
    const hotInstance = mountComponentWithRef((
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
          <RendererComponent hot-renderer></RendererComponent>
        </HotColumn>
      </HotTable>
    )).hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('A1');
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>value: B1</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      hotInstance.render();
    });

    await sleep(300);

    expect(hotInstance.getCell(99, 0).innerHTML).toEqual('A100');
    expect(hotInstance.getCell(99, 1).innerHTML).toEqual('<div>value: B100</div>');
  });
});

describe('Editor configuration using React components', () => {
  it('should use the editor component as Handsontable editor, when it\'s nested under HotTable and assigned the \'hot-editor\' attribute', async () => {
    const hotInstance = mountComponentWithRef((
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
          <EditorComponent hot-editor></EditorComponent>
        </HotColumn>
      </HotTable>
    )).hotInstance;

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

    hotInstance.getActiveEditor().close();

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });

  it('should be possible to reuse editor components between columns with different props passed to them', async () => {
    class ReusableEditor extends EditorComponent {
      prepare(row, col, prop, TD, originalValue, cellProperties): any {
        super.prepare(row, col, prop, TD, originalValue, cellProperties);

        this.mainElementRef.current.style.backgroundColor = this.props.background;
      }
    }

    const hotInstance = mountComponentWithRef((
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
          <ReusableEditor background='red' hot-editor></ReusableEditor>
        </HotColumn>
        <HotColumn>
          <ReusableEditor background='yellow' hot-editor></ReusableEditor>
        </HotColumn>
      </HotTable>
    )).hotInstance;

    await act(async () => {
      hotInstance.selectCell(0, 0);
    });

    expect((document.querySelectorAll('#editorComponentContainer')[0] as any).style.backgroundColor).toEqual('red');

    await act(async () => {
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor().editorComponent.mainElementRef.current.style.backgroundColor).toEqual('red');

    await act(async () => {
      hotInstance.getActiveEditor().close();
      hotInstance.selectCell(0, 1);
    });

    expect((document.querySelectorAll('#editorComponentContainer')[1] as any).style.backgroundColor).toEqual('yellow');

    await act(async () => {
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor().editorComponent.mainElementRef.current.style.backgroundColor).toEqual('yellow');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor().editorComponent.mainElementRef.current.style.backgroundColor).toEqual('red');

    hotInstance.getActiveEditor().close();
  });
});

describe('Dynamic HotColumn configuration changes', () => {
  it('should be possible to rearrange and change the column + editor + renderer configuration dynamically', async () => {
    function RendererComponent2(props) {
      return (
        <>r2: {props.value}</>
      );
    }

    class WrapperComponent extends React.Component<any, any> {
      constructor(props) {
        super(props);

        this.state = {
          setup: [
            <RendererComponent hot-renderer key={'1'}/>,
            <HotColumn title="test title" className="first-column-class-name" key={'2'}>
              <EditorComponent className="editor-className-1" id="editor-id-1" style={{background: 'red'}} hot-editor/>
            </HotColumn>,
            <HotColumn title="test title 2" key={'3'}>
              <RendererComponent2 hot-renderer></RendererComponent2>
            </HotColumn>
          ]
        }
      }

      render() {
        return (
          <HotTable licenseKey="non-commercial-and-evaluation" id="test-hot"
                    data={createSpreadsheetData(3, 2)}
                    width={300}
                    height={300}
                    rowHeights={23}
                    colWidths={50}
                    readOnly={false}
                    autoRowSize={false}
                    autoColumnSize={false}
                    init={function () {
                      mockElementDimensions(this.rootElement, 300, 300);
                    }}
                    ref={hotTableInstanceRef}>
            {this.state.setup}
          </HotTable>
        );
      };
    }

    let hotTableInstanceRef = React.createRef();

    const wrapperComponentInstance = mountComponentWithRef((
      <WrapperComponent/>
    ));

    let hotInstance = (hotTableInstanceRef.current as any).hotInstance;
    let editorElement = document.querySelector('#editorComponentContainer');

    expect(hotInstance.getSettings().columns[0].title).toEqual('test title');
    expect(hotInstance.getSettings().columns[0].className).toEqual('first-column-class-name');
    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>value: A1</div>');
    expect(hotInstance.getCell(1, 0).innerHTML).toEqual('<div>value: A2</div>');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      hotInstance.getActiveEditor().open();
    });

    expect(hotInstance.getActiveEditor().constructor.name).toEqual('CustomEditor');
    expect(hotInstance.getActiveEditor().editorComponent.__proto__.constructor.name).toEqual('EditorComponent');
    expect(editorElement.style.display).toEqual('block');
    expect(editorElement.parentNode.style.background).toEqual('red');
    expect(editorElement.parentNode.id).toEqual('editor-id-1');
    expect(editorElement.parentNode.className.includes('editor-className-1')).toBe(true);

    await act(async () => {
      hotInstance.getActiveEditor().close();
    });

    expect(hotInstance.getSettings().columns[1].title).toEqual('test title 2');
    expect(hotInstance.getSettings().columns[1].className).toEqual(void 0);
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>r2: B1</div>');
    expect(hotInstance.getCell(1, 1).innerHTML).toEqual('<div>r2: B2</div>');
    hotInstance.selectCell(0, 1);
    expect(hotInstance.getActiveEditor().constructor.name).toEqual('TextEditor');
    expect(hotInstance.getActiveEditor().editorComponent).toEqual(void 0);
    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async() => {
      wrapperComponentInstance.setState({
        setup: [
          <EditorComponent className="editor-className-2" id="editor-id-2" style={{background: 'blue'}} hot-editor key={'1'}/>,
          <HotColumn title="test title 2" key={'2'}>
            <RendererComponent2 hot-renderer></RendererComponent2>
          </HotColumn>,
          <HotColumn title="test title" className="first-column-class-name" key={'3'}>
            <RendererComponent hot-renderer/>
          </HotColumn>
        ]
      });
    });

    await sleep(100);

    editorElement = document.querySelector('#editorComponentContainer');

    expect(hotInstance.getSettings().columns[0].title).toEqual('test title 2');
    expect(hotInstance.getSettings().columns[0].className).toEqual(void 0);
    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>r2: A1</div>');
    expect(hotInstance.getCell(1, 0).innerHTML).toEqual('<div>r2: A2</div>');

    await act(async () => {
      hotInstance.selectCell(0, 0);
      hotInstance.getActiveEditor().open();
    });

    expect(hotInstance.getActiveEditor().constructor.name).toEqual('CustomEditor');
    expect(hotInstance.getActiveEditor().editorComponent.__proto__.constructor.name).toEqual('EditorComponent');
    expect(editorElement.style.display).toEqual('block');
    expect(editorElement.parentNode.style.background).toEqual('blue');
    expect(editorElement.parentNode.id).toEqual('editor-id-2');
    expect(editorElement.parentNode.className.includes('editor-className-2')).toBe(true);

    await act(async () => {
      hotInstance.getActiveEditor().close();
    });

    expect(hotInstance.getSettings().columns[1].title).toEqual('test title');
    expect(hotInstance.getSettings().columns[1].className).toEqual('first-column-class-name');
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>value: B1</div>');
    expect(hotInstance.getCell(1, 1).innerHTML).toEqual('<div>value: B2</div>');

    await act(async () => {
      hotInstance.selectCell(0, 1);
      hotInstance.getActiveEditor().open();
    });

    expect(hotInstance.getActiveEditor().constructor.name).toEqual('CustomEditor');
    expect(hotInstance.getActiveEditor().editorComponent.__proto__.constructor.name).toEqual('EditorComponent');
    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');

    await act(async () => {
      hotInstance.getActiveEditor().close();
    });

    expect(hotInstance.getSettings().licenseKey).toEqual('non-commercial-and-evaluation');
  });
});

describe('Miscellaneous scenarios with `HotColumn` config', () => {
  it('should validate all cells correctly in a `dropdown`-typed column after populating data through it', async () => {
    const onAfterValidate = jasmine.createSpy('warn');
    const hotInstance = mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                data={[['yellow'], ['white'], ['orange']]}
                afterValidate={onAfterValidate}
      >
        <HotColumn type="dropdown" source={['yellow', 'red', 'orange']}/>
      </HotTable>
    )).hotInstance;

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
