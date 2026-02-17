/* file: app.component.ts */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
} from '@handsontable/angular-wrapper';

export const inputData = [
  {
    id: 640329,
    itemName: 'Lunar Core',
  },
  {
    id: 863104,
    itemName: 'Zero Thrusters',
  },
  {
    id: 395603,
    itemName: 'EVA Suits',
  },
  {
    id: 679083,
    itemName: 'Solar Panels',
  },
  {
    id: 912663,
    itemName: 'Comm Array',
  },
  {
    id: 315806,
    itemName: 'Habitat Dome',
  },
  {
    id: 954632,
    itemName: 'Oxygen Unit',
  },
];

@Component({
  selector: 'example1-color-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div style="height: 100%; width: 100%;" [style.background]="value">
    <b>{{ value }}</b>
  </div>`,
  styles: `
  :host{
    height: 100%;
    width: 100%;
  }
  `,
  standalone: false,
})
export class ColorRendererComponent extends HotCellRendererAdvancedComponent<string> {}

@Component({
  selector: 'example1-color-picker-editor',
  template: `
    <input style="width: 100%; height: 100%;" type="color" [value]="value" (input)="onColorChange($event)" />
  `,
  standalone: false,
})
export class ColorPickerEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override afterClose(): void {
    this.finishEdit.emit();
  }

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setValue(input.value);
  }
}

@Component({
  selector: 'example1-guide-color-picker-angular',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1GuideColorPickerAngularComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    color: `#${Math.round(0x1000000 + 0xffffff * Math.random())
      .toString(16)
      .slice(1)
      .toUpperCase()}`,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ['ID', 'Item Name', 'Item color'],
    columns: [
      { data: 'id', type: 'numeric' },
      {
        data: 'itemName',
        type: 'text',
      },
      {
        data: 'color',
        width: 150,
        editor: ColorPickerEditorComponent,
        renderer: ColorRendererComponent,
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
/* start:skip-in-compilation */
import {
  Example1GuideColorPickerAngularComponent,
  ColorPickerEditorComponent,
  ColorRendererComponent,
} from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1GuideColorPickerAngularComponent, ColorPickerEditorComponent, ColorRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1GuideColorPickerAngularComponent],
})
export class AppModule {}
/* end-file */
