/**
 * Client-side interactions for .hot-example blocks.
 *
 * Handles:
 *  - Tab switching within a code section.
 *  - "Source code" toggle to show/hide the code section.
 *  - "Edit on StackBlitz" button — builds a project from embedded JSON data
 *    and POSTs it to https://stackblitz.com/run.
 */
document.addEventListener('DOMContentLoaded', function () {

  // ── Hot-example code assembly (Expressive Code blocks) ───────────────────
  //
  // The loader outputs marker divs + markdown code fences *after* the
  // .hot-example HTML block. Expressive Code renders the fences at build
  // time. This handler collects the rendered .expressive-code elements,
  // builds a tab bar if needed, and moves everything into the .hot-example.
  document.querySelectorAll('.hot-example-code-start').forEach(function (marker) {
    var exampleId = marker.dataset.example;
    var tabs = (marker.dataset.tabs || '').split(',').filter(Boolean);
    var hotExample = document.getElementById('hot-example-' + exampleId);

    if (!hotExample) return;

    // Collect .expressive-code siblings until the end marker
    var panels = [];
    var sibling = marker.nextElementSibling;

    while (sibling && !sibling.classList.contains('hot-example-code-end')) {
      if (sibling.classList.contains('expressive-code')) {
        panels.push(sibling);
      }
      sibling = sibling.nextElementSibling;
    }

    var endMarker = sibling;

    if (panels.length === 0) return;

    // Create the code section wrapper (hidden by default, toggled by Source code btn)
    var codeSection = document.createElement('div');
    codeSection.className = 'hot-example-code';
    codeSection.id = 'hot-code-' + exampleId;
    codeSection.hidden = true;

    // Build tab bar if multiple files
    if (tabs.length > 1) {
      var tabbar = document.createElement('div');
      tabbar.className = 'hot-example-tabbar';
      tabbar.setAttribute('role', 'tablist');

      tabs.forEach(function (title, i) {
        var btn = document.createElement('button');
        btn.className = 'hot-example-tab' + (i === 0 ? ' is-active' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        btn.dataset.tab = String(i);
        btn.textContent = title;
        tabbar.appendChild(btn);
      });

      codeSection.appendChild(tabbar);

      // Tab click handler
      tabbar.addEventListener('click', function (e) {
        var btn = e.target.closest('.hot-example-tab');
        if (!btn) return;

        var idx = btn.dataset.tab;

        tabbar.querySelectorAll('.hot-example-tab').forEach(function (t) {
          var active = t.dataset.tab === idx;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        codeSection.querySelectorAll('.expressive-code').forEach(function (p) {
          p.style.display = p.dataset.panelIndex === idx ? '' : 'none';
        });
      });
    }

    // Move panels into code section
    panels.forEach(function (panel, i) {
      if (tabs.length > 1) {
        panel.style.display = i === 0 ? '' : 'none';
      }
      panel.dataset.panelIndex = String(i);
      codeSection.appendChild(panel);
    });

    // Append code section to the hot-example container
    hotExample.appendChild(codeSection);

    // Remove markers
    if (marker.parentNode) marker.parentNode.removeChild(marker);
    if (endMarker && endMarker.parentNode) endMarker.parentNode.removeChild(endMarker);
  });

  // ── Source code toggle ────────────────────────────────────────────────────
  document.querySelectorAll('.hot-example-source-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var codeId = btn.getAttribute('aria-controls');
      var codeEl = codeId ? document.getElementById(codeId) : null;

      if (!codeEl) return;

      var isOpen = !codeEl.hidden;

      codeEl.hidden = isOpen;
      btn.setAttribute('aria-expanded', String(!isOpen));
      btn.classList.toggle('is-open', !isOpen);
    });
  });

  // ── Code group tabs (npm / Yarn / pnpm etc.) ────────────────────────────
  document.querySelectorAll('.code-group-start').forEach(function (marker) {
    var tabs = (marker.dataset.tabs || '').split(',');

    if (tabs.length === 0) return;

    // Collect all .expressive-code siblings between start and end markers
    var panels = [];
    var sibling = marker.nextElementSibling;

    while (sibling && !sibling.classList.contains('code-group-end')) {
      if (sibling.classList.contains('expressive-code')) {
        panels.push(sibling);
      }

      sibling = sibling.nextElementSibling;
    }

    var endMarker = sibling;

    if (panels.length === 0) return;

    // Build wrapper
    var wrapper = document.createElement('div');

    wrapper.className = 'code-group';

    // Build tab bar
    var tabbar = document.createElement('div');

    tabbar.className = 'code-group-tabbar';
    tabbar.setAttribute('role', 'tablist');

    tabs.forEach(function (title, i) {
      var btn = document.createElement('button');

      btn.className = 'code-group-tab' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.dataset.index = String(i);
      btn.textContent = title;
      tabbar.appendChild(btn);
    });

    wrapper.appendChild(tabbar);

    // Wrap panels inside the group container
    marker.parentNode.insertBefore(wrapper, marker);

    panels.forEach(function (panel, i) {
      panel.style.display = i === 0 ? '' : 'none';
      panel.dataset.groupIndex = String(i);
      wrapper.appendChild(panel);
    });

    // Remove markers
    if (marker.parentNode) marker.parentNode.removeChild(marker);
    if (endMarker && endMarker.parentNode) endMarker.parentNode.removeChild(endMarker);

    // Tab click handler
    tabbar.addEventListener('click', function (e) {
      var btn = e.target.closest('.code-group-tab');

      if (!btn) return;

      var idx = btn.dataset.index;

      tabbar.querySelectorAll('.code-group-tab').forEach(function (t) {
        var active = t.dataset.index === idx;

        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      wrapper.querySelectorAll('.expressive-code').forEach(function (p) {
        p.style.display = p.dataset.groupIndex === idx ? '' : 'none';
      });
    });
  });

  // ── Edit on StackBlitz ────────────────────────────────────────────────────
  document.querySelectorAll('.hot-example-stackblitz-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrapper = btn.closest('.hot-example');
      var dataEl  = wrapper && wrapper.querySelector('.hot-example-sb-data');

      if (!dataEl) return;

      var data;

      try {
        data = JSON.parse(dataEl.textContent);
      } catch (err) {
        console.error('[hot-example] Failed to parse StackBlitz data', err);
        return;
      }

      openOnStackBlitz(data);
    });
  });

  /**
   * Builds a StackBlitz project from the embedded example data and submits it
   * via a hidden form POST.
   *
   * @param {{ title: string, hotVersion: string, framework: string, exampleId: string, files: Record<string,string>, extraDeps: Record<string,string> }} data
   */
  function openOnStackBlitz(data) {
    var hotVersion  = data.hotVersion || 'latest';
    var framework   = data.framework  || 'javascript';
    var exampleId   = data.exampleId  || 'example';
    var userFiles   = data.files      || {};
    var extraDeps   = data.extraDeps  || {};
    var title       = data.title      || 'Handsontable Example';

    var projectFiles = buildProjectFiles(framework, hotVersion, exampleId, userFiles, extraDeps);

    // All frameworks use Vite ('node' template) so ES module imports resolve.
    var sbTemplate = 'node';

    var form = document.createElement('form');

    form.method = 'post';
    form.action = 'https://stackblitz.com/run';
    form.target = '_blank';
    form.style.display = 'none';

    function addInput(name, value) {
      var input = document.createElement('input');

      input.type  = 'hidden';
      input.name  = name;
      input.value = value;
      form.appendChild(input);
    }

    addInput('project[title]',       title);
    addInput('project[description]', 'Handsontable v' + hotVersion + ' live example');
    addInput('project[template]',    sbTemplate);

    Object.keys(projectFiles).forEach(function (filename) {
      addInput('project[files][' + filename + ']', projectFiles[filename]);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  /**
   * Assembles the full set of project files to send to StackBlitz.
   *
   * @param {string} framework - 'javascript' | 'react' | 'vue' | 'angular'
   * @param {string} hotVersion
   * @param {string} exampleId
   * @param {Record<string,string>} userFiles - Raw source files from the example
   * @param {Record<string,string>} extraDeps - Extra npm packages to include
   * @returns {Record<string,string>}
   */
  function buildProjectFiles(framework, hotVersion, exampleId, userFiles, extraDeps) {
    if (framework === 'react') {
      return buildReactProject(hotVersion, exampleId, userFiles, extraDeps);
    }

    if (framework === 'vue') {
      return buildVueProject(hotVersion, exampleId, userFiles, extraDeps);
    }

    if (framework === 'angular') {
      return buildAngularProject(hotVersion, exampleId, userFiles, extraDeps);
    }

    return buildJsProject(hotVersion, exampleId, userFiles, extraDeps);
  }

  // ── Vanilla JS project ────────────────────────────────────────────────────

  function buildJsProject(hotVersion, exampleId, userFiles, extraDeps) {
    var jsFile = findFile(userFiles, '.js') || 'index.js';
    var jsCode = userFiles[jsFile] || '';

    var deps = Object.assign({ handsontable: hotVersion, vite: 'latest' }, extraDeps);

    var pkg = JSON.stringify({
      name: 'handsontable-example',
      version: '1.0.0',
      private: true,
      dependencies: deps,
      scripts: { start: 'vite', build: 'vite build' },
    }, null, 2);

    var cssFile = findFile(userFiles, '.css');

    // Entry point re-exports the example code.
    // Handsontable CSS is loaded via a CDN <link> in index.html to avoid
    // Vite 8 / rolldown strict exports-field resolution for CSS files.
    var mainJs = [
      cssFile ? 'import "../styles.css";' : '',
      'import "../index.js";',
    ].filter(Boolean).join('\n');

    var cdnCssUrl = 'https://unpkg.com/handsontable@' + hotVersion + '/dist/handsontable.full.min.css';

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Handsontable Example</title>',
      '  <link rel="stylesheet" href="' + cdnCssUrl + '" />',
      '  <style>body { padding: 1rem; font-family: sans-serif; }</style>',
      '</head>',
      '<body>',
      '  <div id="' + exampleId + '"></div>',
      '  <script type="module" src="/src/main.js"><\/script>',
      '</body>',
      '</html>',
    ].join('\n');

    var files = {
      'package.json': pkg,
      'index.html':   html,
      'index.js':     jsCode,
      'src/main.js':  mainJs,
    };

    if (cssFile) {
      files['styles.css'] = userFiles[cssFile];
    }

    return files;
  }

  // ── React project ─────────────────────────────────────────────────────────

  function buildReactProject(hotVersion, exampleId, userFiles, extraDeps) {
    var jsxFile = findFile(userFiles, '.jsx') || findFile(userFiles, '.tsx') || 'App.jsx';
    var jsxCode = userFiles[jsxFile] || '';

    var deps = Object.assign(
      {
        handsontable:              hotVersion,
        '@handsontable/react-wrapper': hotVersion,
        react:                     '18.x',
        'react-dom':               '18.x',
        vite:                      'latest',
        '@vitejs/plugin-react':    'latest',
      },
      extraDeps,
    );

    var pkg = JSON.stringify({
      name: 'handsontable-react-example',
      version: '1.0.0',
      private: true,
      dependencies: deps,
      scripts: { start: 'vite', build: 'vite build' },
    }, null, 2);

    var viteConfig = [
      'import { defineConfig } from "vite";',
      'import react from "@vitejs/plugin-react";',
      '',
      'export default defineConfig({ plugins: [react()] });',
    ].join('\n');

    var index = [
      'import React from "react";',
      'import { createRoot } from "react-dom/client";',
      'import App from "./App";',
      '',
      'const root = createRoot(document.getElementById("' + exampleId + '"));',
      'root.render(React.createElement(App));',
    ].join('\n');

    var cdnCssUrl = 'https://unpkg.com/handsontable@' + hotVersion + '/dist/handsontable.full.min.css';

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Handsontable React Example</title>',
      '  <link rel="stylesheet" href="' + cdnCssUrl + '" />',
      '</head>',
      '<body>',
      '  <div id="' + exampleId + '"></div>',
      '  <script type="module" src="/src/main.jsx"><\/script>',
      '</body>',
      '</html>',
    ].join('\n');

    return {
      'package.json':   pkg,
      'vite.config.js': viteConfig,
      'index.html':     html,
      'src/main.jsx':   index,
      'src/App.jsx':    jsxCode,
    };
  }

  // ── Vue 3 project ─────────────────────────────────────────────────────────

  function buildVueProject(hotVersion, exampleId, userFiles, extraDeps) {
    var jsFile = findFile(userFiles, '.js') || 'App.js';
    var appCode = userFiles[jsFile] || '';

    var deps = Object.assign(
      {
        handsontable:         hotVersion,
        '@handsontable/vue3': hotVersion,
        vue:                  '3.x',
        vite:                 'latest',
        '@vitejs/plugin-vue': 'latest',
      },
      extraDeps,
    );

    var pkg = JSON.stringify({
      name: 'handsontable-vue-example',
      version: '1.0.0',
      private: true,
      dependencies: deps,
      scripts: { start: 'vite', build: 'vite build' },
    }, null, 2);

    var viteConfig = [
      'import { defineConfig } from "vite";',
      'import vue from "@vitejs/plugin-vue";',
      '',
      'export default defineConfig({ plugins: [vue()] });',
    ].join('\n');

    var main = [
      'import { createApp } from "vue";',
      'import App from "./App.js";',
      '',
      'createApp(App).mount("#' + exampleId + '");',
    ].join('\n');

    var cdnCssUrl = 'https://unpkg.com/handsontable@' + hotVersion + '/dist/handsontable.full.min.css';

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Handsontable Vue Example</title>',
      '  <link rel="stylesheet" href="' + cdnCssUrl + '" />',
      '</head>',
      '<body>',
      '  <div id="' + exampleId + '"></div>',
      '  <script type="module" src="/src/main.js"><\/script>',
      '</body>',
      '</html>',
    ].join('\n');

    return {
      'package.json': pkg,
      'vite.config.js': viteConfig,
      'index.html':  html,
      'src/main.js': main,
      'src/App.js':  appCode,
    };
  }

  // ── Angular project ───────────────────────────────────────────────────────

  /**
   * Splits a multi-section Angular source file into individual files.
   * Sections are delimited by:  /* file: filename * /  ...  /* end-file * /
   * Content inside  /* start:skip-in-compilation * /  …  /* end:skip-in-compilation * /
   * is stripped from each extracted file.
   *
   * @param {string} raw - Combined source from the docs example
   * @returns {Record<string,string>} Map of filename → cleaned source
   */
  function parseAngularSourceFiles(raw) {
    var files = {};
    var fileRe  = /\/\* file: ([^*]+?) \*\/([\s\S]*?)\/\* end-file \*\//g;
    var skipRe  = /\/\* start:skip-in-compilation \*\/[\s\S]*?\/\* end:skip-in-compilation \*\//g;
    var match;

    while ((match = fileRe.exec(raw)) !== null) {
      var name    = match[1].trim();
      var content = match[2].replace(skipRe, '').trim();

      files[name] = content;
    }

    // No markers — treat the whole thing as the component file.
    if (!Object.keys(files).length) {
      files['app.component.ts'] = raw.trim();
    }

    return files;
  }

  /** Extracts the @Component selector value, defaulting to 'app-root'. */
  function extractAngularSelector(tsCode) {
    var m = tsCode.match(/selector\s*:\s*['"]([^'"]+)['"]/);

    return m ? m[1] : 'app-root';
  }

  function buildAngularProject(hotVersion, exampleId, userFiles, extraDeps) {
    var tsFile = findFile(userFiles, '.ts') || 'app.component.ts';
    var tsCode = userFiles[tsFile] || '';

    // Split the combined example file into component / module sections.
    var parsed        = parseAngularSourceFiles(tsCode);
    var componentCode = parsed['app.component.ts'] || tsCode;
    var moduleCode    = parsed['app.module.ts']    || null;

    var selector  = extractAngularSelector(componentCode);
    var cdnCssUrl = 'https://unpkg.com/handsontable@' + hotVersion + '/dist/handsontable.full.min.css';

    // The component import in app.module.ts was inside /* start:skip-in-compilation */
    // so it was stripped. Re-inject it so declarations/bootstrap resolve correctly.
    if (moduleCode) {
      var classNameMatch = componentCode.match(/export\s+class\s+(\w+)/);
      var compClassName  = classNameMatch ? classNameMatch[1] : null;

      if (compClassName) {
        moduleCode = "import { " + compClassName + " } from './app.component';\n" + moduleCode;
      }
    }

    var deps = Object.assign(
      {
        handsontable:                        hotVersion,
        '@handsontable/angular-wrapper':     hotVersion,
        '@angular/animations':               '21.x',
        '@angular/common':                   '21.x',
        '@angular/compiler':                 '21.x',
        '@angular/core':                     '21.x',
        '@angular/forms':                    '21.x',
        '@angular/platform-browser':         '21.x',
        '@angular/platform-browser-dynamic': '21.x',
        '@angular/router':                   '21.x',
        rxjs:                                '~7.8.0',
        tslib:                               '^2.3.0',
        'zone.js':                           '~0.15.0',
        '@angular-devkit/build-angular':     '21.x',
        '@angular/cli':                      '21.x',
        '@angular/compiler-cli':             '21.x',
        typescript:                          '~5.9.0',
      },
      extraDeps,
    );

    var pkg = JSON.stringify({
      name: 'handsontable-angular-example',
      version: '1.0.0',
      private: true,
      scripts: { ng: 'ng', start: 'ng serve', build: 'ng build' },
      dependencies: deps,
    }, null, 2);

    var angularJson = JSON.stringify({
      $schema: './node_modules/@angular/cli/lib/config/schema.json',
      version: 1,
      newProjectRoot: 'projects',
      projects: {
        app: {
          projectType: 'application',
          root: '',
          sourceRoot: 'src',
          prefix: 'app',
          architect: {
            build: {
              builder: '@angular-devkit/build-angular:application',
              options: {
                outputPath: 'dist/app',
                index: 'src/index.html',
                browser: 'src/main.ts',
                polyfills: ['zone.js'],
                tsConfig: 'tsconfig.json',
                assets: [],
                styles: [],
                scripts: [],
              },
              configurations: {
                development: { optimization: false, sourceMap: true },
              },
              defaultConfiguration: 'development',
            },
            serve: {
              builder: '@angular-devkit/build-angular:dev-server',
              configurations: {
                development: { buildTarget: 'app:build:development' },
              },
              defaultConfiguration: 'development',
            },
          },
        },
      },
    }, null, 2);

    var tsConfig = JSON.stringify({
      compilerOptions: {
        outDir: './dist/out-tsc',
        strict: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        skipLibCheck: true,
        esModuleInterop: true,
        sourceMap: true,
        declaration: false,
        experimentalDecorators: true,
        moduleResolution: 'bundler',
        importHelpers: true,
        target: 'ES2022',
        module: 'ES2022',
        useDefineForClassFields: false,
        lib: ['ES2022', 'dom'],
      },
      angularCompilerOptions: {
        enableI18nLegacyMessageIdFormat: false,
        strictInjectionParameters: true,
        strictInputAccessModifiers: true,
        strictTemplates: true,
      },
    }, null, 2);

    var indexHtml = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <title>Handsontable Angular Example</title>',
      '  <base href="/">',
      '  <link rel="stylesheet" href="' + cdnCssUrl + '" />',
      '</head>',
      '<body>',
      '  <' + selector + '></' + selector + '>',
      '</body>',
      '</html>',
    ].join('\n');

    // NgModule examples bootstrap via platformBrowserDynamic;
    // standalone examples (no app.module.ts) use bootstrapApplication.
    var mainTs;

    if (moduleCode) {
      mainTs = [
        "import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';",
        "import { AppModule } from './app/app.module';",
        '',
        'platformBrowserDynamic().bootstrapModule(AppModule)',
        '  .catch(err => console.error(err));',
      ].join('\n');
    } else {
      var classMatch = componentCode.match(/export\s+class\s+(\w+)/);
      var className  = classMatch ? classMatch[1] : 'AppComponent';

      mainTs = [
        "import { bootstrapApplication } from '@angular/platform-browser';",
        "import { " + className + " } from './app/app.component';",
        '',
        'bootstrapApplication(' + className + ').catch(err => console.error(err));',
      ].join('\n');
    }

    var files = {
      'package.json':             pkg,
      'angular.json':             angularJson,
      'tsconfig.json':            tsConfig,
      'src/index.html':           indexHtml,
      'src/main.ts':              mainTs,
      'src/app/app.component.ts': componentCode,
    };

    if (moduleCode) {
      files['src/app/app.module.ts'] = moduleCode;
    }

    return files;
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  /** Returns the first filename in `files` that ends with `ext`, or null. */
  function findFile(files, ext) {
    return Object.keys(files).find(function (k) {
      return k.endsWith(ext);
    }) || null;
  }

});
