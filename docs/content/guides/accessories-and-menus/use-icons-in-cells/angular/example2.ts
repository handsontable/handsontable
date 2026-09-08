/* file: app.component.ts */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridSettings, HotCellRendererComponent, HotTableModule } from '@handsontable/angular-wrapper';
import { Flag, FlagOff, LucideAngularModule } from 'lucide-angular';

interface Task {
  task: string;
  assignee: string;
  dueDate: string;
  flagged: boolean;
}

// A renderer component receives the cell's value and coordinates, so the
// Lucide icon goes in the template. No `data-lucide` placeholder and no
// `createIcons()` scan - Angular renders the `<svg>` itself.
@Component({
  selector: 'app-flag-renderer',
  standalone: true,
  imports: [LucideAngularModule],
  // The icon has no accessible name, so the button carries an `aria-label`
  // that describes what clicking it does. `currentColor` is Lucide's default
  // stroke, so the icon stays visible in both light and dark themes.
  template: `
    <button
      type="button"
      [attr.aria-label]="label"
      style="background: none; border: none; cursor: pointer; padding: 0.25rem;"
      (click)="toggle()"
    >
      <lucide-icon [img]="value ? flagIcon : flagOffIcon" [size]="18"></lucide-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagRendererComponent extends HotCellRendererComponent<boolean> {
  readonly flagIcon = Flag;
  readonly flagOffIcon = FlagOff;

  get label(): string {
    const taskName = String(this.instance.getDataAtCell(this.row, 0));

    return this.value
      ? `Remove the follow-up flag from ${taskName}`
      : `Flag ${taskName} for follow-up`;
  }

  toggle(): void {
    this.instance.setDataAtCell(this.row, 3, !this.value);
  }
}

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example2',
  template: `
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  `,
})
export class AppComponent {
  readonly data: Task[] = [
    { task: 'Update API docs', assignee: 'Ana García', dueDate: '2025-06-30', flagged: true },
    { task: 'Deploy hotfix', assignee: 'James Okafor', dueDate: '2025-06-18', flagged: false },
    { task: 'Review pull request', assignee: 'Li Wei', dueDate: '2025-06-20', flagged: false },
    { task: 'Write release notes', assignee: 'Sara Nowak', dueDate: '2025-06-25', flagged: true },
    { task: 'Fix flaky test', assignee: 'Marco Rossi', dueDate: '2025-06-22', flagged: false },
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: ['Task', 'Assignee', 'Due date', 'Flagged'],
    columns: [
      { data: 'task' },
      { data: 'assignee' },
      { data: 'dueDate', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
      { data: 'flagged', renderer: FlagRendererComponent, className: 'htCenter' },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
  };
}
/* end-file */

/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
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
