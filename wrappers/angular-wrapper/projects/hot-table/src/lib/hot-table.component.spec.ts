import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange, SimpleChanges } from '@angular/core';
import Handsontable from 'handsontable';
import { registerPlugin, CopyPaste } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { createSpreadsheetData } from './test-helpers/create-spreadsheet-data';
import { HotSettingsResolver } from './services/hot-settings-resolver.service';
import { NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';

registerPlugin(CopyPaste);

describe('HotTableComponent', () => {
  let fixture: ComponentFixture<HotTableComponent>;
  const settings = <GridSettings>{
    licenseKey: NON_COMMERCIAL_LICENSE,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

  });

  it(`should render 'hot-table'`, async () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = { ...settings };
    fixture.detectChanges();
    await fixture.whenStable();

    const elem = fixture.nativeElement;
    expect(elem.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.hotInstance).toBeDefined();
  });

  it(`should render 'hot-table' even when settings are not provided`, async () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const elem = fixture.nativeElement;
    expect(elem.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.hotInstance).toBeDefined();
  });

  it(`should set data`, async () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = {};
    fixture.componentInstance.data = createSpreadsheetData(5, 5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.hotInstance.getDataAtCell(0, 0)).toBe('A1');
  });

  it(`should be possible to set some option and pass it to Handsontable`, async () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = {
      ...settings,
      rowHeaders: true,
      colHeaders: true,
      width: 300,
      height: 400,
    };

    fixture.detectChanges();
    await fixture.whenStable();

    const handsontableSettings = fixture.componentInstance.hotInstance.getSettings();
    expect(handsontableSettings.rowHeaders).toBe(true);
    expect(handsontableSettings.colHeaders).toBe(true);
    expect(handsontableSettings.width).toBe(300);
    expect(handsontableSettings.height).toBe(400);
  });

  describe('ngOnChanges', () => {
    it('should update Handsontable settings if settings change and it is not the first change', async () => {
      const newSettings = { readOnly: true };
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      await fixture.whenStable();
      const hotSettingsResolver = fixture.componentRef.injector.get(HotSettingsResolver);
      const component = fixture.componentInstance;
      const applyCustomSettingsSpy = jest.spyOn(hotSettingsResolver, 'applyCustomSettings');
      const updateHotTableSpy = jest.spyOn(component.hotInstance, 'updateSettings');

      const changes: SimpleChanges = {
        settings: new SimpleChange(null, newSettings, false),
      };

      component.ngOnChanges(changes);

      expect(applyCustomSettingsSpy).toHaveBeenCalledWith(newSettings);
      expect(updateHotTableSpy).toHaveBeenCalledWith(newSettings, false);
    });

    it('should not update Handsontable settings if it is the first change', async () => {
      const newSettings = { data: [[1, 2, 3]] };
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      await fixture.whenStable();
      const hotSettingsResolver = fixture.componentRef.injector.get(HotSettingsResolver);
      const applyCustomSettingsSpy = jest.spyOn(hotSettingsResolver, 'applyCustomSettings');
      const component = fixture.componentInstance;
      const updateHotTableSpy = jest.spyOn(component.hotInstance, 'updateSettings');

      const changes: SimpleChanges = {
        settings: new SimpleChange(null, newSettings, true),
      };

      component.ngOnChanges(changes);

      expect(applyCustomSettingsSpy).not.toHaveBeenCalled();
      expect(updateHotTableSpy).not.toHaveBeenCalled();
    });

    it('should update Handsontable data if data change and it is not the first change', async () => {
      const newData = [[1, 2, 3]];
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      await fixture.whenStable();
      const component = fixture.componentInstance;

      const updateDataSpy = jest.spyOn(component.hotInstance, 'updateData');

      const changes: SimpleChanges = {
        data: new SimpleChange(null, newData, false),
      };

      component.ngOnChanges(changes);
      expect(updateDataSpy).toHaveBeenCalledWith(newData);
    });

    it('should not update Handsontable data if data change and it is the first change', async () => {
      const newData = [[1, 2, 3]];
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      await fixture.whenStable();
      const component = fixture.componentInstance;

      const updateDataSpy = jest.spyOn(component.hotInstance, 'updateData');

      const changes: SimpleChanges = {
        data: new SimpleChange(null, newData, true),
      };

      component.ngOnChanges(changes);
      expect(updateDataSpy).not.toHaveBeenCalledWith(newData);
    });

    it('should not pass init-only settings to updateSettings after initialization', async () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        renderAllRows: false,
        width: 300,
      };
      fixture.detectChanges();
      await fixture.whenStable();
      const component = fixture.componentInstance;
      const updateSettingsSpy = jest.spyOn(component.hotInstance, 'updateSettings');

      const changes: SimpleChanges = {
        settings: new SimpleChange(
          { renderAllRows: false, width: 300 },
          { renderAllRows: true, width: 500 },
          false
        ),
      };

      component.ngOnChanges(changes);

      const passedSettings = updateSettingsSpy.mock.calls[0][0];

      expect(passedSettings.renderAllRows).toBe(void 0);
      expect(passedSettings.width).toBe(500);
    });
  });

  describe('ngOnDestroy', () => {
    it('should destroy Handsontable instance and editor component references, when columns property is an array', async () => {
      fixture = TestBed.createComponent(HotTableComponent);
      const editorRefMock = {
        destroy: jest.fn(),
      } as any;
      fixture.componentInstance.settings = {
        ...settings,
        columns: [
          {
            _editorComponentReference: editorRefMock,
          },
        ],
      };
      fixture.detectChanges();
      await fixture.whenStable();
      const hotInstance = fixture.componentInstance.hotInstance;
      const destroySpy = jest.spyOn(hotInstance, 'destroy');

      fixture.componentInstance.ngOnDestroy();

      expect(editorRefMock.destroy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should destroy Handsontable instance, when columns property is a function', async () => {
      fixture = TestBed.createComponent(HotTableComponent);

      fixture.componentInstance.settings = {
        ...settings,
        columns: () => ({ data: 'id' }),
      };

      fixture.detectChanges();
      await fixture.whenStable();
      const hotInstance = fixture.componentInstance.hotInstance;
      const destroySpy = jest.spyOn(hotInstance, 'destroy');

      fixture.componentInstance.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should destroy Handsontable instance, when columns property is undefined', async () => {
      fixture = TestBed.createComponent(HotTableComponent);

      fixture.componentInstance.settings = {
        ...settings,
      };

      fixture.detectChanges();
      await fixture.whenStable();
      const hotInstance = fixture.componentInstance.hotInstance;
      const destroySpy = jest.spyOn(hotInstance, 'destroy');

      fixture.componentInstance.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should not create Handsontable instance if component is destroyed before microtask resolves', async () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();

      // Destroy before the pending Promise resolves
      fixture.componentInstance.ngOnDestroy();
      await fixture.whenStable();

      expect(fixture.componentInstance.hotInstance).toBeNull();
    });
  });

  describe('hooks', () => {
    it(`should use Handsontable as a hook's context, if is defined as a component's method`, async () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        ...settings,
        afterInit: function () {
          return this;
        },
      };
      fixture.detectChanges();
      await fixture.whenStable();

      const instance: Handsontable = fixture.componentInstance.hotInstance;
      instance.runHooks('afterInit');

      expect(instance.getPlugin).toBeDefined();
      expect(instance.getPlugin('copyPaste')).toBeTruthy();
    });

    it(`should use Handsontable as a hook's context, if is defined as a function in settings object`, async () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        ...settings,
        afterInit: function () {
          return this;
        },
      };
      fixture.detectChanges();
      await fixture.whenStable();

      const instance: Handsontable = fixture.componentInstance.hotInstance.runHooks('afterInit');

      expect(instance.getPlugin).toBeDefined();
      expect(instance.getPlugin('copyPaste')).toBeTruthy();
    });

    it(`should allow to block 'before*' hooks`, async () => {
      fixture = TestBed.createComponent(HotTableComponent);
      const component = fixture.componentInstance;
      component.settings = {
        ...settings,
        beforeChange: function () {
          return false;
        },
        afterChange: function (changes, source) {
          // `afterChange` is called once during the initialisation
          if (source === 'edit') {
            afterChangeResult = true;
          }
        },
      };
      let afterChangeResult = false;
      fixture.detectChanges();
      await fixture.whenStable();

      component.hotInstance.setDataAtCell(0, 0, 'test');

      expect(afterChangeResult).toBe(false);
    });
  });
});
