
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import Handsontable from 'handsontable';
import { HotTableModule, HotTableRegisterer } from '@handsontable/angular';

@Component({
  selector: 'hot-test-component',
  template: ''
})
class TestComponent {
  public prop: object = {};
  id = 'hot';

  constructor (private _registerer: HotTableRegisterer) { }

  getHotInstance(instance: string): Handsontable {
    return this._registerer.getInstance(instance);
  }
}

describe('HotTableComponent', () => {
  let fixture: ComponentFixture<TestComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      declarations: [ TestComponent ],
      imports: [ HotTableModule.forRoot() ],
    });
  }));

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it(`should register instance if component has hotId attribute`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `<hot-table [hotId]="id"></hot-table>`
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;

      fixture.detectChanges();

      expect(app.getHotInstance(app.id)).toBeTruthy();
    });
  });

  it(`should register every hot-table component with added hotID attribute`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `
          <hot-table [hotId]="prop.hotTableId"></hot-table>
          <hot-table [hotId]="'hot1'"></hot-table>
          <hot-table hotId="hot2"></hot-table>
        `
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;

      app.prop['hotTableId'] = 'hot';

      fixture.detectChanges();

      expect(app.getHotInstance(app.prop['hotTableId'])).toBeDefined();
      expect(app.getHotInstance('hot1')).toBeDefined();
      expect(app.getHotInstance('hot2')).toBeDefined();
    });
  });
});
