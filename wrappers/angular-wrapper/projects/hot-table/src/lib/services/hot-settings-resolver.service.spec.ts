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
    const result = service.applyCustomSettings(mergedSettings);

    const settings = result.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBeDefined();
    expect(settings._editorComponentReference.instance instanceof TestEditorComponent).toBe(true);
    expect(settings._environmentInjector).toBe(envInjector);
  });

  it('should not mutate the input settings object or its columns', () => {
    const column = { editor: TestEditorComponent, validator: (v: any) => true } as ColumnSettings;
    const inputSettings: GridSettings = { afterChange: jest.fn(), columns: [column] };

    const result = service.applyCustomSettings(inputSettings);

    // Returned (cloned) object carries the resolved editor/validator/hook.
    const resolvedColumn = result.columns[0] as ColumnSettingsInternal;
    expect(resolvedColumn._editorComponentReference).toBeDefined();
    expect(result).not.toBe(inputSettings);
    expect(result.columns[0]).not.toBe(column);

    // Input object and its column are left untouched, so they can be safely reused across tables.
    expect((inputSettings.columns[0] as ColumnSettingsInternal)._editorComponentReference).toBeUndefined();
    expect(inputSettings.columns[0].editor).toBe(TestEditorComponent);
    expect((column.validator as Function).length).toBe(1);
  });

  it('should use advanced editor mode when editor is Advanced component', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          editor: TestEditorAdvancedComponent,
        } as ColumnSettings,
      ],
    };

    const result = service.applyCustomSettings(mergedSettings);

    const settings = result.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBeDefined();
    expect(typeof settings.editor).toBe('function');
    // ComponentRef is stored so ngOnDestroy can destroy it — advanced editors do NOT set _environmentInjector.
    expect(settings._editorComponentReference.instance instanceof TestEditorAdvancedComponent).toBe(true);
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

    const result = service.applyCustomSettings(mergedSettings);

    const settings = result.columns[0] as ColumnSettingsInternal;
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
    const result = service.applyCustomSettings(mergedSettings);
    expect(result.columns[0].validator).toBeDefined();
    expect(result.columns[0].validator.length).toBe(2);
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

  it('should invoke the custom validator and pass its result to the HOT callback', () => {
    // validator must have .length === 1 to be recognised as a custom (single-arg) validator
    const mergedSettings: GridSettings = {
      columns: [{ validator: (v: any): boolean => v === 'valid' } as ColumnSettings],
    };
    const result = service.applyCustomSettings(mergedSettings);

    const wrappedValidator = result.columns[0].validator as Function;
    const callback = jest.fn();
    wrappedValidator('valid', callback);

    expect(callback).toHaveBeenCalledWith(true);
  });

  it('should pass false to HOT callback when custom validator returns false', () => {
    const mergedSettings: GridSettings = {
      columns: [{ validator: (v: any): boolean => v !== null } as ColumnSettings],
    };
    const result = service.applyCustomSettings(mergedSettings);

    const wrappedValidator = result.columns[0].validator as Function;
    const cbFalse = jest.fn();

    wrappedValidator(null, cbFalse);

    expect(cbFalse).toHaveBeenCalledWith(false);
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

    const result = service.applyCustomSettings(mergedSettings);

    const settings0 = result.columns[0] as ColumnSettingsInternal;
    const settings1 = result.columns[1] as ColumnSettingsInternal;
    const settings2 = result.columns[2] as ColumnSettingsInternal;

    expect(settings0._editorComponentReference).toBeDefined(); // advanced — tracked for cleanup
    expect(settings1._editorComponentReference).toBeDefined();
    expect(settings2._editorComponentReference).toBeDefined();
  });

  describe('editor component recycling across settings changes', () => {
    it('should recycle the editor component when the same editor type sits at the same index', () => {
      const first = service.applyCustomSettings({ columns: [{ editor: TestEditorComponent } as ColumnSettings] });
      const firstRef = (first.columns[0] as ColumnSettingsInternal)._editorComponentReference;
      const destroySpy = jest.spyOn(firstRef, 'destroy');

      const second = service.applyCustomSettings(
        { columns: [{ editor: TestEditorComponent } as ColumnSettings] },
        first.columns as ColumnSettings[]
      );

      // Same component instance is reused, not recreated or destroyed.
      expect((second.columns[0] as ColumnSettingsInternal)._editorComponentReference).toBe(firstRef);
      expect(destroySpy).not.toHaveBeenCalled();
    });

    it('should create a fresh editor component when the editor type at the index changes', () => {
      const first = service.applyCustomSettings({ columns: [{ editor: TestEditorComponent } as ColumnSettings] });
      const firstRef = (first.columns[0] as ColumnSettingsInternal)._editorComponentReference;

      const second = service.applyCustomSettings(
        { columns: [{ editor: TestEditorAdvancedComponent } as ColumnSettings] },
        first.columns as ColumnSettings[]
      );

      expect((second.columns[0] as ColumnSettingsInternal)._editorComponentReference).not.toBe(firstRef);
    });

    it('should not recycle when no previous columns are provided', () => {
      const first = service.applyCustomSettings({ columns: [{ editor: TestEditorComponent } as ColumnSettings] });
      const firstRef = (first.columns[0] as ColumnSettingsInternal)._editorComponentReference;

      const second = service.applyCustomSettings({ columns: [{ editor: TestEditorComponent } as ColumnSettings] });

      expect((second.columns[0] as ColumnSettingsInternal)._editorComponentReference).not.toBe(firstRef);
    });
  });

  describe('null / undefined columns edge cases', () => {
    it('should not throw when columns is null', () => {
      const mergedSettings = { columns: null } as unknown as GridSettings;

      expect(() => service.applyCustomSettings(mergedSettings)).not.toThrow();
      expect(dynamicComponentService.createRendererFromComponent).not.toHaveBeenCalled();
      expect(dynamicComponentService.createRendererWithFactory).not.toHaveBeenCalled();
    });

    it('should not throw when columns is undefined', () => {
      const mergedSettings: GridSettings = {};

      expect(() => service.applyCustomSettings(mergedSettings)).not.toThrow();
      expect(dynamicComponentService.createRendererFromComponent).not.toHaveBeenCalled();
    });

    it('should not throw when columns is an empty array', () => {
      const mergedSettings: GridSettings = { columns: [] };

      expect(() => service.applyCustomSettings(mergedSettings)).not.toThrow();
      expect(dynamicComponentService.createRendererFromComponent).not.toHaveBeenCalled();
    });

    it('should not throw when settings object itself has no keys', () => {
      expect(() => service.applyCustomSettings({} as GridSettings)).not.toThrow();
    });
  });

  describe('wrapHooksInNgZone', () => {
    it('should leave array-valued hooks unchanged and not wrap them', () => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const hookArray = [fn1, fn2];
      const mergedSettings = { afterChange: hookArray } as unknown as GridSettings;

      service.applyCustomSettings(mergedSettings);

      expect((mergedSettings as any).afterChange).toBe(hookArray);
    });

    it('should wrap function hooks so they run inside NgZone', () => {
      const hookFn = jest.fn().mockReturnValue('result');
      const mergedSettings = { afterChange: hookFn } as unknown as GridSettings;

      const result = service.applyCustomSettings(mergedSettings);

      const wrappedHook = (result as any).afterChange;
      expect(wrappedHook).not.toBe(hookFn);
      expect(typeof wrappedHook).toBe('function');
    });

    it('should not wrap non-hook keys', () => {
      const mergedSettings = { readOnly: true } as GridSettings;

      service.applyCustomSettings(mergedSettings);

      expect((mergedSettings as any).readOnly).toBe(true);
    });

    it('should not double-wrap a hook that is already zone-wrapped', () => {
      const hookFn = jest.fn();

      const firstResult = service.applyCustomSettings({ afterChange: hookFn } as unknown as GridSettings);
      const wrappedOnce = (firstResult as any).afterChange;
      expect(wrappedOnce).not.toBe(hookFn);

      // Feeding the already-wrapped hook back in must not wrap it a second time.
      const secondResult = service.applyCustomSettings({ afterChange: wrappedOnce } as unknown as GridSettings);
      const wrappedTwice = (secondResult as any).afterChange;

      expect(wrappedTwice).toBe(wrappedOnce);
    });
  });
});
