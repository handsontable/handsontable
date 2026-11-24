import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from './services/hot-global-config.service';
import { GridSettings } from './models/grid-settings';
import { TEST_LICENSE_KEY } from './test-helpers/license-key';

/**
 * A key no reader accepts, so a grid built with it is locked.
 */
const UNREADABLE_KEY = 'not-a-handsontable-license-key';

/**
 * The license key through the Angular wrapper. The core reads the key once, while the grid is built, so
 * a key the wrapper passed later (in an `updateSettings()` after the constructor) would leave the grid
 * behind the license lock. The key comes from the `settings` input or from `HOT_GLOBAL_CONFIG.license`,
 * and the input wins.
 */
describe('HotTableComponent license key', () => {
  let fixture: ComponentFixture<HotTableComponent>;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    // The core prints its license message once per page, so only the first grid of a file would show it:
    // these tests read the lock, which every grid draws on its own, and the spy keeps the output quiet.
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fixture?.destroy();
    warn.mockRestore();
  });

  /**
   * Builds the wrapper with a global configuration and a `settings` input, and returns its instance.
   *
   * @param globalConfig The `HOT_GLOBAL_CONFIG` value.
   * @param settings The `settings` input.
   * @returns The Handsontable instance.
   */
  function createGrid(globalConfig: HotGlobalConfig, settings: GridSettings) {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: globalConfig }],
    }).compileComponents();

    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = settings;
    fixture.detectChanges();

    return fixture.componentInstance.hotInstance;
  }

  /**
   * Whether the grid shows the license lock. The root wrapper is asserted first: a grid with no wrapper
   * would otherwise read as locked or unlocked without any lock being checked.
   *
   * @param hot The instance.
   * @param hot.rootElement The instance's root element.
   * @returns `true` when the lock is in the grid's root wrapper.
   */
  function isLocked(hot: { rootElement: HTMLElement }): boolean {
    const wrapper = hot.rootElement.closest('.ht-root-wrapper');

    expect(wrapper).not.toBeNull();

    return wrapper?.querySelector('.ht-license-lock') !== null;
  }

  it('should build a grid without a key behind the license lock', () => {
    const hot = createGrid({}, { data: [['A1', 'B1']] });

    expect(isLocked(hot)).toBe(true);
  });

  it('should build a grid with the key from `HOT_GLOBAL_CONFIG.license` unlocked', () => {
    const hot = createGrid({ license: TEST_LICENSE_KEY }, { data: [['A1', 'B1']] });

    expect(hot.getSettings().licenseKey).toBe(TEST_LICENSE_KEY);
    expect(isLocked(hot)).toBe(false);
  });

  it('should build a grid with the key from the `settings` input over the global one', () => {
    const hot = createGrid({ license: UNREADABLE_KEY }, { data: [['A1', 'B1']], licenseKey: TEST_LICENSE_KEY });

    expect(hot.getSettings().licenseKey).toBe(TEST_LICENSE_KEY);
    expect(isLocked(hot)).toBe(false);
  });

  it('should lock a grid whose `settings` key is unreadable, whatever the global key', () => {
    const hot = createGrid({ license: TEST_LICENSE_KEY }, { data: [['A1', 'B1']], licenseKey: UNREADABLE_KEY });

    expect(hot.getSettings().licenseKey).toBe(UNREADABLE_KEY);
    expect(isLocked(hot)).toBe(true);
  });
});
