import { ComponentRef, EnvironmentInjector, Type, TemplateRef } from '@angular/core';
import Handsontable from 'handsontable/base';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';
import { EditorRendererMode } from '../editor/models/editor-renderer-mode.enum';
import { RendererRenderMode } from '../renderer/renderer-render-mode.enum';

export type CustomValidatorFn<T> = (value: T) => boolean;

export type ColumnSettings =
  | Handsontable.ColumnSettings
  | {
      editor?: Type<HotCellEditorComponent<any>> | Handsontable.ColumnSettings['editor'];
      editorRenderMode?: EditorRendererMode;
      renderer?: Type<HotCellRendererComponent<any, any>> | TemplateRef<any> | Handsontable.ColumnSettings['renderer'];
      rendererRenderMode?: RendererRenderMode;
      validator?: CustomValidatorFn<any> | Handsontable.ColumnSettings['validator'];
      rendererProps?: any;
    };

export interface EditorReferenceInternal {
  _editorComponentReference?: ComponentRef<HotCellEditorComponent<any>>;
  _environmentInjector?: EnvironmentInjector;
}

export interface ColumnSettingsInternal extends Handsontable.ColumnSettings, EditorReferenceInternal {}
