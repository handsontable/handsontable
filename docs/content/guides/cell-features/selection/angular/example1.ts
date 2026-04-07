/* file: app.component.ts */
import {Component, ViewChild, ViewEncapsulation, HostListener, ElementRef} from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example1-selection',
  standalone: false,
  template: ` <div class="controls">
      <div class="theme-dropdown" #dropdownRef>
        <button
          class="theme-dropdown-trigger"
          type="button"
          aria-haspopup="listbox"
          [attr.aria-expanded]="isOpen"
          (click)="toggleDropdown()"
        >
          <span>{{ selectedLabel }}</span>
          <svg class="theme-dropdown-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"/></svg>
        </button>
        <ul class="theme-dropdown-menu" role="listbox" *ngIf="isOpen">
          <li
            *ngFor="let opt of options"
            role="option"
            [attr.aria-selected]="selected === opt.value"
            (click)="selectOption(opt.value)"
          >
            {{ opt.label }}
          </li>
        </ul>
      </div>
    </div>
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>`,
  encapsulation: ViewEncapsulation.None
})
export class Example1SelectionComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  isOpen = false;
  selected = 'multiple';

  readonly options = [
    { value: 'single', label: 'Single selection' },
    { value: 'range', label: 'Range selection' },
    { value: 'multiple', label: 'Multiple ranges selection' },
  ];

  readonly data = [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7'],
    ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8'],
    ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9'],
  ];

  readonly gridSettings: GridSettings = {
    width: 'auto',
    height: 'auto',
    colWidths: 100,
    rowHeaders: true,
    colHeaders: true,
    selectionMode: 'multiple', // 'single', 'range' or 'multiple',
    autoWrapRow: true,
    autoWrapCol: true
  };

  get selectedLabel(): string {
    return this.options.find((o) => o.value === this.selected)?.label || '';
  }

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(value: string): void {
    this.selected = value;
    this.isOpen = false;
    type selection = 'multiple' | 'single' | 'range' | undefined;

    this.hotTable?.hotInstance?.updateSettings({ selectionMode: value as selection });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.theme-dropdown')?.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen = false;
    }
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
import { Example1SelectionComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ Example1SelectionComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example1SelectionComponent ]
})

export class AppModule { }
/* end-file */
