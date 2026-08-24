import { Directive, HostBinding } from '@angular/core';
import { HotCellEditorBase } from './hot-cell-editor-base.directive';

/**
 * Abstract class representing a basic Handsontable cell editor in Angular.
 *
 * Extend this class and decorate the subclass with `@Component()` to implement a custom editor.
 * Value type is limited to primitives (`string | number | boolean`).
 * For object and array values use {@link HotCellEditorAdvancedComponent}.
 */
@Directive()
export abstract class HotCellEditorComponent<T extends string | number | boolean> extends HotCellEditorBase<T> {
  static readonly EDITOR_MARKER = Symbol('HotCellEditorComponent');

  /** The tabindex attribute for the editor. */
  @HostBinding('attr.tabindex') protected tabindex = -1;

  /** The data-hot-input attribute for the editor. */
  @HostBinding('attr.data-hot-input') protected dataHotInput = '';

  /** The handsontableInput class for the editor. */
  @HostBinding('class.handsontableInput') protected handsontableInputClass = true;

  /** Event triggered by Handsontable on closing the editor. */
  onClose(): void {}

  /** Event triggered by Handsontable on opening the editor. */
  onOpen(event?: Event): void {}

  /**
   * Event triggered by Handsontable on focusing the editor.
   * Must be implemented by the subclass to move focus to the actual input element.
   * @example
   * ```typescript
   * @Component({ template: `<input #inputElement>` })
   * class CustomEditor extends HotCellEditorComponent<string> {
   *   @ViewChild('inputElement') inputElement!: ElementRef;
   *   onFocus(): void { this.inputElement.nativeElement.focus(); }
   * }
   * ```
   */
  abstract onFocus(): void;
}
