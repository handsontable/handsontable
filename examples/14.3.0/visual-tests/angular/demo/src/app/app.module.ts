import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { DataGridComponent } from '../data-grid/data-grid.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '/', component: DataGridComponent },
  { path: 'basic-example', component: DataGridComponent },

];

@NgModule({
  declarations: [
    DataGridComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    HotTableModule
  ],
  providers: [],
  bootstrap: [DataGridComponent]
})
export class AppModule { }
