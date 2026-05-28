import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HotCellRendererAdvancedComponent } from './hot-cell-renderer-advanced.component';
import { HotCellRendererComponent } from './hot-cell-renderer.component';

@Component({
  selector: 'hot-mock-advanced-renderer',
  template: '<span>{{ value }}</span>',
  standalone: true,
})
class ConcreteAdvancedRendererComponent extends HotCellRendererAdvancedComponent<string> {}

describe('HotCellRendererAdvancedComponent', () => {
  let fixture: ComponentFixture<ConcreteAdvancedRendererComponent>;
  let component: ConcreteAdvancedRendererComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcreteAdvancedRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcreteAdvancedRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('RENDERER_MARKER should be a Symbol', () => {
    expect(typeof HotCellRendererAdvancedComponent.RENDERER_MARKER).toBe('symbol');
  });

  it('RENDERER_MARKER should differ from HotCellRendererComponent.RENDERER_MARKER', () => {
    expect(HotCellRendererAdvancedComponent.RENDERER_MARKER).not.toBe(HotCellRendererComponent.RENDERER_MARKER);
  });

  describe('default values', () => {
    it('value should default to empty string', () => {
      expect(component.value).toBe('');
    });

    it('getProps() should return empty object when cellProperties is not set', () => {
      expect(component.getProps()).toEqual({});
    });
  });

  describe('@Input properties', () => {
    it('should accept string value input', () => {
      fixture.componentRef.setInput('value', 'advanced-cell');
      expect(component.value).toBe('advanced-cell');
    });

    it('should accept object value input', () => {
      fixture.componentRef.setInput('value', { key: 'val' } as any);
      expect(component.value).toEqual({ key: 'val' });
    });

    it('should accept array value input', () => {
      fixture.componentRef.setInput('value', [1, 2, 3] as any);
      expect(component.value).toEqual([1, 2, 3]);
    });

    it('should accept row input', () => {
      fixture.componentRef.setInput('row', 5);
      expect(component.row).toBe(5);
    });

    it('should accept col input', () => {
      fixture.componentRef.setInput('col', 3);
      expect(component.col).toBe(3);
    });

    it('should accept prop input', () => {
      fixture.componentRef.setInput('prop', 'amount');
      expect(component.prop).toBe('amount');
    });

    it('should accept td input', () => {
      const td = document.createElement('td');
      fixture.componentRef.setInput('td', td);
      expect(component.td).toBe(td);
    });

    it('should accept instance input', () => {
      const mockInstance = {} as any;
      fixture.componentRef.setInput('instance', mockInstance);
      expect(component.instance).toBe(mockInstance);
    });

    it('should accept cellProperties input', () => {
      const props = { type: 'numeric', rendererProps: { format: '#,##0' } } as any;
      fixture.componentRef.setInput('cellProperties', props);
      expect(component.cellProperties).toBe(props);
    });
  });

  describe('getProps()', () => {
    it('should return rendererProps when present in cellProperties', () => {
      const rendererProps = { format: '#,##0' };
      fixture.componentRef.setInput('cellProperties', { rendererProps } as any);
      expect(component.getProps()).toBe(rendererProps);
    });

    it('should return empty object when cellProperties has no rendererProps', () => {
      fixture.componentRef.setInput('cellProperties', { type: 'numeric' } as any);
      expect(component.getProps()).toEqual({});
    });

    it('should return empty object when cellProperties is null', () => {
      fixture.componentRef.setInput('cellProperties', null);
      expect(component.getProps()).toEqual({});
    });

    it('should return empty object when rendererProps is null', () => {
      fixture.componentRef.setInput('cellProperties', { rendererProps: null } as any);
      expect(component.getProps()).toEqual({});
    });
  });
});
