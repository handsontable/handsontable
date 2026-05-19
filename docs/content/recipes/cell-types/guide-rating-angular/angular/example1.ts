/* file: app.component.ts */
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotTableModule,
  KeyboardShortcutConfig,
  HotCellRendererAdvancedComponent,
} from '@handsontable/angular-wrapper';

export const starSvg =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

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
  selector: 'example1-guide-star-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rating-cell">
      @for (star of stars; track $index) {
        <span class="rating-star" [class.active]="$index < value" [innerHTML]="starSvgMarkup"></span>
      }
    </div>`,
  styleUrls: ['./example1.css'],
  standalone: true,
  imports: [],
})
export class StarRendererComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);
}

@Component({
  selector: 'example1-guide-star-editor',
  standalone: true,
  imports: [],
  template: `
    <div
      class="rating-editor"
      (mouseover)="onMouseOver($event)"
      (mousedown)="onMouseDown()"
    >
      @for (star of stars; track $index) {
        <span
          [attr.data-value]="$index + 1"
          class="rating-star"
          [class.active]="$index < getValue()"
          [class.current]="isCurrentStar($index)"
          [innerHTML]="starSvgMarkup"
        ></span>
      }
    </div>
  `,
  styleUrls: ['./example1.css'],
})
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);

  isCurrentStar(index: number): boolean {
    return (index + 1) === parseInt(this.getValue()?.toString() ?? '0', 10);
  }

  override shortcuts?: KeyboardShortcutConfig[] = [
    {
      keys: [['1'], ['2'], ['3'], ['4'], ['5']],
      callback: (editor, _event) => {
        editor.setValue(_event.key);
      },
    },
    {
      keys: [['ArrowRight']],
      callback: (editor, _event) => {
        if (parseInt(editor.value) < 5) {
          editor.setValue(parseInt(editor.value) + 1);
        }
      },
    },
    {
      keys: [['ArrowLeft']],
      callback: (editor, _event) => {
        if (parseInt(editor.value) > 1) {
          editor.setValue(parseInt(editor.value) - 1);
        }
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);

  onMouseOver(event: MouseEvent): void {
    const star = (event.target as HTMLElement).closest('.rating-star') as HTMLElement | null;
    if (
      star?.dataset['value'] &&
      parseInt(this.getValue()?.toString() ?? '0', 10) !== parseInt(star.dataset['value'], 10)
    ) {
      this.setValue(parseInt(star.dataset['value'], 10));
    }
    this.cdr.detectChanges();
  }

  onMouseDown(): void {
    this.finishEdit.emit();
  }
}

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
    colHeaders: ['ID', 'Item Name', 'Stars Rating'],
    columns: [
      { data: 'id', type: 'numeric' },
      {
        data: 'itemName',
        type: 'text',
      },
      {
        data: 'stars',
        width: 200,
        renderer: StarRendererComponent,
        editor: StarEditorComponent,
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
