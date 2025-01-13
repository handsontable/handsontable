const buildAngularBody = ({ html, js, version, hyperformulaVersion }) => {
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
    "start": "ng serve --disable-host-check",
    "build": "ng build"
  },
  "dependencies": {
    "@angular/animations": "^17.3.0",
    "@angular/common": "^17.3.0",
    "@angular/compiler": "^17.3.0",
    "@angular/core": "^17.3.0",
    "@angular/forms": "^17.3.0",
    "@angular/platform-browser": "^17.3.0",
    "@angular/platform-browser-dynamic": "^17.3.0",
    "@angular/router": "^17.3.0",
    "numbro": "^2.4.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.2",
    "zone.js": "^0.14.4",
    "hyperformula": "${hyperformulaVersion}",
    "handsontable": "${version}",
    "@handsontable/angular": "${version}"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.3.0",
    "@angular/localize": "latest",
    "@angular/service-worker": "latest",
    "@angular/cli": "^17.3.0",
    "@angular/compiler-cli": "^17.3.0",
    "@types/node": "12.20.7",
    "ts-node": "8.3.0",
    "typescript": "5.4.2"
  }
}`,
      },
      'angular.json': {
        content: `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "sandbox": {
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
            "styles": [
              "node_modules/handsontable/styles/handsontable.min.css",
              "node_modules/handsontable/styles/ht-theme-main.min.css"
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
              ],
              "outputHashing": "all"
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "browserTarget": "sandbox:build"
          },
          "configurations": {
            "production": {
              "browserTarget": "sandbox:build:production"
            },
            "development": {
              "browserTarget": "sandbox:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n",
          "options": {
            "browserTarget": "sandbox:build"
          }
        }
      }
    }
  },
  "defaultProject": "sandbox",
  "cli": {
    "analytics": false
  }
}`,
      },
      'tsconfig.app.json': {
        content: `/* To learn more about this file see: https://angular.io/config/tsconfig. */
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    ${html || '<app-root></app-root>'}
  </body>
</html>`,
      },
      'src/main.ts': {
        content: `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
`,
      },
      ...codePartsObject
    },
  };
};

module.exports = { buildAngularBody };
