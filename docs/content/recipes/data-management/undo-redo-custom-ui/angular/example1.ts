/* file: app.component.ts */
import { Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

@Component({
  selector: 'example1-undo-redo-custom-ui',
  standalone: false,
  template: `
    <div class="undo-redo-controls">
      <button type="button" [disabled]="!isUndoAvailable" (click)="undo()">Undo</button>
      <button type="button" [disabled]="!isRedoAvailable" (click)="redo()">Redo</button>
    </div>
    <hot-table [data]="hotData" [settings]="hotSettings"></hot-table>
  `,
})
export class Example1UndoRedoCustomUiComponent {
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
    undoRedo: true,
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

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1UndoRedoCustomUiComponent } from './app.component';
/* end:skip-in-compilation */

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
  declarations: [Example1UndoRedoCustomUiComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1UndoRedoCustomUiComponent],
})
export class AppModule {}
/* end-file */
