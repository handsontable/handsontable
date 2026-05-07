import { TestBed } from '@angular/core/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EnvironmentInjector } from '@angular/core';

import { DynamicComponentService } from '../renderer/hot-dynamic-renderer-component.service';
import { HotSettingsResolver } from './hot-settings-resolver.service';
import { GridSettings } from '../models/grid-settings';
import { ColumnSettings, ColumnSettingsInternal } from '../models/column-settings';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorAdvancedComponent } from '../editor/hot-cell-editor-advanced.component';
import { HotCellRendererAdvancedComponent } from '../renderer/hot-cell-renderer-advanced.component';
import { TextEditor } from 'handsontable/editors';

@Component({
  standalone: true,
})
class TestRendererComponent extends HotCellRendererComponent {}

@Component({
  standalone: true,
})
class TestRendererAdvancedComponent extends HotCellRendererAdvancedComponent {}

@Component({
  standalone: true,
})
class TestEditorComponent extends HotCellEditorComponent<number> {
  onFocus(): void {}
}

@Component({
  standalone: true,
})
class TestEditorAdvancedComponent extends HotCellEditorAdvancedComponent<number> {}

class TestClaseBasedEditor extends TextEditor {}

describe('HotSettingsResolver', () => {
  let service: HotSettingsResolver;

  let dynamicComponentService: DynamicComponentService;

  beforeEach(() => {
    const dynamicServiceSpy = {
      createRendererFromComponent: jest.fn(),
      createRendererWithFactory: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [HotSettingsResolver, { provide: DynamicComponentService, useValue: dynamicServiceSpy }, EnvironmentInjector],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    service.applyCustomSettings(mergedSettings);
    expect(dynamicComponentService.createRendererFromComponent).toHaveBeenCalled();
  });

  it('should use advanced renderer mode when renderer is Advanced component', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          renderer: TestRendererAdvancedComponent,
          rendererProps: { prop: 'value' },
        } as ColumnSettings,
      ],
    };

    service.applyCustomSettings(mergedSettings);

    expect(dynamicComponentService.createRendererWithFactory).toHaveBeenCalledWith(TestRendererAdvancedComponent, { prop: 'value' });
    expect(dynamicComponentService.createRendererFromComponent).not.toHaveBeenCalled();
  });

  it('should use basic renderer mode for HotCellRendererComponent', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          renderer: TestRendererComponent,
          rendererProps: { prop: 'value' },
        } as ColumnSettings,
      ],
    };

    service.applyCustomSettings(mergedSettings);

    expect(dynamicComponentService.createRendererFromComponent).toHaveBeenCalledWith(TestRendererComponent, { prop: 'value' });
    expect(dynamicComponentService.createRendererWithFactory).not.toHaveBeenCalled();
  });

  it('should not update column renderer when no renderer set', () => {
    const mergedSettings: GridSettings = {
      columns: [{} as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings);

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
    service.applyCustomSettings(mergedSettings);

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
    service.applyCustomSettings(mergedSettings);

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
    service.applyCustomSettings(mergedSettings);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBeDefined();
    expect(settings._editorComponentReference.instance instanceof TestEditorComponent).toBe(true);
    expect(settings._environmentInjector).toBe(envInjector);
  });

  it('should use advanced editor mode when editor is Advanced component', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          editor: TestEditorAdvancedComponent,
        } as ColumnSettings,
      ],
    };

    service.applyCustomSettings(mergedSettings);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBeDefined();
    expect(typeof settings.editor).toBe('function');
    expect(settings._editorComponentReference).toBeUndefined();
    expect(settings._environmentInjector).toBeUndefined();
  });

  it('should use basic editor mode for HotCellEditorComponent', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          editor: TestEditorComponent,
        } as ColumnSettings,
      ],
    };
    const envInjector = TestBed.inject(EnvironmentInjector);

    service.applyCustomSettings(mergedSettings);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBeDefined();
    expect(settings._editorComponentReference.instance instanceof TestEditorComponent).toBe(true);
    expect(settings._environmentInjector).toBe(envInjector);
  });

  it('should not update column editor when no custom editor set', () => {
    const mergedSettings: GridSettings = {
      columns: [{ editor: 'text' } as ColumnSettings],
    };

    service.applyCustomSettings(mergedSettings);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBe('text');
    expect(settings._editorComponentReference).toBeUndefined();
    expect(settings._environmentInjector).toBeUndefined();
  });

  it('should not update column editor when editor is class', () => {
    const mergedSettings: GridSettings = {
      columns: [{ editor: TestClaseBasedEditor } as ColumnSettings],
    };

    service.applyCustomSettings(mergedSettings);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBe(TestClaseBasedEditor);
    expect(settings._editorComponentReference).toBeUndefined();
    expect(settings._environmentInjector).toBeUndefined();
  });

  it('should update column validator for given custom validator', () => {
    const mergedSettings: GridSettings = {
      columns: [{ validator: (value: any) => true } as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings);
    expect(mergedSettings.columns[0].validator).toBeDefined();
    expect(mergedSettings.columns[0].validator.length).toBe(2);
  });

  it('should not update column validator when validator is string', () => {
    const mergedSettings: GridSettings = {
      columns: [{ validator: 'numeric' } as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings);
    expect(mergedSettings.columns[0].validator).toBe('numeric');
  });

  it('should not update column validator when validator is RegEx', () => {
    const mergedSettings: GridSettings = {
      columns: [{ validator: /^abc/ } as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings);
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
    service.applyCustomSettings(mergedSettings);
    expect(mergedSettings.columns[0].validator.length).toBe(2);
  });

  it('should handle multiple columns with different renderer render modes', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          renderer: TestRendererAdvancedComponent,
        } as ColumnSettings,
        {
          renderer: TestRendererComponent,
        } as ColumnSettings,
        {
          renderer: TestRendererComponent,
        } as ColumnSettings,
      ],
    };

    service.applyCustomSettings(mergedSettings);

    expect(dynamicComponentService.createRendererWithFactory).toHaveBeenCalledTimes(1);
    expect(dynamicComponentService.createRendererFromComponent).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple columns with different editor render modes', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          editor: TestEditorAdvancedComponent,
        } as ColumnSettings,
        {
          editor: TestEditorComponent,
        } as ColumnSettings,
        {
          editor: TestEditorComponent,
        } as ColumnSettings,
      ],
    };

    service.applyCustomSettings(mergedSettings);

    const settings0 = mergedSettings.columns[0] as ColumnSettingsInternal;
    const settings1 = mergedSettings.columns[1] as ColumnSettingsInternal;
    const settings2 = mergedSettings.columns[2] as ColumnSettingsInternal;

    expect(settings0._editorComponentReference).toBeUndefined();
    expect(settings1._editorComponentReference).toBeDefined();
    expect(settings2._editorComponentReference).toBeDefined();
  });
});
