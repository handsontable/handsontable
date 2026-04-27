/**
 * Angular 19 — linkedSignal() and resource()
 *
 * Angular 19 stabilised the Signal API and introduced two new primitives:
 *
 * - linkedSignal() — a writable derived signal that resets whenever its source
 *   changes, enabling local overrides that are discarded on source update
 * - resource()     — experimental async data-loading API with loading / resolved
 *   / error states and built-in AbortController support
 *
 * Tests cover practical scenarios: dataset switching, async data fetching with
 * mocked loaders, and multiple tables sharing a single signal source.
 */

import {
  ChangeDetectionStrategy,
  Component,
  linkedSignal,
  resource,
  ResourceStatus,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

// ─── linkedSignal() — reactive dataset switching ─────────────────────────────

interface Dataset {
  id: string;
  rows: string[][];
  columns: string[];
}

const DATASETS: Record<string, Dataset> = {
  cities: {
    id: 'cities',
    rows: [['London', '9M'], ['Berlin', '3.6M'], ['Paris', '2.1M']],
    columns: ['City', 'Population'],
  },
  countries: {
    id: 'countries',
    rows: [['United Kingdom', 'Europe'], ['Germany', 'Europe'], ['France', 'Europe']],
    columns: ['Country', 'Continent'],
  },
};

@Component({
  selector: 'app-linked-signal-host',
  template: `<hot-table [data]="tableData()" [settings]="tableSettings()"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LinkedSignalHostComponent {
  activeDatasetId = signal<string>('cities');

  tableData = linkedSignal<string, string[][]>({
    source: this.activeDatasetId,
    computation: (id: string) => DATASETS[id]?.rows ?? [],
  });

  tableSettings = linkedSignal<string, GridSettings>({
    source: this.activeDatasetId,
    computation: (id: string): GridSettings => ({
      licenseKey: LICENSE,
      colHeaders: DATASETS[id]?.columns ?? true,
      rowHeaders: true,
    }),
  });
}

// ─── resource() — async data loading ─────────────────────────────────────────

const mockFetch = jest.fn();

@Component({
  selector: 'app-resource-host',
  template: `
    @if (dataResource.status() === resolvedStatus) {
      <hot-table [data]="dataResource.value()!" [settings]="settings"></hot-table>
    } @else if (dataResource.status() === loadingStatus) {
      <p class="loading">Loading...</p>
    } @else if (dataResource.status() === errorStatus) {
      <p class="error">Error: {{ dataResource.error() }}</p>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ResourceHostComponent {
  readonly resolvedStatus = ResourceStatus.Resolved;
  readonly loadingStatus  = ResourceStatus.Loading;
  readonly errorStatus    = ResourceStatus.Error;

  pageIndex = signal(0);
  settings: GridSettings = { licenseKey: LICENSE };

  dataResource = resource<string[][], { page: number }>({
    request: () => ({ page: this.pageIndex() }),
    loader: async ({ request }) => mockFetch(request.page),
  });
}

// ─── Multiple tables sharing one linkedSignal settings source ─────────────────

@Component({
  selector: 'app-shared-signal-host',
  template: `
    @for (id of tableIds(); track id) {
      <hot-table [data]="getRows(id)" [settings]="sharedSettings()"></hot-table>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class SharedSignalHostComponent {
  tableIds = signal<string[]>(['A', 'B']);
  readOnly = signal(false);

  sharedSettings = linkedSignal<boolean, GridSettings>({
    source: this.readOnly,
    computation: (ro: boolean): GridSettings => ({
      licenseKey: LICENSE,
      readOnly: ro,
      rowHeaders: true,
    }),
  });

  getRows(id: string): string[][] {
    return [[`Table ${id}`, `Row 1`], [`Table ${id}`, `Row 2`]];
  }
}

// ─── linkedSignal() with local writes (writable override) ────────────────────

@Component({
  selector: 'app-writable-linked-host',
  template: `<hot-table [data]="editableData()" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class WritableLinkedHostComponent {
  baseData = signal<string[][]>([['original', '1']]);

  editableData = linkedSignal<string[][], string[][]>({
    source: this.baseData,
    computation: (base: string[][]) => base.map((row) => [...row]),
  });

  settings: GridSettings = { licenseKey: LICENSE };

  resetToBase(): void {
    this.editableData.set(this.baseData());
  }
}

// ────────────────────────────────────────────────────────────────────────────

describe('Angular 19 — linkedSignal() and resource()', () => {
  describe('linkedSignal() — reactive dataset switching', () => {
    let fixture: ComponentFixture<LinkedSignalHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [LinkedSignalHostComponent] });
      fixture = TestBed.createComponent(LinkedSignalHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders hot-table with data from linkedSignal()', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('linkedSignal() computes data from the active dataset', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('London');
    });

    it('changing the source signal resets linked table data', () => {
      fixture.componentInstance.activeDatasetId.set('countries');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('United Kingdom');
    });

    it('linkedSignal() also updates colHeaders when the dataset changes', () => {
      fixture.componentInstance.activeDatasetId.set('countries');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getSettings().colHeaders).toEqual(['Country', 'Continent']);
    });

    it('local set() on linkedSignal() overrides data without changing the source', () => {
      fixture.componentInstance.tableData.set([['manual', 'override']]);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('manual');
    });

    it('changing the source discards the local linkedSignal() override', () => {
      fixture.componentInstance.tableData.set([['overridden']]);
      fixture.detectChanges();

      fixture.componentInstance.activeDatasetId.set('countries');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('United Kingdom');
    });
  });

  describe('resource() — async data loading', () => {
    beforeEach(() => mockFetch.mockReset());

    it('resource() transitions through loading → resolved states', async () => {
      mockFetch.mockResolvedValue([['loaded', 'data']]);

      TestBed.configureTestingModule({ imports: [ResourceHostComponent] });
      const fixture = TestBed.createComponent(ResourceHostComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.dataResource.status()).toBe(ResourceStatus.Loading);

      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.dataResource.status()).toBe(ResourceStatus.Resolved);
      expect(fixture.componentInstance.dataResource.value()).toEqual([['loaded', 'data']]);

      fixture.destroy();
    });

    it('hot-table appears after resource() resolves with data', async () => {
      mockFetch.mockResolvedValue([['London', 'UK'], ['Paris', 'France']]);

      TestBed.configureTestingModule({ imports: [ResourceHostComponent] });
      const fixture = TestBed.createComponent(ResourceHostComponent);
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
      fixture.destroy();
    });

    it('resource() with a rejected loader transitions to error state', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      TestBed.configureTestingModule({ imports: [ResourceHostComponent] });
      const fixture = TestBed.createComponent(ResourceHostComponent);
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.dataResource.status()).toBe(ResourceStatus.Error);
      expect(fixture.nativeElement.querySelector('.error')).not.toBeNull();
      fixture.destroy();
    });

    it('changing the request signal triggers a new resource() load', async () => {
      mockFetch
        .mockResolvedValueOnce([['page 0']])
        .mockResolvedValueOnce([['page 1']]);

      TestBed.configureTestingModule({ imports: [ResourceHostComponent] });
      const fixture = TestBed.createComponent(ResourceHostComponent);
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();
      expect(mockFetch).toHaveBeenCalledWith(0);

      fixture.componentInstance.pageIndex.set(1);
      fixture.detectChanges();

      await fixture.whenStable();
      fixture.detectChanges();

      expect(mockFetch).toHaveBeenCalledWith(1);
      expect(fixture.componentInstance.dataResource.value()).toEqual([['page 1']]);
      fixture.destroy();
    });
  });

  describe('Multiple tables sharing one linkedSignal() settings source', () => {
    let fixture: ComponentFixture<SharedSignalHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [SharedSignalHostComponent] });
      fixture = TestBed.createComponent(SharedSignalHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('all tables render with the shared settings', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThanOrEqual(2);
    });

    it('changing readOnly signal updates all tables simultaneously', () => {
      fixture.componentInstance.readOnly.set(true);
      fixture.detectChanges();

      const instances = fixture.debugElement.children.map(
        (child) => child.componentInstance.hotInstance
      );

      instances.forEach((instance) => {
        expect(instance.getSettings().readOnly).toBe(true);
      });
    });

    it('adding an ID to tableIds() creates a new table', () => {
      const initial = fixture.nativeElement.querySelectorAll('.handsontable').length;

      fixture.componentInstance.tableIds.update((ids) => [...ids, 'C']);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(initial);
    });
  });

  describe('linkedSignal() writable — local edits with source reset', () => {
    let fixture: ComponentFixture<WritableLinkedHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [WritableLinkedHostComponent] });
      fixture = TestBed.createComponent(WritableLinkedHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('linkedSignal() reflects the base signal data initially', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('original');
    });

    it('set() on linkedSignal() locally overrides the table data', () => {
      fixture.componentInstance.editableData.set([['modified', '2']]);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('modified');
    });

    it('resetToBase() restores data from the baseData signal', () => {
      fixture.componentInstance.editableData.set([['modified', '2']]);
      fixture.detectChanges();

      fixture.componentInstance.resetToBase();
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('original');
    });
  });
});
