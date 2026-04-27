/**
 * Angular 18 — zoneless change detection + afterNextRender() + @let
 *
 * Angular 18 shipped experimental zoneless mode, where zone.js is no longer
 * required. Change detection is triggered manually or via signals rather than
 * by zone.js patching async APIs.
 *
 * Key considerations for hot-table in zoneless mode:
 * - HotTableComponent uses NgZone.runOutsideAngular() — a no-op in zoneless,
 *   which is the intended behaviour
 * - Handsontable hook callbacks are wrapped with ngZone.run() by
 *   HotSettingsResolver — in zoneless mode this calls markDirty() instead
 * - afterNextRender() guarantees execution after the next render cycle
 *
 * Angular 18 also introduced @let for declaring local template variables.
 */

import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  provideExperimentalZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

// ─── OnPush component for zoneless testing ───────────────────────────────────

@Component({
  selector: 'app-zoneless-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ZonelessHostComponent {
  data: string[][] = [['zoneless', 'works']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── afterNextRender() alongside hot-table ───────────────────────────────────

@Component({
  selector: 'app-after-render-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AfterNextRenderHostComponent {
  data: string[][] = [['before'], ['render']];
  settings: GridSettings = { licenseKey: LICENSE };
  renderCount = 0;

  constructor() {
    afterNextRender(() => {
      this.renderCount++;
    });
  }
}

// ─── Signal + OnPush in zoneless mode ────────────────────────────────────────

@Component({
  selector: 'app-signal-zoneless-host',
  template: `<hot-table [data]="rows()" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalZonelessHostComponent {
  rows     = signal<string[][]>([['signal', 'zoneless']]);
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── @let template variable (Angular 18+) ────────────────────────────────────

@Component({
  selector: 'app-let-syntax-host',
  template: `
    @let tableLabel = 'Results: ' + data.length + ' rows';
    <p class="label">{{ tableLabel }}</p>
    <hot-table [data]="data" [settings]="settings"></hot-table>
  `,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LetSyntaxHostComponent {
  data: string[][] = [['A', '1'], ['B', '2'], ['C', '3']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── ChangeDetectorRef.markForCheck() with OnPush ────────────────────────────

@Component({
  selector: 'app-manual-cdr-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ManualCdrHostComponent {
  data: string[][] = [['original']];
  settings: GridSettings = { licenseKey: LICENSE };

  private cdr = inject(ChangeDetectorRef);

  updateData(newData: string[][]): void {
    this.data = newData;
    this.cdr.markForCheck();
  }
}

// ────────────────────────────────────────────────────────────────────────────

describe('Angular 18 — zoneless change detection + afterNextRender() + @let', () => {
  describe('provideExperimentalZonelessChangeDetection — zoneless mode', () => {
    let fixture: ComponentFixture<ZonelessHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ZonelessHostComponent],
        providers: [provideExperimentalZonelessChangeDetection()],
      });
      fixture = TestBed.createComponent(ZonelessHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('hot-table renders correctly in zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('Handsontable instance is created in zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance).toBeTruthy();
      expect(hotInstance.isDestroyed).toBe(false);
    });

    it('data is accessible on the hot-table instance in zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('zoneless');
    });

    it('hot-table destroys cleanly in zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      fixture.destroy();

      expect(hotInstance.isDestroyed).toBe(true);
    });
  });

  describe('afterNextRender() — callback after view initialisation', () => {
    let fixture: ComponentFixture<AfterNextRenderHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [AfterNextRenderHostComponent],
        providers: [provideExperimentalZonelessChangeDetection()],
      });
      fixture = TestBed.createComponent(AfterNextRenderHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('afterNextRender() callback fires after the component with hot-table initialises', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.renderCount).toBeGreaterThan(0);
    });

    it('hot-table is already initialised when afterNextRender() runs', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance).toBeTruthy();
      expect(hotInstance.isDestroyed).toBe(false);
    });
  });

  describe('Signals + OnPush in zoneless mode', () => {
    let fixture: ComponentFixture<SignalZonelessHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [SignalZonelessHostComponent],
        providers: [provideExperimentalZonelessChangeDetection()],
      });
      fixture = TestBed.createComponent(SignalZonelessHostComponent);
    });

    afterEach(() => fixture.destroy());

    it('hot-table renders with signal data in zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('signal');
    });

    it('updating the signal refreshes hot-table in zoneless mode', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.rows.set([['updated', 'signal']]);
      fixture.detectChanges();
      await fixture.whenStable();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('updated');
    });
  });

  describe('@let — local template variables (Angular 18+)', () => {
    let fixture: ComponentFixture<LetSyntaxHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [LetSyntaxHostComponent] });
      fixture = TestBed.createComponent(LetSyntaxHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('renders hot-table alongside an element using @let', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('@let computes the row-count label correctly', () => {
      const label = fixture.nativeElement.querySelector('.label');
      expect(label.textContent).toContain('3');
      expect(label.textContent).toContain('Results');
    });

    it('hot-table has the correct row count alongside @let', () => {
      const hotInstance = fixture.debugElement.children[1].componentInstance.hotInstance;
      expect(hotInstance.countRows()).toBe(3);
    });
  });

  describe('ChangeDetectorRef.markForCheck() with OnPush strategy', () => {
    let fixture: ComponentFixture<ManualCdrHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ManualCdrHostComponent] });
      fixture = TestBed.createComponent(ManualCdrHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('markForCheck() causes hot-table to re-render with new data', () => {
      fixture.componentInstance.updateData([['updated', 'via markForCheck']]);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('updated');
    });
  });
});
