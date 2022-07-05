import { enableProdMode, VERSION as AngularVersion } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { HotTableModule } from '@handsontable/angular';
import Handsontable from 'handsontable';

if (environment.production) {
  enableProdMode();
}

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTableModule.version} Angular: v${AngularVersion.full}`);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
