import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";

import {
  HOT_GLOBAL_CONFIG,
  HotConfig,
  NON_COMMERCIAL_LICENSE,
} from "@handsontable/angular-wrapper";

const globalHotConfig: HotConfig = {
  themeName: "ht-theme-main-dark-auto",
  license: NON_COMMERCIAL_LICENSE,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: HOT_GLOBAL_CONFIG, useValue: globalHotConfig },
  ],
};
