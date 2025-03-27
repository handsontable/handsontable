import { TestBed } from '@angular/core/testing';
import { Component, EnvironmentInjector } from '@angular/core';
import { DynamicComponentService } from '../renderer/hot-dynamic-renderer-component.service';
import { HotSettingsResolver } from './hot-settings-resolver.service';
import { GridSettings } from '../models/grid-settings';
import {
  ColumnSettings,
  ColumnSettingsInternal,
} from '../models/column-settings';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';

@Component({})
class TestRendererComponent extends HotCellRendererComponent {}

@Component({})
class TestEditorComponent extends HotCellEditorComponent<number> {
  onFocus(): void {}
}

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
        EnvironmentInjector,
      ],
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
          componentRenderer: TestRendererComponent,
          componentRendererProps: { prop: 'value' },
        } as ColumnSettings,
      ],
    };
    service.applyCustomSettings(mergedSettings);
    expect(
      dynamicComponentService.createRendererFromComponent
    ).toHaveBeenCalled();
  });

  it('should not update column renderer when no renderer set', () => {
    const mergedSettings: GridSettings = {
      columns: [{} as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings);

    expect(
      dynamicComponentService.createRendererFromComponent
    ).not.toHaveBeenCalled();
  });

  it('should update column editor for given custom editor', () => {
    const mergedSettings: GridSettings = {
      columns: [
        {
          customEditor: TestEditorComponent,
        } as ColumnSettings,
      ],
    };
    const envInjector = TestBed.inject(EnvironmentInjector);
    service.applyCustomSettings(mergedSettings);

    const settings = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(settings.editor).toBeDefined();
    expect(
      settings._editorComponentReference.instance instanceof TestEditorComponent
    ).toBe(true);
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

  it('should update column validator for given custom validator', () => {
    const mergedSettings: GridSettings = {
      columns: [{ customValidator: (value: any) => true } as ColumnSettings],
    };
    service.applyCustomSettings(mergedSettings);
    const column = mergedSettings.columns[0] as ColumnSettingsInternal;
    expect(column.validator).toBeDefined();
  });
});
