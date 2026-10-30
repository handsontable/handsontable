import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, Search } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';

registerPlugin(Search);

/**
 * The `search` options through the Angular wrapper: a change of the `settings` input sends every key again.
 */
describe('HotTableComponent with `search`', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  /**
   * Builds the wrapper with the given settings and returns its Search plugin.
   *
   * @param settings The `settings` input.
   * @returns The Search plugin.
   */
  function createGrid(settings: GridSettings): Search {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = settings;
    fixture.detectChanges();

    const plugin = fixture.componentInstance.hotInstance.getPlugin('search');

    if (!(plugin instanceof Search)) {
      throw new Error('The Search plugin is not registered.');
    }

    return plugin;
  }

  /**
   * Hands the wrapper a new `settings` input.
   *
   * @param next The new `settings` input.
   */
  function changeSettings(next: GridSettings) {
    const component = fixture.componentInstance;

    component.settings = next;
    component.ngOnChanges({ settings: new SimpleChange(null, next, false) });
  }

  it('should keep a query method set through the plugin API when an unrelated setting changes', () => {
    const queryMethod = jest.fn(() => false);
    const settings = (): GridSettings => ({
      licenseKey: NON_COMMERCIAL_LICENSE,
      data: [['apple'], ['plum']],
      search: true,
    });
    const plugin = createGrid(settings());

    plugin.setQueryMethod(queryMethod);
    changeSettings({ ...settings(), height: 300 });

    expect(fixture.componentInstance.hotInstance.getSettings().height).toBe(300);
    expect(plugin.getQueryMethod()).toBe(queryMethod);
  });

  it('should drop the object options once `search` changes to `true`', () => {
    const queryMethod = jest.fn(() => true);
    const plugin = createGrid({
      licenseKey: NON_COMMERCIAL_LICENSE,
      data: [['apple'], ['plum']],
      search: { queryMethod, searchResultClass: 'my-hit' },
    });

    changeSettings({
      licenseKey: NON_COMMERCIAL_LICENSE,
      data: [['apple'], ['plum']],
      search: true,
    });

    expect(plugin.getQueryMethod()).not.toBe(queryMethod);
    expect(plugin.getSearchResultClass()).toBe('htSearchResult');
  });
});
