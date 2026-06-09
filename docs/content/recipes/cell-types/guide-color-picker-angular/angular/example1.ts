/* file: app.component.ts */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
  HotTableModule,
} from '@handsontable/angular-wrapper';

export const inputData = [
  {
    id: 640329,
    itemName: 'Lunar Core',
    itemNo: 'XJ-12',
    leadEngineer: 'Ellen Ripley',
    cost: 350000,
    inStock: true,
    category: 'Lander',
    itemQuality: 87,
    origin: '🇺🇸 USA',
    quantity: 2,
    valueStock: 700000,
    repairable: false,
    supplierName: 'TechNova',
    restockDate: '2025-08-01',
    operationalStatus: 'Awaiting Parts',
  },
  {
    id: 863104,
    itemName: 'Zero Thrusters',
    itemNo: 'QL-54',
    leadEngineer: 'Sam Bell',
    cost: 450000,
    inStock: false,
    category: 'Propulsion',
    itemQuality: 0,
    origin: '🇩🇪 Germany',
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: 'PropelMax',
    restockDate: '2025-09-15',
    operationalStatus: 'In Maintenance',
  },
  {
    id: 395603,
    itemName: 'EVA Suits',
    itemNo: 'PM-67',
    leadEngineer: 'Alex Rogan',
    cost: 150000,
    inStock: true,
    category: 'Equipment',
    itemQuality: 79,
    origin: '🇮🇹 Italy',
    quantity: 50,
    valueStock: 7500000,
    repairable: true,
    supplierName: 'SuitCraft',
    restockDate: '2025-10-05',
    operationalStatus: 'Ready for Testing',
  },
  {
    id: 679083,
    itemName: 'Solar Panels',
    itemNo: 'BW-09',
    leadEngineer: 'Dave Bowman',
    cost: 75000,
    inStock: true,
    category: 'Energy',
    itemQuality: 95,
    origin: '🇺🇸 USA',
    quantity: 10,
    valueStock: 750000,
    repairable: false,
    supplierName: 'SolarStream',
    restockDate: '2025-11-10',
    operationalStatus: 'Operational',
  },
  {
    id: 912663,
    itemName: 'Comm Array',
    itemNo: 'ZR-56',
    leadEngineer: 'Louise Banks',
    cost: 125000,
    inStock: false,
    category: 'Communication',
    itemQuality: 0,
    origin: '🇯🇵 Japan',
    quantity: 0,
    valueStock: 0,
    repairable: true,
    supplierName: 'CommTech',
    restockDate: '2025-12-20',
    operationalStatus: 'Decommissioned',
  },
  {
    id: 315806,
    itemName: 'Habitat Dome',
    itemNo: 'UJ-23',
    leadEngineer: 'Dr. Ryan Stone',
    cost: 1000000,
    inStock: true,
    category: 'Shelter',
    itemQuality: 93,
    origin: '🇨🇦 Canada',
    quantity: 3,
    valueStock: 3000000,
    repairable: false,
    supplierName: 'DomeInnovate',
    restockDate: '2026-01-25',
    operationalStatus: 'Operational',
  },
  {
    id: 954632,
    itemName: 'Oxygen Unit',
    itemNo: 'FK-87',
    leadEngineer: 'Dr. Grace Augustine',
    cost: 600000,
    inStock: true,
    category: 'Life Support',
    itemQuality: 85,
    origin: '🇺🇸 USA',
    quantity: 15,
    valueStock: 9000000,
    repairable: true,
    supplierName: 'OxyGenius',
    restockDate: '2026-03-02',
    operationalStatus: 'Awaiting Parts',
  },
  {
    id: 734944,
    itemName: 'Processing Rig',
    itemNo: 'LK-13',
    leadEngineer: 'Jake Sully',
    cost: 350000,
    inStock: true,
    category: 'Mining',
    itemQuality: 81,
    origin: '🇦🇺 Australia',
    quantity: 25,
    valueStock: 8750000,
    repairable: true,
    supplierName: 'RigTech',
    restockDate: '2026-04-15',
    operationalStatus: 'Ready for Testing',
  },
  {
    id: 834662,
    itemName: 'Navigation Module',
    itemNo: 'XP-24',
    leadEngineer: 'Dr. Ellie Arroway',
    cost: 450000,
    inStock: true,
    category: 'Navigation',
    itemQuality: 89,
    origin: '🇫🇷 France',
    quantity: 8,
    valueStock: 3600000,
    repairable: false,
    supplierName: 'NavSolutions',
    restockDate: '2026-05-30',
    operationalStatus: 'In Maintenance',
  },
  {
    id: 714329,
    itemName: 'Surveyor Arm',
    itemNo: 'QA-86',
    leadEngineer: 'Mark Watney',
    cost: 100000,
    inStock: true,
    category: 'Exploration',
    itemQuality: 78,
    origin: '🇺🇸 USA',
    quantity: 40,
    valueStock: 4000000,
    repairable: true,
    supplierName: 'ExploreTech',
    restockDate: '2026-07-12',
    operationalStatus: 'Decommissioned',
  },
];

const colorValidator = (value: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
};

@Component({
  selector: 'example1-color-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="color-picker-cell">
      <span class="color-picker-swatch" [style.background]="value"></span>
    </div>`,
  styles: `
  :host {
    height: 100%;
    width: 100%;
  }
  .color-picker-cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .color-picker-swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.15);
  }
  `,
  standalone: true,
  imports: [],
})
export class ColorRendererComponent extends HotCellRendererAdvancedComponent<string> {}

@Component({
  selector: 'example1-color-picker-editor',
  template: `
    <input
      class="color-picker-editor"
      type="color"
      [value]="value"
      (input)="onColorChange($event)"
    />
  `,
  styles: `
  :host {
    height: 100%;
    width: 100%;
  }
  .color-picker-editor {
    width: 100%;
    height: 100%;
    box-sizing: border-box !important;
    cursor: pointer;
    border: none;
    outline: none;
  }
  `,
  standalone: true,
  imports: [],
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
  selector: 'app-root',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    // eslint-disable-next-line no-mixed-operators
    color: `#${
      // eslint-disable-next-line no-mixed-operators
      Math.round(0x1000000 + 0xffffff * Math.random())
        .toString(16)
        .slice(1)
        .toUpperCase()
    }`,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    width: '100%',
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ['ID', 'Item Name', 'Item Color', 'Item No.', 'Cost', 'Value in Stock'],
    columns: [
      {
        data: 'id',
        type: 'numeric',
        width: 80,
        headerClassName: 'htLeft',
      },
      {
        data: 'itemName',
        type: 'text',
        width: 200,
        headerClassName: 'htLeft',
      },
      {
        data: 'color',
        headerClassName: 'htLeft',
        editor: ColorPickerEditorComponent,
        renderer: ColorRendererComponent,
        validator: colorValidator,
      },
      {
        data: 'itemNo',
        type: 'text',
        width: 100,
        headerClassName: 'htLeft',
      },
      {
        data: 'cost',
        type: 'numeric',
        width: 70,
        headerClassName: 'htLeft',
      },
      {
        data: 'valueStock',
        type: 'numeric',
        width: 130,
        headerClassName: 'htRight',
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
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};
/* end-file */
