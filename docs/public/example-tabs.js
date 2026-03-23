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

  // ── Tab switching ─────────────────────────────────────────────────────────
  document.querySelectorAll('.hot-example-tabbar').forEach(function (tabbar) {
    tabbar.addEventListener('click', function (e) {
      var button = e.target.closest('.hot-example-tab');

      if (!button) return;

      var example = tabbar.closest('.hot-example');
      var tabIndex = button.dataset.tab;

      tabbar.querySelectorAll('.hot-example-tab').forEach(function (t) {
        var active = t.dataset.tab === tabIndex;

        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active);
      });

      example.querySelectorAll('.hot-example-panel').forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.panel === tabIndex);
      });
    });
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

  function buildAngularProject(hotVersion, exampleId, userFiles, extraDeps) {
    var tsFile   = findFile(userFiles, '.ts')   || 'app.component.ts';
    var htmlFile = findFile(userFiles, '.html') || null;
    var tsCode   = userFiles[tsFile]   || '';
    var htmlCode = htmlFile ? (userFiles[htmlFile] || '') : '<div id="' + exampleId + '"></div>';

    var deps = Object.assign(
      {
        handsontable:                      hotVersion,
        '@handsontable/angular-wrapper':   hotVersion,
        '@angular/core':                   '16.x',
        '@angular/common':                 '16.x',
        '@angular/compiler':               '16.x',
        '@angular/platform-browser':       '16.x',
        '@angular/platform-browser-dynamic': '16.x',
        '@angular/forms':                  '16.x',
        '@angular/animations':             '16.x',
        rxjs:                              '7.x',
        'zone.js':                         '0.13.x',
      },
      extraDeps,
    );

    var pkg = JSON.stringify({
      name: 'handsontable-angular-example',
      version: '1.0.0',
      private: true,
      dependencies: deps,
    }, null, 2);

    return {
      'package.json':       pkg,
      'app.component.ts':   tsCode,
      'app.component.html': htmlCode,
    };
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  /** Returns the first filename in `files` that ends with `ext`, or null. */
  function findFile(files, ext) {
    return Object.keys(files).find(function (k) {
      return k.endsWith(ext);
    }) || null;
  }

});
