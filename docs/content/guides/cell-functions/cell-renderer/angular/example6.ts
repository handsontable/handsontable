/* file: app.component.ts */
import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {GridSettings, HotTableComponent} from '@handsontable/angular-wrapper';
import { textRenderer } from 'handsontable/renderers/textRenderer';

@Component({
  selector: 'app-example6',
  template: `

    <div
      id="exampleContainer5"
      (mouseup)="exampleContainerMouseupCallback($event)"
    >
      <hot-table *ngIf="!!hotSettings"
                 [settings]="hotSettings!">
      </hot-table>
    </div>
  `,
  standalone: false
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  isChecked = false;

  hotSettings!: GridSettings;

  ngAfterViewInit() {
    const componentThis = this;

    function customRenderer(_instance, td) {
      textRenderer.apply(componentThis, arguments);

      if (componentThis.isChecked) {
        td.style.backgroundColor = 'yellow';
      } else {
        td.style.backgroundColor = 'rgba(255,255,255,0.1)';
      }
    }

    this.hotSettings = {
      height: 'auto',
      columns: [{}, { renderer: customRenderer }],
      colHeaders(col) {
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

  exampleContainerMouseupCallback = (event) => {
    const hot = this.hotTable.hotInstance!;

    if (
      event.target?.nodeName == 'INPUT' &&
      event.target.className == 'checker'
    ) {
      this.isChecked = !event.target.checked;
      hot?.render();
    }
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
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ AppComponent  ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
