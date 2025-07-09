import { Directive, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CellProperties } from 'handsontable/settings';

/**
 * Abstract class representing a Handsontable editor in angular.
 */
@Directive()
export abstract class HotCellEditorComponent<T extends string | number | boolean> {
  /** The tabindex attribute for the editor. */
  @HostBinding('attr.tabindex') protected tabindex = -1;

  /** The data-hot-input attribute for the editor. */
  @HostBinding('attr.data-hot-input') protected dataHotInput = '';

  /** The handsontableInput class for the editor. */
  @HostBinding('class.handsontableInput') protected handsontableInputClass = true;

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
  abstract onFocus(): void;

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
}
