import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { HotCellRendererComponent } from './hot-cell-renderer.component';

@Component({
  selector: 'hot-mock-basic-renderer',
  template: '<span>{{ value }}</span>',
  standalone: true,
})
class ConcreteRendererComponent extends HotCellRendererComponent<string> {}

describe('HotCellRendererComponent', () => {
  let fixture: ComponentFixture<ConcreteRendererComponent>;
  let component: ConcreteRendererComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcreteRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConcreteRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('RENDERER_MARKER should be a Symbol', () => {
    expect(typeof HotCellRendererComponent.RENDERER_MARKER).toBe('symbol');
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
    it('should accept value input', () => {
      fixture.componentRef.setInput('value', 'cell-value');
      expect(component.value).toBe('cell-value');
    });

    it('should accept row input', () => {
      fixture.componentRef.setInput('row', 1);
      expect(component.row).toBe(1);
    });

    it('should accept col input', () => {
      fixture.componentRef.setInput('col', 2);
      expect(component.col).toBe(2);
    });

    it('should accept prop input', () => {
      fixture.componentRef.setInput('prop', 'country');
      expect(component.prop).toBe('country');
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
      const props = { type: 'text', rendererProps: { bold: true } } as any;
      fixture.componentRef.setInput('cellProperties', props);
      expect(component.cellProperties).toBe(props);
    });
  });

  describe('getProps()', () => {
    it('should return rendererProps when present in cellProperties', () => {
      const rendererProps = { color: 'red' };
      fixture.componentRef.setInput('cellProperties', { rendererProps } as any);
      expect(component.getProps()).toBe(rendererProps);
    });

    it('should return empty object when cellProperties has no rendererProps', () => {
      fixture.componentRef.setInput('cellProperties', { type: 'text' } as any);
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
