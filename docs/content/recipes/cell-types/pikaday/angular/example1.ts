/* file: app.component.ts */
import { Component, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import {
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
  GridSettings,
} from '@handsontable/angular-wrapper';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';

const DATE_FORMAT_US = 'MM/DD/YYYY';

@Component({
  selector: 'example1-pikaday-editor',
  template: `<div #container class="pikaday-container"></div>`,
  styles: [
    `
    :host { display: block; }
    .pikaday-container { min-height: 250px; }
  `,
  ],
  standalone: false,
})
export class PikadayEditorComponent extends HotCellEditorAdvancedComponent<string> {
  @ViewChild('container', { static: true }) container!: ElementRef;
  private pikaday: Pikaday | null = null;

  override afterOpen(): void {
    const FORMAT = DATE_FORMAT_US;

    this.pikaday = new Pikaday({
      field: this.container.nativeElement,
      container: this.container.nativeElement,
      bound: false,
      format: FORMAT,
      onSelect: (date: Date) => {
        this.setValue(moment(date).format(FORMAT));
      },
      onClose: () => {
        this.finishEdit.emit();
      },
    });

    if (this.value) {
      const m = moment(this.value, FORMAT, true);

      if (m.isValid()) {
        (this.pikaday as any).setMoment?.(m);
      }
    }

    this.pikaday.show();
  }

  override afterClose(): void {
    this.pikaday?.destroy();
    this.pikaday = null;
  }

  override onFocus(): void {
    this.container.nativeElement.focus();
  }
}

@Component({
  selector: 'example1-pikaday-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ formattedDate }}</span>`,
  standalone: false,
})
export class PikadayRendererComponent extends HotCellRendererAdvancedComponent<string> {
  get formattedDate(): string {
    if (!this.value) return '';
    const m = moment(this.value, DATE_FORMAT_US, true);

    return m.isValid() ? m.format(DATE_FORMAT_US) : this.value;
  }
}

@Component({
  selector: 'example1-pikaday',
  standalone: false,
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class Example1PikadayComponent {
  readonly data = [
    {
      itemName: 'Lunar Core',
      category: 'Lander',
      leadEngineer: 'Ellen Ripley',
      restockDate: '08/01/2025',
      cost: 350000,
    },
    {
      itemName: 'Zero Thrusters',
      category: 'Propulsion',
      leadEngineer: 'Sam Bell',
      restockDate: '09/15/2025',
      cost: 450000,
    },
    {
      itemName: 'EVA Suits',
      category: 'Equipment',
      leadEngineer: 'Alex Rogan',
      restockDate: '10/05/2025',
      cost: 150000,
    },
    {
      itemName: 'Solar Panels',
      category: 'Energy',
      leadEngineer: 'Dave Bowman',
      restockDate: '11/10/2025',
      cost: 75000,
    },
    {
      itemName: 'Comm Array',
      category: 'Communication',
      leadEngineer: 'Louise Banks',
      restockDate: '12/20/2025',
      cost: 125000,
    },
    {
      itemName: 'Habitat Dome',
      category: 'Shelter',
      leadEngineer: 'Dr. Ryan Stone',
      restockDate: '01/25/2026',
      cost: 1000000,
    },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Item Name', 'Category', 'Lead Engineer', 'Restock Date', 'Cost'],
    autoRowSize: true,
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
    headerClassName: 'htLeft',
    columns: [
      { data: 'itemName', type: 'text', width: 130 },
      { data: 'category', type: 'text', width: 120 },
      { data: 'leadEngineer', type: 'text', width: 150 },
      {
        data: 'restockDate',
        width: 150,
        allowInvalid: false,
        editor: PikadayEditorComponent,
        renderer: PikadayRendererComponent,
      } as any,
      {
        data: 'cost',
        type: 'numeric',
        width: 120,
        className: 'htRight',
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US',
        },
      },
    ],
    licenseKey: 'non-commercial-and-evaluation',
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
  Example1PikadayComponent,
  PikadayEditorComponent,
  PikadayRendererComponent,
} from './app.component';
/* end:skip-in-compilation */

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1PikadayComponent, PikadayEditorComponent, PikadayRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1PikadayComponent],
})
export class AppModule {}
/* end-file */
