import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Input,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { HotCellEditorComponent } from './hot-cell-editor.component';

/**
 * Component representing a placeholder for a custom editor in Handsontable.
 * It is used only within the wrapper.
 */
@Component({
  template: ` <div
    class="handsontableInputHolder ht_clone_master"
    [style.display]="display"
    [style.width.px]="width"
    [style.height.px]="height"
    [style.maxWidth.px]="width"
    [style.maxHeight.px]="height"
    [style.top.px]="top"
    [style.left.px]="left"
  >
    <ng-template #inputPlaceholder></ng-template>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CustomEditorPlaceholderComponent {
  /** The top position of the editor. */
  @Input() top: number;

  /** The left position of the editor. */
  @Input() left: number;

  /** The height of the editor. */
  @Input() height: number;

  /** The width of the editor. */
  @Input() width: number;

  @Input()
  set isVisible(value: boolean) {
    this._isVisible = value;
  }

  /** The reference to the component instance of the editor. */
  @Input() set componentRef(
    hotEditorComponentRef: ComponentRef<HotCellEditorComponent<any>>
  ) {
    if (hotEditorComponentRef) {
      this.container.insert(hotEditorComponentRef.hostView);
    }
  }

  /** The container for the editor's input placeholder. */
  @ViewChild('inputPlaceholder', { read: ViewContainerRef, static: true }) container: ViewContainerRef;

  /** The display style of the editor. */
  get display(): string {
    return this._isVisible ? 'block' : 'none';
  }

  private _isVisible = false;

  /**
   * Detaches the container from the Handsontable.
   */
  detachEditor(): void {
    this.container.detach();
  }
}
