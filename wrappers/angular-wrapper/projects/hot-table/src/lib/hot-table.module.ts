import { NgModule } from '@angular/core';
import { HotTableComponent } from './hot-table.component';

@NgModule({
  imports: [HotTableComponent],
  exports: [HotTableComponent],
})
export class HotTableModule {
  /**
   * Placeholder for the library version.
   * Replaced automatically during the pre-build/post-build process.
   */
  static readonly version = '0.0.0-VERSION';
}
