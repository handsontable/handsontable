/**
 * Cleanup and memory-leak prevention tests
 *
 * Verifies that hot-table and Handsontable core release all resources when
 * Angular destroys a component. Covers the subset that is testable in jsdom:
 *
 * - DOM nodes removed from the document after destroy
 * - Handsontable instance marked as destroyed (no dangling core object)
 * - No DOM left behind when @if hides the component
 * - Multiple instances all cleaned up when the parent is destroyed
 * - Re-mounting creates a fresh instance (no state leak from prior mount)
 * - Subscriptions created with takeUntilDestroyed() stop emitting after destroy
 */

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { HotTableComponent, GridSettings, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

const LICENSE = NON_COMMERCIAL_LICENSE;

// ─── Basic host ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-cleanup-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class CleanupHostComponent {
  data: string[][] = [['a', 'b']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── @if host ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-if-cleanup-host',
  template: `
    @if (show()) {
      <hot-table [data]="data" [settings]="settings"></hot-table>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class IfCleanupHostComponent {
  show = signal(true);
  data: string[][] = [['x']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── Multiple instances host ──────────────────────────────────────────────────

@Component({
  selector: 'app-multi-cleanup-host',
  template: `
    @for (id of ids; track id) {
      <hot-table [data]="data" [settings]="settings"></hot-table>
    }
  `,
  standalone: true,
  imports: [HotTableComponent],
})
class MultiCleanupHostComponent {
  ids = [1, 2, 3];
  data: string[][] = [['row']];
  settings: GridSettings = { licenseKey: LICENSE };
}

// ─── Subscription host ────────────────────────────────────────────────────────

@Component({
  selector: 'app-subscription-host',
  template: `<hot-table [data]="data" [settings]="settings"></hot-table>`,
  standalone: true,
  imports: [HotTableComponent],
})
class SubscriptionHostComponent {
  data: string[][] = [['s']];
  settings: GridSettings = { licenseKey: LICENSE };
  emitCount = 0;

  private source$ = new Subject<void>();

  constructor() {
    this.source$
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.emitCount++);
  }

  emit(): void { this.source$.next(); }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Cleanup — DOM and instance teardown', () => {
  describe('Single instance', () => {
    let fixture: ComponentFixture<CleanupHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [CleanupHostComponent] });
      fixture = TestBed.createComponent(CleanupHostComponent);
      fixture.detectChanges();
    });

    it('marks the HOT instance as destroyed after fixture.destroy()', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.isDestroyed).toBe(false);

      fixture.destroy();

      expect(hotInstance.isDestroyed).toBe(true);
    });

    it('removes .handsontable DOM nodes from the fixture after destroy', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);

      fixture.destroy();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBe(0);
    });

  });

  describe('@if — conditional mount / unmount', () => {
    let fixture: ComponentFixture<IfCleanupHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [IfCleanupHostComponent] });
      fixture = TestBed.createComponent(IfCleanupHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('DOM is present while @if is true', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });

    it('removes all .handsontable DOM nodes when @if becomes false', () => {
      fixture.componentInstance.show.set(false);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBe(0);
    });

    it('HOT instance is destroyed when @if becomes false', () => {
      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;

      fixture.componentInstance.show.set(false);
      fixture.detectChanges();

      expect(hotInstance.isDestroyed).toBe(true);
    });

    it('re-enabling @if creates a new, independent HOT instance', () => {
      const first = fixture.debugElement.children[0].componentInstance.hotInstance;

      fixture.componentInstance.show.set(false);
      fixture.detectChanges();
      fixture.componentInstance.show.set(true);
      fixture.detectChanges();

      const second = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(second).not.toBe(first);
      expect(second.isDestroyed).toBe(false);
    });

    it('re-mounted instance has no state from the previous mount', () => {
      fixture.componentInstance.show.set(false);
      fixture.detectChanges();
      fixture.componentInstance.show.set(true);
      fixture.detectChanges();

      const hotInstance = fixture.debugElement.children[0].componentInstance.hotInstance;
      expect(hotInstance.getDataAtCell(0, 0)).toBe('x');
    });
  });

  describe('Multiple instances — all destroyed together', () => {
    let fixture: ComponentFixture<MultiCleanupHostComponent>;
    let instances: any[];

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [MultiCleanupHostComponent] });
      fixture = TestBed.createComponent(MultiCleanupHostComponent);
      fixture.detectChanges();
      instances = fixture.debugElement.children.map(
        (child) => child.componentInstance.hotInstance
      );
    });

    it('creates one HOT instance per @for item', () => {
      expect(instances.length).toBe(3);
      instances.forEach((inst) => expect(inst.isDestroyed).toBe(false));
    });

    it('destroys all HOT instances when the parent fixture is destroyed', () => {
      fixture.destroy();

      instances.forEach((inst) => expect(inst.isDestroyed).toBe(true));
    });

    it('removes all .handsontable nodes when the parent fixture is destroyed', () => {
      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBeGreaterThan(0);

      fixture.destroy();

      expect(fixture.nativeElement.querySelectorAll('.handsontable').length).toBe(0);
    });
  });

  describe('takeUntilDestroyed() — subscription lifetime', () => {
    let fixture: ComponentFixture<SubscriptionHostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [SubscriptionHostComponent] });
      fixture = TestBed.createComponent(SubscriptionHostComponent);
      fixture.detectChanges();
    });

    it('subscription receives emissions while the component is alive', () => {
      fixture.componentInstance.emit();
      fixture.componentInstance.emit();
      expect(fixture.componentInstance.emitCount).toBe(2);
    });

    it('subscription stops after component is destroyed', () => {
      fixture.componentInstance.emit();
      const countBeforeDestroy = fixture.componentInstance.emitCount;

      fixture.destroy();

      fixture.componentInstance.emit();
      expect(fixture.componentInstance.emitCount).toBe(countBeforeDestroy);
    });
  });
});
