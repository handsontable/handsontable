import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import Handsontable from 'handsontable';
import { HotTableModule, HotTableRegisterer } from '@handsontable/angular';
import { HOT_DESTROYED_WARNING } from '../lib/hot-table-registerer.service';

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

  it(`should render 'hot-table'`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `<hot-table></hot-table>`
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const elem = fixture.nativeElement;

      fixture.detectChanges();

      expect(elem.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
    });
  });

  it(`should set 'settings' as a settings object`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `<hot-table [hotId]="id" [settings]="prop.settings"></hot-table>`
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;

      app.prop['settings'] = {
        data: Handsontable.helper.createSpreadsheetData(5, 5)
      };

      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getDataAtCell(0, 0)).toBe('A1');
    });
  });

  it(`should be possible to set custom option in settings object`, async() => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: `<hot-table [hotId]="id" [settings]="prop.settings"></hot-table>`
      }
    });
    await TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(TestComponent);
      const app = fixture.componentInstance;

      app.prop['settings'] = {
        customOption: 'test',
      };

      fixture.detectChanges();
      expect(app.getHotInstance(app.id).getSettings()['customOption']).toBe('test');
    });
  });

  describe('options', () => {
    it('should support all of the available options in Handsontable', async() => {
        const options = Object.keys(Handsontable.DefaultSettings);
        const unsupportedSettings = ['isEmptyRow', 'isEmptyCol'];
        const template = `<hot-table [hotId]="id" ${options.map(option => unsupportedSettings.includes(option) ?
            '' :
            `[${option}]="prop.${option}"`).join(' ')}></hot-table>`;

        TestBed.overrideComponent(TestComponent, {
          set: {
            template: template
          }
        });
        await TestBed.compileComponents().then(() => {
          fixture = TestBed.createComponent(TestComponent);
          const elem = fixture.nativeElement;

          fixture.detectChanges();

          expect(elem.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
        });
    });

    it(`should overwrite settings' option by the attribute`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [settings]="prop.settings" [activeHeaderClassName]="prop.activeHeaderClassName"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['settings'] = {
          activeHeaderClassName: 'classFromSettings',
        };
        app.prop['activeHeaderClassName'] = 'classFromAttribute';

        fixture.detectChanges();
        expect(app.getHotInstance(app.id).getSettings()['activeHeaderClassName']).toBe('classFromAttribute');
      });
    });
  });

  describe('hooks', () => {
    it('should support all of the available hooks in Handsontable', async() => {
      const hooks = Handsontable.hooks.getRegistered();
      const unsupportedHooks = [
        'afterContextMenuExecute',
        'afterDropdownMenuExecute',
        'afterIsMultipleSelection'
      ];
      const template = `<hot-table [hotId]="id" ${hooks.map(hook => unsupportedHooks.includes(hook) ?
          '' :
          `[${hook}]="prop.${hook}"`).join(' ')}></hot-table>`;

      TestBed.overrideComponent(TestComponent, {
        set: {
          template: template
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const elem = fixture.nativeElement;

        fixture.detectChanges();

        expect(elem.querySelectorAll('.handsontable').length).toBeGreaterThan(0);
      });
    });

    it(`should use Handsontable as a hook's context, if is defined as a component's method`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [afterInit]="prop.afterInit"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['afterInit'] = function() {
          return this;
        };

        fixture.detectChanges();
        const instance: Handsontable = app.getHotInstance(app.id).runHooks('afterInit');

        expect(instance.getPlugin).toBeDefined();
        expect(instance.getPlugin('copyPaste')).toBeTruthy();
      });
    });

    it(`should allow overwrite Handsontable in a hook's context by bind`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [afterInit]="prop.afterInit.bind(this)"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['specKey'] = 'testKey';
        app.prop['afterInit'] = function() {
          return this;
        };

        fixture.detectChanges();
        const instance: TestComponent = app.getHotInstance(app.id).runHooks('afterInit');

        expect(instance.prop['specKey']).toBe('testKey');
      });
    });

    it(`should be possible to get a reference to Handsontable instance`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [init]="prop.init.bind(this)"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['specKey'] = 'testKey';
        app.prop['init'] = function() {
          return [this, this.getHotInstance(app.id)];
        };

        fixture.detectChanges();
        const [instance, hot]: [TestComponent, Handsontable] = app.getHotInstance(app.id).runHooks('init');

        expect(instance.prop['specKey']).toBe('testKey');
        expect(hot.getPlugin).toBeDefined();
        expect(hot.getPlugin('copyPaste')).toBeTruthy();
      });
    });

    it(`should use Handsontable as a hook's context, if is defined as a function in settings object`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [settings]="prop.settings"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['settings'] = {
          afterInit() {
            return this;
          }
        };

        fixture.detectChanges();
        const instance: Handsontable = app.getHotInstance(app.id).runHooks('afterInit');

        expect(instance.getPlugin).toBeDefined();
        expect(instance.getPlugin('copyPaste')).toBeTruthy();
      });
    });

    it(`should use TestComponent as a hook's context, if is defined as a arrow-function in settings object`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [settings]="prop.settings"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['specKey'] = 'testKey';
        app.prop['settings'] = {
          afterInit: (function() {
            return () => {
              return this;
            };
          }).call(app),
        };

        fixture.detectChanges();
        const instance: TestComponent = app.getHotInstance(app.id).runHooks('afterInit');

        expect(instance.prop['specKey']).toBe('testKey');
      });
    });

    it(`should overwrite settings' hook by the attribute`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [settings]="prop.settings" [afterAddChild]="prop.afterAddChild"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['settings'] = {
          afterAddChild: () => 'hookFromSettings'
        };

        app.prop['afterAddChild'] = () => 'hookFromAttribute';

        fixture.detectChanges();
        expect(app.getHotInstance(app.id).runHooks('afterAddChild')).toBe('hookFromAttribute');
      });
    });

    it(`should allow to block 'before*' hooks`, async() => {
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [beforeChange]="prop.beforeChange" [afterChange]="prop.afterChange"></hot-table>`
        }
      });
      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);

        const app = fixture.componentInstance;
        let afterChangeResult = false;

        app.prop['beforeChange'] = function() { return false; };
        app.prop['afterChange'] = function(changes, source) {
          // `afterChange` is called once during the initialisation
          if (source === 'edit') {
            afterChangeResult = true;
          }
        };
        fixture.detectChanges();

        app.getHotInstance(app.id).setDataAtCell(0, 0, 'test');

        expect(afterChangeResult).toBe(false);
      });
    });
  });

  describe(`internal Handsontable instance`, () => {
    it(`should display a warning and not throw any errors, when the underlying Handsontable instance ` +
      `has been destroyed`, async() => {
      const warnFunc = console.warn;
      const warnCalls = [];
      TestBed.overrideComponent(TestComponent, {
        set: {
          template: `<hot-table [hotId]="id" [settings]="prop.settings"></hot-table>`
        }
      });

      console.warn = (warningMessage) => {
        warnCalls.push(warningMessage);
      };

      await TestBed.compileComponents().then(() => {
        fixture = TestBed.createComponent(TestComponent);
        const app = fixture.componentInstance;

        app.prop['settings'] = {
          data: Handsontable.helper.createSpreadsheetData(5, 5)
        };

        fixture.detectChanges();

        expect(app.getHotInstance(app.id).isDestroyed).toEqual(false);

        app.getHotInstance(app.id).destroy();

        expect(app.getHotInstance(app.id)).toEqual(null);
        expect(warnCalls.length).toBeGreaterThan(0);
        warnCalls.forEach((message) => {
          expect(message).toEqual(HOT_DESTROYED_WARNING);
        });

        console.warn = warnFunc;
      });
    });
  });
});
