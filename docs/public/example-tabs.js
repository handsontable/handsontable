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

    var sbTemplate = 'javascript';

    if (framework === 'react') sbTemplate = 'node';

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

    var deps = Object.assign({ handsontable: hotVersion }, extraDeps);

    var pkg = JSON.stringify({
      name: 'handsontable-example',
      version: '1.0.0',
      private: true,
      dependencies: deps,
    }, null, 2);

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Handsontable Example</title>',
      '  <link rel="stylesheet"',
      '    href="node_modules/handsontable/dist/handsontable.full.min.css" />',
      '  <style>body { padding: 1rem; font-family: sans-serif; }</style>',
      '</head>',
      '<body>',
      '  <div id="' + exampleId + '"></div>',
      '  <script type="module" src="index.js"><\/script>',
      '</body>',
      '</html>',
    ].join('\n');

    var files = {
      'package.json': pkg,
      'index.html':   html,
      'index.js':     jsCode,
    };

    var cssFile = findFile(userFiles, '.css');

    if (cssFile) {
      files['styles.css'] = userFiles[cssFile];
      files['index.html'] = files['index.html'].replace(
        '  <style>',
        '  <link rel="stylesheet" href="styles.css" />\n  <style>',
      );
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
      'import "handsontable/dist/handsontable.full.min.css";',
      '',
      'const root = createRoot(document.getElementById("' + exampleId + '"));',
      'root.render(React.createElement(App));',
    ].join('\n');

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Handsontable React Example</title>',
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
      'import "handsontable/dist/handsontable.full.min.css";',
      '',
      'createApp(App).mount("#' + exampleId + '");',
    ].join('\n');

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Handsontable Vue Example</title>',
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
