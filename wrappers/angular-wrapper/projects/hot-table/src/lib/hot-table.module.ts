import { NgModule, ModuleWithProviders } from '@angular/core';
import { HotTableComponent } from './hot-table.component';
import { CustomEditorPlaceholderComponent } from './editor/custom-editor-placeholder.component';

@NgModule({
  declarations: [HotTableComponent, CustomEditorPlaceholderComponent],
  imports: [],
  exports: [HotTableComponent],
})
export class HotTableModule {
  static version = '0.0.0-VERSION';

  constructor() {}

  public static forRoot(): ModuleWithProviders<HotTableModule> {
    return {
      ngModule: HotTableModule,
    };
  }
}
