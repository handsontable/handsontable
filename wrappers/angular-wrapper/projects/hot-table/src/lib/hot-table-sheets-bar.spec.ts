import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, SheetsBar } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';

registerPlugin(SheetsBar);

/**
 * The sheets bar through the Angular wrapper: a change of the `settings` input sends every key again, and
 * the visible sheet keeps the settings it declares.
 */
describe('HotTableComponent with a sheets bar', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should keep the visible sheet\'s own headers when the `settings` input changes', () => {
    const sheets = [
      { name: 'Plain', data: [[1, 2]] },
      { name: 'Own', data: [[3, 4]], settings: { colHeaders: ['X', 'Y'] } },
    ];
    const settings = () => ({
      licenseKey: NON_COMMERCIAL_LICENSE,
      colHeaders: ['a', 'b'],
      sheetsBar: { sheets },
    });

    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = settings();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const hot = component.hotInstance;
    const plugin = hot.getPlugin('sheetsBar');

    if (!(plugin instanceof SheetsBar)) {
      throw new Error('The SheetsBar plugin is not registered.');
    }

    plugin.setActiveSheet('Own');

    const next = { ...settings(), height: 300 };

    component.settings = next;
    component.ngOnChanges({ settings: new SimpleChange(null, next, false) });

    expect(hot.getColHeader(0)).toBe('X');

    plugin.setActiveSheet('Plain');

    expect(hot.getColHeader(0)).toBe('a');
  });
});
