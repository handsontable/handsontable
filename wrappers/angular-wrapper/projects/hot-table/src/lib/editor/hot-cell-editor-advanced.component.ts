import { Directive, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { ExtendedEditor } from 'handsontable/editors/factory';
import { CellProperties } from 'handsontable/settings';
import { KeyboardShortcutConfig } from './models/keyboard-shortcut-config';

/**
 * Abstract class representing a Handsontable editor in angular.
 */
@Directive()
export abstract class HotCellEditorAdvancedComponent<T extends string | number | boolean | Record<string, any> | Array<any>> {
  static readonly EDITOR_MARKER = Symbol('HotCellEditorAdvancedComponent');

  /** The height of the editor as a percentage of the parent container. */
  @HostBinding('style.height.%') protected heightFitParentContainer = 100;

  /** The width of the editor as a percentage of the parent container. */
  @HostBinding('style.width.%') protected widthFitParentContainer = 100;

  /** The row index of the cell being edited. */
  @Input() row: number;

  /** The column index of the cell being edited. */
  @Input() column: number;

  /** The property name of the cell being edited. */
  @Input() prop: string | number;

  /** The original value of the cell being edited. */
  @Input() originalValue: T;

  /** The cell properties of the cell being edited. */
  @Input() cellProperties: CellProperties;

  /** Event emitted when the edit is finished.
   * The data will be saved to the model.
   */
  @Output() finishEdit = new EventEmitter<void>();

  /** Event emitted when the edit is canceled.
   * The entered data will be reverted to the original value.
   */
  @Output() cancelEdit = new EventEmitter<void>();

  /** The current value of the editor. */
  protected value: T;

  /** Event triggered by Handsontable on focus the editor.
   * The user have to define focus logic.
   */
  onFocus(editor?: ExtendedEditor<T>): void {}

  /**
   * Gets the current value of the editor.
   * @returns The current value of the editor.
   */
  getValue(): T {
    return this.value;
  }

  /**
   * Sets the current value of the editor.
   * @param value The value to set.
   */
  setValue(value: T): void {
    this.value = value;
  }

  /** The position of the editor in the DOM. Used by Handsontable API. Available in advanced mode. */
  position: 'container' | 'portal' = 'container';

  /** The shortcuts available for the editor. Available in advanced mode. */
  shortcuts?: KeyboardShortcutConfig[];

  /** The group name for the shortcuts. Available in advanced mode.*/
  shortcutsGroup?: string;

  /** Configuration. Available in advanced mode. */
  config?: any;

  /** Lifecycle hook called after the editor is opened. Available in advanced mode.*/
  afterOpen(editor: ExtendedEditor<T>, event?: Event): void {}

  /** Lifecycle hook called after the editor is closed. Available in advanced mode. */
  afterClose(editor: ExtendedEditor<T>): void {}

  /** Lifecycle hook called after the editor is initialized. Available in advanced mode.*/
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
