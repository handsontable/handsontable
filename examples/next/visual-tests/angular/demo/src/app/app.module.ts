import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HotTableModule } from '@handsontable/angular';
import { DataGridComponent } from '../data-grid/data-grid.component';
import { RouterModule, Routes } from '@angular/router';
import { ScenarioGridComponent } from '../scenario-two-grid/scenario-grid.component';
import { AppComponent } from './app.component'; // Import AppComponent

const routes: Routes = [
  { path: 'scenario-grid', component: ScenarioGridComponent },
  { path: '', component: DataGridComponent },
];

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    HotTableModule,
    AppComponent,
    DataGridComponent,
    ScenarioGridComponent,
  ],
  providers: [],
  bootstrap: [AppComponent] // Use AppComponent as the bootstrap component
})
export class AppModule { }
