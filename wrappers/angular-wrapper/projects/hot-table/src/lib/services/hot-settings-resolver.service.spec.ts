import { TestBed } from '@angular/core/testing';
import {Component, CUSTOM_ELEMENTS_SCHEMA, EnvironmentInjector} from '@angular/core';

import { DynamicComponentService } from '../renderer/hot-dynamic-renderer-component.service';
import { HotSettingsResolver } from './hot-settings-resolver.service';
import { GridSettings } from '../models/grid-settings';
import { ColumnSettings, ColumnSettingsInternal } from '../models/column-settings';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { TextEditor } from 'handsontable/editors';

@Component({})
class TestRendererComponent extends HotCellRendererComponent {}

@Component({})
class TestEditorComponent extends HotCellEditorComponent<number> {
  onFocus(): void {}
}

class TestClaseBasedEditor extends TextEditor {}

describe('HotSettingsResolver', () => {
  let service: HotSettingsResolver;

  let dynamicComponentService: DynamicComponentService;

  beforeEach(() => {
    const dynamicServiceSpy = {
      createRendererFromComponent: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        HotSettingsResolver,
        { provide: DynamicComponentService, useValue: dynamicServiceSpy },
        EnvironmentInjector
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });

    dynamicComponentService = TestBed.inject(DynamicComponentService);
    service = TestBed.inject(HotSettingsResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update column renderer for given custom renderer', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          renderer: TestRendererComponent,
          rendererProps: { prop: 'value' },
        } as ColumnSettings,
      ],
    };
    service.applyCustomSettings(mergedSettings, undefined);
    expect(dynamicComponentService.createRendererFromComponent).toHaveBeenCalled();
  });

  it('should not update column renderer when no renderer set', () => {
    const mergedSettings: GridSettings = {
      columns: [{} as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings, undefined);

    expect(dynamicComponentService.createRendererFromComponent).not.toHaveBeenCalled();
  });

  it('should not update column renderer when renderer is string', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          renderer: 'numeric',
        } as ColumnSettings,
      ],
    };
    service.applyCustomSettings(mergedSettings, undefined);

    expect(dynamicComponentService.createRendererFromComponent).not.toHaveBeenCalled();
    expect(mergedSettings.columns[0].renderer).toBe('numeric');
  });

  it('should not update column renderer when renderer is function', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          renderer: (instance, TD, row, column, prop, value, cellProp) => {},
        } as ColumnSettings,
      ],
    };
    service.applyCustomSettings(mergedSettings, undefined);

    expect(dynamicComponentService.createRendererFromComponent).not.toHaveBeenCalled();
  });

  it('should update column editor for given custom editor', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          editor: TestEditorComponent,
        } as ColumnSettings,
      ],
    };
    const envInjector = TestBed.inject(EnvironmentInjector);
    service.applyCustomSettings(mergedSettings, undefined);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBeDefined();
    expect(settings._editorComponentReference.instance instanceof TestEditorComponent).toBe(true);
    expect(settings._environmentInjector).toBe(envInjector);
  });

  it('should not update column editor when no custom editor set', () => {
    const mergedSettings: GridSettings = {
      columns: [{ editor: 'text' } as ColumnSettings],
    };

    service.applyCustomSettings(mergedSettings, undefined);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBe('text');
    expect(settings._editorComponentReference).toBeUndefined();
    expect(settings._environmentInjector).toBeUndefined();
  });

  it('should not update column editor when editor is class', () => {
    const mergedSettings: GridSettings = {
      columns: [{ editor: TestClaseBasedEditor } as ColumnSettings],
    };

    service.applyCustomSettings(mergedSettings, undefined);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBe(TestClaseBasedEditor);
    expect(settings._editorComponentReference).toBeUndefined();
    expect(settings._environmentInjector).toBeUndefined();
  });

  it('should update column validator for given custom validator', () => {
    const mergedSettings: GridSettings = {
      columns: [{ validator: (value: any) => true } as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings, undefined);
    expect(mergedSettings.columns[0].validator).toBeDefined();
    expect(mergedSettings.columns[0].validator.length).toBe(2);
  });

  it('should not update column validator when validator is string', () => {
    const mergedSettings: GridSettings = {
      columns: [{ validator: 'numeric' } as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings, undefined);
    expect(mergedSettings.columns[0].validator).toBe('numeric');
  });

  it('should not update column validator when validator is RegEx', () => {
    const mergedSettings: GridSettings = {
      columns: [{ validator: /^abc/ } as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings, undefined);
    expect(mergedSettings.columns[0].validator).toEqual(/^abc/);
  });

  it('should not update column validator when validator is function with callback', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          validator: (value: string, callback: (result: boolean) => void) => callback(true),
        } as ColumnSettings,
      ],
    };
    service.applyCustomSettings(mergedSettings, undefined);
    expect(mergedSettings.columns[0].validator.length).toBe(2);
  });
});
