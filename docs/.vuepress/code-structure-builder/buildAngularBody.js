const buildAngularBody = ({ html, js, version }) => {
  const codeParts = js.matchAll(/\/\* file:(.*?)\*\/(.*?)\/\* end-file \*\//gs);
  const codePartsObject = [...codeParts]?.reduce((acc, curr) => {
    const name = curr?.[1].trim();
    const content = curr?.[2].trim();
    // eslint-disable-next-line
    const path = 'src/app/' + name;

    if (name.includes('.ts')) {
      acc[path] = {
        content
      };
    }

    return acc;
  }, {}) ?? {};

  return {
    files: {
      'package.json': {
        content: `{
  "name": "handsontable",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --port 8080"
  },
  "dependencies": {
    "@angular/animations": "latest",
    "@angular/common": "latest",
    "@angular/compiler": "latest",
    "@angular/core": "latest",
    "@angular/forms": "latest",
    "@angular/platform-browser": "latest",
    "@angular/platform-browser-dynamic": "latest",
    "@angular/router": "latest",
    "rxjs": "6.6.7",
    "tslib": "2.1.0",
    "zone.js": "0.14.0",
    "@handsontable/angular": "${version}",
    "handsontable": "${version}"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "latest",
    "@angular/localize": "latest",
    "@angular/service-worker": "latest",
    "@angular/cli": "latest",
    "@angular/compiler-cli": "latest",
    "@types/node": "12.20.7",
    "puppeteer": "14.3.0",
    "ts-node": "8.3.0",
    "typescript": "5.2.2"
  }
}`,
      },
      'angular.json': {
        content: `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "angular": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:application": {
          "strict": true
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "aot": true,
            "styles": [
              "node_modules/handsontable/dist/handsontable.full.css"
            ],
            "scripts": [],
            "preserveSymlinks": true,
            "allowedCommonJsDependencies": [
              "core-js",
              "@handsontable/pikaday",
              "numbro"
            ]
          },
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ]
            }
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "browserTarget": "angular:build"
          },
          "configurations": {
            "production": {
              "browserTarget": "angular:build:production"
            }
          }
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "browserTarget": "angular:build"
          }
        }
      }
    }
  },
  "defaultProject": "angular",
  "cli": {
    "analytics": false
  }
}`,
      },
      'tsconfig.app.json': {
        content: `
/* To learn more about this file see: https://angular.io/guide/typescript-configuration. */
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}`
      },
      'tsconfig.json': {
        content: `/* To learn more about this file see: https://angular.io/config/tsconfig. */
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": [
      "ES2022",
      "dom"
    ]
  },
  "angularCompilerOptions": {
    "disableTypeScriptVersionCheck": true,
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}`
      },
      'src/index.html': {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Handsontable for Angular example</title>
    <base href="." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    ${html || '<app-root></app-root>'}
  </body>
</html>`,
      },
      'src/environments/environment.prod.ts': {
        content: `export const environment = {
  production: true
};`,
      },
      'src/environments/environment.ts': {
        content: `export const environment = {
  production: false
};`,
      },
      'src/main.ts': {
        content: `import { enableProdMode} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));`,
      },
      ...codePartsObject
    },
  };
};

module.exports = { buildAngularBody };
