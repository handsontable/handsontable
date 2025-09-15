/* file: app.component.ts */
import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

const ipValidatorRegexp =
  /^(?:\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b|null)$/;

const emailValidator = (value: string, callback: (arg0: boolean) => void) => {
  setTimeout(() => {
    if (/.+@.+/.test(value)) {
      callback(true);
    } else {
      callback(false);
    }
  }, 1000);
};

@Component({
  selector: 'app-example1',
  template: `
    <output class="console">{{output}}</output>

    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: false
})
export class AppComponent implements OnInit {
  output = 'Here you will see the log';

  readonly hotData = [
    {
      id: 1,
      name: { first: 'Joe', last: 'Fabiano' },
      ip: '0.0.0.1',
      email: 'Joe.Fabiano@ex.com',
    },
    {
      id: 2,
      name: { first: 'Fred', last: 'Wecler' },
      ip: '0.0.0.1',
      email: 'Fred.Wecler@ex.com',
    },
    {
      id: 3,
      name: { first: 'Steve', last: 'Wilson' },
      ip: '0.0.0.1',
      email: 'Steve.Wilson@ex.com',
    },
    {
      id: 4,
      name: { first: 'Maria', last: 'Fernandez' },
      ip: '0.0.0.1',
      email: 'M.Fernandez@ex.com',
    },
    {
      id: 5,
      name: { first: 'Pierre', last: 'Barbault' },
      ip: '0.0.0.1',
      email: 'Pierre.Barbault@ex.com',
    },
    {
      id: 6,
      name: { first: 'Nancy', last: 'Moore' },
      ip: '0.0.0.1',
      email: 'Nancy.Moore@ex.com',
    },
    {
      id: 7,
      name: { first: 'Barbara', last: 'MacDonald' },
      ip: '0.0.0.1',
      email: 'B.MacDonald@ex.com',
    },
    {
      id: 8,
      name: { first: 'Wilma', last: 'Williams' },
      ip: '0.0.0.1',
      email: 'Wilma.Williams@ex.com',
    },
    {
      id: 9,
      name: { first: 'Sasha', last: 'Silver' },
      ip: '0.0.0.1',
      email: 'Sasha.Silver@ex.com',
    },
    {
      id: 10,
      name: { first: 'Don', last: 'Pérignon' },
      ip: '0.0.0.1',
      email: 'Don.Pérignon@ex.com',
    },
    {
      id: 11,
      name: { first: 'Aaron', last: 'Kinley' },
      ip: '0.0.0.1',
      email: 'Aaron.Kinley@ex.com',
    },
  ];

  hotSettings!: GridSettings;

  ngOnInit() {
    const componentInstance = this;

    this.hotSettings = {
      beforeChange(changes) {
        for (let i = changes.length - 1; i >= 0; i--) {
          const currChange = changes[i];

          if (!currChange) {
            return false;
          }

          // gently don't accept the word "foo" (remove the change at index i)
          if (currChange[3] === 'foo') {
            changes.splice(i, 1);
          }
          // if any of pasted cells contains the word "nuke", reject the whole paste
          else if (currChange[3] === 'nuke') {
            return false;
          }
          // capitalise first letter in column 1 and 2
          else if (
            currChange[1] === 'name.first' ||
            currChange[1] === 'name.last'
          ) {
            if (currChange[3] !== null) {
              changes[i]![3] =
                currChange[3].charAt(0).toUpperCase() + currChange[3].slice(1);
            }
          }
        }

        return true;
      },
      afterChange(changes, source) {
        if (source !== 'loadData') {
          componentInstance.output = JSON.stringify(changes);
        }
      },
      colHeaders: ['ID', 'First name', 'Last name', 'IP', 'E-mail'],
      height: 'auto',
      licenseKey: 'non-commercial-and-evaluation',
      columns: [
        { data: 'id', type: 'numeric' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'ip', validator: ipValidatorRegexp, allowInvalid: true },
        { data: 'email', validator: emailValidator, allowInvalid: false },
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
