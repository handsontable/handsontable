/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable/common';
import Handsontable from 'handsontable/base';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-undo-redo-custom-ui',
  template: `
    <div class="undo-redo-controls">
      <button type="button" [disabled]="!isUndoAvailable" (click)="undo()">Undo</button>
      <button type="button" [disabled]="!isRedoAvailable" (click)="redo()">Redo</button>
    </div>
    <hot-table [data]="hotData" [settings]="hotSettings"></hot-table>
  `,
})
export class AppComponent {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  isUndoAvailable = false;
  isRedoAvailable = false;

  readonly hotData = [
    { id: 1, task: 'Write release notes', status: 'Done', owner: 'Mia' },
    { id: 2, task: 'Update API docs', status: 'In progress', owner: 'Owen' },
    { id: 3, task: 'Review recipes', status: 'Blocked', owner: 'Lena' },
    { id: 4, task: 'Ship hotfix', status: 'Done', owner: 'Kai' },
  ];

  readonly hotSettings: GridSettings = {
    colHeaders: ['ID', 'Task', 'Status', 'Owner'],
    rowHeaders: true,
    width: '100%',
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      { data: 'id', type: 'numeric', width: 60, readOnly: true },
      { data: 'task', type: 'text', width: 220 },
      { data: 'status', type: 'text', width: 130 },
      { data: 'owner', type: 'text', width: 120 },
    ],
    afterChange: (_changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
      if (source !== 'loadData') {
        this.updateButtonsState();
      }
    },
    afterUndo: () => {
      this.updateButtonsState();
    },
    afterRedo: () => {
      this.updateButtonsState();
    },
  };

  updateButtonsState(): void {
    const undoRedoPlugin = this.hotTable?.hotInstance?.getPlugin('undoRedo');

    if (undoRedoPlugin) {
      this.isUndoAvailable = undoRedoPlugin.isUndoAvailable();
      this.isRedoAvailable = undoRedoPlugin.isRedoAvailable();
    }
  }

  undo(): void {
    this.hotTable?.hotInstance?.getPlugin('undoRedo').undo();
    this.updateButtonsState();
  }

  redo(): void {
    this.hotTable?.hotInstance?.getPlugin('undoRedo').redo();
    this.updateButtonsState();
  }
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
