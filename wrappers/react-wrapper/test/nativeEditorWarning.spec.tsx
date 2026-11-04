import React, { forwardRef, lazy, memo } from 'react';
import { act } from '@testing-library/react';
import Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  CustomNativeEditor,
  EditorComponent,
  mockElementDimensions,
  mountComponentWithRef,
  simulateKeyboardEvent,
} from './_helpers';
import { HotTableProps, HotTableRef } from '../src/types';
import { isNativeEditor, NATIVE_EDITOR_IN_EDITOR_PROP_WARNING } from '../src/helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

// The one-time warning is remembered per value for the whole file, so each test that expects a
// warning creates its own class.
function createEditorClass() {
  return class WrappingEditor extends Handsontable.editors.TextEditor {
    getValue() {
      return `--${super.getValue()}--`;
    }
  };
}

function mountGrid(props: HotTableProps): HotTableRef {
  return mountComponentWithRef<HotTableRef>((
    <HotTable
      licenseKey={TEST_LICENSE_KEY}
      id="test-hot"
      data={createSpreadsheetData(2, 2)}
      width={300}
      height={300}
      minRowHeights={23}
      colWidths={50}
      autoRowSize={false}
      autoColumnSize={false}
      init={function() {
        mockElementDimensions(this.rootElement, 300, 300);
      }}
      {...props}
    />
  ));
}

function nativeEditorWarningCalls(warnSpy: jest.SpyInstance): unknown[][] {
  return warnSpy.mock.calls.filter(args => args[0] === NATIVE_EDITOR_IN_EDITOR_PROP_WARNING);
}

describe('Handsontable editor passed to the React editor prop', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should warn once and use an editor class passed to the HotTable editor prop', async() => {
    const EditorClass = createEditorClass();
    const hotRef = mountGrid({ editor: EditorClass as any });
    const hotInstance = hotRef.hotInstance!;

    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(1);
    expect(hotInstance.getCellEditor(0, 0)).toBe(EditorClass);

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()).toBeInstanceOf(EditorClass);

    await act(async() => {
      (document.activeElement as HTMLTextAreaElement).value = 'hello';
      hotInstance.getActiveEditor()!.finishEditing(false);
    });

    expect(hotInstance.getDataAtCell(0, 0)).toEqual('--hello--');
  });

  it('should warn once and use an editor name passed to the HotTable editor prop', async() => {
    const hotInstance = mountGrid({ editor: 'numeric' as any }).hotInstance!;

    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(1);
    expect(hotInstance.getCellEditor(0, 0)).toBe(Handsontable.editors.NumericEditor);
    expect(document.querySelector('numeric')).toBeNull();
  });

  it('should warn once and use a built-in editor class passed to the HotColumn editor prop', async() => {
    const hotInstance = mountGrid({
      children: [
        <HotColumn key="0" />,
        <HotColumn key="1" editor={Handsontable.editors.NumericEditor as any} />,
      ],
    }).hotInstance!;

    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(1);
    expect(hotInstance.getCellEditor(0, 1)).toBe(Handsontable.editors.NumericEditor);
    expect(hotInstance.getCellEditor(0, 0)).toBe(Handsontable.editors.TextEditor);

    await act(async() => {
      hotInstance.selectCell(0, 1);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()).toBeInstanceOf(Handsontable.editors.NumericEditor);
  });

  it('should warn once and use an editor name passed to the HotColumn editor prop', async() => {
    const hotInstance = mountGrid({
      children: [
        <HotColumn key="0" editor={'dropdown' as any} />,
        <HotColumn key="1" />,
      ],
    }).hotInstance!;

    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(1);
    expect(hotInstance.getCellEditor(0, 0)).toBe(Handsontable.editors.DropdownEditor);
    expect(document.querySelector('dropdown')).toBeNull();
  });

  it('should warn once and keep the inherited editor when an unregistered name is passed to the editor prop', async() => {
    const hotInstance = mountGrid({
      children: [
        <HotColumn key="0" editor={'Numeric' as any} />,
        <HotColumn key="1" />,
      ],
    }).hotInstance!;

    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(1);
    expect(hotInstance.getCellEditor(0, 0)).toBe(Handsontable.editors.TextEditor);
    expect(document.querySelector('numeric')).toBeNull();

    await act(async() => {
      hotInstance.selectCell(0, 0);
      simulateKeyboardEvent('keydown', 13);
    });

    expect(hotInstance.getActiveEditor()).toBeInstanceOf(Handsontable.editors.TextEditor);
  });

  it('should let an editor named in hotEditor win over an editor class in the editor prop', async() => {
    const EditorClass = createEditorClass();
    const hotInstance = mountGrid({
      children: [
        <HotColumn key="0" editor={EditorClass as any} hotEditor={CustomNativeEditor} />,
        <HotColumn key="1" editor={createEditorClass() as any} hotEditor={false} />,
      ],
    }).hotInstance!;

    expect(hotInstance.getCellEditor(0, 0)).toBe(CustomNativeEditor);
    expect(hotInstance.getCellEditor(0, 1)).toBe(false);
    // `hotEditor` already holds the right value, so the stray `editor` value is ignored silently.
    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(0);
  });

  it('should let an editor named in the HotTable hotEditor prop win over an editor class in its editor prop', async() => {
    const hotInstance = mountGrid({
      editor: createEditorClass() as any,
      hotEditor: CustomNativeEditor,
    }).hotInstance!;

    expect(hotInstance.getCellEditor(0, 0)).toBe(CustomNativeEditor);
    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(0);
  });

  it('should not warn when a React editor component is passed to the editor prop', async() => {
    const hotInstance = mountGrid({
      children: [
        <HotColumn key="0" editor={EditorComponent} />,
        <HotColumn key="1" editor={memo(EditorComponent)} />,
      ],
    }).hotInstance!;

    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(0);
    expect(hotInstance.getCellEditor(0, 0)).not.toBe(Handsontable.editors.TextEditor);
    expect(document.querySelector('#editorComponentContainer')).not.toBeNull();
  });

  it('should not warn when an editor class is passed to hotEditor', async() => {
    const EditorClass = createEditorClass();
    const hotInstance = mountGrid({ hotEditor: EditorClass }).hotInstance!;

    expect(nativeEditorWarningCalls(warnSpy)).toHaveLength(0);
    expect(hotInstance.getCellEditor(0, 0)).toBe(EditorClass);
  });
});

describe('isNativeEditor', () => {
  it('should detect editor classes and editor names', () => {
    expect(isNativeEditor(Handsontable.editors.TextEditor)).toBe(true);
    expect(isNativeEditor(Handsontable.editors.BaseEditor)).toBe(true);
    expect(isNativeEditor(createEditorClass())).toBe(true);
    expect(isNativeEditor('numeric')).toBe(true);
  });

  it('should detect an editor class by its methods, not by its base class', () => {
    // Stands in for a class built on another copy of Handsontable.
    class ForeignEditor {
      prepare() {}
      beginEditing() {}
      getValue() {}
      setValue() {}
      open() {}
      close() {}
    }

    expect(isNativeEditor(ForeignEditor)).toBe(true);
    expect(isNativeEditor(Handsontable.editors.TextEditor.prototype.extend())).toBe(true);
  });

  it('should not detect React components or flags', () => {
    class ClassComponent extends React.Component {
      render() {
        return null;
      }
    }
    function FunctionComponent() {
      return null;
    }
    const ArrowComponent = () => null;

    // A class component with editor-like methods, as in the old `BaseEditorComponent` pattern.
    class EditorLikeClassComponent extends React.Component {
      prepare() {}
      beginEditing() {}
      getValue() {}
      setValue() {}
      open() {}
      close() {}
      render() {
        return null;
      }
    }
    class PartialEditor {
      getValue() {}
      setValue() {}
      open() {}
      close() {}
    }
    const StaticMethodsComponent = Object.assign(() => null, { open() {}, close() {} });

    expect(isNativeEditor(ClassComponent)).toBe(false);
    expect(isNativeEditor(FunctionComponent)).toBe(false);
    expect(isNativeEditor(ArrowComponent)).toBe(false);
    expect(isNativeEditor(memo(ArrowComponent))).toBe(false);
    expect(isNativeEditor(forwardRef(() => null))).toBe(false);
    expect(isNativeEditor(lazy(() => Promise.resolve({ default: ArrowComponent })))).toBe(false);
    expect(isNativeEditor(EditorLikeClassComponent)).toBe(false);
    expect(isNativeEditor(PartialEditor)).toBe(false);
    expect(isNativeEditor(class {})).toBe(false);
    expect(isNativeEditor(StaticMethodsComponent)).toBe(false);
    expect(isNativeEditor(true)).toBe(false);
    expect(isNativeEditor(false)).toBe(false);
    expect(isNativeEditor(undefined)).toBe(false);
    expect(isNativeEditor('')).toBe(false);
  });
});
