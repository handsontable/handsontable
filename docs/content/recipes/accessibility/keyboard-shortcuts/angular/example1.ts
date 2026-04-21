/* file: app.component.ts */
import { Component, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

/* start:skip-in-preview */
const employees = [
  { name: 'Ana García', department: 'Engineering', role: 'Senior Developer', salary: 95000, startDate: '2021-03-15' },
  { name: 'James Okafor', department: 'Marketing', role: 'Marketing Manager', salary: 82000, startDate: '2020-07-01' },
  { name: 'Li Wei', department: 'Engineering', role: 'Frontend Developer', salary: 78000, startDate: '2022-01-10' },
  { name: 'Priya Nair', department: 'HR', role: 'HR Specialist', salary: 68000, startDate: '2019-11-20' },
  { name: 'Carlos Mendes', department: 'Finance', role: 'Financial Analyst', salary: 88000, startDate: '2021-09-05' },
  { name: 'Fatima Al-Hassan', department: 'Engineering', role: 'Backend Developer', salary: 92000, startDate: '2020-04-18' },
  { name: 'Noah Kim', department: 'Design', role: 'UX Designer', salary: 75000, startDate: '2023-02-14' },
  { name: 'Sara Lindqvist', department: 'Marketing', role: 'Content Strategist', salary: 71000, startDate: '2022-06-30' },
];
/* end:skip-in-preview */

@Component({
  selector: 'example1-keyboard-shortcuts',
  standalone: false,
  template: `
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    <span class="shortcut-status" [class.visible]="statusMessage">{{ statusMessage }}</span>
    <div class="submit-log">{{ submitLog }}</div>
  `,
  styleUrls: ['./example1.css'],
})
export class Example1KeyboardShortcutsComponent implements AfterViewInit, OnDestroy {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  data = employees;
  statusMessage = '';
  submitLog = '';

  private statusTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly gridSettings: GridSettings = {
    colHeaders: ['Name', 'Department', 'Role', 'Salary', 'Start Date'],
    columns: [
      { data: 'name', type: 'text' },
      { data: 'department', type: 'text' },
      { data: 'role', type: 'text' },
      { data: 'salary', type: 'numeric', numericFormat: { pattern: '$0,0' } },
      { data: 'startDate', type: 'text' },
    ],
    rowHeaders: true,
    height: 'auto',
    width: '100%',
    autoWrapRow: true,
  };

  ngAfterViewInit(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    // Ctrl+D: duplicate the currently selected row
    gridContext.addShortcut({
      keys: [['Control', 'd']],
      group: 'customActions',
      runOnlyIf: () => hot.getSelected() !== undefined,
      callback: (event: KeyboardEvent) => {
        event.preventDefault();

        const selectedRange = hot.getSelectedRangeLast();

        if (!selectedRange) {
          return;
        }

        const row = selectedRange.from.row;
        const rowData = hot.getSourceDataAtRow(row) as Record<string, unknown>;

        hot.alter('insert_row_below', row);
        hot.populateFromArray(row + 1, 0, [Object.values(rowData)]);

        this.showStatus('Ctrl+D -- row duplicated');
      },
    });

    // Ctrl+Enter: submit the grid data
    gridContext.addShortcut({
      keys: [['Control', 'Enter']],
      group: 'customActions',
      runOnlyIf: () => true,
      callback: (event: KeyboardEvent) => {
        event.preventDefault();

        const data = hot.getData();
        const headers = hot.getColHeader() as string[];
        const rowCount = data.length;
        const timestamp = new Date().toLocaleTimeString();

        this.submitLog = `[${timestamp}] Submitted ${rowCount} rows -- columns: ${headers.join(', ')}`;
        this.showStatus('Ctrl+Enter -- data submitted');
      },
    });
  }

  ngOnDestroy(): void {
    const hot = this.hotTable?.hotInstance;

    if (!hot) {
      return;
    }

    hot.getShortcutManager().getContext('grid').removeShortcutsByGroup('customActions');
  }

  private showStatus(message: string): void {
    this.statusMessage = message;
    if (this.statusTimeout !== null) {
      clearTimeout(this.statusTimeout);
    }
    this.statusTimeout = setTimeout(() => {
      this.statusMessage = '';
      this.statusTimeout = null;
    }, 2000);
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
import { Example1KeyboardShortcutsComponent } from './app.component';
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
  declarations: [Example1KeyboardShortcutsComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1KeyboardShortcutsComponent],
})
export class AppModule {}
/* end-file */
