import { ApplicationConfig } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

registerAllModules();

const globalHotConfig: HotGlobalConfig = {
  license: NON_COMMERCIAL_LICENSE,
};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
  ],
};
