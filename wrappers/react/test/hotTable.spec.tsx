import React from 'react';
import { act } from '@testing-library/react';
import {
  HotTable
} from '../src/hotTable';
import {
  createSpreadsheetData,
  IndividualPropsWrapper,
  mockElementDimensions,
  RendererComponent,
  EditorComponent,
  SingleObjectWrapper,
  sleep,
  simulateKeyboardEvent,
  simulateMouseEvent,
  mountComponent,
  mountComponentWithRef
} from './_helpers';

describe('Handsontable initialization', () => {
  it('should render Handsontable when using the HotTable component', async () => {
    const hotInstance = mountComponentWithRef((
      <HotTable
        id="test-hot"
        data={[[2]]}
        licenseKey="non-commercial-and-evaluation"
      />
    )).hotInstance;

    expect(hotInstance).not.toBe(null);
    expect(hotInstance).not.toBe(void 0);

    expect(hotInstance.rootElement.id).toEqual('test-hot');
  });

  it('should pass the provided properties to the Handsontable instance', async () => {
    const hotInstance = mountComponentWithRef((
      <HotTable
        id="test-hot"
        contextMenu={true}
        rowHeaders={true}
        colHeaders={true}
        data={[[2]]}
        licenseKey="non-commercial-and-evaluation"/>
    )).hotInstance;

    expect(hotInstance.rootElement.id).toBe('test-hot');
    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().rowHeaders).toBe(true);
    expect(hotInstance.getSettings().colHeaders).toBe(true);
    expect(JSON.stringify(hotInstance.getData())).toEqual('[[2]]');
  });
});

describe('Updating the Handsontable settings', () => {
  it('should call the updateSettings method of Handsontable, when the component properties get updated (when providing properties individually)', async () => {
    const componentInstance = mountComponentWithRef((
      <IndividualPropsWrapper/>
    ));

    const hotInstance = componentInstance.hotTable.hotInstance;
    let updateSettingsCount = 0;


    hotInstance.addHook('afterUpdateSettings', () => {
      updateSettingsCount++;
    });

    await sleep(300);

    await act(async () => {
      componentInstance.setState({
        hotSettings: {
          data: [[2]],
          contextMenu: true,
          readOnly: true
        }
      });
    });

    expect(updateSettingsCount).toEqual(1);
  });

  it('should call the updateSettings method of Handsontable, when the component properties get updated (when providing properties as a single settings object)', async () => {
    const componentInstance = mountComponentWithRef((
      <SingleObjectWrapper/>
    ));

    const hotInstance = componentInstance.hotTable.hotInstance;
    let updateSettingsCount = 0;

    hotInstance.addHook('afterUpdateSettings', () => {
      updateSettingsCount++;
    });

    await sleep(300);

    await act(async () => {
      componentInstance.setState({
        hotSettings: {
          data: [[2]],
          contextMenu: true,
          readOnly: true
        }
      });
    });

    expect(updateSettingsCount).toEqual(1);
  });

  it('should update the Handsontable options, when the component properties get updated (when providing properties individually)', async () => {
    const componentInstance = mountComponentWithRef((
      <IndividualPropsWrapper/>
    ));

    const hotInstance = componentInstance.hotTable.hotInstance;

    expect(hotInstance.getSettings().contextMenu).toEqual(void 0);
    expect(hotInstance.getSettings().readOnly).toEqual(false);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]]');

    await sleep(300);

    await act(async () => {
      componentInstance.setState({
        hotSettings: {
          data: [[2]],
          contextMenu: true,
          readOnly: true
        }
      });
    });

    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().readOnly).toBe(true);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[2]]');
  });

  it('should update the Handsontable options, when the component properties get updated (when providing properties as a single settings object)', async () => {
    const componentInstance = mountComponentWithRef((
      <SingleObjectWrapper/>
    ));

    const hotInstance = componentInstance.hotTable.hotInstance;

    expect(hotInstance.getSettings().contextMenu).toEqual(void 0);
    expect(hotInstance.getSettings().readOnly).toEqual(false);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null]]');

    await sleep(300);

    await act(async () => {
      componentInstance.setState({
        hotSettings: {
          data: [[2]],
          contextMenu: true,
          readOnly: true
        }
      });
    });

    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().readOnly).toBe(true);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[2]]');
  });

  it('should throw an error when trying to update init-only settings after inializing the component', async () => {
    console.error = jasmine.createSpy('error');

    let updateState = null;

    function ExampleComponent() {
      const [renderAllRows, setRenderAllRows] = React.useState(false);

      (updateState as any) = setRenderAllRows;

      return (
        <>
          <HotTable licenseKey="non-commercial-and-evaluation"
            id="test-hot"
            data={[[1]]}
            renderAllRows={renderAllRows}
          ></HotTable>
        </>
      )
    }

    mountComponent((
      <ExampleComponent/>
    ));

    const updateStateAndRender = () => act(() => (updateState as any)(true));

    await expect(updateStateAndRender).toThrowError(
      'The `renderAllRows` option can not be updated after the Handsontable is initialized.'
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('should NOT throw an error when trying to update settings after inializing the component if the other settings' +
  'contain init-only entries', async () => {
    console.error = jasmine.createSpy('error');

    let updateState = null;

    function ExampleComponent() {
      const [rowHeaders, setRowHeaders] = React.useState(false);

      (updateState as any) = setRowHeaders;

      return (
        <>
          <HotTable licenseKey="non-commercial-and-evaluation"
            id="test-hot"
            data={[[1]]}
            rowHeaders={rowHeaders}
            renderAllRows={true}
          ></HotTable>
        </>
      )
    }

    mountComponent((
      <ExampleComponent/>
    ));

    const updateStateAndRender = () => act(() => (updateState as any)(true));

    await expect(updateStateAndRender).not.toThrowError();

    expect(console.error).not.toHaveBeenCalled();
  });

  it('should NOT throw an error when definiting init-only settings, without updating them afterwards', async () => {
    console.error = jasmine.createSpy('error');

    function ExampleComponent() {
      return (
        <>
          <HotTable licenseKey="non-commercial-and-evaluation"
            id="test-hot"
            data={[[1]]}
            renderAllRows={true}
            renderAllColumns={true}
            ariaTags={true}
            layoutDirection={"rtl"}
          ></HotTable>
        </>
      )
    }

    mountComponent((
      <ExampleComponent/>
    ));

    expect(console.error).not.toHaveBeenCalled();
  });
});

describe('Renderer configuration using React components', () => {
  it('should use the renderer component as Handsontable renderer, when it\'s nested under HotTable and assigned the \'hot-renderer\' attribute', async () => {
    const hotInstance = mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(100, 100)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererComponent hot-renderer></RendererComponent>
      </HotTable>
    )).hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>value: A1</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      // For some reason it needs another render
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 1).innerHTML).toEqual('<div>value: B100</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 99,
      });
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 99).innerHTML).toEqual('<div>value: CV100</div>');
  });
});

describe('Editor configuration using React components', () => {
  it('should use the editor component as Handsontable editor and mount it in the root tree of the document', async () => {
    mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <EditorComponent hot-editor></EditorComponent>
      </HotTable>
    )).hotInstance;

    const editorElement = document.querySelector('#editorComponentContainer');

    expect(editorElement.parentElement.parentElement).toBe(document.body);
  });

  it('should use the editor component as Handsontable editor, when it\'s nested under HotTable and assigned the \'hot-editor\' attribute', async () => {
    const hotInstance = mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 3)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <EditorComponent hot-editor></EditorComponent>
      </HotTable>
    )).hotInstance;

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
      hotInstance.getActiveEditor().close();
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });

  it('should use the correct editor inside HotTable component depends on its mount state', async () => {
    let hotTableInstanceRef = React.createRef();

    class WrapperComponent extends React.Component<any, any> {
      state = {
        editor: false,
      }

      render() {
        return (
          <HotTable licenseKey="non-commercial-and-evaluation"
                    id="test-hot"
                    data={createSpreadsheetData(3, 3)}
                    width={300}
                    height={300}
                    rowHeights={23}
                    colWidths={50}
                    init={function () {
                      mockElementDimensions(this.rootElement, 300, 300);
                    }}
                    ref={hotTableInstanceRef}>
            {this.state.editor ? <EditorComponent hot-editor></EditorComponent> : null}
          </HotTable>
        );
      };
    }

    const wrapperComponentInstance = mountComponentWithRef((
      <WrapperComponent/>
    ));

    let hotInstance = (hotTableInstanceRef.current as any).hotInstance;

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeEditor = hotInstance.getActiveEditor();

      expect(activeEditor.constructor.name).toBe('TextEditor');

      activeEditor.close();
    }

    await act(async() => {
      wrapperComponentInstance.setState({ editor: true });
    });

    await sleep(100);

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeEditor = hotInstance.getActiveEditor();

      expect(activeEditor.constructor.name).toBe('CustomEditor');
      expect(activeEditor.editorComponent.__proto__.constructor.name).toBe('EditorComponent');

      activeEditor.close();
    }

    await act(async() => {
      wrapperComponentInstance.setState({ editor: false });
    });

    await sleep(100);

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeEditor = hotInstance.getActiveEditor();

      expect(activeEditor.constructor.name).toBe('TextEditor');

      activeEditor.close();
    }
  });

  it('should use the correct renderer inside HotTable component depends on its mount state', async () => {
    let hotTableInstanceRef = React.createRef();

    class WrapperComponent extends React.Component<any, any> {
      state = {
        renderer: false,
      }

      render() {
        return (
          <HotTable licenseKey="non-commercial-and-evaluation"
                    id="test-hot"
                    data={createSpreadsheetData(3, 3)}
                    width={300}
                    height={300}
                    rowHeights={23}
                    colWidths={50}
                    init={function () {
                      mockElementDimensions(this.rootElement, 300, 300);
                    }}
                    ref={hotTableInstanceRef}>
            {this.state.renderer ?  <RendererComponent hot-renderer /> : null}
          </HotTable>
        );
      };
    }

    const wrapperComponentInstance = mountComponentWithRef((
      <WrapperComponent/>
    ));

    let hotInstance = (hotTableInstanceRef.current as any).hotInstance;

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeRenderer = hotInstance.getCellRenderer(0, 0);

      expect(activeRenderer.name).toBe('textRenderer');
    }

    await act(async() => {
      wrapperComponentInstance.setState({ renderer: true });
    });

    await sleep(100);

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeRenderer = hotInstance.getCellRenderer(0, 0);

      expect(activeRenderer.name).toBe('__internalRenderer');
    }

    await act(async() => {
      wrapperComponentInstance.setState({ renderer: false });
    });

    await sleep(100);

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeRenderer = hotInstance.getCellRenderer(0, 0);

      expect(activeRenderer.name).toBe('textRenderer');
    }
  });
});

