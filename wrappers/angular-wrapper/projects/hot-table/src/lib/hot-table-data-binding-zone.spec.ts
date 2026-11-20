import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, DoCheck, NgZone, ViewChild } from '@angular/core';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { TEST_LICENSE_KEY } from './test-helpers/license-key';

/**
 * The number of change-detection passes after which the host keeps its rows. It ends a loop that would
 * otherwise never return, so a regression fails the assertions instead of hanging the suite.
 */
const PASS_LIMIT = 50;

/**
 * A host that gives `[data]` a new array on every change-detection pass, as `[data]="getRows(id)"`
 * or `[data]="items.map(...)"` do in a component checked on every pass (`Default` before Angular 22, which
 * made `OnPush` the default).
 */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [HotTableModule],
  template: '<hot-table [settings]="settings" [data]="rows"></hot-table>',
})
class NewArrayPerPassHostComponent implements DoCheck {
  @ViewChild(HotTableComponent) hotTable!: HotTableComponent;

  settings: GridSettings = { licenseKey: TEST_LICENSE_KEY };

  rows: number[][] = [[1, 2], [3, 4]];

  passes = 0;

  ngDoCheck(): void {
    this.passes += 1;

    if (this.passes <= PASS_LIMIT) {
      this.rows = this.rows.map(row => [...row]);
    }
  }
}

describe('HotTableComponent [data] binding that gives a new array on each change-detection pass', () => {
  let fixture: ComponentFixture<NewArrayPerPassHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NewArrayPerPassHostComponent],
    }).compileComponents();
  });

  /**
   * Renders the host, then records the Angular zone state and the array of every `updateData()` call the
   * grid gets.
   */
  function render(settings: GridSettings = {}) {
    fixture = TestBed.createComponent(NewArrayPerPassHostComponent);
    fixture.componentInstance.settings = { licenseKey: TEST_LICENSE_KEY, ...settings };
    fixture.detectChanges();

    const hot = fixture.componentInstance.hotTable.hotInstance;
    const updateData = hot.updateData.bind(hot);
    const updateDataZones: boolean[] = [];
    const loadedArrays: unknown[] = [];

    jest.spyOn(hot, 'updateData').mockImplementation((...args: Parameters<typeof hot.updateData>) => {
      updateDataZones.push(NgZone.isInAngularZone());
      loadedArrays.push(args[0]);

      return updateData(...args);
    });

    return { updateDataZones, loadedArrays };
  }

  it('should run with zone change detection', () => {
    expect(TestBed.inject(NgZone).run(() => NgZone.isInAngularZone())).toBe(true);
  });

  it('should load the new array once per pass and let the page settle', async() => {
    const { updateDataZones, loadedArrays } = render();

    fixture.autoDetectChanges();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.passes).toBeLessThan(PASS_LIMIT);
    expect(updateDataZones.length).toBeGreaterThanOrEqual(1);
    // The first pass created the grid; each pass after it loads its new array once.
    expect(updateDataZones.length).toBe(fixture.componentInstance.passes - 1);
    expect(updateDataZones.every(inZone => !inZone)).toBe(true);
    expect(loadedArrays[loadedArrays.length - 1]).toBe(fixture.componentInstance.rows);
  });

  it('should keep running a hook the settings input declares inside the Angular zone', async() => {
    const hookZones: boolean[] = [];
    const { updateDataZones } = render({
      afterUpdateData: () => {
        hookZones.push(NgZone.isInAngularZone());
      },
    });

    fixture.autoDetectChanges();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.passes).toBeLessThan(PASS_LIMIT);
    expect(updateDataZones.length).toBeGreaterThanOrEqual(1);
    expect(updateDataZones.length).toBe(fixture.componentInstance.passes - 1);
    expect(hookZones.length).toBe(updateDataZones.length);
    expect(hookZones.every(inZone => inZone)).toBe(true);
  });
});
