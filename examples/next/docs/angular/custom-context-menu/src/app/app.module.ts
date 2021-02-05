import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HotTableModule } from '@handsontable/angular';

import { AppComponent } from './app.component';
import { HotTableComponent } from './hot-table/hot-table.component';

@NgModule({
  declarations: [
    AppComponent,
    HotTableComponent
  ],
  imports: [
    BrowserModule,
    HotTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
