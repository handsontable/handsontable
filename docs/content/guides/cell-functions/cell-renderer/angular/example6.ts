/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import {GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { textRenderer } from 'handsontable/renderers/textRenderer';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example6',
  template: `

    <div
      id="exampleContainer5"
      (mouseup)="exampleContainerMouseupCallback($event)"
    >
      @if (hotSettings) {
        <hot-table [settings]="hotSettings!"></hot-table>
      }
    </div>
  `,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  isChecked = false;

  hotSettings!: GridSettings;

  ngAfterViewInit() {
    const componentThis = this;

    function customRenderer(_instance: Handsontable, td: HTMLTableCellElement) {
      textRenderer.apply(componentThis, arguments as unknown as Parameters<typeof textRenderer>);

      if (componentThis.isChecked) {
        td.style.backgroundColor = 'yellow';
      } else {
        td.style.backgroundColor = 'rgba(255,255,255,0.1)';
      }
    }

    this.hotSettings = {
      height: 'auto',
      columns: [{}, { renderer: customRenderer }],
      colHeaders(col: number) {
        return col === 0
          ? '<b>Bold</b> and <em>Beautiful</em>'
          : `Some <input type="checkbox" class="checker" ${
            componentThis.isChecked ? 'checked="checked"' : ''
          }> checkbox`;
      },
      autoWrapRow: true,
      autoWrapCol: true,
    };
  }

  exampleContainerMouseupCallback = (event: MouseEvent) => {
    const hot = this.hotTable.hotInstance!;
    const target = event.target as HTMLInputElement | null;

    if (target?.nodeName == 'INPUT' && target.className == 'checker') {
      this.isChecked = !target.checked;
      hot?.render();
    }
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
