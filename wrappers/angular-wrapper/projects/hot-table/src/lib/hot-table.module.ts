import { NgModule } from '@angular/core';
import { HotTableComponent } from './hot-table.component';

@NgModule({
  imports: [HotTableComponent],
  exports: [HotTableComponent],
})
export class HotTableModule {
  static readonly version = '17.1.0';
}
