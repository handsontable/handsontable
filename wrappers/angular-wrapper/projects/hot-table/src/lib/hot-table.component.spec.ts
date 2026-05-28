import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NgZone, SimpleChange, SimpleChanges } from '@angular/core';
import Handsontable from 'handsontable';
import { registerPlugin, CopyPaste } from 'handsontable/plugins';
import { HotTableModule } from './hot-table.module';
import { HOT_DESTROYED_WARNING, HotTableComponent } from './hot-table.component';
import { GridSettings } from './models/grid-settings';
import { createSpreadsheetData } from './test-helpers/create-spreadsheet-data';
import { HotSettingsResolver } from './services/hot-settings-resolver.service';
import { HOT_GLOBAL_CONFIG, HotGlobalConfigService, NON_COMMERCIAL_LICENSE } from './services/hot-global-config.service';
import { DynamicComponentService } from './renderer/hot-dynamic-renderer-component.service';

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

  it(`should render 'hot-table'`, () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = { ...settings };
    fixture.detectChanges();

    const elem = fixture.nativeElement;
    expect(elem.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.hotInstance).toBeDefined();
  });

  it(`should render 'hot-table' even when settings are not provided`, () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.detectChanges();

    const elem = fixture.nativeElement;
    expect(elem.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.hotInstance).toBeDefined();
  });

  it(`should set data`, () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = {};
    fixture.componentInstance.data = createSpreadsheetData(5, 5);
    fixture.detectChanges();

    expect(fixture.componentInstance.hotInstance.getDataAtCell(0, 0)).toBe('A1');
  });

  it(`should render with empty data array`, () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = { ...settings };
    fixture.componentInstance.data = [];
    fixture.detectChanges();

    expect(fixture.componentInstance.hotInstance.countRows()).toBe(0);
  });

  it(`should use data from settings when [data] input is not bound`, () => {
    const settingsData = createSpreadsheetData(3, 3);

    fixture = TestBed.createComponent(HotTableComponent);
    // GridSettings intentionally omits 'data' (users should use [data] binding),
    // but we cast here to verify the runtime merge does not override it with null
    // when [data] is unbound (e.g. JavaScript users or future API changes).
    fixture.componentInstance.settings = {
      ...settings,
      data: settingsData,
    } as unknown as GridSettings;
    // [data] input is intentionally not set — remains null (the default)
    fixture.detectChanges();

    expect(fixture.componentInstance.hotInstance.getDataAtCell(0, 0)).toBe('A1');
    expect(fixture.componentInstance.hotInstance.countRows()).toBe(3);
  });

  it(`should be possible to set some option and pass it to Handsontable`, () => {
    fixture = TestBed.createComponent(HotTableComponent);
    fixture.componentInstance.settings = {
      ...settings,
      rowHeaders: true,
      colHeaders: true,
      width: 300,
      height: 400,
    };

    fixture.detectChanges();

    const handsontableSettings = fixture.componentInstance.hotInstance.getSettings();
    expect(handsontableSettings.rowHeaders).toBe(true);
    expect(handsontableSettings.colHeaders).toBe(true);
    expect(handsontableSettings.width).toBe(300);
    expect(handsontableSettings.height).toBe(400);
  });

  describe('ngOnChanges', () => {
    it('should update Handsontable settings if settings change and it is not the first change', () => {
      const newSettings = { readOnly: true };
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
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

    it('should not update Handsontable settings if it is the first change', () => {
      const newSettings = { data: [[1, 2, 3]] };
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
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

    it('should update Handsontable data if data change and it is not the first change', () => {
      const newData = [[1, 2, 3]];
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      const component = fixture.componentInstance;

      const updateDataSpy = jest.spyOn(component.hotInstance, 'updateData');

      const changes: SimpleChanges = {
        data: new SimpleChange(null, newData, false),
      };

      component.ngOnChanges(changes);
      expect(updateDataSpy).toHaveBeenCalledWith(newData);
    });

    it('should not update Handsontable data if data change and it is the first change', () => {
      const newData = [[1, 2, 3]];
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      const component = fixture.componentInstance;

      const updateDataSpy = jest.spyOn(component.hotInstance, 'updateData');

      const changes: SimpleChanges = {
        data: new SimpleChange(null, newData, true),
      };

      component.ngOnChanges(changes);
      expect(updateDataSpy).not.toHaveBeenCalledWith(newData);
    });

    it('should destroy old editor component refs when settings change with new column objects', () => {
      const editorRefMock = { destroy: jest.fn() } as any;
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        ...settings,
        columns: [{ _editorComponentReference: editorRefMock }],
      };
      fixture.detectChanges();

      const changes: SimpleChanges = {
        settings: new SimpleChange(
          fixture.componentInstance.settings,
          { ...settings, columns: [{}] },
          false
        ),
      };

      fixture.componentInstance.ngOnChanges(changes);

      expect(editorRefMock.destroy).toHaveBeenCalled();
    });

    it('should NOT destroy old editor refs when new settings do not include columns', () => {
      const editorRefMock = { destroy: jest.fn() } as any;
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        ...settings,
        columns: [{ _editorComponentReference: editorRefMock }],
      };
      fixture.detectChanges();

      const changes: SimpleChanges = {
        settings: new SimpleChange(
          fixture.componentInstance.settings,
          { ...settings, readOnly: true },
          false
        ),
      };

      fixture.componentInstance.ngOnChanges(changes);

      expect(editorRefMock.destroy).not.toHaveBeenCalled();
    });

    it('should not pass init-only settings to updateSettings after initialization', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        renderAllRows: false,
        width: 300,
      };
      fixture.detectChanges();
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

    it('should apply each change when settings change multiple times rapidly', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const updateSettingsSpy = jest.spyOn(component.hotInstance, 'updateSettings');

      const rapidChanges = [
        { readOnly: true },
        { readOnly: false },
        { width: 200 },
      ];

      rapidChanges.forEach((next, i) => {
        const prev = i === 0 ? component.settings : rapidChanges[i - 1];
        component.ngOnChanges({
          settings: new SimpleChange(prev, next, false),
        });
      });

      expect(updateSettingsSpy).toHaveBeenCalledTimes(3);
      expect(updateSettingsSpy.mock.calls[2][0]).toMatchObject({ width: 200 });
    });

    it('should handle data changed to empty array', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.componentInstance.data = createSpreadsheetData(3, 3);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const updateDataSpy = jest.spyOn(component.hotInstance, 'updateData');

      component.ngOnChanges({
        data: new SimpleChange(component.data, [], false),
      });

      expect(updateDataSpy).toHaveBeenCalledWith([]);
    });

    it('should handle data changed to null', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.componentInstance.data = createSpreadsheetData(3, 3);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const updateDataSpy = jest.spyOn(component.hotInstance, 'updateData');

      component.ngOnChanges({
        data: new SimpleChange(component.data, null, false),
      });

      expect(updateDataSpy).toHaveBeenCalledWith(null);
    });

    it('should update both settings and data when both change simultaneously', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const updateSettingsSpy = jest.spyOn(component.hotInstance, 'updateSettings');
      const updateDataSpy = jest.spyOn(component.hotInstance, 'updateData');

      const newData = [[1, 2, 3]];
      component.ngOnChanges({
        settings: new SimpleChange(component.settings, { readOnly: true }, false),
        data: new SimpleChange(null, newData, false),
      });

      expect(updateSettingsSpy).toHaveBeenCalled();
      expect(updateDataSpy).toHaveBeenCalledWith(newData);
    });
  });

  describe('ngOnDestroy', () => {
    it('should destroy Handsontable instance and editor component references, when columns property is an array', () => {
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
      const hotInstance = fixture.componentInstance.hotInstance;
      const destroySpy = jest.spyOn(hotInstance, 'destroy');

      fixture.componentInstance.ngOnDestroy();

      expect(editorRefMock.destroy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should destroy Handsontable instance, when columns property is a function', () => {
      fixture = TestBed.createComponent(HotTableComponent);

      fixture.componentInstance.settings = {
        ...settings,
        columns: () => ({ data: 'id' }),
      };

      fixture.detectChanges();
      const hotInstance = fixture.componentInstance.hotInstance;
      const destroySpy = jest.spyOn(hotInstance, 'destroy');

      fixture.componentInstance.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should destroy Handsontable instance, when columns property is undefined', () => {
      fixture = TestBed.createComponent(HotTableComponent);

      fixture.componentInstance.settings = {
        ...settings,
      };

      fixture.detectChanges();
      const hotInstance = fixture.componentInstance.hotInstance;
      const destroySpy = jest.spyOn(hotInstance, 'destroy');

      fixture.componentInstance.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call cleanupContainer on DynamicComponentService before destroying the HOT instance', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();

      const dynamicComponentService = TestBed.inject(DynamicComponentService);
      const cleanupSpy = jest.spyOn(dynamicComponentService, 'cleanupContainer');
      const containerEl = (fixture.componentInstance as any).container.nativeElement;

      fixture.componentInstance.ngOnDestroy();

      expect(cleanupSpy).toHaveBeenCalledWith(containerEl);
    });
  });

  describe('hooks', () => {
    it(`should use Handsontable as a hook's context, if is defined as a function in settings object`, () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        ...settings,
        afterInit: function () {
          return this;
        },
      };
      fixture.detectChanges();

      const instance = fixture.componentInstance.hotInstance.runHooks('afterInit') as unknown as Handsontable;

      expect(instance.getPlugin).toBeDefined();
      expect(instance.getPlugin('copyPaste')).toBeTruthy();
    });

    it(`should allow to block 'before*' hooks`, () => {
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

      component.hotInstance.setDataAtCell(0, 0, 'test');

      expect(afterChangeResult).toBe(false);
    });
  });

  describe('getNegotiatedSettings', () => {
    it('should return early from ngOnChanges when hotInstance is null', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();

      jest.spyOn(fixture.componentInstance, 'hotInstance', 'get').mockReturnValue(null);

      const hotSettingsResolver = fixture.componentRef.injector.get(HotSettingsResolver);
      const applyCustomSettingsSpy = jest.spyOn(hotSettingsResolver, 'applyCustomSettings');

      const changes: SimpleChanges = {
        settings: new SimpleChange(null, { readOnly: true }, false),
      };

      fixture.componentInstance.ngOnChanges(changes);

      expect(applyCustomSettingsSpy).not.toHaveBeenCalled();
    });

    it('should pass theme from global config to Handsontable init options', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HotTableModule],
        providers: [
          { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE, theme: 'ht-theme-main' } },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();

      expect(fixture.componentInstance.hotInstance).toBeTruthy();
    });

    it('should pass themeName from settings to Handsontable init options', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        ...settings,
        themeName: 'ht-theme-main' as any,
      };
      fixture.detectChanges();

      expect(fixture.componentInstance.hotInstance).toBeTruthy();
    });

    it('should update Handsontable when global config changes after initialization', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();
      const updateSettingsSpy = jest.spyOn(fixture.componentInstance.hotInstance, 'updateSettings');

      TestBed.inject(HotGlobalConfigService).setConfig({ license: NON_COMMERCIAL_LICENSE });

      expect(updateSettingsSpy).toHaveBeenCalled();
    });

    it('should pass language from global config when settings does not specify it', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HotTableModule],
        providers: [
          { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE, language: 'en-US' } },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      const updateSettingsSpy = jest.spyOn(fixture.componentInstance.hotInstance, 'updateSettings');

      TestBed.inject(HotGlobalConfigService).setConfig({ license: NON_COMMERCIAL_LICENSE, language: 'en-US' });

      expect(updateSettingsSpy).toHaveBeenCalled();
      const calledWith = updateSettingsSpy.mock.calls[0][0];
      expect(calledWith.language).toBe('en-US');
    });

    it('should not pass layoutDirection from global config when triggered after initialization', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();
      const updateSettingsSpy = jest.spyOn(fixture.componentInstance.hotInstance, 'updateSettings');

      TestBed.inject(HotGlobalConfigService).setConfig({ license: NON_COMMERCIAL_LICENSE, layoutDirection: 'rtl' });

      expect(updateSettingsSpy).toHaveBeenCalled();
      const calledWith = updateSettingsSpy.mock.calls[0][0];
      expect(calledWith.layoutDirection).toBeUndefined();
    });

    it('should prefer theme over themeName when both are provided in global config', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HotTableModule],
        providers: [
          {
            provide: HOT_GLOBAL_CONFIG,
            useValue: { license: NON_COMMERCIAL_LICENSE, theme: 'ht-theme-main', themeName: 'ht-theme-horizon' },
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {};
      fixture.detectChanges();
      const updateSettingsSpy = jest.spyOn(fixture.componentInstance.hotInstance, 'updateSettings');

      TestBed.inject(HotGlobalConfigService).setConfig({
        license: NON_COMMERCIAL_LICENSE,
        theme: 'ht-theme-main',
        themeName: 'ht-theme-horizon',
      });

      expect(updateSettingsSpy).toHaveBeenCalled();
      const calledWith = updateSettingsSpy.mock.calls[0][0];
      expect(calledWith.theme).toBe('ht-theme-main');
      expect(calledWith.themeName).toBeUndefined();
    });
  });

  describe('hotInstance getter', () => {
    it('should return null and emit HOT_DESTROYED_WARNING when the HOT instance has been destroyed', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { ...settings };
      fixture.detectChanges();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Destroy HOT directly — bypasses ngOnDestroy so the private ref stays set
      (fixture.componentInstance as any).__hotInstance.destroy();

      const result = fixture.componentInstance.hotInstance;

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(HOT_DESTROYED_WARNING);
      warnSpy.mockRestore();
    });
  });

  describe('NgZone hook wrapping', () => {
    it('should run hook callbacks inside Angular zone even when triggered from outside', () => {
      fixture = TestBed.createComponent(HotTableComponent);
      const ngZone = TestBed.inject(NgZone);
      let capturedZoneState = false;

      fixture.componentInstance.settings = {
        ...settings,
        afterInit: function () {
          capturedZoneState = NgZone.isInAngularZone();
        },
      };
      fixture.detectChanges();

      ngZone.runOutsideAngular(() => {
        fixture.componentInstance.hotInstance.runHooks('afterInit');
      });

      expect(capturedZoneState).toBe(true);
    });
  });
});
