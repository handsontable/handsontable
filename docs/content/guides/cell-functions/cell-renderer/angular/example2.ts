/* file: app.component.ts */
import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {GridSettings} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example2',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>

    <ng-template #coverRenderer let-value>
      <img [src]="value" (mousedown)="$event.preventDefault()"/>
    </ng-template>
  `,
  standalone: false
})
export class AppComponent implements OnInit {
  @ViewChild('coverRenderer', { static: true }) coverRendererTemplate!: TemplateRef<any>;

  readonly hotData = [
    {
      title:
        '<a href="https://www.amazon.com/Professional-JavaScript-Developers-Nicholas-Zakas/dp/1118026691">Professional JavaScript for Web Developers</a>',
      description:
        'This <a href="https://bit.ly/sM1bDf">book</a> provides a developer-level introduction along with more advanced and useful features of <b>JavaScript</b>.',
      cover:
        '{{$basePath}}/img/examples/professional-javascript-developers-nicholas-zakas.jpg',
    },
    {
      title:
        '<a href="https://shop.oreilly.com/product/9780596517748.do">JavaScript: The Good Parts</a>',
      description:
        'This book provides a developer-level introduction along with <b>more advanced</b> and useful features of JavaScript.',
      cover: '{{$basePath}}/img/examples/javascript-the-good-parts.jpg',
    },
    {
      title:
        '<a href="https://shop.oreilly.com/product/9780596805531.do">JavaScript: The Definitive Guide</a>',
      description:
        '<em>JavaScript: The Definitive Guide</em> provides a thorough description of the core <b>JavaScript</b> language and both the legacy and standard DOMs implemented in web browsers.',
      cover: '{{$basePath}}/img/examples/javascript-the-definitive-guide.jpg',
    },
  ];

  hotSettings!: GridSettings;

  ngOnInit() {
    this.hotSettings = {
      colWidths: [200, 400, 80],
      colHeaders: ['Title', 'Description', 'Cover'],
      height: 'auto',
      columns: [
        { data: 'title', renderer: 'html' },
        { data: 'description', renderer: 'html' },
        { data: 'cover', renderer: this.coverRendererTemplate },
      ],
      autoWrapRow: true,
      autoWrapCol: true,
    };
  }
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
