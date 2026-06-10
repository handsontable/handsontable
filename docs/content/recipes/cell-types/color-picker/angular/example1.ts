/* file: app.component.ts */
import { Component, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
  HotTableModule
} from '@handsontable/angular-wrapper';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';

/* start:skip-in-preview */
const inputData = [
  { id: 640329, itemName: 'Lunar Core', itemNo: 'XJ-12', cost: 350000, valueStock: 700000 },
  { id: 863104, itemName: 'Zero Thrusters', itemNo: 'QL-54', cost: 450000, valueStock: 0 },
  { id: 395603, itemName: 'EVA Suits', itemNo: 'PM-67', cost: 150000, valueStock: 7500000 },
  { id: 679083, itemName: 'Solar Panels', itemNo: 'BW-09', cost: 75000, valueStock: 750000 },
  { id: 912663, itemName: 'Comm Array', itemNo: 'ZR-56', cost: 125000, valueStock: 0 },
  { id: 315806, itemName: 'Habitat Dome', itemNo: 'UJ-23', cost: 1000000, valueStock: 3000000 },
  { id: 954632, itemName: 'Oxygen Unit', itemNo: 'FK-87', cost: 600000, valueStock: 9000000 },
  { id: 734944, itemName: 'Processing Rig', itemNo: 'LK-13', cost: 350000, valueStock: 8750000 },
];
/* end:skip-in-preview */

const colorValidator = (value: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(value);

@Component({
  standalone: true,
  selector: 'example1-color-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="color-picker-cell">
      <span class="color-picker-swatch" [style.background]="value"></span>
    </div>`,
  styles: `
  :host { height: 100%; width: 100%; }
  .color-picker-cell { display: flex; align-items: center; justify-content: center; }
  .color-picker-swatch { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.15); }
  `,
})
export class ColorRendererComponent extends HotCellRendererAdvancedComponent<string> {}

@Component({
  standalone: true,
  selector: 'example1-color-picker-editor',
  template: `
    <div #editorContainer style="width:100%;height:100%;position:relative;">
      <input #colorInput class="color-picker-editor" type="text" readonly />
    </div>
  `,
  styles: `
  :host { width: 100%; height: 100%; }
  .color-picker-editor { width: 100%; height: 100%; border: none; outline: none; box-sizing: border-box !important; cursor: pointer; }
  `,
})
export class ColorPickerEditorComponent extends HotCellEditorAdvancedComponent<string> {
  @ViewChild('colorInput', { static: true }) colorInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLElement>;

  private pickrInstance: Pickr | null = null;
  private pickrButton: HTMLButtonElement | null = null;
  private openedAt = 0;

  override afterOpen(): void {
    this.openedAt = Date.now();
    this.colorInput.nativeElement.value = this.value || '#000000';

    this.pickrButton = document.createElement('button');
    this.pickrButton.textContent = 'Open color picker';
    this.pickrButton.style.cssText = 'position:absolute;opacity:0;pointer-events:none;';
    this.editorContainer.nativeElement.appendChild(this.pickrButton);
    const button = this.pickrButton;

    this.pickrInstance = Pickr.create({
      el: button,
      theme: 'nano',
      default: this.value || '#000000',
      autoReposition: false,
      padding: 0,
      components: { preview: true, hue: true },
    });

    (this.pickrInstance as any)._root.root.style.height = '0';
    (this.pickrInstance as any)._root.root.style.overflow = 'hidden';

    this.pickrInstance.on('change', (color: { toHEXA: () => { toString: () => string } } | null) => {
      if (color) {
        const hex = color.toHEXA().toString();
        this.colorInput.nativeElement.value = hex;
        this.setValue(hex);
      }
    });

    this.pickrInstance.on('hide', () => {
      if (Date.now() - this.openedAt < 400) {
        this.pickrInstance?.show();
        return;
      }
      this.finishEdit.emit();
    });

    this.pickrInstance.show();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cellRect = this.editorContainer.nativeElement.getBoundingClientRect();

        if (cellRect && this.pickrInstance) {
          (this.pickrInstance as any)._root.app.style.top = `${cellRect.bottom}px`;
        }
      });
    });
  }

  override afterClose(): void {
    (this.pickrInstance as any)?._root.app.classList.remove('visible');
    this.pickrInstance?.hide();
    this.pickrInstance?.destroy();
    this.pickrInstance = null;
    this.pickrButton?.remove();
    this.pickrButton = null;
  }

  override onFocus(): void {
    this.colorInput.nativeElement.focus();
  }
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-color-picker',
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class AppComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    color: `#${Math.round(0x1000000 + 0xffffff * Math.random()).toString(16).slice(1).toUpperCase()}`,
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    width: '100%',
    colHeaders: ['ID', 'Item Name', 'Item Color', 'Item No.', 'Cost', 'Value in Stock'],
    columns: [
      { data: 'id', type: 'numeric', width: 80, headerClassName: 'htLeft' },
      { data: 'itemName', type: 'text', width: 200, headerClassName: 'htLeft' },
      {
        data: 'color',
        headerClassName: 'htLeft',
        editor: ColorPickerEditorComponent,
        renderer: ColorRendererComponent,
        validator: colorValidator,
      } as any,
      { data: 'itemNo', type: 'text', width: 100, headerClassName: 'htLeft' },
      { data: 'cost', type: 'numeric', width: 70, headerClassName: 'htLeft' },
      { data: 'valueStock', type: 'numeric', width: 130, headerClassName: 'htRight' },
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
