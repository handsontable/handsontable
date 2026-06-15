import { Directive } from '@angular/core';
import { ExtendedEditor } from 'handsontable/editors/factory';
import { CellProperties } from 'handsontable/settings';
import { KeyboardShortcutConfig } from './models/keyboard-shortcut-config';
import { HotCellEditorBase } from './hot-cell-editor-base.directive';

/**
 * Abstract class representing an advanced Handsontable cell editor in Angular.
 *
 * Extend this class and decorate the subclass with `@Component()` to implement a custom editor.
 * Unlike {@link HotCellEditorComponent}, this variant also accepts object and array values
 * and provides additional lifecycle hooks and positioning options.
 */
@Directive()
export abstract class HotCellEditorAdvancedComponent<
  T extends string | number | boolean | Record<string, any> | Array<any>
> extends HotCellEditorBase<T> {
  static readonly EDITOR_MARKER = Symbol('HotCellEditorAdvancedComponent');

  /** Event triggered by Handsontable on focusing the editor. Available in advanced mode. */
  onFocus(editor?: ExtendedEditor<T>): void {}

  /** The position of the editor in the DOM. Available in advanced mode. */
  position: 'container' | 'portal' = 'container';

  /** The shortcuts available for the editor. Available in advanced mode. */
  shortcuts?: KeyboardShortcutConfig[];

  /** The group name for the shortcuts. Available in advanced mode. */
  shortcutsGroup?: string;

  /** Configuration object. Available in advanced mode. */
  config?: any;

  /** Lifecycle hook called after the editor is opened. Available in advanced mode. */
  afterOpen(editor: ExtendedEditor<T>, event?: Event): void {}

  /** Lifecycle hook called after the editor is closed. Available in advanced mode. */
  afterClose(editor: ExtendedEditor<T>): void {}

  /** Lifecycle hook called after the editor is initialized. Available in advanced mode. */
  afterInit(editor: ExtendedEditor<T>): void {}

  /** Lifecycle hook called before the editor is opened. Available in advanced mode. */
  beforeOpen(
    editor: ExtendedEditor<T>,
    {
      row,
      col,
      prop,
      td,
      originalValue,
      cellProperties,
    }: {
      row: number;
      col: number;
      prop: string | number;
      td: HTMLTableCellElement;
      originalValue: any;
      cellProperties: CellProperties;
    }
  ): void {}
}
