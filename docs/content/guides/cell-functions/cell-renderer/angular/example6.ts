/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import {GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';
import { textRenderer } from 'handsontable/renderers/textRenderer';

const ALLOWED_TAGS = ['B', 'EM', 'INPUT', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH'];
const ALLOWED_ATTRIBUTES = ['type', 'class', 'checked', 'colspan', 'rowspan'];
const DROPPED_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE'];

// Handsontable has no built-in sanitizer since v18.0, and `sanitizer` is grid-level:
// it also filters pasted HTML, so the table tags have to survive -- otherwise pasting
// a range degrades to plain text. In production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeHeader = (html: string): string => {
  const template = document.createElement('template');

  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (DROPPED_TAGS.includes(element.tagName)) {
      // Unwrapping these would promote their source text into the output
      element.remove();
    } else if (ALLOWED_TAGS.includes(element.tagName)) {
      Array.from(element.attributes).forEach((attribute) => {
        if (!ALLOWED_ATTRIBUTES.includes(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      });
    } else {
      // Unwrap a disallowed element, keeping its text content
      element.replaceWith(...Array.from(element.childNodes));
    }
  });

  return template.innerHTML;
};

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
      sanitizer: sanitizeHeader,
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
