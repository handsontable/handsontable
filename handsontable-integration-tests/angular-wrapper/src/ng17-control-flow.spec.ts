/**
 * Angular 17 — built-in control flow (@if, @for, @switch, @defer)
 *
 * Angular 17 replaced structural directives with native block-level control
 * flow in templates. Key differences from the old *ngIf / *ngFor syntax:
 *
 * - @if/@else is block-level (no host element wrapper)
 * - @for requires a track expression to avoid unnecessary re-renders
 * - @defer supports lazy loading with placeholder, loading and error blocks
 *
 * These tests verify that hot-table initialises and destroys correctly inside
 * each block type, including reactive signal-driven lists.
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, DeferBlockState, TestBed } from '@angular/core/testing';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

// ─── @if ────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-if-host',
  template: `
    @if (show) {
      <hot-table [data]="data" [settings]="settings"></hot-table>
    } @else {
      <p class="placeholder">No table</p>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class IfHostComponent {
  show = true;
  data: string[][] = [['Alice', 'has'], ['Bob', 'data']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── @for ───────────────────────────────────────────────────────────────────

interface TableConfig {
  id: number;
  data: string[][];
}

@Component({
  selector: 'app-for-host',
  template: `
    @for (table of tables; track table.id) {
      <div class="table-wrapper" [attr.data-id]="table.id">
        <hot-table [data]="table.data" [settings]="settings"></hot-table>
      </div>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class ForHostComponent {
  tables: TableConfig[] = [
    { id: 1, data: [['A1', 'B1']] },
    { id: 2, data: [['A2', 'B2']] },
    { id: 3, data: [['A3', 'B3']] },
  ];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── @switch ─────────────────────────────────────────────────────────────────

type TableMode = 'compact' | 'full' | 'readonly';

@Component({
  selector: 'app-switch-host',
  template: `
    @switch (mode) {
      @case ('compact') {
        <hot-table [data]="data" [settings]="compactSettings"></hot-table>
      }
      @case ('full') {
        <hot-table [data]="data" [settings]="fullSettings"></hot-table>
      }
      @case ('readonly') {
        <hot-table [data]="data" [settings]="readonlySettings"></hot-table>
      }
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class SwitchHostComponent {
  mode: TableMode = 'compact';
  data: string[][] = [['value']];

  compactSettings:  GridSettings = { licenseKey: LICENSE, rowHeaders: false, colHeaders: false };
  fullSettings:     GridSettings = { licenseKey: LICENSE, rowHeaders: true,  colHeaders: true  };
  readonlySettings: GridSettings = { licenseKey: LICENSE, rowHeaders: true,  readOnly: true    };
}

// ─── @defer ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-defer-host',
  template: `
    @defer (when loadTable) {
      <hot-table [data]="data" [settings]="settings"></hot-table>
    } @placeholder {
      <p class="defer-placeholder">Loading table...</p>
    } @loading {
      <p class="defer-loading">Fetching data...</p>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class DeferHostComponent {
  loadTable = false;
  data: string[][] = [['lazy', 'loaded']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── @for with signal ────────────────────────────────────────────────────────

@Component({
  selector: 'app-for-signal-host',
  template: `
    @for (id of tableIds(); track id) {
      <hot-table [data]="getDataForId(id)" [settings]="settings"></hot-table>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class ForSignalHostComponent {
  tableIds = signal<number[]>([1, 2]);
  settings: GridSettings = { licenseKey: LICENSE };

  getDataForId(id: number): string[][] {
    return [[`Table ${id}`, `Row 1`]];
  }
}

// ────────────────────────────────────────────────────────────────────────────

describe('Angular 17 — built-in control flow (@if, @for, @switch, @defer)', () => {
  describe('@if — conditional rendering', () => {
    let fixture: ComponentFixture<IfHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [IfHostComponent] });
      fixture = TestBed.createComponent(IfHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders hot-table when @if condition is true', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
      expect(fixture.nativeElement.querySelector('.placeholder')).toBeNull();
    });

    it('removes hot-table and shows @else block when condition becomes false', () => {
      fixture.componentInstance.show = false;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBe(0);
      expect(fixture.nativeElement.querySelector('.placeholder')).not.toBeNull();
    });

    it('Handsontable instance is destroyed when @if transitions to false', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.isDestroyed).toBe(false);

      fixture.componentInstance.show = false;
      fixture.detectChanges();

      expect(hotInstance.isDestroyed).toBe(true);
    });

    it('re-enabling @if creates a new Handsontable instance', () => {
      const first = fixture.debugElement.children[0].componentInstance.hotInstance;

      fixture.componentInstance.show = false;
      fixture.detectChanges();
      fixture.componentInstance.show = true;
      fixture.detectChanges();

      const second = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(second).not.toBe(first);
      expect(second.isDestroyed).toBe(false);
    });
  });

  describe('@for — multiple hot-table instances with track', () => {
    let fixture: ComponentFixture<ForHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ForHostComponent] });
      fixture = TestBed.createComponent(ForHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders one hot-table per item in the list', () => {
      const tables = fixture.nativeElement.querySelectorAll('.handsontable');
      expect(tables.length).toBeGreaterThanOrEqual(fixture.componentInstance.tables.length);
    });

    it('each table has independent data', () => {
      const children = fixture.debugElement.children;
      const first  = children[0].children[0].componentInstance.hotInstance;
      const second = children[1].children[0].componentInstance.hotInstance;

      expect(first.getDataAtCell(0, 0)).toBe('A1');
      expect(second.getDataAtCell(0, 0)).toBe('A2');
    });

    it('removing an item from the list destroys the corresponding instance', () => {
      const thirdHot = fixture.debugElement.children[2].children[0].componentInstance.hotInstance;

      fixture.componentInstance.tables = fixture.componentInstance.tables.slice(0, 2);
      fixture.detectChanges();

      expect(thirdHot.isDestroyed).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('.table-wrapper').length).toBe(2);
    });
  });

  describe('@switch — switching between table configurations', () => {
    let fixture: ComponentFixture<SwitchHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [SwitchHostComponent] });
      fixture = TestBed.createComponent(SwitchHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders compact mode by default (rowHeaders: false)', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().rowHeaders).toBe(false);
    });

    it('switching to full mode enables rowHeaders and colHeaders', () => {
      fixture.componentInstance.mode = 'full';
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().rowHeaders).toBe(true);
      expect(hotInstance.getSettings().colHeaders).toBe(true);
    });

    it('switching to readonly mode sets the table to read-only', () => {
      fixture.componentInstance.mode = 'readonly';
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(true);
    });

    it('each mode switch creates a new Handsontable instance', () => {
      const first = fixture.debugElement.children[0].componentInstance.hotInstance;

      fixture.componentInstance.mode = 'full';
      fixture.detectChanges();

      const second = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(second).not.toBe(first);
      expect(first.isDestroyed).toBe(true);
    });
  });

  describe('@defer — lazy-loaded hot-table', () => {
    let fixture: ComponentFixture<DeferHostComponent>;

    beforeEach(async () => {
      TestBed.configureTestingModule({ imports: [DeferHostComponent] });
      fixture = TestBed.createComponent(DeferHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    afterEach(() => fixture.destroy());

    it('shows the placeholder block before the defer trigger fires', () => {
      expect(fixture.nativeElement.querySelector('.defer-placeholder')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBe(0);
    });

    it('renders hot-table after the defer block is triggered', async () => {
      const deferBlocks = await fixture.getDeferBlocks();
      await deferBlocks[0].render(DeferBlockState.Complete);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('loading block is accessible during the defer loading state', async () => {
      const deferBlocks = await fixture.getDeferBlocks();
      await deferBlocks[0].render(DeferBlockState.Loading);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.defer-loading')).not.toBeNull();
    });
  });

  describe('@for with signal — reactive table list', () => {
    let fixture: ComponentFixture<ForSignalHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ForSignalHostComponent] });
      fixture = TestBed.createComponent(ForSignalHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders tables matching the signal array length', () => {
      expect(fixture.nativeElement.querySelectorAll('hot-table').length).toBe(2);
    });

    it('adding an ID to the signal appends a new table', () => {
      fixture.componentInstance.tableIds.update((ids) => [...ids, 3]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('hot-table').length).toBe(3);
    });

    it('removing an ID from the signal removes the corresponding table', () => {
      fixture.componentInstance.tableIds.set([1]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('hot-table').length).toBe(1);
    });
  });
});
