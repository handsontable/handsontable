import { NgModule, ModuleWithProviders } from '@angular/core';
import { HotTableComponent } from './hot-table.component';
import { HotColumnComponent } from './hot-column.component';
import { HotTableRegisterer } from './hot-table-registerer.service';

/**
 * Angular prevents use static public getters under NgModule decorator.
 * Moreover, ngc doesn't allow importing `Version` from external file.
 */
class Version {
  public static get version(): string {
    return '0.0.0-VERSION';
  }
}

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
export class HotTableModule extends Version {
  public static forRoot(): ModuleWithProviders<HotTableModule> {
    return {
      ngModule: HotTableModule,
      providers: [ HotTableRegisterer ],
    };
  }
}
