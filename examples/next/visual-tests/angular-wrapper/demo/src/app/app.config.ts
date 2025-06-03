import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";

import {
  HOT_GLOBAL_CONFIG,
  HotGlobalConfig,
  NON_COMMERCIAL_LICENSE,
} from "@handsontable/angular-wrapper";

const globalHotConfig: HotGlobalConfig = {
  themeName: "ht-theme-main-dark-auto",
  license: NON_COMMERCIAL_LICENSE,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
  ],
};
