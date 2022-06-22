import { Component, VERSION as AngularVersion } from '@angular/core';
import { HotTableModule } from '@handsontable/angular';
import Handsontable from 'handsontable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  hotSettings: Handsontable.GridSettings = {
    data: [
        ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
        ['2019', 10, 11, 12, 13],
        ['2020', 20, 11, 14, 13],
        ['2021', 30, 15, 12, 13]
    ],
    colHeaders: true,
    rowHeaders: true,
    width: '100%',
    height: '100%',
    licenseKey: 'non-commercial-and-evaluation'
  };

  ngOnInit() {
    console.log(this.getDebugInfo());
  }

  private getDebugInfo() {
    let debug = 'Handsontable:';
    debug += ` v${Handsontable.version}`;
    debug += ` (${Handsontable.buildDate})`;
    debug += ' Wrapper:';
    debug += ` v${HotTableModule.version}`;
    debug += ' Angular:';
    debug += ` v${AngularVersion.full}`;
    return debug;
  }
}
