/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';
import { horizonTheme, registerTheme } from 'handsontable/themes';
import { registerAllModules } from 'handsontable/registry';

// Register Handsontable's modules
registerAllModules();

// Register the main theme with custom parameters
const myTheme = registerTheme(horizonTheme);

// Configure theme parameters using the params() method
myTheme.params({
  colors: {
    primary: {
      500: '#9333ea', // Change primary color
    },
  },
  tokens: {
    fontSize: '16px',
    iconSize: 'sizing.size_5',
    accentColor: ['colors.primary.500', 'colors.primary.600'],
  },
});

// Set color scheme and density type
myTheme.setColorScheme('light');
myTheme.setDensityType('default');

@Component({
  selector: 'example2-demo',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data: Array<Array<string | number>> = [
    ['John Doe', 'johndoe@example.com', 'New York', 32, 'Engineer'],
    ['Jane Smith', 'janesmith@example.com', 'Los Angeles', 29, 'Designer'],
    ['Sam Wilson', 'samwilson@example.com', 'Chicago', 41, 'Manager'],
    ['Emily Johnson', 'emilyj@example.com', 'San Francisco', 35, 'Developer'],
    ['Michael Brown', 'mbrown@example.com', 'Boston', 38, 'Analyst'],
  ];

  readonly gridSettings: GridSettings = {
    theme: myTheme,
    colHeaders: ['Name', 'Email', 'City', 'Age', 'Position'],
    columns: [
      { data: 0, type: 'text' },
      { data: 1, type: 'text' },
      { data: 2, type: 'text' },
      { data: 3, type: 'numeric' },
      { data: 4, type: 'text' }
    ],
    rowHeaders: true,
    dropdownMenu: true,
    width: '100%',
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation'
  };
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
