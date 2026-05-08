/* file: app.component.ts */
import { Component, ElementRef, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example-grid-size',
  standalone: true,
  imports: [HotTableModule],
  template: `<div class="example-controls-container">
      <div class="controls">
        <button
          id="triggerBtn"
          class="button button--primary"
          (click)="btnClick()"
        >
          {{ isContainerExpanded ? 'Collapse container' : 'Expand container' }}
        </button>
      </div>
    </div>
    <div class="table-container" #tableContainer>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;
  @ViewChild('tableContainer', { static: false }) readonly tableContainer!: ElementRef<HTMLDivElement>;

  // generate an array of arrays with dummy data
  readonly data = new Array(100) // number of rows
    .fill(null)
    .map((_, row) =>
      new Array(50) // number of columns
        .fill(null)
        .map((_, column) => `${row}, ${column}`)
    );

  isContainerExpanded = false;

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    colHeaders: true,
    width: '100%',
    height: '100%',
    colWidths: 100,
    autoWrapRow: true,
    autoWrapCol: true
  };

  btnClick(): void {
    this.isContainerExpanded = !this.isContainerExpanded;
    const newHeight = this.isContainerExpanded ? 410 : 157;

    this.tableContainer.nativeElement.style.height = `${newHeight}px`;
    this.hotTable?.hotInstance?.refreshDimensions();
  }
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
