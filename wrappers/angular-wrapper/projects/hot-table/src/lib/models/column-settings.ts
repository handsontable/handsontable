import { ComponentRef, EnvironmentInjector, Type, TemplateRef } from '@angular/core';
import Handsontable from 'handsontable/base';
import { ExtendedEditor } from 'handsontable/editors/factory';
import { CellProperties } from 'handsontable/settings';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';
import { HotCellRendererAdvancedComponent } from '../renderer/hot-cell-renderer-advanced.component';
import { HotCellEditorAdvancedComponent } from '../editor/hot-cell-editor-advanced.component';

declare module 'handsontable/settings' {
  interface ColumnSettings {
    _editorComponentReference?: ComponentRef<HotCellEditorComponent<any>>;
    _environmentInjector?: EnvironmentInjector;
  }
}

export type CustomValidatorFn<T> = (value: T) => boolean;

export type ColumnSettings =
  | Handsontable.ColumnSettings
  | {
      editor?: Type<HotCellEditorComponent<any>> |
        Type<HotCellEditorAdvancedComponent<any>> |
        Handsontable.ColumnSettings['editor'] |
        ExtendedEditor<any>;
      renderer?: Type<HotCellRendererComponent<any, any>> |
        Type<HotCellRendererAdvancedComponent<any, any>> |
        TemplateRef<any> |
        Handsontable.ColumnSettings['renderer'] |
        (
          (instance: Handsontable,
            td: HTMLTableCellElement,
            row: number, column: number,
            prop: string | number,
            value: any,
            cellProperties: CellProperties
          ) => void);
      validator?: CustomValidatorFn<any> | Handsontable.ColumnSettings['validator'];
      rendererProps?: any;
    };

export interface EditorReferenceInternal {
  _editorComponentReference?: ComponentRef<HotCellEditorComponent<any>>;
  _environmentInjector?: EnvironmentInjector;
}

export interface ColumnSettingsInternal extends Handsontable.ColumnSettings, EditorReferenceInternal {}
