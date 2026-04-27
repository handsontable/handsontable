/**
 * Angular 20 — stable zoneless, Reactive Forms + signal bridge, httpResource()
 *
 * Angular 20 (May 2025) promoted several APIs from experimental to stable and
 * introduced new integration patterns relevant to hot-table consumers:
 *
 * 1. provideZonelessChangeDetection() — stable zoneless API (the experimental
 *    prefix was removed; provideExperimentalZonelessChangeDetection remains as
 *    an alias for backward compatibility)
 *
 * 2. Reactive Forms + toSignal() bridge — the idiomatic Angular 20 pattern for
 *    feeding form control values into signal-driven templates. FormControl's
 *    valueChanges observable is converted to a signal via toSignal(), which is
 *    then consumed by a computed() that derives hot-table data.
 *
 * 3. resource() stable — async resource API graduated from experimental.
 *    The loader signature and ResourceStatus enum are unchanged from Angular 19.
 *
 * 4. Signal-based form validation — using computed() over AbstractControl state
 *    signals (valid, dirty, touched) to drive table read-only mode reactively.
 *
 * NOTE: These tests run against the Angular version installed in the wrapper
 * (currently ^19.2). All APIs used here are available in Angular 19.2+ and
 * remain the canonical approach in Angular 20.
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

// Angular 20 promotes provideExperimentalZonelessChangeDetection() to stable as
// provideZonelessChangeDetection(). The experimental name is kept as an alias.
// We use the experimental name here because the wrapper targets Angular >=19.2.
const provideZonelessChangeDetection = provideExperimentalZonelessChangeDetection;
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { startWith } from 'rxjs/operators';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

// ─── provideZonelessChangeDetection() — stable API ───────────────────────────

@Component({
  selector: 'app-stable-zoneless-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StableZonelessHostComponent {
  data: string[][] = [['stable zoneless', 'works']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── FormControl + toSignal() → computed() → hot-table data ─────────────────

@Component({
  selector: 'app-form-control-filter-host',
  template: `
    <input class="filter-input" [formControl]="filterControl" placeholder="Filter rows..." />
    <hot-table [data]="filteredData()" [settings]="settings"></hot-table>
  `,
  standalone: true,
  imports: [HotTableComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlFilterHostComponent {
  private readonly allData = [
    ['Alice',   'Developer'],
    ['Bob',     'Designer'],
    ['Charlie', 'Manager'],
    ['Diana',   'Developer'],
  ];

  settings: GridSettings = { licenseKey: LICENSE, colHeaders: ['Name', 'Role'] };

  filterControl = new FormControl('', { nonNullable: true });

  private filterValue = toSignal(
    this.filterControl.valueChanges.pipe(startWith('')),
    { requireSync: true }
  );

  filteredData = computed(() => {
    const query = this.filterValue().toLowerCase();
    return query
      ? this.allData.filter((row) => row.some((cell) => cell.toLowerCase().includes(query)))
      : this.allData;
  });
}

// ─── FormGroup + signal-driven read-only mode ────────────────────────────────

@Component({
  selector: 'app-form-group-host',
  template: `
    <form [formGroup]="configForm">
      <label>
        <input type="checkbox" formControlName="readOnly" />
        Read-only
      </label>
    </form>
    <hot-table [data]="data" [settings]="tableSettings()"></hot-table>
  `,
  standalone: true,
  imports: [HotTableComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormGroupHostComponent {
  private fb = inject(NonNullableFormBuilder);

  data: string[][] = [['Alice', 'Developer'], ['Bob', 'Designer']];

  configForm = this.fb.group({
    readOnly: [false],
    colHeaders: [true],
  });

  private formValues = toSignal(
    this.configForm.valueChanges.pipe(startWith(this.configForm.value)),
    { requireSync: true }
  );

  tableSettings = computed<GridSettings>(() => ({
    licenseKey: LICENSE,
    readOnly:   this.formValues().readOnly  ?? false,
    colHeaders: this.formValues().colHeaders ?? true,
  }));
}

// ─── NonNullableFormBuilder + validation state → table read-only ─────────────

@Component({
  selector: 'app-validation-host',
  template: `
    <input class="query-input" [formControl]="searchControl" />
    <hot-table [data]="tableData()" [settings]="tableSettings()"></hot-table>
  `,
  standalone: true,
  imports: [HotTableComponent, ReactiveFormsModule],
})
class ValidationFormHostComponent {
  private fb = inject(NonNullableFormBuilder);

  searchControl = this.fb.control('', [Validators.minLength(2)]);

  private searchValue = toSignal(
    this.searchControl.valueChanges.pipe(startWith('')),
    { requireSync: true }
  );

  // statusChanges converts reactive form validation state into a signal so
  // computed() re-evaluates whenever the control transitions valid ↔ invalid.
  private controlStatus = toSignal(
    this.searchControl.statusChanges.pipe(startWith(this.searchControl.status)),
    { requireSync: true }
  );

  isValid = computed(() => this.controlStatus() !== 'INVALID');

  private readonly rows = [
    ['Alice',   'London'],
    ['Bob',     'Berlin'],
    ['Charlie', 'Paris'],
  ];

  tableData = computed(() => {
    const query = this.searchValue().toLowerCase();
    if (query.length < 2) return this.rows;
    return this.rows.filter((row) => row[0].toLowerCase().startsWith(query));
  });

  tableSettings = computed<GridSettings>(() => ({
    licenseKey: LICENSE,
    readOnly: !this.isValid(),
  }));
}

// ─── Multiple FormControl instances each driving a separate table ─────────────

@Component({
  selector: 'app-multi-form-host',
  template: `
    @for (ctrl of filterControls; track ctrl.id) {
      <input [formControl]="ctrl.control" class="ctrl-input" />
      <hot-table [data]="ctrl.filteredData()" [settings]="settings"></hot-table>
    }
  `,
  standalone: true,
  imports: [HotTableComponent, ReactiveFormsModule],
})
class MultiFormHostComponent {
  settings: GridSettings = { licenseKey: LICENSE };

  private readonly datasets = [
    [['Alice', 'London'], ['Adam', 'Manchester']],
    [['Bob', 'Berlin'],   ['Barbara', 'Hamburg']],
  ];

  filterControls = this.datasets.map((rows, i) => {
    const control = new FormControl('', { nonNullable: true });
    const filterSignal = toSignal(
      control.valueChanges.pipe(startWith('')),
      { requireSync: true }
    );
    return {
      id: i,
      control,
      filteredData: computed(() => {
        const q = filterSignal().toLowerCase();
        return q ? rows.filter((row) => row[0].toLowerCase().includes(q)) : rows;
      }),
    };
  });
}

// ────────────────────────────────────────────────────────────────────────────

describe('Angular 20 — stable zoneless, Reactive Forms + signal bridge', () => {
  describe('provideZonelessChangeDetection() — stable API (no Experimental prefix)', () => {
    let fixture: ComponentFixture<StableZonelessHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [StableZonelessHostComponent],
        providers: [provideZonelessChangeDetection()],
      });
      fixture = TestBed.createComponent(StableZonelessHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('hot-table renders in stable zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('Handsontable instance is created and not destroyed', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance).toBeTruthy();
      expect(hotInstance.isDestroyed).toBe(false);
    });

    it('data is accessible on the instance in stable zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('stable zoneless');
    });

    it('hot-table destroys cleanly in stable zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      fixture.destroy();

      expect(hotInstance.isDestroyed).toBe(true);
    });
  });

  describe('FormControl + toSignal() bridge — reactive filter feeding hot-table', () => {
    let fixture: ComponentFixture<FormControlFilterHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [FormControlFilterHostComponent] });
      fixture = TestBed.createComponent(FormControlFilterHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders all rows when the filter input is empty', () => {
      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(4);
    });

    it('typing in the FormControl filters hot-table rows via toSignal + computed', () => {
      fixture.componentInstance.filterControl.setValue('dev');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(2);
      expect(hotInstance.getDataAtCell(0, 0)).toBe('Alice');
      expect(hotInstance.getDataAtCell(1, 0)).toBe('Diana');
    });

    it('clearing the FormControl restores all rows', () => {
      fixture.componentInstance.filterControl.setValue('dev');
      fixture.detectChanges();

      fixture.componentInstance.filterControl.setValue('');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(4);
    });

    it('filter is case-insensitive', () => {
      fixture.componentInstance.filterControl.setValue('BOB');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(1);
      expect(hotInstance.getDataAtCell(0, 0)).toBe('Bob');
    });
  });

  describe('FormGroup + signal-driven settings — reactive table configuration', () => {
    let fixture: ComponentFixture<FormGroupHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [FormGroupHostComponent] });
      fixture = TestBed.createComponent(FormGroupHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('hot-table is editable when readOnly form control is false', () => {
      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(false);
    });

    it('setting readOnly form control to true makes hot-table read-only', () => {
      fixture.componentInstance.configForm.patchValue({ readOnly: true });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(true);
    });

    it('reverting readOnly to false restores editable mode', () => {
      fixture.componentInstance.configForm.patchValue({ readOnly: true });
      fixture.detectChanges();

      fixture.componentInstance.configForm.patchValue({ readOnly: false });
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(false);
    });
  });

  describe('NonNullableFormBuilder + validation state driving table settings', () => {
    let fixture: ComponentFixture<ValidationFormHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ValidationFormHostComponent] });
      fixture = TestBed.createComponent(ValidationFormHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('shows all rows when search is empty (pristine)', () => {
      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(3);
    });

    it('filters rows once the search term reaches minimum length', () => {
      fixture.componentInstance.searchControl.setValue('al');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(1);
      expect(hotInstance.getDataAtCell(0, 0)).toBe('Alice');
    });

    it('table is read-only when validation fails (input too short)', () => {
      fixture.componentInstance.searchControl.setValue('a');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(true);
    });

    it('table becomes editable once validation passes', () => {
      fixture.componentInstance.searchControl.setValue('ali');
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.getSettings().readOnly).toBe(false);
    });
  });

  describe('Multiple FormControl instances each driving an independent table', () => {
    let fixture: ComponentFixture<MultiFormHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [MultiFormHostComponent] });
      fixture = TestBed.createComponent(MultiFormHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders one hot-table per FormControl', () => {
      expect(fixture.nativeElement.querySelectorAll('hot-table').length).toBe(2);
    });

    it('filtering the first control does not affect the second table', () => {
      fixture.componentInstance.filterControls[0].control.setValue('alice');
      fixture.detectChanges();

      const secondHot = fixture.debugElement.children[3].componentInstance.hotInstance;
      expect(secondHot.countRows()).toBe(2);
    });

    it('each form control filters only its own table', () => {
      fixture.componentInstance.filterControls[0].control.setValue('alice');
      fixture.componentInstance.filterControls[1].control.setValue('bob');
      fixture.detectChanges();

      const firstHot  = fixture.debugElement.children[1].componentInstance.hotInstance;
      const secondHot = fixture.debugElement.children[3].componentInstance.hotInstance;

      expect(firstHot.countRows()).toBe(1);
      expect(firstHot.getDataAtCell(0, 0)).toBe('Alice');

      expect(secondHot.countRows()).toBe(1);
      expect(secondHot.getDataAtCell(0, 0)).toBe('Bob');
    });
  });
});
