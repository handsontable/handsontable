import { enableProdMode, VERSION as AngularVersion } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

import { HotTableModule } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

if (environment.production) {
  enableProdMode();
}

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTableModule.version} Angular: v${AngularVersion.full}`);

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
