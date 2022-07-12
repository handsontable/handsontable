import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { DataGridComponent } from '../data-grid/data-grid.component';

@NgModule({
  declarations: [
    DataGridComponent
  ],
  imports: [
    BrowserModule,
    HotTableModule
  ],
  providers: [],
  bootstrap: [DataGridComponent]
})
export class AppModule { }
