import { TestBed, ComponentFixture } from '@angular/core/testing';
import Handsontable from 'handsontable';
import { Component, EnvironmentInjector } from '@angular/core';
import { BaseEditorAdapter } from './base-editor-adapter';
import { CellProperties } from 'handsontable/settings';
import { HotCellEditorComponent } from './hot-cell-editor.component';

@Component({
  selector: 'hot-mock-custom-editor',
  template: '',
})
class CustomEditorComponent extends HotCellEditorComponent<number> {
  onFocus(): void {}
}

describe('BaseEditorAdapter', () => {
  let instance: Handsontable.Core;
  let adapter: BaseEditorAdapter;
  let customEditor: ComponentFixture<CustomEditorComponent>;

  const cellRect = {
    top: 0,
    start: 0,
    height: 0,
    width: 0,
    maxHeight: 0,
    maxWidth: 0,
  };

  beforeEach(() => {
    customEditor = TestBed.createComponent(CustomEditorComponent);
    const environmentInjector = TestBed.inject(EnvironmentInjector);
    const column = {
      editor: BaseEditorAdapter,
      _editorComponentReference: customEditor.componentRef,
      _environmentInjector: environmentInjector,
    };

    const settings = <Handsontable.GridSettings>{
      licenseKey: 'non-commercial-and-evaluation',
      columns: [column],
      data: [[1]],
    };

    instance = new Handsontable(document.createElement('div'), settings);

    jest.spyOn(instance, 'getColumnMeta').mockReturnValue(column);
    adapter = new BaseEditorAdapter(instance);

    jest.spyOn(adapter, 'getEditedCellRect').mockReturnValue(cellRect);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    instance.destroy();
    customEditor.destroy();
  });

  it('should create an instance', () => {
    expect(adapter).toBeDefined();
  });

  describe('hot table hooks', () => {
    it('should call setInput on custom editor when afterRowResize hook is triggered', () => {
      const setInputSpy = jest.spyOn(customEditor.componentRef, 'setInput');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});
      jest.spyOn(adapter, 'isOpened').mockReturnValue(true);

      instance.runHooks('afterRowResize');

      expect(setInputSpy).toHaveBeenCalledTimes(5);
    });

    it('should call setInput on custom editor when onAfterColumnResize hook is triggered', () => {
      const setInputSpy = jest.spyOn(customEditor.componentRef, 'setInput');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});
      jest.spyOn(adapter, 'isOpened').mockReturnValue(true);

      instance.runHooks('afterColumnResize');

      expect(setInputSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('prepare', () => {
    it('should call super.prepare when editor id not opened', () => {
      const superPrepareSpy = jest.spyOn(Handsontable.editors.BaseEditor.prototype, 'prepare');

      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      expect(superPrepareSpy).toHaveBeenCalled();
    });

    it('should not call super.prepare when editor id opened', () => {
      const superPrepareSpy = jest.spyOn(Handsontable.editors.BaseEditor.prototype, 'prepare');
      jest.spyOn(adapter, 'isOpened').mockReturnValue(true);

      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      expect(superPrepareSpy).not.toHaveBeenCalled();
    });

    it('should call hotInstance.rootElement append only once', () => {
      const appendChildSpy = jest.spyOn(instance.rootElement, 'appendChild');

      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});
      adapter.prepare(1, 1, 'prop', document.createElement('td'), 2, <CellProperties>{});

      expect(appendChildSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});
    });

    it('should call custom editor instance onClose', () => {
      const closeSpy = jest.spyOn(customEditor.componentInstance, 'onClose');
      jest.spyOn(adapter, 'isOpened').mockReturnValue(true);

      adapter.close();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not call custom editor instance onClose when editor is not opened', () => {
      const closeSpy = jest.spyOn(customEditor.componentInstance, 'onClose');

      adapter.close();

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    it('should call custom editor instance onFocus', () => {
      const focusSpy = jest.spyOn(customEditor.componentInstance, 'onFocus');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      adapter.focus();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('getValue', () => {
    it('should call custom editor instance getValue', () => {
      const getValueSpy = jest.spyOn(customEditor.componentInstance, 'getValue');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      adapter.getValue();

      expect(getValueSpy).toHaveBeenCalled();
    });
  });

  describe('open', () => {
    it('should set active context name to editor', () => {
      const setActiveContextNameSpy = jest.spyOn(instance.getShortcutManager(), 'setActiveContextName');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      adapter.open();

      expect(setActiveContextNameSpy).toHaveBeenCalledWith('editor');
    });

    it('should call custom editor instance onOpen', () => {
      const onOpenSpy = jest.spyOn(customEditor.componentInstance, 'onOpen');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      adapter.open();

      expect(onOpenSpy).toHaveBeenCalled();
    });

    it('should set values for custom editor inputs', () => {
      const setInputSpy = jest.spyOn(customEditor.componentRef, 'setInput');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      adapter.open();

      expect(setInputSpy).toHaveBeenCalledWith('originalValue', 1);
      expect(setInputSpy).toHaveBeenCalledWith('row', 0);
      expect(setInputSpy).toHaveBeenCalledWith('column', 0);
      expect(setInputSpy).toHaveBeenCalledWith('prop', 'prop');
      expect(setInputSpy).toHaveBeenCalledWith('cellProperties', {});
    });

    it('should call custom editor instance setValue when editor is not in full mode', () => {
      const setValueSpy = jest.spyOn(customEditor.componentInstance, 'setValue');
      jest.spyOn(adapter, 'isInFullEditMode').mockReturnValue(false);
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      adapter.open();

      expect(setValueSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('setValue', () => {
    it('should call custom editor instance setValue', () => {
      const setValueSpy = jest.spyOn(customEditor.componentInstance, 'setValue');
      const detectChangesSpy = jest.spyOn(customEditor.componentRef.changeDetectorRef, 'detectChanges');
      adapter.prepare(0, 0, 'prop', document.createElement('td'), 1, <CellProperties>{});

      adapter.setValue(2);

      expect(setValueSpy).toHaveBeenCalledWith(2);
      expect(detectChangesSpy).toHaveBeenCalledTimes(1);
    });
  });
});
