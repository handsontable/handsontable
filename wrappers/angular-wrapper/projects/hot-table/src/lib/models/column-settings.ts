import { ComponentRef, EnvironmentInjector, Type } from '@angular/core';
import Handsontable from 'handsontable';
import { HotCellRendererComponent } from '../renderer/hot-cell-renderer.component';
import { HotCellEditorComponent } from '../editor/hot-cell-editor.component';

export type CustomValidatorFn<T> = (value: T) => boolean;

export interface ColumnSettings
  extends Handsontable.ColumnSettings,
    CustomColumnProperties {}

export interface CustomColumnProperties {
  rendererComponent?: Type<HotCellRendererComponent>;
  rendererComponentProps?: any;
  customEditor?: Type<HotCellEditorComponent<any>>;
  customValidator?: CustomValidatorFn<any>;
}

export interface EditorReferenceInternal {
  _editorComponentReference?: ComponentRef<HotCellEditorComponent<any>>;
  _environmentInjector?: EnvironmentInjector;
}

export interface ColumnSettingsInternal
  extends Omit<ColumnSettings, 'customValidator'>,
    EditorReferenceInternal,
    CustomColumnProperties {}
