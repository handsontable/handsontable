import Handsontable from 'handsontable/base';
import { Directive, EventEmitter, HostBinding, Input, Output } from '@angular/core';

/**
 * Shared base directive for HotCellEditorComponent and HotCellEditorAdvancedComponent.
 * Holds all @Input(), @Output() and @HostBinding() declarations that both editor variants share.
 *
 * @template T - The type of the edited cell value.
 */
@Directive()
export abstract class HotCellEditorBase<
  T extends string | number | boolean | Record<string, any> | Array<any>
> {
  @HostBinding('style.height.%') protected heightFitParentContainer = 100;
  @HostBinding('style.width.%') protected widthFitParentContainer = 100;

  @Input() row: number;
  @Input() column: number;
  @Input() prop: string | number;
  @Input() originalValue: T;
  @Input() cellProperties: Handsontable.CellProperties;

  @Output() finishEdit = new EventEmitter<void>();
  @Output() cancelEdit = new EventEmitter<void>();

  protected value: T;

  getValue(): T {
    return this.value;
  }

  setValue(value: T): void {
    this.value = value;
  }
}
