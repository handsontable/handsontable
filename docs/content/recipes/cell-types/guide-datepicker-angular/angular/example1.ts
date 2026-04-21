/* file: app.component.ts */
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject, ViewChild, ElementRef } from '@angular/core';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
  HotTableModule,
} from '@handsontable/angular-wrapper';
import { FormsModule } from '@angular/forms';
import { format, parse, isValid } from 'date-fns';

export const inputData = [
  {
    id: 640329,
    itemName: 'Lunar Core',
    restockDate: '2025-08-01',
  },
  {
    id: 863104,
    itemName: 'Zero Thrusters',
    restockDate: '2025-09-15',
  },
  {
    id: 395603,
    itemName: 'EVA Suits',
    restockDate: '2025-10-05',
  },
  {
    id: 679083,
    itemName: 'Solar Panels',
    restockDate: '2025-11-10',
  },
  {
    id: 912663,
    itemName: 'Comm Array',
    restockDate: '2025-12-20',
  },
  {
    id: 315806,
    itemName: 'Habitat Dome',
    restockDate: '2026-01-25',
  },
  {
    id: 954632,
    itemName: 'Oxygen Unit',
    restockDate: '2026-03-02',
  },
];

@Component({
  selector: 'example1-date-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="date"
      [(ngModel)]="dateValue"
      #editorInput
      (change)="onDateChange()"
      style="width: 100%; height: 100%; padding: 8px; border: 2px solid #4CAF50; border-radius: 4px; font-size: 14px; box-sizing: border-box;"
    />
  `,
  standalone: true,
  imports: [FormsModule],
})
export class DateEditorComponent extends HotCellEditorAdvancedComponent<string> {
  dateValue: string = '';

  @ViewChild('editorInput', { static: true })
  protected editorInput!: ElementRef<HTMLInputElement>;

  private readonly cdr = inject(ChangeDetectorRef);

  override afterOpen(): void {
    setTimeout(() => {
      this.editorInput.nativeElement.showPicker?.();
    }, 0);
  }

  override beforeOpen(_: any, { originalValue }: any) {
    if (originalValue) {
      try {
        let parsedDate: Date;

        // Try to parse MM/DD/YYYY format
        if (typeof originalValue === 'string' && originalValue.includes('/')) {
          parsedDate = parse(originalValue, 'MM/dd/yyyy', new Date());
        }
        // Try to parse YYYY-MM-DD format
        else if (typeof originalValue === 'string' && originalValue.includes('-')) {
          parsedDate = parse(originalValue, 'yyyy-MM-dd', new Date());
        }
        // Fallback to generic date parsing
        else {
          parsedDate = new Date(originalValue);
        }

        if (isValid(parsedDate)) {
          // Format as YYYY-MM-DD for native input type='date'
          this.dateValue = format(parsedDate, 'yyyy-MM-dd');
        } else {
          this.dateValue = '';
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        this.dateValue = '';
      }
    } else {
      this.dateValue = '';
    }

    this.cdr.detectChanges();
  }

  override afterClose(): void {
    this.finishEdit.emit();
  }

  onDateChange(): void {
    if (this.dateValue) {
      try {
        // Parse YYYY-MM-DD from input
        const parsedDate = parse(this.dateValue, 'yyyy-MM-dd', new Date());

        if (isValid(parsedDate)) {
          // Format as MM/DD/YYYY for Handsontable
          const formattedDate = format(parsedDate, 'MM/dd/yyyy');
          this.setValue(formattedDate);
        }
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }
  }

  override onFocus(): void {
    this.editorInput.nativeElement.focus();
  }
}

@Component({
  selector: 'example1-date-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div>
    {{ formattedDate }}
  </div>`,
  standalone: true,
  imports: [],
})
export class DateRendererComponent extends HotCellRendererAdvancedComponent<string, { renderFormat: string }> {
  get formattedDate(): string {
    return format(new Date(this.value), this.getProps().renderFormat);
  }
}

const DATE_FORMAT_US = 'MM/dd/yyyy';
const DATE_FORMAT_EU = 'dd/MM/yyyy';

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
    stars: Math.floor(Math.random() * 5) + 1,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ['ID', 'Item Name', 'Restock Date EU', 'Restock Date US'],
    columns: [
      { data: 'id', type: 'numeric' },
      {
        data: 'itemName',
        type: 'text',
      },
      {
        data: 'restockDate',
        width: 150,
        allowInvalid: false,
        rendererProps: {
          renderFormat: DATE_FORMAT_EU,
        },
        editor: DateEditorComponent,
        renderer: DateRendererComponent,
      },
      {
        data: 'restockDate',
        width: 150,
        allowInvalid: false,
        rendererProps: {
          renderFormat: DATE_FORMAT_US,
        },
        editor: DateEditorComponent,
        renderer: DateRendererComponent,
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
