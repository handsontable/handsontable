import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HotCellEditorAdvancedComponent } from './hot-cell-editor-advanced.component';
import { HotCellEditorComponent } from './hot-cell-editor.component';

@Component({
  selector: 'hot-mock-advanced-editor',
  template: '',
  standalone: true,
})
class ConcreteAdvancedEditorComponent extends HotCellEditorAdvancedComponent<string> {}

describe('HotCellEditorAdvancedComponent', () => {
  let fixture: ComponentFixture<ConcreteAdvancedEditorComponent>;
  let component: ConcreteAdvancedEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcreteAdvancedEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcreteAdvancedEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('EDITOR_MARKER should be a Symbol', () => {
    expect(typeof HotCellEditorAdvancedComponent.EDITOR_MARKER).toBe('symbol');
  });

  it('EDITOR_MARKER should differ from HotCellEditorComponent.EDITOR_MARKER', () => {
    expect(HotCellEditorAdvancedComponent.EDITOR_MARKER).not.toBe(HotCellEditorComponent.EDITOR_MARKER);
  });

  describe('host bindings', () => {
    it('should set height 100% on host element', () => {
      expect(fixture.nativeElement.style.height).toBe('100%');
    });

    it('should set width 100% on host element', () => {
      expect(fixture.nativeElement.style.width).toBe('100%');
    });
  });

  describe('default property values', () => {
    it('position should default to "container"', () => {
      expect(component.position).toBe('container');
    });

    it('shortcuts should be undefined by default', () => {
      expect(component.shortcuts).toBeUndefined();
    });

    it('shortcutsGroup should be undefined by default', () => {
      expect(component.shortcutsGroup).toBeUndefined();
    });

    it('config should be undefined by default', () => {
      expect(component.config).toBeUndefined();
    });
  });

  describe('@Input properties', () => {
    it('should accept row input', () => {
      fixture.componentRef.setInput('row', 2);
      expect(component.row).toBe(2);
    });

    it('should accept column input', () => {
      fixture.componentRef.setInput('column', 4);
      expect(component.column).toBe(4);
    });

    it('should accept prop as string', () => {
      fixture.componentRef.setInput('prop', 'id');
      expect(component.prop).toBe('id');
    });

    it('should accept prop as number', () => {
      fixture.componentRef.setInput('prop', 0);
      expect(component.prop).toBe(0);
    });

    it('should accept originalValue', () => {
      fixture.componentRef.setInput('originalValue', 'original');
      expect(component.originalValue).toBe('original');
    });

    it('should accept cellProperties', () => {
      const props = { type: 'text' } as any;
      fixture.componentRef.setInput('cellProperties', props);
      expect(component.cellProperties).toBe(props);
    });
  });

  describe('@Output events', () => {
    it('should emit finishEdit', () => {
      let emitted = false;
      component.finishEdit.subscribe(() => {
        emitted = true;
      });
      component.finishEdit.emit();
      expect(emitted).toBe(true);
    });

    it('should emit cancelEdit', () => {
      let emitted = false;
      component.cancelEdit.subscribe(() => {
        emitted = true;
      });
      component.cancelEdit.emit();
      expect(emitted).toBe(true);
    });
  });

  describe('getValue / setValue', () => {
    it('should return undefined before setValue is called', () => {
      expect(component.getValue()).toBeUndefined();
    });

    it('should return value after setValue', () => {
      component.setValue('advanced-value');
      expect(component.getValue()).toBe('advanced-value');
    });

    it('should overwrite value on subsequent setValue calls', () => {
      component.setValue('first');
      component.setValue('second');
      expect(component.getValue()).toBe('second');
    });
  });

  describe('configurable public properties', () => {
    it('should allow setting position to "portal"', () => {
      component.position = 'portal';
      expect(component.position).toBe('portal');
    });

    it('should allow setting position back to "container"', () => {
      component.position = 'portal';
      component.position = 'container';
      expect(component.position).toBe('container');
    });

    it('should allow setting shortcuts', () => {
      const shortcuts = [{ keys: [['Enter']], callback: () => {} }];
      component.shortcuts = shortcuts;
      expect(component.shortcuts).toBe(shortcuts);
    });

    it('should allow setting shortcutsGroup', () => {
      component.shortcutsGroup = 'myGroup';
      expect(component.shortcutsGroup).toBe('myGroup');
    });

    it('should allow setting config', () => {
      const config = { foo: 'bar' };
      component.config = config;
      expect(component.config).toEqual(config);
    });
  });

  describe('lifecycle hooks', () => {
    it('onFocus() should be callable without argument', () => {
      expect(() => component.onFocus()).not.toThrow();
    });

    it('onFocus() should be callable with editor argument', () => {
      expect(() => component.onFocus({} as any)).not.toThrow();
    });

    it('afterOpen() should be callable with editor only', () => {
      expect(() => component.afterOpen({} as any)).not.toThrow();
    });

    it('afterOpen() should be callable with editor and event', () => {
      const event = new Event('open');
      expect(() => component.afterOpen({} as any, event)).not.toThrow();
    });

    it('afterClose() should be callable', () => {
      expect(() => component.afterClose({} as any)).not.toThrow();
    });

    it('afterInit() should be callable', () => {
      expect(() => component.afterInit({} as any)).not.toThrow();
    });

    it('beforeOpen() should be callable with all required arguments', () => {
      expect(() =>
        component.beforeOpen({} as any, {
          row: 0,
          col: 0,
          prop: 'test',
          td: document.createElement('td'),
          originalValue: 'val',
          cellProperties: {} as any,
        })
      ).not.toThrow();
    });
  });
});
