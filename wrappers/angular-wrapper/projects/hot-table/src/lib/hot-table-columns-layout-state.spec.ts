import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, ManualColumnResize } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { TEST_LICENSE_KEY } from './test-helpers/license-key';

registerPlugin(ManualColumnResize);

const ALL_COLUMNS = ['a', 'b', 'c', 'd'];

/**
 * Builds the rows of a grid whose columns are the given property names.
 */
function buildData(props: string[]) {
  return [1, 2, 3].map(rank => Object.fromEntries(props.map(prop => [prop, `${prop}${rank}`])));
}

/**
 * Builds the `columns` option for the given property names.
 */
function buildColumns(props: string[]) {
  return props.map(data => ({ data }));
}

/**
 * The component passes `data` with every `settings` change, so a change of `columns` reaches the core as
 * `{ data, columns }`, and the column state must follow the layout.
 */
describe('HotTableComponent column state when `columns` changes', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  /**
   * Renders the component with a manual width on the third column.
   */
  function render(settings: GridSettings) {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = { licenseKey: TEST_LICENSE_KEY, ...settings };
    fixture.detectChanges();

    const component = fixture.componentInstance;

    component.hotInstance.getPlugin('manualColumnResize').setManualSize(2, 222);

    return component;
  }

  /**
   * Passes a new `settings` object that carries the given props as `data` and `columns`.
   */
  function changeColumns(component: HotTableComponent, settings: GridSettings, props: string[]) {
    component.ngOnChanges({
      settings: new SimpleChange(settings, {
        ...settings,
        data: buildData(props),
        columns: buildColumns(props),
      }, false),
    });
  }

  it('should start a manual width over when a column before it is removed', () => {
    const settings = {
      data: buildData(ALL_COLUMNS),
      columns: buildColumns(ALL_COLUMNS),
      manualColumnResize: true,
      height: 200,
    } as GridSettings;
    const component = render(settings);

    expect(component.hotInstance.getColWidth(2)).toBe(222);

    changeColumns(component, settings, ['b', 'c', 'd']);

    expect(component.hotInstance.countCols()).toBe(3);
    expect([0, 1, 2].map(column => component.hotInstance.getColWidth(column))).not.toContain(222);
  });

  it('should keep a manual width when the last column is removed', () => {
    const settings = {
      data: buildData(ALL_COLUMNS),
      columns: buildColumns(ALL_COLUMNS),
      manualColumnResize: true,
      height: 200,
    } as GridSettings;
    const component = render(settings);

    changeColumns(component, settings, ['a', 'b', 'c']);

    expect(component.hotInstance.countCols()).toBe(3);
    expect(component.hotInstance.getColWidth(2)).toBe(222);
  });
});
