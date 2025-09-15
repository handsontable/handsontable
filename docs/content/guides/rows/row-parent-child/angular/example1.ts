/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
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
      category: 'Best Rock Performance',
      artist: null,
      title: null,
      label: null,
      __children: [
        {
          title: "Don't Wanna Fight",
          artist: 'Alabama Shakes',
          label: 'ATO Records',
        },
        {
          title: 'What Kind Of Man',
          artist: 'Florence & The Machine',
          label: 'Republic',
        },
        {
          title: 'Something From Nothing',
          artist: 'Foo Fighters',
          label: 'RCA Records',
        },
        {
          title: "Ex's & Oh's",
          artist: 'Elle King',
          label: 'RCA Records',
        },
        {
          title: 'Moaning Lisa Smile',
          artist: 'Wolf Alice',
          label: 'RCA Records/Dirty Hit',
        },
      ],
    },
    {
      category: 'Best Metal Performance',
      __children: [
        {
          title: 'Cirice',
          artist: 'Ghost',
          label: 'Loma Vista Recordings',
        },
        {
          title: 'Identity',
          artist: 'August Burns Red',
          label: 'Fearless Records',
        },
        {
          title: '512',
          artist: 'Lamb Of God',
          label: 'Epic Records',
        },
        {
          title: 'Thank You',
          artist: 'Sevendust',
          label: '7Bros Records',
        },
        {
          title: 'Custer',
          artist: 'Slipknot',
          label: 'Roadrunner Records',
        },
      ],
    },
    {
      category: 'Best Rock Song',
      __children: [
        {
          title: "Don't Wanna Fight",
          artist: 'Alabama Shakes',
          label: 'ATO Records',
        },
        {
          title: "Ex's & Oh's",
          artist: 'Elle King',
          label: 'RCA Records',
        },
        {
          title: 'Hold Back The River',
          artist: 'James Bay',
          label: 'Republic',
        },
        {
          title: 'Lydia',
          artist: 'Highly Suspect',
          label: '300 Entertainment',
        },
        {
          title: 'What Kind Of Man',
          artist: 'Florence & The Machine',
          label: 'Republic',
        },
      ],
    },
    {
      category: 'Best Rock Album',
      __children: [
        {
          title: 'Drones',
          artist: 'Muse',
          label: 'Warner Bros. Records',
        },
        {
          title: 'Chaos And The Calm',
          artist: 'James Bay',
          label: 'Republic',
        },
        {
          title: 'Kintsugi',
          artist: 'Death Cab For Cutie',
          label: 'Atlantic',
        },
        {
          title: 'Mister Asylum',
          artist: 'Highly Suspect',
          label: '300 Entertainment',
        },
        {
          title: '.5: The Gray Chapter',
          artist: 'Slipknot',
          label: 'Roadrunner Records',
        },
      ],
    },
  ];

  readonly hotSettings: GridSettings = {
    preventOverflow: 'horizontal',
    rowHeaders: true,
    colHeaders: ['Category', 'Artist', 'Title', 'Album', 'Label'],
    nestedRows: true,
    contextMenu: true,
    bindRowsWithHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    height: 'auto',
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
