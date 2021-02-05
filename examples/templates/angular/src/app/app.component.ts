import { Component, VERSION as AngularVersion } from '@angular/core';
import { HotTableModule } from '@handsontable/angular';
import Handsontable from 'handsontable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

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
