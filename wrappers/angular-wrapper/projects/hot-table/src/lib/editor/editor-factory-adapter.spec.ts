import { TestBed, ComponentFixture } from '@angular/core/testing';
import Handsontable from 'handsontable';
import { Component, EnvironmentInjector } from '@angular/core';
import { FactoryEditorAdapter } from './editor-factory-adapter';
import { HotCellEditorAdvancedComponent } from './hot-cell-editor-advanced.component';

@Component({
  selector: 'hot-mock-custom-editor',
  template: '<input />',
  standalone: true,
})
class CustomEditorComponent extends HotCellEditorAdvancedComponent<number> {
  onFocus(): void {}
}

describe('FactoryEditorAdapter', () => {
  let instance: Handsontable.Core;
  let customEditor: ComponentFixture<CustomEditorComponent>;
  let adapter: any;

  beforeEach(() => {
    customEditor = TestBed.createComponent(CustomEditorComponent);
    const environmentInjector = TestBed.inject(EnvironmentInjector);

    const EditorClass = FactoryEditorAdapter(customEditor.componentRef);

    const settings = <Handsontable.GridSettings>{
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ editor: EditorClass }],
      data: [[1]],
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    instance = new Handsontable(container, settings);
    (instance as any)._angularEnvironmentInjector = environmentInjector;

    instance.selectCell(0, 0);
    instance.getActiveEditor().beginEditing();
    adapter = instance.getActiveEditor();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (instance) {
      instance.destroy();
    }
    if (customEditor) {
      customEditor.destroy();
    }
  });

  it('should create an instance', () => {
    expect(adapter).toBeDefined();
  });

  describe('init', () => {
    it('should initialize editor with component references', () => {
      expect(adapter._componentRef).toBeDefined();
      expect(adapter._editorPlaceHolderRef).toBeDefined();
    });

    it('should create editor placeholder component', () => {
      expect(adapter._editorPlaceHolderRef).toBeDefined();
      expect(adapter.input).toBeDefined();
    });

    it('should register afterRowResize hook callback', () => {
      expect(adapter._afterRowResizeCallback).toBeDefined();
      expect(typeof adapter._afterRowResizeCallback).toBe('function');
    });

    it('should register afterColumnResize hook callback', () => {
      expect(adapter._afterColumnResizeCallback).toBeDefined();
      expect(typeof adapter._afterColumnResizeCallback).toBe('function');
    });

    it('should register afterDestroy hook callback', () => {
      expect(adapter._afterDestroyCallback).toBeDefined();
      expect(typeof adapter._afterDestroyCallback).toBe('function');
    });
  });

  describe('hot table hooks', () => {
    it('should call setInput on placeholder when afterRowResize hook is triggered', () => {
      const setInputSpy = jest.spyOn(adapter._editorPlaceHolderRef, 'setInput');
      setInputSpy.mockClear();

      instance.runHooks('afterRowResize');

      expect(setInputSpy).toHaveBeenCalled();
    });

    it('should call setInput on placeholder when afterColumnResize hook is triggered', () => {
      const setInputSpy = jest.spyOn(adapter._editorPlaceHolderRef, 'setInput');
      setInputSpy.mockClear();

      instance.runHooks('afterColumnResize');

      expect(setInputSpy).toHaveBeenCalled();
    });

    it('should destroy editor placeholder on afterDestroy hook', () => {
      const destroySpy = jest.spyOn(adapter._editorPlaceHolderRef, 'destroy');

      instance.runHooks('afterDestroy');

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('beforeOpen', () => {
    beforeEach(() => {
      adapter.finishEditing();
    });

    it('should apply props to editor', () => {
      const setInputSpy = jest.spyOn(customEditor.componentRef, 'setInput');
      setInputSpy.mockClear();

      instance.selectCell(0, 0);
      adapter.beginEditing();

      expect(setInputSpy).toHaveBeenCalledWith('originalValue', adapter.originalValue);
      expect(setInputSpy).toHaveBeenCalledWith('row', 0);
      expect(setInputSpy).toHaveBeenCalledWith('column', 0);
      expect(setInputSpy).toHaveBeenCalledWith('prop', expect.anything());
      expect(setInputSpy).toHaveBeenCalledWith('cellProperties', expect.any(Object));
    });

    it('should subscribe to finishEdit event', () => {
      instance.selectCell(0, 0);
      adapter.beginEditing();

      expect(adapter._finishEditSubscription).toBeDefined();
    });

    it('should subscribe to cancelEdit event', () => {
      instance.selectCell(0, 0);
      adapter.beginEditing();

      expect(adapter._cancelEditSubscription).toBeDefined();
    });

    it('should call custom editor beforeOpen if defined', () => {
      customEditor.componentInstance.beforeOpen = jest.fn();

      instance.selectCell(0, 0);
      adapter.beginEditing();

      expect(customEditor.componentInstance.beforeOpen).toHaveBeenCalled();
    });
  });

  describe('afterOpen', () => {
    beforeEach(() => {
      adapter.finishEditing();
    });

    it('should call custom editor afterOpen if defined', () => {
      customEditor.componentInstance.afterOpen = jest.fn();

      instance.selectCell(0, 0);
      adapter.beginEditing();

      expect(customEditor.componentInstance.afterOpen).toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    it('should call custom editor onFocus', () => {
      const focusSpy = jest.spyOn(customEditor.componentInstance, 'onFocus');
      focusSpy.mockClear();

      adapter.focus();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('afterClose', () => {
    it('should reset editor state', () => {
      const setInputSpy = jest.spyOn(adapter._editorPlaceHolderRef, 'setInput');
      setInputSpy.mockClear();

      adapter.finishEditing();

      expect(setInputSpy).toHaveBeenCalledWith('top', undefined);
      expect(setInputSpy).toHaveBeenCalledWith('left', undefined);
      expect(setInputSpy).toHaveBeenCalledWith('height', undefined);
      expect(setInputSpy).toHaveBeenCalledWith('width', undefined);
      expect(setInputSpy).toHaveBeenCalledWith('isVisible', false);
      expect(setInputSpy).toHaveBeenCalledWith('componentRef', undefined);
    });

    it('should call custom editor afterClose', () => {
      const afterCloseSpy = jest.spyOn(customEditor.componentInstance, 'afterClose');

      adapter.finishEditing();

      expect(afterCloseSpy).toHaveBeenCalled();
    });

    it('should detach editor from placeholder', () => {
      const detachSpy = jest.spyOn(adapter._editorPlaceHolderRef.instance, 'detachEditor');

      adapter.finishEditing();

      expect(detachSpy).toHaveBeenCalled();
    });
  });

  describe('getValue', () => {
    it('should call custom editor getValue', () => {
      const getValueSpy = jest.spyOn(customEditor.componentInstance, 'getValue');

      adapter.getValue();

      expect(getValueSpy).toHaveBeenCalled();
    });
  });

  describe('setValue', () => {
    it('should set value on editor instance', () => {
      adapter.setValue(42);

      expect(adapter.value).toBe(42);
    });

    it('should call custom editor setValue', () => {
      const setValueSpy = jest.spyOn(customEditor.componentInstance, 'setValue');

      adapter.setValue(42);

      expect(setValueSpy).toHaveBeenCalledWith(42);
    });

    it('should trigger change detection', () => {
      const detectChangesSpy = jest.spyOn(customEditor.componentRef.changeDetectorRef, 'detectChanges');
      detectChangesSpy.mockClear();

      adapter.setValue(42);

      expect(detectChangesSpy).toHaveBeenCalled();
    });
  });
});
