import { ApplicationConfig } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig },
  ],
};
