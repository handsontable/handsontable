/* file: app.component.ts */
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { GridSettings, HotCellEditorAdvancedComponent, KeyboardShortcutConfig } from '@handsontable/angular-wrapper';

export const inputData = [
  { feature: 'Dark Mode', category: 'UI', priority: 'High', feedback: '👍', votes: 124, status: 'Planned' },
  { feature: 'Bulk Edit', category: 'Core', priority: 'High', feedback: '👍', votes: 98, status: 'In Progress' },
  { feature: 'AI Suggestions', category: 'Beta', priority: 'Medium', feedback: '🤷', votes: 45, status: 'Research' },
  { feature: 'Offline Mode', category: 'Infra', priority: 'Low', feedback: '👎', votes: 12, status: 'Backlog' },
];

@Component({
  selector: 'example1-feedback-angular',
  standalone: false,
  template: `
    <div class="feedback-editor">
      @for (option of config; track option) {
      <button [class.active]="option === getValue()" (click)="onClick(option)">
        {{ option }}
      </button>
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
      callback: (editor, _event) => {
        let index = this.config.indexOf(this.getValue());

        index = index === this.config.length - 1 ? 0 : index + 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges();

        return false;
      },
    },
    {
      keys: [['ArrowLeft']],
      callback: (editor, _event) => {
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
  selector: 'example1-guide-feedback-angular',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1GuideFeedbackAngularComponent {
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
      {
        data: 'feedback',
        width: 100,
        editor: FeedbackEditorComponent,
        config: ['👍', '👎', '🤷'],
      },
      { data: 'votes', type: 'numeric', width: 60 },
      { data: 'status', type: 'text', width: 120 },
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
/* start:skip-in-compilation */
import { Example1GuideFeedbackAngularComponent, FeedbackEditorComponent } from './app.component';
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
  declarations: [Example1GuideFeedbackAngularComponent, FeedbackEditorComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1GuideFeedbackAngularComponent],
})
export class AppModule {}
/* end-file */
