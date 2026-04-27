/**
 * Angular 16 — required @Input({ required: true })
 *
 * Angular 16 introduced the ability to mark @Input() as required, causing a
 * compile-time error if the parent does not supply the binding. These tests
 * verify that HotTableComponent behaves correctly when hosted inside components
 * that declare required inputs for their data and settings.
 */

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

@Component({
  selector: 'app-required-host',
  template: `<hot-table [data]="rows" [settings]="config"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class RequiredInputHostComponent {
  @Input({ required: true }) rows!: string[][];
  @Input({ required: true }) config!: GridSettings;
}

@Component({
  selector: 'app-required-reactive-host',
  template: `<hot-table [data]="processedRows" [settings]="config"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class RequiredReactiveHostComponent implements OnChanges {
  @Input({ required: true }) rawRows!: string[][];
  @Input({ required: true }) config!: GridSettings;

  processedRows: string[][] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawRows']) {
      this.processedRows = changes['rawRows'].currentValue.map((row: string[]) =>
        row.map((cell: string) => cell.toUpperCase())
      );
    }
  }
}

@Component({
  selector: 'app-mixed-inputs-host',
  template: `<hot-table [data]="data" [settings]="effectiveSettings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class MixedInputsHostComponent {
  @Input({ required: true }) data!: any[][];
  @Input() extraSettings: GridSettings = {};

  get effectiveSettings(): GridSettings {
    return { licenseKey: LICENSE, ...this.extraSettings };
  }
}

describe('Angular 16 — required @Input()', () => {
  describe('RequiredInputHostComponent', () => {
    let fixture: ComponentFixture<RequiredInputHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [RequiredInputHostComponent] });
      fixture = TestBed.createComponent(RequiredInputHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('renders hot-table when required inputs are provided', () => {
      fixture.componentRef.setInput('rows', [['London', 'UK'], ['Paris', 'France']]);
      fixture.componentRef.setInput('config', { licenseKey: LICENSE });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('data from required input flows into the Handsontable instance', () => {
      fixture.componentRef.setInput('rows', [['London', 'UK'], ['Paris', 'France']]);
      fixture.componentRef.setInput('config', { licenseKey: LICENSE });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('London');
      expect(hotInstance.getDataAtCell(1, 1)).toBe('France');
    });

    it('updating the required rows input reloads table data', () => {
      fixture.componentRef.setInput('rows', [['old', 'value']]);
      fixture.componentRef.setInput('config', { licenseKey: LICENSE });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('old');

      fixture.componentRef.setInput('rows', [['new', 'value']]);
      fixture.detectChanges();

      expect(hotInstance.getDataAtCell(0, 0)).toBe('new');
    });

    it('updating the required config input applies new settings to the table', () => {
      fixture.componentRef.setInput('rows', [['x']]);
      fixture.componentRef.setInput('config', { licenseKey: LICENSE, rowHeaders: false });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().rowHeaders).toBe(false);

      fixture.componentRef.setInput('config', { licenseKey: LICENSE, rowHeaders: true });
      fixture.detectChanges();

      expect(hotInstance.getSettings().rowHeaders).toBe(true);
    });
  });

  describe('RequiredReactiveHostComponent — ngOnChanges transforms required input before passing to hot-table', () => {
    let fixture: ComponentFixture<RequiredReactiveHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [RequiredReactiveHostComponent] });
      fixture = TestBed.createComponent(RequiredReactiveHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('ngOnChanges transforms the required input value before it reaches hot-table', () => {
      fixture.componentRef.setInput('rawRows', [['london', 'united kingdom']]);
      fixture.componentRef.setInput('config', { licenseKey: LICENSE });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('LONDON');
      expect(hotInstance.getDataAtCell(0, 1)).toBe('UNITED KINGDOM');
    });
  });

  describe('MixedInputsHostComponent — required and optional inputs combined', () => {
    let fixture: ComponentFixture<MixedInputsHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [MixedInputsHostComponent] });
      fixture = TestBed.createComponent(MixedInputsHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('works with only the required data input and default settings', () => {
      fixture.componentRef.setInput('data', [[1, 2, 3]]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('optional extraSettings are merged with licenseKey from the getter', () => {
      fixture.componentRef.setInput('data', [[1, 2]]);
      fixture.componentRef.setInput('extraSettings', { colHeaders: ['Column A', 'Column B'] });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().colHeaders).toEqual(['Column A', 'Column B']);
    });
  });
});
