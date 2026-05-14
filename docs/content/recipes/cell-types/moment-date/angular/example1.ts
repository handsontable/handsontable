/* file: app.component.ts */
import { Component, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import {
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
  GridSettings,
  HotTableModule
} from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';

const DATE_FORMAT = 'YYYY-MM-DD';

@Component({
  standalone: true,
  selector: 'example1-moment-date-editor',
  template: `<div #container class="pikaday-container"></div>`,
  styles: [
    `
    :host { display: block; }
    .pikaday-container { min-height: 250px; }
  `,
  ],
})
export class MomentDateEditorComponent extends HotCellEditorAdvancedComponent<string> {
  @ViewChild('container', { static: true }) container!: ElementRef;
  private pikaday: Pikaday | null = null;

  override afterOpen(): void {
    this.pikaday = new Pikaday({
      field: this.container.nativeElement,
      container: this.container.nativeElement,
      bound: false,
      format: DATE_FORMAT,
      firstDay: 0,
      showWeekNumber: true,
      disableDayFn: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
      onSelect: (date: Date) => {
        this.setValue(moment(date).format(DATE_FORMAT));
      },
      onClose: () => {
        this.finishEdit.emit();
      },
    });

    if (this.value) {
      const m = moment(this.value, DATE_FORMAT, true);

      if (m.isValid()) {
        (this.pikaday as any).setMoment?.(m);
      }
    } else {
      this.pikaday.gotoToday();
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
  standalone: true,
  selector: 'example1-moment-date-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ formattedDate }}</span>`,
})
export class MomentDateRendererComponent extends HotCellRendererAdvancedComponent<string> {
  get formattedDate(): string {
    if (!this.value) return '';
    const m = moment(this.value, DATE_FORMAT, true);

    return m.isValid() ? m.format(DATE_FORMAT) : this.value;
  }
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-moment-date',
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class AppComponent {
  readonly data = [
    {
      itemName: 'Lunar Core',
      category: 'Lander',
      leadEngineer: 'Ellen Ripley',
      restockDate: '2025-08-01',
      cost: 350000,
    },
    {
      itemName: 'Zero Thrusters',
      category: 'Propulsion',
      leadEngineer: 'Sam Bell',
      restockDate: '2025-09-15',
      cost: 450000,
    },
    {
      itemName: 'EVA Suits',
      category: 'Equipment',
      leadEngineer: 'Alex Rogan',
      restockDate: '2025-10-05',
      cost: 150000,
    },
    {
      itemName: 'Solar Panels',
      category: 'Energy',
      leadEngineer: 'Dave Bowman',
      restockDate: '2025-11-10',
      cost: 75000,
    },
    {
      itemName: 'Comm Array',
      category: 'Communication',
      leadEngineer: 'Louise Banks',
      restockDate: '2025-12-20',
      cost: 125000,
    },
    {
      itemName: 'Habitat Dome',
      category: 'Shelter',
      leadEngineer: 'Dr. Ryan Stone',
      restockDate: '2026-01-25',
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
        editor: MomentDateEditorComponent,
        renderer: MomentDateRendererComponent,
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
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

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
