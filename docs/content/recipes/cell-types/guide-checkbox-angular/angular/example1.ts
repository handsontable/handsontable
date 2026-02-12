/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotCellEditorAdvancedComponent } from '@handsontable/angular-wrapper';

export const inputData = [
  {
    id: 640329,
    itemName: 'Lunar Core',
    inStock: true,
  },
  {
    id: 863104,
    itemName: 'Zero Thrusters',
    inStock: false,
  },
  {
    id: 395603,
    itemName: 'EVA Suits',
    inStock: true,
  },
  {
    id: 679083,
    itemName: 'Solar Panels',
    inStock: true,
  },
  {
    id: 912663,
    itemName: 'Comm Array',
    inStock: false,
  },
  {
    id: 315806,
    itemName: 'Habitat Dome',
    inStock: true,
  },
  {
    id: 954632,
    itemName: 'Oxygen Unit',
    inStock: true,
  },
];

@Component({
  selector: 'example1-checkbox-editor',
  template: `
    <div
      style="background-color: white; border: 2px solid #1a42e8;  display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;"
    >
      <mat-checkbox [checked]="value" (change)="onCheckboxChange($event.checked)" color="primary"> </mat-checkbox>
    </div>
  `,
  standalone: false,
})
export class CheckboxEditorComponent extends HotCellEditorAdvancedComponent<boolean> {
  onCheckboxChange(checked: boolean): void {
    this.value = checked;
    this.finishEdit.emit();
  }

  override setValue(value: boolean): void {
    this.value = value ?? false;
  }

  override getValue(): boolean {
    return this.value ?? false;
  }
}

@Component({
  selector: 'example1-guide-checkbox-angular',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1GuideCheckboxAngularComponent {
  readonly data = inputData.map((el) => ({
    ...el,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ['ID', 'Item Name', 'In Stock'],
    columns: [
      { data: 'id', type: 'numeric' },
      {
        data: 'itemName',
        type: 'text',
      },
      {
        data: 'inStock',
        width: 150,
        editor: CheckboxEditorComponent,
      },
    ],
  };
}
/* end-file */

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
import { MatCheckboxModule } from '@angular/material/checkbox';
/* start:skip-in-compilation */
import { Example1GuideCheckboxAngularComponent, CheckboxEditorComponent } from './app.component';
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
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule, MatCheckboxModule],
  declarations: [Example1GuideCheckboxAngularComponent, CheckboxEditorComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1GuideCheckboxAngularComponent],
})
export class AppModule {}
/* end-file */
