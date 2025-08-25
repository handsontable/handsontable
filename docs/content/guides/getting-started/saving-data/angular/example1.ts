/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'example1-saving-data',
  standalone: false,
  template: ` <div class="example-controls-container">
      <div class="controls">
        <button
          id="load"
          class="button button--primary button--blue"
          (click)="loadClickCallback($event)"
        >
          Load data
        </button>
        <button
          id="save"
          class="button button--primary button--blue"
          (click)="saveClickCallback($event)"
        >
          Save data
        </button>
        <label>
          <input
            type="checkbox"
            name="autosave"
            id="autosave"
            [checked]="isAutoSave"
            (click)="autosaveClickCallback($event)"
          />
          Autosave
        </label>
      </div>
      <output class="console" id="output"> {{ output }} </output>
    </div>
    <div>
      <hot-table [settings]="gridSettings"></hot-table>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class Example1SavingDataComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  isAutoSave = false;
  output: string = 'Click "Load" to load data from server';

  readonly gridSettings: GridSettings = {
    startRows: 8,
    startCols: 6,
    rowHeaders: true,
    colHeaders: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,

    afterChange: (
      change: Handsontable.CellChange[] | null,
      source: Handsontable.ChangeSource
    ) => {
      if (source === 'loadData') {
        return; // don't save this change
      }

      if (!this.isAutoSave) {
        return;
      }

      fetch('https://handsontable.com/docs/scripts/json/save.json', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: change }),
      }).then(() => {
        this.output = `Autosaved (${change?.length} cell${
          (change?.length || 0) > 1 ? 's' : ''
        })`;
        console.log('The POST request is only used here for the demo purposes');
      });
    }
  };

  autosaveClickCallback(event: MouseEvent): void {
    const target = event.target as HTMLInputElement;

    this.isAutoSave = target.checked;

    if (target.checked) {
      this.output = 'Changes will be autosaved';
    } else {
      this.output = 'Changes will not be autosaved';
    }
  }

  loadClickCallback(event: MouseEvent): void {
    const hot = this.hotTable?.hotInstance;

    fetch('https://handsontable.com/docs/scripts/json/load.json').then(
      (response) => {
        response.json().then((data) => {
          hot?.loadData(data.data);
          // or, use `updateData()` to replace `data` without resetting states
          this.output = 'Data loaded';
        });
      }
    );
  }

  saveClickCallback(event: MouseEvent): void {
    const hot = this.hotTable?.hotInstance;

    // save all cell's data
    fetch('https://handsontable.com/docs/scripts/json/save.json', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: hot?.getData() }),
    }).then(() => {
      this.output = 'Data saved';
      console.log('The POST request is only used here for the demo purposes');
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
import { Example1SavingDataComponent } from './app.component';
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
  declarations: [ Example1SavingDataComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1SavingDataComponent ]
})

export class AppModule { }
/* end-file */
