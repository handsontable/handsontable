/* file: app.component.ts */
import { Component } from '@angular/core';
import Handsontable from 'handsontable';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example1',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
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
          category: 'Major label releases',
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
          ],
        },
        {
          category: 'Independent releases',
          artist: null,
          title: null,
          label: null,
          __children: [
            {
              title: 'Moaning Lisa Smile',
              artist: 'Wolf Alice',
              label: 'RCA Records/Dirty Hit',
            },
            {
              title: "Ex's & Oh's",
              artist: 'Elle King',
              label: 'RCA Records',
            },
          ],
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
    afterInit(this: Handsontable) {
      this.getPlugin('nestedRows').collapsingUI?.collapseChildren(8);
    },
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
