/* file: app.component.ts */
import { Component, ChangeDetectorRef, inject } from "@angular/core";
import { GridSettings, HotCellEditorAdvancedComponent, KeyboardShortcutConfig } from "@handsontable/angular-wrapper";

export const inputData = [
  {
    id: 640329,
    itemName: "Lunar Core",
  },
  {
    id: 863104,
    itemName: "Zero Thrusters",
  },
  {
    id: 395603,
    itemName: "EVA Suits",
  },
  {
    id: 679083,
    itemName: "Solar Panels",
  },
  {
    id: 912663,
    itemName: "Comm Array",
  },
  {
    id: 315806,
    itemName: "Habitat Dome",
  },
  {
    id: 954632,
    itemName: "Oxygen Unit",
  },
];

@Component({
  selector: "example1-feedback-angular",
  standalone: false,
  template: `
    <div style="display: flex; gap: 4px; background:#eee; border: 1px solid #ccc; border-radius: 4px;">
      <button
        style="width:33%;"
        [style.backgroundColor]="option === getValue() ? '#90f5e7ff' : '#fff'"
        [style.color]="option === getValue() ? '#ffffffff' : '#000'"
        *ngFor="let option of config"
        (click)="onClick(option)"
      >
        {{ option }}
      </button>
    </div>
  `,
})
export class FeedbackEditorComponent extends HotCellEditorAdvancedComponent<string> {
  override config = ["👍", "👎", "🤷‍♂️"];
  override value = "👍";

  override shortcuts?: KeyboardShortcutConfig[] = [
    {
      keys: [["ArrowRight"], ["Tab"]],
      callback: (editor, _event) => {
        let index = this.config.indexOf(this.getValue());

        index = index === this.config.length - 1 ? 0 : index + 1;
        this.setValue(this.config[index]);
        this.cdr.detectChanges();

        return false;
      },
    },
    {
      keys: [["ArrowLeft"]],
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
  selector: "example1-guide-feedback-angular",
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example1GuideFeedbackAngularComponent {
  readonly data = inputData.map((el) => ({
    ...el,
    feedback: Math.random() > 0.5 ? "👍" : "👎",
  }));

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: "auto",
    manualColumnResize: true,
    manualRowResize: true,
    colHeaders: ["ID", "Item Name", "Item feedback"],
    columns: [
      { data: "id", type: "numeric" },
      {
        data: "itemName",
        type: "text",
      },
      {
        data: "feedback",
        width: 150,
        editor: FeedbackEditorComponent,
      },
    ],
  };
}
/* end-file */

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { registerAllModules } from "handsontable/registry";
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from "@handsontable/angular-wrapper";
import { CommonModule } from "@angular/common";
import { NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";
/* start:skip-in-compilation */
import { Example1GuideFeedbackAngularComponent, FeedbackEditorComponent } from "./app.component";
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: "ht-theme-main",
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
