/**
 * Angular 16 — DestroyRef + takeUntilDestroyed
 *
 * Angular 16 introduced DestroyRef as an injection token for fine-grained
 * cleanup. takeUntilDestroyed() from @angular/core/rxjs-interop automatically
 * completes RxJS subscriptions when the host component is destroyed.
 *
 * These tests verify that these patterns work alongside hot-table without
 * memory leaks or errors after destruction.
 */

import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

const externalSubject$ = new Subject<string[][]>();

@Component({
  selector: 'app-destroy-ref-host',
  template: `<hot-table [data]="tableData" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class DestroyRefHostComponent implements OnInit {
  tableData: string[][] = [];
  settings: GridSettings = { licenseKey: LICENSE };

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    externalSubject$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.tableData = data;
    });
  }
}

@Component({
  selector: 'app-constructor-destroy-ref',
  template: `<hot-table [data]="rows" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class ConstructorDestroyRefComponent {
  rows: string[][] = [['initial']];
  settings: GridSettings = { licenseKey: LICENSE };

  readonly onDestroyed$ = new Subject<void>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      this.onDestroyed$.next();
      this.onDestroyed$.complete();
    });
  }
}

@Component({
  selector: 'app-multi-sub-host',
  template: `<hot-table [data]="tableData" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class MultiSubHostComponent {
  tableData: string[][] = [['A']];
  settings: GridSettings = { licenseKey: LICENSE };
  updateCount = 0;

  private destroyRef = inject(DestroyRef);

  constructor() {
    const s1$ = new Subject<void>();
    const s2$ = new Subject<void>();

    s1$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateCount++);
    s2$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateCount++);
  }
}

describe('Angular 16 — DestroyRef and takeUntilDestroyed', () => {
  describe('DestroyRefHostComponent', () => {
    let fixture: ComponentFixture<DestroyRefHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [DestroyRefHostComponent] });
      fixture = TestBed.createComponent(DestroyRefHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => {
      externalSubject$.next([]);
      fixture.destroy();
    });

    it('renders hot-table alongside a component using DestroyRef', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('subscription via takeUntilDestroyed updates hot-table data', () => {
      const newData = [['Berlin', 'Germany'], ['Vienna', 'Austria']];
      externalSubject$.next(newData);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('Berlin');
    });

    it('emitting after destruction does not throw', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      const destroySpy = jest.spyOn(hotInstance, 'destroy');

      fixture.destroy();

      expect(() => externalSubject$.next([['post-destroy']])).not.toThrow();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('Handsontable instance is destroyed together with the host component', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.isDestroyed).toBe(false);

      fixture.destroy();

      expect(hotInstance.isDestroyed).toBe(true);
    });
  });

  describe('ConstructorDestroyRefComponent — DestroyRef used inside constructor', () => {
    let fixture: ComponentFixture<ConstructorDestroyRefComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ConstructorDestroyRefComponent] });
      fixture = TestBed.createComponent(ConstructorDestroyRefComponent);
      fixture.detectChanges();
    });

    it('registering a constructor onDestroy callback does not interfere with hot-table', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('destroyRef.onDestroy() callback fires on component destruction', () => {
      const completeSpy = jest.spyOn(fixture.componentInstance.onDestroyed$, 'complete');

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('MultiSubHostComponent — multiple subscriptions with takeUntilDestroyed', () => {
    let fixture: ComponentFixture<MultiSubHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [MultiSubHostComponent] });
      fixture = TestBed.createComponent(MultiSubHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('component with multiple DestroyRef subscriptions still renders hot-table', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });
  });
});
