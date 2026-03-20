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
   * @param {{ title: string, hotVersion: string, framework: string, exampleId: string, files: Record<string,string> }} data
   */
  function openOnStackBlitz(data) {
    var hotVersion  = data.hotVersion || 'latest';
    var framework   = data.framework  || 'javascript';
    var exampleId   = data.exampleId  || 'example';
    var userFiles   = data.files      || {};
    var title       = data.title      || 'Handsontable Example';

    var projectFiles = buildProjectFiles(framework, hotVersion, exampleId, userFiles);

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
    addInput('project[template]',    framework === 'react' ? 'create-react-app' : 'javascript');

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
   * @param {string} framework - 'javascript' | 'react' | 'angular'
   * @param {string} hotVersion
   * @param {string} exampleId
   * @param {Record<string,string>} userFiles - Raw source files from the example
   * @returns {Record<string,string>}
   */
  function buildProjectFiles(framework, hotVersion, exampleId, userFiles) {
    if (framework === 'react') {
      return buildReactProject(hotVersion, exampleId, userFiles);
    }

    if (framework === 'angular') {
      return buildAngularProject(hotVersion, exampleId, userFiles);
    }

    return buildJsProject(hotVersion, exampleId, userFiles);
  }

  // ── Vanilla JS project ────────────────────────────────────────────────────

  function buildJsProject(hotVersion, exampleId, userFiles) {
    var jsFile = findFile(userFiles, '.js') || 'index.js';
    var jsCode = userFiles[jsFile] || '';

    var pkg = JSON.stringify({
      name: 'handsontable-example',
      version: '1.0.0',
      private: true,
      dependencies: { handsontable: hotVersion },
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
      '  <script src="index.js"><\/script>',
      '</body>',
      '</html>',
    ].join('\n');

    var files = {
      'package.json': pkg,
      'index.html':   html,
      'index.js':     jsCode,
    };

    // Include any CSS file the example ships with
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

  function buildReactProject(hotVersion, exampleId, userFiles) {
    var jsxFile = findFile(userFiles, '.jsx') || findFile(userFiles, '.tsx') || 'App.jsx';
    var jsxCode = userFiles[jsxFile] || '';

    var pkg = JSON.stringify({
      name: 'handsontable-react-example',
      version: '1.0.0',
      private: true,
      dependencies: {
        handsontable: hotVersion,
        '@handsontable/react': hotVersion,
        react: '18.x',
        'react-dom': '18.x',
      },
    }, null, 2);

    var index = [
      'import React from "react";',
      'import { createRoot } from "react-dom/client";',
      'import App from "./App";',
      'import "handsontable/dist/handsontable.full.min.css";',
      '',
      'const root = createRoot(document.getElementById("' + exampleId + '"));',
      'root.render(<App />);',
    ].join('\n');

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Handsontable React Example</title>',
      '  <style>body { padding: 1rem; font-family: sans-serif; }</style>',
      '</head>',
      '<body>',
      '  <div id="' + exampleId + '"></div>',
      '</body>',
      '</html>',
    ].join('\n');

    return {
      'package.json': pkg,
      'index.html':   html,
      'index.js':     index,
      'App.jsx':      jsxCode,
    };
  }

  // ── Angular project ───────────────────────────────────────────────────────

  function buildAngularProject(hotVersion, exampleId, userFiles) {
    var tsFile  = findFile(userFiles, '.ts')   || 'app.component.ts';
    var htmlFile = findFile(userFiles, '.html') || null;
    var tsCode  = userFiles[tsFile]   || '';
    var htmlCode = htmlFile ? (userFiles[htmlFile] || '') : '<div id="' + exampleId + '"></div>';

    var pkg = JSON.stringify({
      name: 'handsontable-angular-example',
      version: '1.0.0',
      private: true,
      dependencies: {
        handsontable: hotVersion,
        '@handsontable/angular-wrapper': hotVersion,
        '@angular/core': '17.x',
        '@angular/common': '17.x',
        '@angular/platform-browser': '17.x',
        '@angular/platform-browser-dynamic': '17.x',
        'rxjs': '7.x',
        'zone.js': '0.14.x',
      },
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
