import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NgZone, SimpleChange, SimpleChanges } from '@angular/core';
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
  let zone;

  let fixture: ComponentFixture<HotTableComponent>;
  const settings = <GridSettings>{
    licenseKey: NON_COMMERCIAL_LICENSE,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HotTableModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    zone = TestBed.inject(NgZone)
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

      expect(applyCustomSettingsSpy).toHaveBeenCalledWith(newSettings, zone);
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
  });

  describe('hooks', () => {
    it(`should use Handsontable as a hook's context, if is defined as a component's method`, () => {
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = {
        ...settings,
        afterInit: function () {
          return this;
        },
      };
      fixture.detectChanges();

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

      const instance: Handsontable = fixture.componentInstance.hotInstance.runHooks('afterInit');

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
});
