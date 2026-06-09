import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HotCellRendererBase } from './hot-cell-renderer-base.directive';

/**
 * Abstract base component for creating advanced custom cell renderer components for Handsontable.
 *
 * Extend this component and provide your own template to implement a custom renderer.
 * Unlike {@link HotCellRendererComponent}, this variant also accepts object and array values.
 *
 * @template TValue - The type of the component renderer.
 * @template TProps - The type of additional renderer properties.
 */
@Component({
  selector: 'hot-cell-renderer-advanced',
  template: `<!-- This is an abstract component. Extend this component and provide your own template. -->`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class HotCellRendererAdvancedComponent<
  TValue extends string | number | boolean | Record<string, any> | Array<any> = string,
  TProps extends {} = any
> extends HotCellRendererBase<TValue, TProps> {
  static readonly RENDERER_MARKER = Symbol('HotCellRendererAdvancedComponent');
}
