import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotTableModule } from './hot-table.module';
import { HotTableComponent } from './hot-table.component';
import { TEST_LICENSE_KEY } from './test-helpers/license-key';

describe('HotTableModule', () => {
  it('version should be a non-empty string', () => {
    expect(typeof HotTableModule.version).toBe('string');
    expect(HotTableModule.version.length).toBeGreaterThan(0);
  });

  describe('HotTableComponent export', () => {
    let fixture: ComponentFixture<HotTableComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HotTableModule],
      });
      fixture = TestBed.createComponent(HotTableComponent);
      fixture.componentInstance.settings = { licenseKey: TEST_LICENSE_KEY };
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture.destroy();
    });

    it('should create HotTableComponent via the module', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });
  });
});
