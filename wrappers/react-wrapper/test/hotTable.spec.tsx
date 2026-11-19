import React from 'react';
import { act } from '@testing-library/react';
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { getCellType } from 'handsontable/cellTypes/registry';
import { getEditor } from 'handsontable/editors/registry';
import { getRenderer } from 'handsontable/renderers/registry';
import { HotTable } from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  RendererComponent,
  EditorComponent,
  ImmediateValueEditor,
  PointerCommitEditor,
  TextInputEditor,
  sleep,
  simulateKeyboardEvent,
  simulateMouseEvent,
  simulatePointerActivation,
  mountComponent,
  mountComponentWithRef,
  customNativeRenderer,
  CustomNativeEditor,
  renderHotTableWithProps
} from './_helpers';
import {
  OBSOLETE_HOTEDITOR_WARNING,
  OBSOLETE_HOTRENDERER_WARNING,
  UNEXPECTED_HOTTABLE_CHILDREN_WARNING
} from '../src/helpers';
import { HotTableProps, HotTableRef } from '../src/types';
import { HotColumn } from '../src/hotColumn';
import { TEST_LICENSE_KEY } from './licenseKey';

// register Handsontable's modules
registerAllModules();

describe('Handsontable initialization', () => {
  it('should render Handsontable when using the HotTable component', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable
        id="test-hot"
        data={[[2]]}
        licenseKey={TEST_LICENSE_KEY}
      />
    )).hotInstance!;

    expect(hotInstance as any).not.toBe(null);
    expect(hotInstance as any).not.toBe(undefined);

    expect(hotInstance.rootContainer.id).toEqual('test-hot');
  });

  it('should not throw when the `id` prop is added or removed across re-renders', async() => {
    // `useId()` must run unconditionally on every render (never only when `id` is
    // missing), or React sees a different hook count between renders and throws
    // "Rendered fewer hooks than expected".
    const hotTableRef = renderHotTableWithProps({
      id: 'test-hot',
      data: [[2]],
      licenseKey: TEST_LICENSE_KEY,
    });

    expect(() => {
      renderHotTableWithProps({
        data: [[2]],
        licenseKey: TEST_LICENSE_KEY,
      }, true, hotTableRef);
    }).not.toThrow();

    expect(hotTableRef.current!.hotInstance!.rootContainer.id).not.toEqual('');
  });

  it('should pass the provided properties to the Handsontable instance', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable
        id="test-hot"
        contextMenu={true}
        rowHeaders={true}
        colHeaders={true}
        data={[[2]]}
        licenseKey={TEST_LICENSE_KEY}/>
    )).hotInstance!;

    expect(hotInstance.rootContainer.id).toBe('test-hot');
    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().rowHeaders).toBe(true);
    expect(hotInstance.getSettings().colHeaders).toBe(true);
    expect(JSON.stringify(hotInstance.getData())).toEqual('[[2]]');
  });
});

describe('Updating the Handsontable settings', () => {
  it('should call the updateSettings method of Handsontable, when the component properties get updated', async() => {
    const hotSettings: HotTableProps = {
      licenseKey: TEST_LICENSE_KEY,
      id: 'hot',
      autoRowSize: false,
      autoColumnSize: false,
    };

    const hotTableRef = renderHotTableWithProps(hotSettings, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    let updateSettingsCount = 0;

    hotInstance.addHook('afterUpdateSettings', () => {
      updateSettingsCount += 1;
    });

    await sleep(300);

    act(() => {
      hotSettings.data = [[2]];
      hotSettings.contextMenu = true;
      hotSettings.readOnly = true;

      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    expect(updateSettingsCount).toEqual(1);
  });

  it('should update the Handsontable options, when the component properties get updated', async() => {
    const hotSettings: HotTableProps = {
      licenseKey: TEST_LICENSE_KEY,
      id: 'hot',
      autoRowSize: false,
      autoColumnSize: false,
    };

    const hotTableRef = renderHotTableWithProps(hotSettings, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    expect(hotInstance.getSettings().contextMenu).toEqual(undefined);
    expect(hotInstance.getSettings().readOnly).toEqual(false);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual(
      '[[null,null,null,null,null],[null,null,null,null,null],[null,null,null,null,null],' +
      '[null,null,null,null,null],[null,null,null,null,null]]'
    );

    await sleep(300);

    act(() => {
      hotSettings.data = [[2]];
      hotSettings.contextMenu = true;
      hotSettings.readOnly = true;

      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    expect(hotInstance.getSettings().contextMenu).toBe(true);
    expect(hotInstance.getSettings().readOnly).toBe(true);
    expect(JSON.stringify(hotInstance.getSettings().data)).toEqual('[[2]]');
  });

  it('should NOT throw an error when trying to update init-only settings after initializing the component', async() => {
    const errorMock = jest.fn();
    const originalError = console.error;

    console.error = (...args: unknown[]) => {
      const message = args[0];

      if (typeof message === 'string' && message.includes('Could not parse CSS stylesheet')) {
        return;
      }
      errorMock(...args);
    };

    let updateState = null;

    /**
     *
     */
    function ExampleComponent() {
      const [renderAllRows, setRenderAllRows] = React.useState(false);

      (updateState as any) = setRenderAllRows;

      return (
        <>
          <HotTable licenseKey={TEST_LICENSE_KEY}
            id="test-hot"
            data={[[1]]}
            renderAllRows={renderAllRows}
          ></HotTable>
        </>
      );
    }

    mountComponent((
      <ExampleComponent/>
    ));

    const updateStateAndRender = () => act(() => (updateState as any)(true));

    await expect(updateStateAndRender).not.toThrowError();

    expect(errorMock).not.toHaveBeenCalled();

    console.error = originalError;
  });

  it('should NOT throw an error when trying to update settings after inializing the component if the other settings' +
  'contain init-only entries', async() => {
    const errorMock = jest.fn();
    const originalError = console.error;

    // Filter out jsdom CSS parsing errors (jsdom doesn't support modern CSS features like light-dark())
    console.error = (...args: unknown[]) => {
      const message = args[0];

      if (typeof message === 'string' && message.includes('Could not parse CSS stylesheet')) {
        return;
      }
      errorMock(...args);
    };

    let updateState = null;

    /**
     *
     */
    function ExampleComponent() {
      const [rowHeaders, setRowHeaders] = React.useState(false);

      (updateState as any) = setRowHeaders;

      return (
        <>
          <HotTable licenseKey={TEST_LICENSE_KEY}
            id="test-hot"
            data={[[1]]}
            rowHeaders={rowHeaders}
            renderAllRows={true}
          ></HotTable>
        </>
      );
    }

    mountComponent((
      <ExampleComponent/>
    ));

    const updateStateAndRender = () => act(() => (updateState as any)(true));

    await expect(updateStateAndRender).not.toThrowError();

    expect(errorMock).not.toHaveBeenCalled();

    console.error = originalError;
  });

  it('should NOT throw an error when definiting init-only settings, without updating them afterwards', async() => {
    const errorMock = jest.fn();
    const originalError = console.error;

    // Filter out jsdom CSS parsing errors (jsdom doesn't support modern CSS features like light-dark())
    console.error = (...args: unknown[]) => {
      const message = args[0];

      if (typeof message === 'string' && message.includes('Could not parse CSS stylesheet')) {
        return;
      }
      errorMock(...args);
    };

    /**
     *
     */
    function ExampleComponent() {
      return (
        <>
          <HotTable licenseKey={TEST_LICENSE_KEY}
            id="test-hot"
            data={[[1]]}
            renderAllRows={true}
            renderAllColumns={true}
            ariaTags={true}
            layoutDirection={'rtl'}
          ></HotTable>
        </>
      );
    }

    mountComponent((
      <ExampleComponent/>
    ));

    expect(errorMock).not.toHaveBeenCalled();

    console.error = originalError;
  });

  it('should not pass equivalent `dataSchema` and `columns` during paste-triggered rerender', async() => {
    const afterValidate = jest.fn();
    const hotTableRef = React.createRef<HotTableRef>();

    /**
     *
     */
    function ExampleComponent() {
      const [, setTotalAmount] = React.useState(0);

      return (
        <HotTable
          ref={hotTableRef}
          dataSchema={{
            unit: 'EA',
            paymentDivision: '',
            unitQuantity: 0,
            unitPrice: 0,
            isSPV: 'false',
            paymentTerms: 'Immediate Payment (V000)',
          }}
          columns={[
            {
              data: 'paymentDivision',
              type: 'autocomplete',
              source: ['Development / Investment / Legal (D)', 'EPC (C)', 'SPV CAPEX (S)'],
              strict: true,
              allowInvalid: true,
            },
            {
              data: 'unitQuantity',
              type: 'numeric',
            },
            {
              data: 'unitPrice',
              type: 'numeric',
            },
          ]}
          afterValidate={afterValidate}
          afterChange={() => {
            const hotInstance = hotTableRef.current?.hotInstance;
            const totalAmount = hotInstance
              ?.getSourceData()
              .map((row: any) => row.unitPrice * row.unitQuantity)
              .reduce((a: number, b: number) => a + b, 0) || 0;

            setTotalAmount(totalAmount);
          }}
          licenseKey={TEST_LICENSE_KEY}
        />
      );
    }

    mountComponent(<ExampleComponent />);

    const hotInstance = hotTableRef.current!.hotInstance!;
    const updateSettingsSpy = jest.spyOn(hotInstance, 'updateSettings');

    await act(async() => {
      hotInstance.populateFromArray(0, 0, [['INVALID DIVISION', '2', '10']], undefined, undefined, 'CopyPaste.paste');
    });

    for (let i = 0; i < 10 && updateSettingsSpy.mock.calls.length === 0; i++) {
      await sleep(0);
    }

    expect(updateSettingsSpy).toHaveBeenCalled();

    expect(afterValidate).toHaveBeenCalledWith(false, 'INVALID DIVISION', 0, 'paymentDivision', 'CopyPaste.paste');
    expect(hotInstance.getDataAtCell(0, 0)).toBe('INVALID DIVISION');
    expect(hotInstance.getCell(0, 0)!.className).toContain('htInvalid');

    const callsFromWrapper = updateSettingsSpy.mock.calls
      .filter(([, init]) => init === false);

    expect(callsFromWrapper.length).toBeGreaterThan(0);
    callsFromWrapper.forEach(([settings]) => {
      expect(Object.prototype.hasOwnProperty.call(settings as object, 'dataSchema')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(settings as object, 'columns')).toBe(false);
    });

    updateSettingsSpy.mockRestore();
  });
});

describe('Renderer configuration using React components', () => {
  it('should use the renderer component as Handsontable renderer, when it\'s passed as component to HotTable renderer prop', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(100, 100)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        autoRowSize={false}
        autoColumnSize={false}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        renderer={RendererComponent}>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>value: A1</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      // For some reason it needs another render
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 1)!.innerHTML).toEqual('<div>value: B100</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 99,
      });
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 99)!.innerHTML).toEqual('<div>value: CV100</div>');
  });

  it('should use the renderer component as Handsontable renderer, when it\'s passed inline to HotTable renderer prop', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(100, 100)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        autoRowSize={false}
        autoColumnSize={false}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        renderer={props => <RendererComponent {...props} />}>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('<div>value: A1</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      // For some reason it needs another render
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 1)!.innerHTML).toEqual('<div>value: B100</div>');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 99,
      });
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 99)!.innerHTML).toEqual('<div>value: CV100</div>');
  });

  it('should use the renderer function as native Handsontable renderer, when it\'s passed to HotTable hotRenderer prop', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(100, 100)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        autoRowSize={false}
        autoColumnSize={false}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        hotRenderer={customNativeRenderer}>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).toEqual('value: A1');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 0,
      });
      // For some reason it needs another render
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 1)!.innerHTML).toEqual('value: B100');

    await act(async() => {
      hotInstance.scrollViewportTo({
        row: 99,
        col: 99,
      });
      hotInstance.render();
    });

    await sleep(100);

    expect(hotInstance.getCell(99, 99)!.innerHTML).toEqual('value: CV100');
  });

  it('should issue a warning when the renderer component is nested under HotTable and assigned the \'hot-renderer\' attribute', async() => {
    console.warn = jest.fn();

    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(100, 100)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        autoRowSize={false}
        autoColumnSize={false}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}>
        {/* @ts-expect-error `hot-renderer` is deliberately invalid: testing the obsolete-API warning. */}
        <RendererComponent hot-renderer></RendererComponent>
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCell(0, 0)!.innerHTML).not.toEqual('<div>value: A1</div>');

    expect(console.warn).toHaveBeenCalledWith(OBSOLETE_HOTRENDERER_WARNING);
  });
});

describe('Editor configuration using React components', () => {
  it('should mount the editor component inside the Handsontable root portal', async() => {
    const hotTableComponent = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        editor={EditorComponent} />
    ));

    const editorElement = document.querySelector('#editorComponentContainer')!;
    const portalHost = hotTableComponent.hotInstance!.rootPortalElement
      .querySelector('.hot-wrapper-editor-portal-host');

    expect(portalHost).not.toBeNull();
    expect(portalHost!.contains(editorElement)).toBe(true);
    expect(portalHost!.classList.contains('hot-wrapper-editor-container')).toBe(false);
  });

  it('should commit setValue after a real pointer sequence on the editor control', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        editor={PointerCommitEditor} />
    )).hotInstance!;

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getDataAtCell(0, 0)).toEqual('A1');

    await act(async() => {
      simulatePointerActivation(document.querySelector('#pointerCommitEditor button'));
    });

    expect(hotInstance.getDataAtCell(0, 0)).toEqual('new-value');
  });

  it('should not unlisten the grid when a pointer gesture lands in the editor\'s own input', async() => {
    // DEV-2787. The document `mouseup` verdict reads a focused plain `<input>` as a page input,
    // because ownership is decided by the `data-hot-input` stamp the grid puts on the inputs it
    // builds itself - and a component editor's field carries none. `unlisten()` blocks EVERY
    // `table`-scoped shortcut context (see the `handleEvent` callback in core), the `editor` one
    // included, so the editor's own Enter, Escape and Tab die with it.
    //
    // Counted through `afterUnlisten` rather than read from `isListening()` at the end of the
    // gesture: the focus scope manager re-listens on the `click` that follows the `mouseup`, so
    // the state has already healed itself by the time a full gesture returns. The hook is what
    // still sees the call - and a listener on it is the shape of user code this defect reaches.
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        editor={TextInputEditor} />
    )).hotInstance!;

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    // Scoped to the live instance's portal. A StrictMode remount leaves the previous editor portal
    // host behind on `document.body`, and a document-wide query can hit that stale copy instead.
    const field = hotInstance.rootPortalElement
      .querySelector('#textInputEditorField') as HTMLInputElement;

    expect(field).not.toBeNull();
    // A starting-state check, not an assertion about the fix (see the note below the gesture).
    expect(hotInstance.isListening()).toBe(true);

    let unlistenCount = 0;

    hotInstance.addHook('afterUnlisten', () => {
      unlistenCount += 1;
    });

    await act(async() => {
      simulatePointerActivation(field);
    });

    // The precondition the case rests on: without the focus actually sitting in the field, the
    // verdict never reaches the `isOutsideInput` branch and the case would pin nothing.
    expect(document.activeElement).toBe(field);

    // The count is what carries this case. The `isListening()` line below cannot: the gesture
    // ends in a `click`, and the focus scope manager re-listens on that, so it stays green even
    // when the `mouseup` unlistened. It is kept as an end-state sanity check only.
    expect(unlistenCount).toBe(0);
    expect(hotInstance.isListening()).toBe(true);
  });

  it('should update the hook value in the same turn as setValue', async() => {
    // Documents the public `useHotEditor().value` contract after dropping
    // `useDeferredValue`. This does not cover the GH-13374 commit path.
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        editor={ImmediateValueEditor} />
    )).hotInstance!;

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    await act(async() => {
      simulateMouseEvent(document.querySelector('#immediateValueSet'), 'click');
    });

    expect(document.querySelector('#immediateValueDisplay')!.textContent).toEqual('typed');
  });

  it('should not fire afterChange when a useHotEditor confirms a number or null without typing', async() => {
    const edits: unknown[] = [];
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={[[12345], [null]]}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        afterChange={(changes, source) => {
          if (source === 'edit') {
            edits.push(changes);
          }
        }}
        editor={ImmediateValueEditor} />
    )).hotInstance!;

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()!.isOpened()).toBe(true);

    await act(async() => {
      hotInstance.getActiveEditor()!.finishEditing(false);
    });

    expect(hotInstance.getActiveEditor()!.isOpened()).toBe(false);
    expect(edits).toEqual([]);
    expect(hotInstance.getDataAtCell(0, 0)).toBe(12345);

    await act(async() => {
      hotInstance.selectCell(1, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()!.isOpened()).toBe(true);

    await act(async() => {
      hotInstance.getActiveEditor()!.finishEditing(false);
    });

    expect(hotInstance.getActiveEditor()!.isOpened()).toBe(false);
    expect(edits).toEqual([]);
    expect(hotInstance.getDataAtCell(1, 0)).toBe(null);
  });

  it('should use the editor component as Handsontable editor, when it\'s passed as component to HotTable editor prop', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        editor={EditorComponent} />
    )).hotInstance!;

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');
    expect(hotInstance.getDataAtCell(0, 0)).toEqual('A1');

    await act(async() => {
      simulateMouseEvent(document.querySelector('#editorComponentContainer button'), 'click');
    });

    expect(hotInstance.getDataAtCell(0, 0)).toEqual('new-value');

    await act(async() => {
      hotInstance.getActiveEditor()!.close();
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });

  it('should use the editor component as Handsontable editor, when it\'s passed inline to HotTable editor prop', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        editor={() => <EditorComponent /> } />
    )).hotInstance!;

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('block');
    expect(hotInstance.getDataAtCell(0, 0)).toEqual('A1');

    await act(async() => {
      simulateMouseEvent(document.querySelector('#editorComponentContainer button'), 'click');
    });

    expect(hotInstance.getDataAtCell(0, 0)).toEqual('new-value');

    await act(async() => {
      hotInstance.getActiveEditor()!.close();
    });

    expect((document.querySelector('#editorComponentContainer') as any).style.display).toEqual('none');
  });

  it('should use the editor class as native Handsontable editor, when it\'s passed to HotTable hotEditor prop', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 3)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}
        hotEditor={CustomNativeEditor} />
    )).hotInstance!;

    await act(async() => {
      hotInstance.selectCell(0, 1);
      simulateKeyboardEvent('keydown', 13);
      (document.activeElement as HTMLInputElement).value = 'hello';
      hotInstance.getActiveEditor()!.finishEditing(false);
    });

    expect(hotInstance.getDataAtCell(0, 1)).toEqual('--hello--');
  });

  it('should use the correct editor inside HotTable component depends on its mount state', async() => {
    const hotTableInstanceRef = React.createRef<HotTableRef>();

    const hotSettings: HotTableProps = {
      licenseKey: TEST_LICENSE_KEY,
      id: 'test-hot',
      data: createSpreadsheetData(3, 3),
      width: 300,
      height: 300,
      minRowHeights: 23,
      colWidths: 50,
      init() {
        mockElementDimensions(this.rootElement, 300, 300);
      },
    };

    renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);

    const hotInstance = hotTableInstanceRef.current!.hotInstance!;

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeEditor = hotInstance.getActiveEditor()!;

      expect(activeEditor.constructor.name).toBe('TextEditor');

      activeEditor.close();
    }

    act(() => {
      hotSettings.editor = EditorComponent;
      renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);
    });

    await sleep(100);

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeEditor = hotInstance.getActiveEditor()!;

      expect(activeEditor.constructor.name).toBe('CustomEditor');

      activeEditor.close();
    }

    act(() => {
      hotSettings.editor = undefined;
      renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);
    });

    await sleep(100);

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeEditor = hotInstance.getActiveEditor()!;

      expect(activeEditor.constructor.name).toBe('TextEditor');

      activeEditor.close();
    }
  });

  it('should use the correct renderer inside HotTable component depends on its mount state', async() => {
    const hotTableInstanceRef = React.createRef<HotTableRef>();

    const hotSettings: HotTableProps = {
      licenseKey: TEST_LICENSE_KEY,
      id: 'test-hot',
      width: 300,
      height: 300,
      minRowHeights: 23,
      colWidths: 50,
      init() {
        mockElementDimensions(this.rootElement, 300, 300);
      },
    };

    renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);

    const hotInstance = hotTableInstanceRef.current!.hotInstance!;

    await act(async() => {
      hotInstance.selectCell(0, 0);
    });

    {
      const activeRenderer = hotInstance.getCellRenderer(0, 0);

      expect(activeRenderer.name).toBe('textRenderer');
    }

    act(() => {
      hotSettings.renderer = RendererComponent;
      renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);
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
      hotSettings.renderer = undefined;
      renderHotTableWithProps(hotSettings, false, hotTableInstanceRef);
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

  it('should issue a warning when the editor component is nested under HotTable and assigned the \'hot-editor\' attribute', async() => {
    console.warn = jest.fn();

    mountComponentWithRef((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}>
        <EditorComponent hot-editor></EditorComponent>
      </HotTable>
    ));

    expect(document.querySelector('#editorComponentContainer')).not.toBeTruthy();
    expect(console.warn).toHaveBeenCalledWith(OBSOLETE_HOTEDITOR_WARNING);
    expect(console.warn).not.toHaveBeenCalledWith(UNEXPECTED_HOTTABLE_CHILDREN_WARNING);
  });

  it('should disable editing when the HotTable `editor` prop is set to `false`', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        columns={[{}, { editor: 'text' }]}
        editor={false}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }} />
    )).hotInstance!;

    expect(hotInstance.getCellEditor(0, 0)).toBe(false);

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()).toBeUndefined();
    expect(hotInstance.getDataAtCell(0, 0)).toEqual('A1');

    // A column that names its own editor still overrides the disabled global one, which also proves
    // the test is not simply failing to open any editor at all.
    expect(hotInstance.getCellEditor(0, 1).EDITOR_TYPE).toBe('text');

    await act(async() => {
      hotInstance.selectCell(0, 1);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toBe('TextEditor');
  });

  it('should disable editing when the HotTable `hotEditor` prop is set to `false`', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        columns={[{}, { editor: 'text' }]}
        hotEditor={false}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }} />
    )).hotInstance!;

    expect(hotInstance.getCellEditor(0, 0)).toBe(false);

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()).toBeUndefined();
    expect(hotInstance.getDataAtCell(0, 0)).toEqual('A1');

    // Positive control, as above.
    expect(hotInstance.getCellEditor(0, 1).EDITOR_TYPE).toBe('text');

    await act(async() => {
      hotInstance.selectCell(0, 1);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toBe('TextEditor');
  });

  it('should apply and revert a dynamic switch of the `editor` prop to `false`', async() => {
    const hotTableRef = React.createRef<HotTableRef>();
    const hotSettings: HotTableProps = {
      licenseKey: TEST_LICENSE_KEY,
      id: 'test-hot',
      data: createSpreadsheetData(3, 2),
      width: 300,
      height: 300,
      minRowHeights: 23,
      colWidths: 50,
      autoRowSize: false,
      autoColumnSize: false,
      init() {
        mockElementDimensions(this.rootElement, 300, 300);
      },
    };

    renderHotTableWithProps(hotSettings, false, hotTableRef);

    const hotInstance = hotTableRef.current!.hotInstance!;

    expect(hotInstance.getCellEditor(0, 0).EDITOR_TYPE).toBe('text');

    await act(async() => {
      hotSettings.editor = false;
      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    expect(hotInstance.getCellEditor(0, 0)).toBe(false);

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()).toBeUndefined();

    // Dropping the prop brings the default editor back, so `false` does not stick.
    await act(async() => {
      delete hotSettings.editor;
      renderHotTableWithProps(hotSettings, false, hotTableRef);
    });

    expect(hotInstance.getCellEditor(0, 0).EDITOR_TYPE).toBe('text');
  });

  it('should let a `hotEditor` editor win over an `editor` prop set to `false`', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        editor={false}
        hotEditor={CustomNativeEditor}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }} />
    )).hotInstance!;

    // `editor={false}` only says "no component editor"; a native editor named alongside it still
    // applies, which is how every released version behaved.
    expect(hotInstance.getCellEditor(0, 0)).toBe(CustomNativeEditor);

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
      (document.activeElement as HTMLInputElement).value = 'hello';
      hotInstance.getActiveEditor()!.finishEditing(false);
    });

    expect(hotInstance.getDataAtCell(0, 0)).toEqual('--hello--');
  });

  it('should fall back to the default editor when the `editor` prop is set to `true`', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        editor={true}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }} />
    )).hotInstance!;

    // `true` carries no component to render, so it must resolve to the default editor rather than an
    // editor class with nothing behind it.
    expect(hotInstance.getCellEditor(0, 0).EDITOR_TYPE).toBe('text');

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toBe('TextEditor');
  });

  it('should fall back to the default editor when the `hotEditor` prop is set to `true`', async() => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        hotEditor={true}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }} />
    )).hotInstance!;

    // A bare `true` must never reach the core, which accepts only a string or a constructor and
    // throws on anything else.
    expect(hotInstance.getCellEditor(0, 0).EDITOR_TYPE).toBe('text');

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toBe('TextEditor');
  });

  it('should keep opening the editor passed by an `editor={condition && Editor}` prop', async() => {
    const withEditor = true;
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        editor={withEditor && EditorComponent}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }} />
    )).hotInstance!;

    // The common `condition && Editor` idiom passes the component itself while the condition holds,
    // so the editor it names must still open, exactly as before this change.
    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()!.constructor.name).toEqual('CustomEditor');
  });

  it('should disable editing when an `editor={condition && Editor}` prop resolves to `false`', async() => {
    const withEditor = false;
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        editor={withEditor && EditorComponent}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }} />
    )).hotInstance!;

    // Once the condition drops the component, the prop is a plain `false`, which is the documented
    // way to switch editing off.
    expect(hotInstance.getCellEditor(0, 0)).toBe(false);

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()).toBeUndefined();
    expect(hotInstance.getDataAtCell(0, 0)).toEqual('A1');
  });
});

describe('Passing children', () => {
  it('should not issue a warning when only HotColumn components are nested under HotTable', async() => {
    console.warn = jest.fn();

    mountComponentWithRef((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}>
        <HotColumn />
        <HotColumn />
      </HotTable>
    ));

    expect(console.warn).not.toHaveBeenCalledWith(UNEXPECTED_HOTTABLE_CHILDREN_WARNING);
  });

  it('should issue a warning when the unknown component is nested under HotTable', async() => {
    console.warn = jest.fn();

    mountComponentWithRef((
      <HotTable licenseKey={TEST_LICENSE_KEY}
        id="test-hot"
        data={createSpreadsheetData(3, 2)}
        width={300}
        height={300}
        minRowHeights={23}
        colWidths={50}
        init={function() {
          mockElementDimensions(this.rootElement, 300, 300);
        }}>
        <HotColumn />
        <div>Something unexpected</div>
      </HotTable>
    ));

    expect(console.warn).toHaveBeenCalledWith(UNEXPECTED_HOTTABLE_CHILDREN_WARNING);
  });
});

describe('Root size options', () => {
  /**
   * The size warnings printed so far. jsdom prints an unrelated theme-stylesheet warning per grid,
   * so the raw call count cannot be asserted.
   * @param spy
   */
  function sizeWarnings(spy: jest.SpyInstance): string[] {
    return spy.mock.calls
      .map(([message]) => message)
      .filter((message): message is string => typeof message === 'string')
      .filter(message => message.includes('cannot be read as a size'));
  }

  it('should write `height="auto"` as inline `height: auto` with no overflow', async() => {
    const hotTableRef = renderHotTableWithProps({
      data: createSpreadsheetData(3, 3),
      height: 'auto',
      licenseKey: TEST_LICENSE_KEY,
    });
    const { rootElement } = hotTableRef.current!.hotInstance!;

    expect(rootElement.style.height).toBe('auto');
    expect(rootElement.style.overflowX).toBe('');
    expect(rootElement.style.overflowY).toBe('');
  });

  it('should warn once for an unreadable size, even though every commit re-sends the same props', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const hotTableRef = renderHotTableWithProps({
      data: createSpreadsheetData(3, 3),
      height: 300,
      licenseKey: TEST_LICENSE_KEY,
    });

    const badProps: HotTableProps = {
      data: createSpreadsheetData(3, 3),
      height: 'abc',
      licenseKey: TEST_LICENSE_KEY,
    };

    renderHotTableWithProps(badProps, true, hotTableRef);
    renderHotTableWithProps(badProps, true, hotTableRef);
    renderHotTableWithProps(badProps, true, hotTableRef);

    const { rootElement } = hotTableRef.current!.hotInstance!;

    expect(rootElement.style.height).toBe('300px');
    expect(sizeWarnings(warnSpy)).toHaveLength(1);
    expect(sizeWarnings(warnSpy)[0]).toContain('"abc"');

    warnSpy.mockRestore();
  });
});

describe('Props set to `undefined`', () => {
  const baseProps: HotTableProps = {
    data: createSpreadsheetData(3, 3),
    licenseKey: TEST_LICENSE_KEY,
  };
  const pluginProps: Array<[keyof HotTableProps, string]> = [
    ['copyPaste', 'copyPaste'],
    ['fillHandle', 'autofill'],
    ['undo', 'undoRedo'],
    ['dragToScroll', 'dragToScroll'],
  ];

  it.each(pluginProps)('should keep `%s` on its default when the prop is `undefined` at init', (prop, plugin) => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, [prop]: undefined });
    const hot = hotTableRef.current!.hotInstance!;

    expect(hot.getPlugin(plugin as any).enabled).toBe(true);
  });

  it('should keep a default option value when the prop is `undefined` at init', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, allowInsertRow: undefined });

    expect(hotTableRef.current!.hotInstance!.getSettings().allowInsertRow).toBe(true);
  });

  it('should still apply `null` and `false` props', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, copyPaste: null as any, undo: false });
    const hot = hotTableRef.current!.hotInstance!;

    expect(hot.getPlugin('copyPaste').enabled).toBe(false);
    expect(hot.getPlugin('undoRedo').enabled).toBe(false);
  });

  it('should clear an option whose default is `undefined` when its prop changes to `undefined` on update', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, colWidths: 150 });
    const hot = hotTableRef.current!.hotInstance!;

    expect(hot.getSettings().colWidths).toBe(150);

    renderHotTableWithProps({ ...baseProps, colWidths: undefined }, true, hotTableRef);

    expect(hot.getSettings().colWidths).toBe(undefined);
  });

  it('should remove the root element\'s inline height and overflow when `height` changes to `undefined` on update', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, height: 120 });
    const { rootElement } = hotTableRef.current!.hotInstance!;

    expect(rootElement.style.height).toBe('120px');
    expect(rootElement.style.overflowY).toBe('clip');

    renderHotTableWithProps({ ...baseProps, height: undefined }, true, hotTableRef);

    expect(rootElement.style.height).toBe('');
    expect(rootElement.style.overflowX).toBe('');
    expect(rootElement.style.overflowY).toBe('');
  });

  it('should remove the root element\'s inline `height: auto` when `height` changes to `undefined` on update', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, height: 'auto' });
    const { rootElement } = hotTableRef.current!.hotInstance!;

    expect(rootElement.style.height).toBe('auto');

    renderHotTableWithProps({ ...baseProps, height: undefined }, true, hotTableRef);

    expect(rootElement.style.height).toBe('');
  });

  it('should remove the root element\'s inline width when `width` changes to `undefined` on update', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, width: 300 });
    const { rootElement } = hotTableRef.current!.hotInstance!;

    expect(rootElement.style.width).toBe('300px');

    renderHotTableWithProps({ ...baseProps, width: undefined }, true, hotTableRef);

    expect(rootElement.style.width).toBe('');
  });

  it('should clear only the axis whose prop changes to `undefined`, and apply a new value after the clear', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, height: 120, width: 300 });
    const { rootElement } = hotTableRef.current!.hotInstance!;

    renderHotTableWithProps({ ...baseProps, height: undefined, width: 300 }, true, hotTableRef);

    expect(rootElement.style.height).toBe('');
    expect(rootElement.style.width).toBe('300px');

    renderHotTableWithProps({ ...baseProps, height: 200, width: 300 }, true, hotTableRef);

    expect(rootElement.style.height).toBe('200px');
    expect(rootElement.style.width).toBe('300px');
  });

  it('should restore the default when a prop that had a value changes to `undefined` on update', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, copyPaste: false });
    const hot = hotTableRef.current!.hotInstance!;

    expect(hot.getPlugin('copyPaste').enabled).toBe(false);

    renderHotTableWithProps({ ...baseProps, copyPaste: undefined }, true, hotTableRef);

    expect(hot.getPlugin('copyPaste').enabled).toBe(true);
  });

  it('should keep a default when a prop stays `undefined` across updates', () => {
    const hotTableRef = renderHotTableWithProps({ ...baseProps, copyPaste: undefined });

    renderHotTableWithProps({ ...baseProps, copyPaste: undefined, width: 300 }, true, hotTableRef);

    expect(hotTableRef.current!.hotInstance!.getPlugin('copyPaste').enabled).toBe(true);
  });

  it('should keep the grid-level value when a `HotColumn` prop is `undefined`', () => {
    const hotTableRef = renderHotTableWithProps({
      ...baseProps,
      readOnly: true,
      children: [<HotColumn key="0" readOnly={undefined} />],
    } as HotTableProps);

    expect(hotTableRef.current!.hotInstance!.getCellMeta(0, 0).readOnly).toBe(true);
  });
});

describe('Removing a hook prop', () => {
  const data = [[1, 2], [3, 4]];
  const baseProps: HotTableProps = {
    data,
    licenseKey: TEST_LICENSE_KEY,
  };
  const editCell = (hotInstance: Handsontable, value: string) => {
    act(() => {
      hotInstance.setDataAtCell(0, 0, value);
    });
  };

  beforeEach(() => {
    data[0][0] = 1;
  });

  it('should stop running the callback when the hook prop is removed', async() => {
    const afterChange = jest.fn();
    const hotTableRef = renderHotTableWithProps({ ...baseProps, afterChange }, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    editCell(hotInstance, 'a');

    expect(afterChange).toHaveBeenCalledWith([[0, 0, 1, 'a']], 'edit');

    renderHotTableWithProps({ ...baseProps }, false, hotTableRef);
    editCell(hotInstance, 'b');

    expect(afterChange).not.toHaveBeenCalledWith([[0, 0, 'a', 'b']], 'edit');
    expect(hotInstance.getSettings().afterChange).toBe(null);
  });

  it('should stop running the callback when the hook prop becomes `undefined`', async() => {
    const afterChange = jest.fn();
    const hotTableRef = renderHotTableWithProps({ ...baseProps, afterChange }, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    renderHotTableWithProps({ ...baseProps, afterChange: undefined }, false, hotTableRef);
    editCell(hotInstance, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
    expect(hotInstance.getSettings().afterChange).toBe(null);
  });

  it('should stop running the callback when the hook prop becomes `null`', async() => {
    const afterChange = jest.fn();
    const hotTableRef = renderHotTableWithProps({ ...baseProps, afterChange }, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    renderHotTableWithProps({ ...baseProps, afterChange: null }, false, hotTableRef);
    editCell(hotInstance, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
  });

  it('should stop running the callback when the hook prop becomes `false`', async() => {
    const afterChange = jest.fn();
    const hotTableRef = renderHotTableWithProps({ ...baseProps, afterChange }, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    renderHotTableWithProps({ ...baseProps, afterChange: false as any }, false, hotTableRef);
    editCell(hotInstance, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
    expect(hotInstance.getSettings().afterChange).toBe(null);
  });

  it('should keep a callback added with `addHook()` when the hook prop is removed', async() => {
    const afterChange = jest.fn();
    const addedAfterChange = jest.fn();
    const hotTableRef = renderHotTableWithProps({ ...baseProps, afterChange }, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    hotInstance.addHook('afterChange', addedAfterChange);
    renderHotTableWithProps({ ...baseProps }, false, hotTableRef);
    editCell(hotInstance, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');
    expect(addedAfterChange).toHaveBeenCalledWith([[0, 0, 1, 'a']], 'edit');
  });

  it('should run the callback again when the hook prop is passed back', async() => {
    const afterChange = jest.fn();
    const hotTableRef = renderHotTableWithProps({ ...baseProps, afterChange }, false);
    const hotInstance = hotTableRef.current!.hotInstance!;

    renderHotTableWithProps({ ...baseProps }, false, hotTableRef);
    editCell(hotInstance, 'a');

    expect(afterChange).not.toHaveBeenCalledWith(expect.anything(), 'edit');

    renderHotTableWithProps({ ...baseProps, afterChange }, false, hotTableRef);
    editCell(hotInstance, 'b');

    expect(afterChange.mock.calls.filter(([, source]) => source === 'edit'))
      .toEqual([[[[0, 0, 'a', 'b']], 'edit']]);
  });

  describe('with a hook the app registered', () => {
    afterEach(() => {
      Handsontable.hooks.deregister('myHook');
    });

    it('should stop running the callback when the hook prop is removed', async() => {
      Handsontable.hooks.register('myHook');

      const myHook = jest.fn();
      const hotTableRef = renderHotTableWithProps({ ...baseProps, myHook }, false);
      const hotInstance = hotTableRef.current!.hotInstance!;

      hotInstance.runHooks('myHook');

      expect(myHook).toHaveBeenCalledTimes(1);

      renderHotTableWithProps({ ...baseProps }, false, hotTableRef);
      hotInstance.runHooks('myHook');

      expect(myHook).toHaveBeenCalledTimes(1);
      expect(hotInstance.getSettings().myHook).toBe(null);
    });
  });
});

describe('Grid-level cell type', () => {
  function gridProps(props: HotTableProps = {}): HotTableProps {
    return {
      licenseKey: TEST_LICENSE_KEY,
      id: 'test-hot',
      data: [['A', true], ['B', false]],
      width: 300,
      height: 300,
      minRowHeights: 23,
      colWidths: 50,
      autoRowSize: false,
      autoColumnSize: false,
      init() {
        mockElementDimensions(this.rootElement, 300, 300);
      },
      ...props,
    };
  }

  function render(props: HotTableProps, ref: React.RefObject<HotTableRef>): Handsontable {
    renderHotTableWithProps(props, false, ref);

    return ref.current!.hotInstance!;
  }

  it.each([
    ['dropdown', { source: ['A', 'B'] }],
    ['autocomplete', { source: ['A', 'B'] }],
    ['date', { data: [['2026-01-01', true], ['2026-01-02', false]] }],
    ['checkbox', {}],
  ])('should give every cell the editor and renderer of the `%s` type set on HotTable', (type, extra) => {
    const hotInstance = render(gridProps({ type, ...extra }), React.createRef<HotTableRef>());
    const cellType = getCellType(type);

    expect(hotInstance.getCellEditor(0, 0)).toBe(cellType.editor);
    expect(hotInstance.getCellRenderer(0, 0)).toBe(cellType.renderer);
    expect(hotInstance.getCellEditor(1, 1)).toBe(cellType.editor);
    expect(hotInstance.getCellRenderer(1, 1)).toBe(cellType.renderer);
  });

  it('should draw the dropdown arrow for a `dropdown` type set on HotTable', () => {
    const hotInstance = render(gridProps({ type: 'dropdown', source: ['A', 'B'] }), React.createRef<HotTableRef>());

    expect(hotInstance.getCell(0, 0)!.querySelector('.htAutocompleteArrow')).not.toBeNull();
  });

  it('should keep the type\'s editor and renderer after a re-render with another prop changed', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps({ type: 'dropdown', source: ['A', 'B'] });

    render(props, ref);
    const hotInstance = render({ ...props, colWidths: 60 }, ref);

    expect(hotInstance.getSettings().colWidths).toBe(60);
    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('dropdown'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('dropdown'));
  });

  it('should let the editor and renderer props win over the type', () => {
    const hotInstance = render(gridProps({
      type: 'dropdown',
      source: ['A', 'B'],
      hotEditor: 'password',
      hotRenderer: customNativeRenderer,
    }), React.createRef<HotTableRef>());

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('password'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(customNativeRenderer);
  });

  it('should let a component editor and a component renderer win over the type', () => {
    const hotInstance = render(gridProps({
      type: 'dropdown',
      source: ['A', 'B'],
      editor: EditorComponent,
      renderer: RendererComponent,
    }), React.createRef<HotTableRef>());

    expect(hotInstance.getCellEditor(0, 0).name).toBe('CustomEditor');
    expect(hotInstance.getCellRenderer(0, 0).name).toBe('__internalRenderer');
  });

  it('should give the type\'s editor and renderer to a grid mounted in StrictMode', () => {
    const hotInstance = renderHotTableWithProps(
      gridProps({ type: 'dropdown', source: ['A', 'B'] }),
      true,
      React.createRef<HotTableRef>()
    ).current!.hotInstance!;

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('dropdown'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('dropdown'));
  });

  it('should keep editing disabled with `editor={false}` and the type\'s renderer', () => {
    const hotInstance = render(
      gridProps({ type: 'dropdown', source: ['A', 'B'], editor: false }),
      React.createRef<HotTableRef>()
    );

    expect(hotInstance.getCellEditor(0, 0)).toBe(false);
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('dropdown'));
  });

  it('should go back to the type\'s editor and renderer when the editor and renderer props are removed', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps({ type: 'dropdown', source: ['A', 'B'] });

    render(props, ref);
    render({ ...props, editor: EditorComponent, renderer: RendererComponent }, ref);
    let hotInstance = render(props, ref);

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('dropdown'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('dropdown'));

    render({ ...props, editor: false, hotRenderer: customNativeRenderer }, ref);
    expect(ref.current!.hotInstance!.getCellEditor(0, 0)).toBe(false);

    hotInstance = render(props, ref);

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('dropdown'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('dropdown'));
  });

  it('should go back to the type\'s editor when an editor named by `hotEditor` or by `editor` is removed', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps({ type: 'dropdown', source: ['A', 'B'] });

    render(props, ref);
    render({ ...props, hotEditor: 'password' }, ref);
    expect(ref.current!.hotInstance!.getCellEditor(0, 0)).toBe(getEditor('password'));

    expect(render(props, ref).getCellEditor(0, 0)).toBe(getEditor('dropdown'));

    render({ ...props, editor: 'password' as unknown as HotTableProps['editor'] }, ref);
    expect(ref.current!.hotInstance!.getCellEditor(0, 0)).toBe(getEditor('password'));

    expect(render(props, ref).getCellEditor(0, 0)).toBe(getEditor('dropdown'));
  });

  it('should go back to the editor and renderer of a cell type object when the props are removed', () => {
    const ref = React.createRef<HotTableRef>();
    const cellType = { editor: getEditor('checkbox'), renderer: getRenderer('checkbox') };
    const props = gridProps({ type: cellType as unknown as HotTableProps['type'] });

    expect(render(props, ref).getCellEditor(0, 0)).toBe(getEditor('checkbox'));

    render({ ...props, hotEditor: 'password', hotRenderer: customNativeRenderer }, ref);
    const hotInstance = render(props, ref);

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('checkbox'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('checkbox'));
  });

  it('should apply the new type when one commit removes the props and changes `type`', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps({ type: 'dropdown', source: ['A', 'B'] });

    render({ ...props, hotEditor: 'password', hotRenderer: customNativeRenderer }, ref);
    const hotInstance = render({ ...props, type: 'checkbox' }, ref);

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('checkbox'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('checkbox'));
  });

  it('should keep the current type when one commit removes the props and sets an unregistered `type`', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps({ type: 'dropdown', source: ['A', 'B'] });

    render({ ...props, hotEditor: 'password', hotRenderer: customNativeRenderer }, ref);

    expect(() => render({ ...props, type: 'notRegisteredType' }, ref)).not.toThrow();

    const hotInstance = ref.current!.hotInstance!;

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('dropdown'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('dropdown'));
  });

  it('should apply a `type` changed after mount', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps({ type: 'dropdown', source: ['A', 'B'] });

    render(props, ref);
    const hotInstance = render({ ...props, type: 'checkbox' }, ref);

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('checkbox'));
    expect(hotInstance.getCellRenderer(0, 0)).toBe(getRenderer('checkbox'));
  });

  it('should supply the editor of the current `type` when the editor prop is removed after `type` changed', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps({ type: 'numeric' });

    render({ ...props, hotEditor: 'password' }, ref);
    render({ ...props, type: 'dropdown', source: ['A', 'B'], hotEditor: 'password' }, ref);

    const hotInstance = render({ ...props, type: 'dropdown', source: ['A', 'B'] }, ref);

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('dropdown'));
  });

  it('should keep the text editor and renderer on a grid with no type', () => {
    const ref = React.createRef<HotTableRef>();
    const props = gridProps();
    let hotInstance = render(props, ref);

    expect(hotInstance.getSettings().editor).toBe(getEditor('text'));
    expect(hotInstance.getSettings().renderer).toBe(getRenderer('text'));

    render({ ...props, hotEditor: 'password', hotRenderer: customNativeRenderer }, ref);
    hotInstance = render(props, ref);

    expect(hotInstance.getSettings().editor).toBe(getEditor('text'));
    expect(hotInstance.getSettings().renderer).toBe(getRenderer('text'));
  });

  it('should keep the type of a HotColumn over the type set on HotTable', () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable {...gridProps({ type: 'dropdown', source: ['A', 'B'] })}>
        <HotColumn />
        <HotColumn type="checkbox" />
      </HotTable>
    )).hotInstance!;

    expect(hotInstance.getCellEditor(0, 0)).toBe(getEditor('dropdown'));
    expect(hotInstance.getCellEditor(0, 1)).toBe(getEditor('checkbox'));
    expect(hotInstance.getCellRenderer(0, 1)).toBe(getRenderer('checkbox'));
  });
});
