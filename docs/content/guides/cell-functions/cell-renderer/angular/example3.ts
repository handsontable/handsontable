/* file: app.component.ts */
import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {GridSettings, HotCellRendererComponent} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-color-renderer',
  template: `<span [style.color]="textColor">{{value}}</span>`,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorRendererComponent extends HotCellRendererComponent<string, {
  textColor?: string,
  textColorFn?: (value: string) => string
}> implements OnInit {
  textColor = '';

  ngOnInit() {
    const props = this.getProps();
    this.textColor = props.textColor ?? 'black';

    if (props.textColorFn && typeof props.textColorFn === 'function') {
      this.textColor = props.textColorFn(this.value);
    }
  }

}

@Component({
  selector: 'app-example3',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent {

  readonly hotData = [
    {
      title:
        '<a href="https://www.amazon.com/Professional-JavaScript-Developers-Nicholas-Zakas/dp/1118026691">Professional JavaScript for Web Developers</a>',
      description:
        'This <a href="https://bit.ly/sM1bDf">book</a> provides a developer-level introduction along with more advanced and useful features of <b>JavaScript</b>.',
      rate: 3
    },
    {
      title:
        '<a href="https://shop.oreilly.com/product/9780596517748.do">JavaScript: The Good Parts</a>',
      description:
        'This book provides a developer-level introduction along with <b>more advanced</b> and useful features of JavaScript.',
      rate: 9
    },
    {
      title:
        '<a href="https://shop.oreilly.com/product/9780596805531.do">JavaScript: The Definitive Guide</a>',
      description:
        '<em>JavaScript: The Definitive Guide</em> provides a thorough description of the core <b>JavaScript</b> language and both the legacy and standard DOMs implemented in web browsers.',
      rate: 5
    },
  ];

  readonly hotSettings: GridSettings = {
    colWidths: [200, 400, 80],
    colHeaders: ['Title', 'Description', 'Comments', 'Cover'],
    height: 'auto',
    columns: [
      { data: 'title', renderer: ColorRendererComponent, rendererProps: { textColor: 'blue' } },
      { data: 'description', renderer: ColorRendererComponent, rendererProps: { textColor: 'orange' } },
      { data: 'rate', renderer: ColorRendererComponent, rendererProps: { textColorFn: (value: string) => +value <= 5 ? 'red' : 'inherit' } },
    ],
    autoWrapRow: true,
    autoWrapCol: true,
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
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
