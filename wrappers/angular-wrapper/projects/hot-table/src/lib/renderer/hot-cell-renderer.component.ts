import Handsontable from 'handsontable/base';
import {Component, Input} from '@angular/core';

/**
 * Abstract base component for creating custom cell renderer components for Handsontable.
 *
 * This class provides a common interface and properties required by any custom cell renderer.
 *
 * @template TValue - The type of the component renderer.
 * @template TProps - The type of additional renderer properties.
 */
@Component({
  selector: 'hot-cell-renderer',
  template: `<!-- This is an abstract component. Extend this component and provide your own template. -->`
})
export abstract class HotCellRendererComponent<TValue extends string | number | boolean = string, TProps extends {} = any> {
  static readonly RENDERER_MARKER = Symbol('HotCellRendererComponent');

  @Input() value: TValue = '' as TValue;

  @Input() instance: Handsontable;
  @Input() td: HTMLTableCellElement;
  @Input() row: number;
  @Input() col: number;
  @Input() prop: string;

  /**
   * The cell properties provided by Handsontable, extended with optional renderer-specific properties.
   */
  @Input() cellProperties: Handsontable.CellProperties & { rendererProps?: TProps };

  /**
   * Retrieves the renderer-specific properties from the cell properties.
   *
   * @returns The additional properties for the renderer.
   */
  public getProps(): TProps {
    return this.cellProperties?.rendererProps ?? ({} as TProps);
  }
}
