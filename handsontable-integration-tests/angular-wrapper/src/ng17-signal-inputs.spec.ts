/**
 * Angular 17 — input(), computed(), model(), output() — Signal API
 *
 * Angular 17.1 introduced function-based signal primitives for declaring
 * component inputs and outputs. Key differences from classic decorators:
 *
 * - input()            → read-only signal set by the parent template binding
 * - input.required()   → same, but mandatory (no default value)
 * - model()            → writable signal enabling two-way binding
 * - output()           → replaces EventEmitter with a type-safe emitter
 * - computed()         → derived signal recomputed when dependencies change
 *
 * Tests verify the full signal chain:
 *   parent signal → template binding → hot-table @Input / ngOnChanges
 */

import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

// ─── input() ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-signal-input-host',
  template: `<hot-table [data]="tableData()" [settings]="tableSettings()"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class SignalInputHostComponent {
  tableData     = input<string[][]>([[]]);
  tableSettings = input<GridSettings>({ licenseKey: LICENSE });
}

// ─── input.required() ────────────────────────────────────────────────────────

@Component({
  selector: 'app-required-signal-host',
  template: `<hot-table [data]="rows()" [settings]="config()"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class RequiredSignalHostComponent {
  rows   = input.required<string[][]>();
  config = input.required<GridSettings>();
}

// ─── computed() ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-computed-settings-host',
  template: `<hot-table [data]="data" [settings]="computedSettings()"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class ComputedSettingsHostComponent {
  data = [['Alice', 'Developer'], ['Bob', 'Designer']];

  readOnly = signal(false);

  computedSettings = computed<GridSettings>(() => ({
    licenseKey: LICENSE,
    readOnly: this.readOnly(),
    rowHeaders: true,
    colHeaders: ['Name', 'Role'],
  }));
}

// ─── model() ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-table-model',
  template: `<hot-table [data]="tableData()" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class TableModelComponent {
  tableData = model<string[][]>([]);
  settings: GridSettings = { licenseKey: LICENSE };
}

@Component({
  selector: 'app-model-parent',
  template: `<app-table-model [(tableData)]="sharedData"></app-table-model>`,
  standalone: true,
  imports: [TableModelComponent],
})
class ModelParentComponent {
  sharedData = signal<string[][]>([['initial', 'value']]);
}

// ─── output() + effect() ─────────────────────────────────────────────────────

@Component({
  selector: 'app-output-signal-host',
  template: `<hot-table [data]="data()" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class OutputSignalHostComponent {
  data = signal<string[][]>([['test']]);
  settings: GridSettings = { licenseKey: LICENSE };

  dataChanged = output<string[][]>();
  changeCount = 0;

  constructor() {
    effect(() => {
      if (this.data().length > 0) {
        this.changeCount++;
      }
    });
  }
}

// ─── Chained computed() — filter pipeline before hot-table ───────────────────

@Component({
  selector: 'app-chained-signals-host',
  template: `<hot-table [data]="visibleData()" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class ChainedSignalsHostComponent {
  rawData    = input<string[][]>([], { alias: 'source' });
  filterText = input<string>('');

  visibleData = computed(() => {
    const filter = this.filterText().toLowerCase();
    if (!filter) return this.rawData();
    return this.rawData().filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(filter))
    );
  });

  settings: GridSettings = { licenseKey: LICENSE };
}

// ────────────────────────────────────────────────────────────────────────────

describe('Angular 17 — Signal API (input, computed, model, output)', () => {
  describe('input() — signal-based inputs', () => {
    let fixture: ComponentFixture<SignalInputHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [SignalInputHostComponent] });
      fixture = TestBed.createComponent(SignalInputHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('renders hot-table with the input() default value', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('data from input() signal flows into hot-table', () => {
      fixture.componentRef.setInput('tableData', [['Berlin', 'Germany']]);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('Berlin');
    });

    it('changing the input() value updates hot-table', () => {
      fixture.componentRef.setInput('tableData', [['old']]);
      fixture.detectChanges();

      fixture.componentRef.setInput('tableData', [['new']]);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('new');
    });

    it('tableSettings input() passes rowHeaders to hot-table', () => {
      fixture.componentRef.setInput('tableData', [['x']]);
      fixture.componentRef.setInput('tableSettings', { licenseKey: LICENSE, rowHeaders: true });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().rowHeaders).toBe(true);
    });
  });

  describe('input.required() — required signal inputs', () => {
    let fixture: ComponentFixture<RequiredSignalHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [RequiredSignalHostComponent] });
      fixture = TestBed.createComponent(RequiredSignalHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('initialises hot-table after required signal inputs are set', () => {
      fixture.componentRef.setInput('rows', [['A', 'B'], ['C', 'D']]);
      fixture.componentRef.setInput('config', { licenseKey: LICENSE });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('rows signal carries the correct data to the instance', () => {
      fixture.componentRef.setInput('rows', [['London', 'United Kingdom']]);
      fixture.componentRef.setInput('config', { licenseKey: LICENSE });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('London');
    });
  });

  describe('computed() — derived settings signal', () => {
    let fixture: ComponentFixture<ComputedSettingsHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ComputedSettingsHostComponent] });
      fixture = TestBed.createComponent(ComputedSettingsHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('computed() settings are passed to hot-table', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(false);
    });

    it('changing readOnly signal updates computed() and hot-table', () => {
      fixture.componentInstance.readOnly.set(true);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(true);
    });

    it('colHeaders from computed() are visible on the instance', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().colHeaders).toEqual(['Name', 'Role']);
    });
  });

  describe('model() — two-way signal binding', () => {
    let fixture: ComponentFixture<ModelParentComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ModelParentComponent] });
      fixture = TestBed.createComponent(ModelParentComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it("parent model() data flows to the child's hot-table", () => {
      const tableChild = fixture.debugElement.children[0];
      const hotInstance = tableChild.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('initial');
    });

    it('updating the parent signal through model() propagates to hot-table', () => {
      fixture.componentInstance.sharedData.set([['updated', 'value']]);
      fixture.detectChanges();

      const tableChild = fixture.debugElement.children[0];
      const hotInstance = tableChild.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('updated');
    });
  });

  describe('output() + effect() — reactive side-effects on data changes', () => {
    let fixture: ComponentFixture<OutputSignalHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [OutputSignalHostComponent] });
      fixture = TestBed.createComponent(OutputSignalHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('effect() runs when the data signal changes', () => {
      const initial = fixture.componentInstance.changeCount;
      fixture.componentInstance.data.set([['new value']]);
      fixture.detectChanges();

      expect(fixture.componentInstance.changeCount).toBeGreaterThan(initial);
    });
  });

  describe('chained computed() — filter pipeline before hot-table', () => {
    let fixture: ComponentFixture<ChainedSignalsHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ChainedSignalsHostComponent] });
      fixture = TestBed.createComponent(ChainedSignalsHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('without a filter all rows are visible in hot-table', () => {
      fixture.componentRef.setInput('source', [['London'], ['Berlin'], ['Paris']]);
      fixture.componentRef.setInput('filterText', '');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(3);
    });

    it('computed() with a filter passes only matching rows to hot-table', () => {
      fixture.componentRef.setInput('source', [['London'], ['Berlin'], ['Paris']]);
      fixture.componentRef.setInput('filterText', 'ber');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(1);
      expect(hotInstance.getDataAtCell(0, 0)).toBe('Berlin');
    });
  });
});
