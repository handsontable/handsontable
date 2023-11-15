import { NgModule, ModuleWithProviders } from '@angular/core';
import { HotTableComponent } from './hot-table.component';
import { HotColumnComponent } from './hot-column.component';
import { HotTableRegisterer } from './hot-table-registerer.service';

@NgModule({
  declarations: [
    HotTableComponent,
    HotColumnComponent,
  ],
  exports: [
    HotTableComponent,
    HotColumnComponent,
  ]
})
export class HotTableModule {
  static version = '0.0.0-VERSION';

  public static forRoot(): ModuleWithProviders<HotTableModule> {
    return {
      ngModule: HotTableModule,
      providers: [ HotTableRegisterer ],
    };
  }
}
