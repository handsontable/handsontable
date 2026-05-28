import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HotCellEditorComponent } from './hot-cell-editor.component';

@Component({
  selector: 'hot-mock-basic-editor',
  template: '',
  standalone: true,
})
class ConcreteEditorComponent extends HotCellEditorComponent<string> {
  onFocus(): void {}
}

describe('HotCellEditorComponent', () => {
  let fixture: ComponentFixture<ConcreteEditorComponent>;
  let component: ConcreteEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcreteEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcreteEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('EDITOR_MARKER should be a Symbol', () => {
    expect(typeof HotCellEditorComponent.EDITOR_MARKER).toBe('symbol');
  });

  describe('host bindings', () => {
    it('should set tabindex=-1 on host element', () => {
      expect(fixture.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('should set data-hot-input attribute on host element', () => {
      expect(fixture.nativeElement.hasAttribute('data-hot-input')).toBe(true);
    });

    it('should add handsontableInput class to host element', () => {
      expect(fixture.nativeElement.classList.contains('handsontableInput')).toBe(true);
    });

    it('should set height 100% on host element', () => {
      expect(fixture.nativeElement.style.height).toBe('100%');
    });

    it('should set width 100% on host element', () => {
      expect(fixture.nativeElement.style.width).toBe('100%');
    });
  });

  describe('@Input properties', () => {
    it('should accept row input', () => {
      fixture.componentRef.setInput('row', 3);
      expect(component.row).toBe(3);
    });

    it('should accept column input', () => {
      fixture.componentRef.setInput('column', 5);
      expect(component.column).toBe(5);
    });

    it('should accept prop as string', () => {
      fixture.componentRef.setInput('prop', 'name');
      expect(component.prop).toBe('name');
    });

    it('should accept prop as number', () => {
      fixture.componentRef.setInput('prop', 2);
      expect(component.prop).toBe(2);
    });

    it('should accept originalValue', () => {
      fixture.componentRef.setInput('originalValue', 'hello');
      expect(component.originalValue).toBe('hello');
    });

    it('should accept cellProperties', () => {
      const props = { readOnly: true } as any;
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

    it('should return the value set by setValue', () => {
      component.setValue('test-value');
      expect(component.getValue()).toBe('test-value');
    });

    it('should update value on subsequent setValue calls', () => {
      component.setValue('first');
      component.setValue('second');
      expect(component.getValue()).toBe('second');
    });
  });

  describe('lifecycle hooks', () => {
    it('onClose() should be callable without throwing', () => {
      expect(() => component.onClose()).not.toThrow();
    });

    it('onOpen() should be callable without event argument', () => {
      expect(() => component.onOpen()).not.toThrow();
    });

    it('onOpen() should be callable with an Event argument', () => {
      const event = new Event('click');
      expect(() => component.onOpen(event)).not.toThrow();
    });

    it('onFocus() should be callable', () => {
      expect(() => component.onFocus()).not.toThrow();
    });
  });
});
