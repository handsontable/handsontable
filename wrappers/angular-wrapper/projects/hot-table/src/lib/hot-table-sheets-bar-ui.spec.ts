import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { registerPlugin, SheetsBar } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { TEST_LICENSE_KEY } from './test-helpers/license-key';

registerPlugin(SheetsBar);

const sheets = [
  { name: 'Budget', data: [[1]] },
  { name: 'Forecast', data: [[2]] },
  { name: 'Notes', data: [[3]] },
];

/**
 * The `settings` input with three sheets.
 *
 * @param extra Settings to add.
 * @returns The settings.
 */
function settingsWith(extra: Record<string, unknown> = {}) {
  return { licenseKey: TEST_LICENSE_KEY, sheetsBar: { sheets }, ...extra };
}

/**
 * The sheets bar's DOM, ARIA and keyboard through the Angular wrapper.
 */
describe('HotTableComponent sheets bar UI', () => {
  let fixture: ComponentFixture<HotTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = settingsWith();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should render the tab strip as a labeled group with the active tab marked', () => {
    const strip = fixture.componentInstance.hotInstance.rootWrapperElement.querySelector('.ht-sheets-bar__tabs');
    const tabs = strip.querySelectorAll('.ht-sheets-bar__tab');

    expect(strip.getAttribute('role')).toBe('group');
    expect(strip.getAttribute('aria-label')).toBe('Sheets');
    expect(tabs.length).toBe(3);
    expect(tabs[0].getAttribute('role')).toBe('button');
    expect(tabs[0].getAttribute('aria-current')).toBe('true');
    expect(tabs[1].getAttribute('aria-current')).toBe(null);
  });

  it('should keep the keyboard focus and the roving Tab stop on the same tab when the `settings` input changes', () => {
    const component = fixture.componentInstance;
    const hot = component.hotInstance;
    const tabs = () => hot.rootWrapperElement.querySelectorAll<HTMLElement>('.ht-sheets-bar__tab');

    hot.listen();
    hot.getFocusScopeManager().activateScope('sheetsBar');
    tabs()[0].focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    const focused = tabs()[1];

    expect(document.activeElement).toBe(focused);
    expect(focused.tabIndex).toBe(0);
    expect(tabs()[0].tabIndex).toBe(-1);

    const next = settingsWith({ height: 300 });

    component.settings = next;
    component.ngOnChanges({ settings: new SimpleChange(null, next, false) });

    expect(hot.getSettings().height).toBe(300);
    expect(tabs()[1]).toBe(focused);
    expect(document.activeElement).toBe(focused);
    expect(focused.tabIndex).toBe(0);
    expect(hot.getPlugin('sheetsBar').getSheets()[0].isActive).toBe(true);
  });
});
