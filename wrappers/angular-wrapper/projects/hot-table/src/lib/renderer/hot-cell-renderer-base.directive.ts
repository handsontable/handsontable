import Handsontable from 'handsontable/base';
import { Directive, Input } from '@angular/core';

/**
 * Shared base directive for HotCellRendererComponent and HotCellRendererAdvancedComponent.
 * Holds all @Input() properties and getProps() that both renderer variants share.
 *
 * @template TValue - The type of the rendered cell value.
 * @template TProps - The type of additional renderer properties.
 */
@Directive()
export abstract class HotCellRendererBase<
  TValue extends string | number | boolean | Record<string, any> | Array<any> = string,
  TProps extends {} = any
> {
  @Input() value: TValue = '' as TValue;

  @Input() instance: Handsontable;
  @Input() td: HTMLTableCellElement;
  @Input() row: number;
  @Input() col: number;
  @Input() prop: string | number;

  @Input() cellProperties: Handsontable.CellProperties & { rendererProps?: TProps };

  public getProps(): TProps {
    return this.cellProperties?.rendererProps ?? ({} as TProps);
  }
}
