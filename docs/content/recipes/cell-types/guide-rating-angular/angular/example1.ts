/* file: app.component.ts */
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  KeyboardShortcutConfig,
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
  selector: 'example1-guide-star-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div>
    @for (star of stars; track $index) {
    <span [attr.data-value]="$index + 1" [style.opacity]="$index < value ? '1' : '0.4'">⭐</span>
    }
  </div>`,
  standalone: false,
})
export class StarRendererComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
}

@Component({
  selector: 'example1-guide-star-editor',
  standalone: false,
  template: `
    <div
      style="background: #eee; padding: 5px 8px; border:1px solid blue; cursor: pointer; border-radius: 4px; font-size: 16px;"
      (mouseover)="onMouseOver($event)"
      (mousedown)="onMouseDown()"
    >
      @for (star of stars; track $index) {
      <span [attr.data-value]="$index + 1" [style.opacity]="$index < getValue() ? '1' : '0.4'">⭐</span>
      }
    </div>
  `,
})
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);

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
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLSpanElement &&
      target.dataset['value'] &&
      parseInt(this.getValue().toString()) !== parseInt(target.dataset['value'])
    ) {
      this.setValue(parseInt(target.dataset['value']));
    }
    this.cdr.detectChanges();
  }

  onMouseDown(): void {
    this.finishEdit.emit();
  }
}

@Component({
  selector: 'example1-guide-star-angular',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1GuideStarAngularComponent {
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

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1GuideStarAngularComponent, StarEditorComponent, StarRendererComponent } from './app.component';
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
  declarations: [Example1GuideStarAngularComponent, StarEditorComponent, StarRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1GuideStarAngularComponent],
})
export class AppModule {}
/* end-file */
