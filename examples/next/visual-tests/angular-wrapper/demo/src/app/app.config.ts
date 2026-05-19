import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
import { DataGridComponent } from '../data-grid/data-grid.component';
import { ScenarioGridComponent } from '../scenario-two-grid/scenario-grid.component';

registerAllModules();

const routes: Routes = [
  { path: 'scenario-grid', component: ScenarioGridComponent },
  { path: '', component: DataGridComponent },
];

const globalHotConfig: HotGlobalConfig = {
  license: NON_COMMERCIAL_LICENSE,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
  ],
};
