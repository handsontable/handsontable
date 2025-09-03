/* file: app.component.ts */
import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example3',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent implements OnInit {

  readonly hotData = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
    ['2021', 10, 11, 12, 13, 15, 16],
  ];

  hotSettings!: GridSettings;


  ngOnInit() {
    const contextMenuSettings = {
      callback(key: string, selection: any, clickEvent: any) {
        // Common callback for all options
        console.log(key, selection, clickEvent);
      },
      items: {
        row_above: {
          disabled(): boolean {
            // `disabled` can be a boolean or a function
            // Disable option when first row was clicked
            // @ts-ignore
            return this.getSelectedLast()?.[0] === 0; // `this` === hot
          },
        },
        // A separator line can also be added like this:
        // 'sp1': '---------'
        // and the key has to be unique
        sp1: { name: '---------' },
        row_below: {
          name: 'Click to add row below',
        },
        about: {
          // Own custom option
          name() {
            // `name` can be a string or a function
            return '<b>Custom option</b>'; // Name can contain HTML
          },
          hidden(): boolean {
            // `hidden` can be a boolean or a function
            // Hide the option when the first column was clicked
            // @ts-ignore
            return this.getSelectedLast()?.[1] == 0; // `this` === hot
          },
          callback() {
            // Callback for specific option
            setTimeout(() => {
              alert('Hello world!'); // Fire alert after menu close (with timeout)
            }, 0);
          },
        },
        colors: {
          // Own custom option
          name: 'Colors...',
          submenu: {
            // Custom option with submenu of items
            items: [
              {
                // Key must be in the form 'parent_key:child_key'
                key: 'colors:red',
                name: 'Red',
                callback() {
                  setTimeout(() => {
                    alert('You clicked red!');
                  }, 0);
                },
              },
              { key: 'colors:green', name: 'Green' },
              { key: 'colors:blue', name: 'Blue' },
            ],
          },
        },
        credits: {
          // Own custom property
          // Custom rendered element in the context menu
          renderer() {
            const elem = document.createElement('marquee');

            elem.style.cssText = 'background: lightgray; color: #222222;';
            elem.textContent = 'Brought to you by...';

            return elem;
          },
          disableSelection: true,
          isCommand: false,
        },
      },
    };

    this.hotSettings = {
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
      height: 'auto',
      contextMenu: contextMenuSettings,
      autoWrapRow: true,
      autoWrapCol: true,
    }
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
