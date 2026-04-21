/* file: app.component.ts */
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { GridSettings, HotCellEditorAdvancedComponent, KeyboardShortcutConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable/common';

/* start:skip-in-preview */
const inputData = [
  { feature: 'Dark Mode', category: 'UI', priority: 'High', feedback: '👍', votes: 124, status: 'Planned' },
  { feature: 'Bulk Edit', category: 'Core', priority: 'High', feedback: '👍', votes: 98, status: 'In Progress' },
  { feature: 'AI Suggestions', category: 'Beta', priority: 'Medium', feedback: '🤷', votes: 45, status: 'Research' },
  { feature: 'Offline Mode', category: 'Infra', priority: 'Low', feedback: '👎', votes: 12, status: 'Backlog' },
];
/* end:skip-in-preview */

@Component({
  standalone: true,
  selector: 'example1-feedback-editor',
  template: `
    <div class="feedback-editor">
      @for (option of config; track option) {
        <button [class.active]="option === getValue()" (click)="onClick(option)">{{ option }}</button>
      }
    </div>
  `,
  styleUrls: ['./example1.css'],
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ['👍', '👎', '🤷'];
  override value = '👍';

  override shortcuts?: KeyboardShortcutConfig[] = [
    {
      keys: [['ArrowRight'], ['Tab']],
      callback: (_editor, _event) => {
        let index = this.config.indexOf(this.getValue());

        index = index === this.config.length - 1 ? 0 : index + 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges();
        return false;
      },
    },
    {
      keys: [['ArrowLeft']],
      callback: (_editor, _event) => {
        let index = this.config.indexOf(this.getValue());

        index = index === 0 ? this.config.length - 1 : index - 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges();
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);

  onClick(option: string): void {
    this.setValue(option);
    this.finishEdit.emit();
  }
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'example1-feedback',
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class AppComponent {
  readonly data = inputData;

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    width: '100%',
    headerClassName: 'htLeft',
    colHeaders: ['Feature', 'Category', 'Priority', 'Feedback', 'Votes', 'Status'],
    columns: [
      { data: 'feature', type: 'text', width: 200 },
      { data: 'category', type: 'text', width: 90 },
      { data: 'priority', type: 'text', width: 100 },
      { data: 'feedback', width: 100, editor: FeedbackEditorComponent },
      { data: 'votes', type: 'numeric', width: 60 },
      { data: 'status', type: 'text', width: 120 },
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
