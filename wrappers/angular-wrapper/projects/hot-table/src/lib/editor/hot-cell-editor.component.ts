import { Directive, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { ExtendedEditor } from 'handsontable/editors/factory';
import { CellProperties } from 'handsontable/settings';
import { Shortcut } from './models/shortcut.model';

/**
 * Abstract class representing a Handsontable editor in angular.
 */
@Directive() //TODO: do want Array support here?
export abstract class HotCellEditorComponent<T extends string | number | boolean | Record<string, any> | Array<any>> {
  /** The tabindex attribute for the editor. */
  @HostBinding('attr.tabindex') protected tabindex = -1;

  /** The data-hot-input attribute for the editor. */
  @HostBinding('attr.data-hot-input') protected dataHotInput = '';

  /** The handsontableInput class for the editor. */
  @Input()
  @HostBinding('class.handsontableInput')
  protected handsontableInputClass = true;

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
  private _value: T;

  /** Event triggered by Handsontable on closing the editor.
   * The user can define their own actions for
   * the custom editor to be called after the base logic. */
  onClose(): void {}

  /** Event triggered by Handsontable on open the editor.
   * The user can define their own actions for
   * the custom editor to be called after the base logic. */
  onOpen(event?: Event): void {}

  /** Event triggered by Handsontable on focus the editor.
   * The user have to define focus logic.
   * @example
   * ```typescript
   * component({
   *  template: `<input #inputElement>`
   * })
   * class CustomEditor extends HotEditor<string> {
   *   @ViewChild('inputElement') inputElement!: ElementRef;
   *
   *   onFocus(): void {
   *     this.inputElement.nativeElement.focus();
   *   }
   * }
   * ```
   */
  abstract onFocus(editor?: ExtendedEditor<T>): void;

  /**
   * Gets the current value of the editor.
   * @returns The current value of the editor.
   */
  getValue(): T {
    return this._value;
  }

  /**
   * Sets the current value of the editor.
   * @param value The value to set.
   */
  setValue(value: T): void {
    this._value = value;
  }

  /** The position of the editor in the DOM. Used by Handsontable API */
  position: 'container' | 'portal' = 'container';

  /** The shortcuts available for the editor. */
  shortcuts?: Shortcut[];

  /** The group name for the shortcuts. */
  shortcutsGroup?: string;

  /** Lifecycle hook called after the editor is opened. */
  afterOpen(editor: ExtendedEditor<T>, event?: Event): void {}

  /** Lifecycle hook called after the editor is closed. */
  afterClose(editor: ExtendedEditor<T>): void {}

  /** Lifecycle hook called after the editor is initialized. */
  afterInit(editor: ExtendedEditor<T>): void {}

  /** Lifecycle hook called before the editor is opened. */
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
