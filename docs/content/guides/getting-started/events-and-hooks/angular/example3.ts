/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import { HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example3-events-hooks',
  standalone: false,
  template: ` <div class="controls">
      <label>
        <input
          (change)="handleChange('fixedRowsTop', [0, 2], $event)"
          type="checkbox"
        />
        Add fixed rows
      </label>
      <br />

      <label>
        <input
          (change)="handleChange('fixedColumnsStart', [0, 2], $event)"
          type="checkbox"
        />
        Add fixed columns
      </label>
      <br />

      <label>
        <input
          (change)="handleChange('rowHeaders', [false, true], $event)"
          type="checkbox"
        />
        Enable row headers
      </label>
      <br />

      <label>
        <input
          (change)="handleChange('colHeaders', [false, true], $event)"
          type="checkbox"
        />
        Enable column headers
      </label>
      <br />
    </div>
    <div style="max-width: 440px">
      <hot-table [data]="data" [settings]="initialState"></hot-table>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class Example3EventsHooksComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5', 'K5', 'L5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6', 'K6', 'L6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7', 'K7', 'L7'],
    ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8', 'K8', 'L8'],
    ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9'],
    [
      'A10',
      'B10',
      'C10',
      'D10',
      'E10',
      'F10',
      'G10',
      'H10',
      'I10',
      'J10',
      'K10',
      'L11',
    ],
    [
      'A11',
      'B11',
      'C11',
      'D11',
      'E11',
      'F11',
      'G11',
      'H11',
      'I11',
      'J11',
      'K11',
      'L11',
    ],
    [
      'A12',
      'B12',
      'C12',
      'D12',
      'E12',
      'F12',
      'G12',
      'H12',
      'I12',
      'J12',
      'K12',
      'L12',
    ],
  ];
  readonly initialState = {
    autoWrapRow: true,
    autoWrapCol: true,
    height: 240
  };

  handleChange(
    setting: string,
    states: number[] | boolean[],
    event: Event
  ): void {
    const target = event.target as HTMLInputElement;

    this.hotTable.hotInstance?.updateSettings({
      [setting]: states[target.checked ? 1 : 0],
    });
  }
}
/* end-file */


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example3EventsHooksComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example3EventsHooksComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example3EventsHooksComponent ]
})

export class AppModule { }
/* end-file */
