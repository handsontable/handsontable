import { ComponentRef, EnvironmentInjector, Type, TemplateRef } from '@angular/core';
import Handsontable from 'handsontable';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';

export type CustomValidatorFn<T> = (value: T) => boolean;

export type ColumnSettings =
  | Handsontable.ColumnSettings
  | {
      editor?: Type<HotCellEditorComponent<any>>;
      renderer?: Type<HotCellRendererComponent<any, any>> | TemplateRef<any>;
      validator?: CustomValidatorFn<any>;
      rendererProps?: any;
    };

export interface EditorReferenceInternal {
  _editorComponentReference?: ComponentRef<HotCellEditorComponent<any>>;
  _environmentInjector?: EnvironmentInjector;
}

export interface ColumnSettingsInternal extends Handsontable.ColumnSettings, EditorReferenceInternal {}
