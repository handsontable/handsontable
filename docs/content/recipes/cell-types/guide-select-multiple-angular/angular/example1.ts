/* file: app.component.ts */
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
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
  template: `<div class="multiselect-editor-container" (click)="$event.stopPropagation()">
    <div class="multiselect-wrapper">
      <label>Select options:</label>
      <div class="dropdown">
        <div class="dropdown-header" (click)="toggleDropdown()">
          <span>{{ getSelectedLabel() }}</span>
          <span class="arrow">▼</span>
        </div>
        @if (isOpen) {
        <div class="dropdown-list">
          @for (option of config; track option.value) {
          <div class="dropdown-item" (click)="toggleOption(option)">
            <input type="checkbox" [checked]="isSelected(option.value)" (click)="$event.stopPropagation()" />
            <label>{{ option.label }}</label>
          </div>
          }
        </div>
        }
      </div>
    </div>
  </div>`,
  styles: [
    `
      .multiselect-editor-container {
        padding: 8px;
        background: white;
        min-width: 250px;
      }
      .multiselect-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .multiselect-wrapper > label {
        font-size: 12px;
        font-weight: 500;
        color: #333;
      }
      .dropdown {
        position: relative;
        width: 100%;
      }
      .dropdown-header {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }
      .dropdown-header:hover {
        border-color: #1976d2;
      }
      .arrow {
        font-size: 10px;
        color: #666;
      }
      .dropdown-list {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
      }
      .dropdown-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dropdown-item:hover {
        background: #f5f5f5;
      }
      .dropdown-item input[type='checkbox'] {
        cursor: pointer;
      }
      .dropdown-item label {
        cursor: pointer;
        font-size: 14px;
        flex: 1;
      }
    `,
  ],
  standalone: false,
  selector: 'example1-multi-select-editor',
})
export class MultiSelectEditorComponent extends HotCellEditorAdvancedComponent<{ value: string; label: string }[]> {
  selectedValues: { value: string; label: string }[] = [];
  isOpen = false;

  private readonly cdr = inject(ChangeDetectorRef);

  override afterClose(): void {
    this.selectedValues = [];
    this.isOpen = false;
    this.finishEdit.emit();
  }

  override beforeOpen(editor: any): void {
    this.config = editor.cellProperties.config || [];
    this.selectedValues = [...editor.originalValue];
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.cdr.detectChanges();
  }

  toggleOption(option: { value: string; label: string }): void {
    const index = this.selectedValues.findIndex((item) => item.value === option.value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(option);
    }

    this.setValue(this.selectedValues);
    this.cdr.detectChanges();
  }

  isSelected(value: string): boolean {
    return this.selectedValues.some((item) => item.value === value);
  }

  getSelectedLabel(): string {
    if (this.selectedValues.length === 0) {
      return 'Select options...';
    }
    return this.selectedValues.map((item) => item.label).join(', ');
  }
}

@Component({
  selector: 'example1-multi-select-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>
    {{ displayValue }}
  </div>`,
  standalone: false,
})
export class MultiSelectRendererComponent extends HotCellRendererAdvancedComponent<{ value: string; label: string }[]> {
  get displayValue(): string {
    return this.value && this.value.length > 0 ? this.value.map((el) => el.label).join(', ') : 'No elements';
  }
}

const components = [
  { value: '1', label: 'Component 1' },
  { value: '2', label: 'Component 2' },
  { value: '3', label: 'Component 3' },
];

@Component({
  selector: 'example1-guide-multi-select-angular',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1GuideMultiSelectAngularComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    components: components
      .map((n) => {
        return [Math.random(), n];
      })
      .sort()
      .map((n) => {
        return n[1];
      })
      .slice(0, Math.ceil(Math.random() * components.length)),
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ['ID', 'Item Name', 'Components'],
    columns: [
      { data: 'id', type: 'numeric' },
      {
        data: 'itemName',
        type: 'text',
      },
      {
        data: 'components',
        width: 150,
        allowInvalid: false,
        renderer: MultiSelectRendererComponent,
        editor: MultiSelectEditorComponent,
        config: components,
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
import { FormsModule } from '@angular/forms';
/* start:skip-in-compilation */
import {
  Example1GuideMultiSelectAngularComponent,
  MultiSelectEditorComponent,
  MultiSelectRendererComponent,
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
  imports: [BrowserModule, HotTableModule, CommonModule, FormsModule],
  declarations: [Example1GuideMultiSelectAngularComponent, MultiSelectEditorComponent, MultiSelectRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1GuideMultiSelectAngularComponent],
})
export class AppModule {}
/* end-file */
