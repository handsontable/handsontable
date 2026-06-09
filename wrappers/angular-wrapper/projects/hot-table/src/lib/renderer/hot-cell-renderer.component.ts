import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HotCellRendererBase } from './hot-cell-renderer-base.directive';

/**
 * Abstract base component for creating custom cell renderer components for Handsontable.
 *
 * Extend this component and provide your own template to implement a custom renderer.
 * Value type is limited to primitives (`string | number | boolean`).
 * For object and array values use {@link HotCellRendererAdvancedComponent}.
 *
 * @template TValue - The type of the component renderer.
 * @template TProps - The type of additional renderer properties.
 */
@Component({
  selector: 'hot-cell-renderer',
  template: `<!-- This is an abstract component. Extend this component and provide your own template. -->`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class HotCellRendererComponent<TValue extends string | number | boolean = string, TProps extends {} = any>
  extends HotCellRendererBase<TValue, TProps> {
  static readonly RENDERER_MARKER = Symbol('HotCellRendererComponent');
}
