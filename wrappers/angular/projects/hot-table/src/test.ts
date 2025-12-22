// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import Handsontable from 'handsontable/base';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

// Prevent unhandled promise rejections from causing page reloads
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  console.warn('Unhandled promise rejection:', event.reason);
});

// Patch Handsontable Core to inject themeName, preventing dynamic themeAPI import
// The dynamic import() in initializeThemeAPI fails without proper ESM support
const OriginalCore = Handsontable.Core;

const PatchedCore = function(this: any, element: HTMLElement, userSettings: Handsontable.GridSettings) {
  // Inject themeName to skip the async themeAPI initialization
  // When themeName is set, Handsontable uses CSS-based theming instead of dynamic imports
  const modifiedSettings = {
    ...userSettings,
    themeName: userSettings.themeName ?? 'ht-theme-main',
  };

  return OriginalCore.call(this, element, modifiedSettings);
} as unknown as typeof Handsontable.Core;

// Copy prototype and static properties
PatchedCore.prototype = OriginalCore.prototype;
Object.setPrototypeOf(PatchedCore, OriginalCore);
Object.keys(OriginalCore).forEach((key) => {
  (PatchedCore as any)[key] = (OriginalCore as any)[key];
});

(Handsontable as any).Core = PatchedCore;


// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true }},
);
