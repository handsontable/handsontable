/* file: app.component.ts */
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example9',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
    <output class="console">{{ output }}</output>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  output = 'Rename a header to see the change here.';

  readonly hotData = [
    ['Wireless mouse', 'Accessories', 24.9, 120],
    ['Mechanical keyboard', 'Accessories', 89, 45],
    ['27-inch monitor', 'Displays', 319.5, 18],
    ['USB-C dock', 'Accessories', 149, 32],
  ];

  hotSettings!: GridSettings;

  ngOnInit() {
    this.hotSettings = {
      colHeaders: ['Product', 'Category', 'Price', 'In stock'],
      rowHeaders: true,
      navigableHeaders: true,
      contextMenu: true,
      editableHeaders: { columnHeaders: true, rowHeaders: true },
      // Save the new names in your app here.
      afterHeaderChange: (axis: 'column' | 'row', visualIndex: number, newValue: string, oldValue: unknown) => {
        this.output = `Renamed the ${axis} header at index ${visualIndex} from "${oldValue}" to "${newValue}".`;
        this.cdr.markForCheck();
      },
      height: 'auto',
      autoWrapRow: true,
      autoWrapCol: true,
    };
  }
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        // license: 'your-license-key', // get a key at https://handsontable.com/pricing/
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
