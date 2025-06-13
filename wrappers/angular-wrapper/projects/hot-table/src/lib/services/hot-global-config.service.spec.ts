import { TestBed } from '@angular/core/testing';
import {
  HotGlobalConfigService,
  HotGlobalConfig,
  NON_COMMERCIAL_LICENSE,
  ThemeName, HOT_GLOBAL_CONFIG,
} from './hot-global-config.service';
import { take } from 'rxjs/operators';

describe('HotGlobalConfigService', () => {
  let service: HotGlobalConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HotGlobalConfigService],
    });
    service = TestBed.inject(HotGlobalConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default configuration', () => {
    const config = service.getConfig();
    expect(config.license).toBeUndefined();
    expect(config.themeName).toEqual('');
  });

  it('should update license when provided', () => {
    const license = NON_COMMERCIAL_LICENSE;
    service.setConfig({ license });
    const config = service.getConfig();
    expect(config.license).toEqual(license);
  });

  it('should update themeName when provided', () => {
    const theme: ThemeName = 'ht-theme-main-dark';
    service.setConfig({ themeName: theme });
    const config = service.getConfig();
    expect(config.themeName).toEqual(theme);
  });

  it('should update whole config when provided', () => {
    const inputConfig: HotGlobalConfig = {
      license: 'sample-license',
      themeName: 'ht-theme-horizon',
      language: 'pl-PL',
      layoutDirection: 'rtl'
    };
    service.setConfig(inputConfig);
    const config = service.getConfig();
    expect(config.license).toEqual(inputConfig.license);
    expect(config.themeName).toEqual(inputConfig.themeName);
    expect(config.language).toEqual(inputConfig.language);
    expect(config.layoutDirection).toEqual(inputConfig.layoutDirection);
  });

  it('should replace the existing configuration', () => {
    // Set initial configuration
    service.setConfig({
      license: 'initial-license',
      themeName: 'ht-theme-horizon-dark',
    });

    // Update only the license
    service.setConfig({ license: 'updated-license' });
    const config = service.getConfig();
    expect(config.license).toEqual('updated-license');
    expect(config.themeName).toEqual('');
  });

  it('should emit configuration changes via config$', (done) => {
    let emitCounter = 0;

    // Listen to config$ and take three emissions:
    // one for the initial default config and two for the updated config.
    service.config$.pipe(take(3)).subscribe((config) => {
      if (emitCounter === 0) {
        expect(config.license).toEqual(undefined);
      } else if (emitCounter === 1) {
        expect(config.license).toEqual('updated-license--1');
      } else  if (emitCounter === 2) {
        expect(config.license).toEqual('updated-license--2');
      } else {
        throw new Error('Unexpected 4th call');
      }
      emitCounter++;

      expect(config.license).toEqual('updated-license--2');
      done();
    });

    // invoke update method after observable is set to receive an events
    service.setConfig({
      license: 'updated-license--1'
    });

    service.setConfig({
      license: 'updated-license--2'
    });
  });

  it('should reset configuration to default values', () => {
    // set and check initial configuration
    const customConfig: HotGlobalConfig = {
      license: 'custom-license',
      themeName: 'ht-theme-main'
    };

    service.setConfig(customConfig);
    let currentConfig = service.getConfig();

    expect(currentConfig.license).toEqual('custom-license');
    expect(currentConfig.themeName).toEqual('ht-theme-main');

    // invoke reset and check configuration after default config is restored
    service.resetConfig();

    currentConfig = service.getConfig();
    expect(currentConfig.license).toBeUndefined();
    expect(currentConfig.themeName).toEqual('');
  });

  it('should override configuration for this test only', () => {
    // Re-initialize the service to pick up the override.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        HotGlobalConfigService,
        {
          provide: HOT_GLOBAL_CONFIG,
          useValue: {
            license: 'overridden-license',
            themeName: 'ht-theme-main',
            language: 'en-US',
            layoutDirection: 'ltr'
          } as HotGlobalConfig }
      ]
    });
    service = TestBed.inject(HotGlobalConfigService);

    const config = service.getConfig();
    expect(config.license).toEqual('overridden-license');
    expect(config.themeName).toEqual('ht-theme-main');
    expect(config.language).toEqual('en-US');
    expect(config.layoutDirection).toEqual('ltr');
  });
});
