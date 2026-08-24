/**
 * Client-side interactions for .hot-example blocks.
 *
 * Handles:
 *  - Tab switching within a code section.
 *  - "Source code" toggle to show/hide the code section.
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
    var scriptLangs = (marker.dataset.scriptLangs || '').split(',').filter(Boolean);
    var scriptCount = parseInt(marker.dataset.scriptCount || '0', 10) || 0;
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

    var needTabs = tabs.length > 1 || scriptCount > 1;

    if (needTabs) {
      var tabbar = document.createElement('div');
      tabbar.className = 'hot-example-tabbar';
      tabbar.setAttribute('role', 'tablist');

      var activeTab = 0;
      var activeScript = 0;

      tabs.forEach(function (title, i) {
        if (i === 0 && scriptCount > 1) {
          // Custom dropdown for JS/TS variants
          var dropdown = document.createElement('div');
          dropdown.className = 'hot-example-lang-dropdown';

          var trigger = document.createElement('button');
          trigger.className = 'hot-example-lang-trigger is-active';
          trigger.setAttribute('type', 'button');
          trigger.setAttribute('aria-haspopup', 'listbox');
          trigger.setAttribute('aria-expanded', 'false');
          trigger.innerHTML = scriptLangs[0] + ' <svg class="hot-example-lang-chevron" aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6-6"/></svg>';
          dropdown.appendChild(trigger);

          var menu = document.createElement('ul');
          menu.className = 'hot-example-lang-menu';
          menu.setAttribute('role', 'listbox');
          menu.hidden = true;

          scriptLangs.forEach(function (lang, j) {
            var li = document.createElement('li');
            li.className = 'hot-example-lang-option' + (j === 0 ? ' is-selected' : '');
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', j === 0 ? 'true' : 'false');
            li.dataset.value = String(j);
            li.textContent = lang;
            menu.appendChild(li);
          });

          dropdown.appendChild(menu);
          tabbar.appendChild(dropdown);
        } else {
          var btn = document.createElement('button');
          btn.className = 'hot-example-tab' + (i === 0 ? ' is-active' : '');
          btn.setAttribute('role', 'tab');
          btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
          btn.dataset.tab = String(i);
          btn.textContent = title;
          tabbar.appendChild(btn);
        }
      });

      codeSection.appendChild(tabbar);

      // Resolves which panel index is visible for a given tab + script variant
      function panelForTab(tabIdx, scriptVariant) {
        if (scriptCount > 1) {
          // Tab 0 = script variants (panels 0..scriptCount-1)
          // Tab N (N>0) = panel at scriptCount + (N - 1)
          return tabIdx === 0 ? scriptVariant : scriptCount + (tabIdx - 1);
        }
        return tabIdx;
      }

      function updatePanels() {
        var visibleIdx = panelForTab(activeTab, activeScript);
        panels.forEach(function (panel, i) {
          panel.style.display = i === visibleIdx ? '' : 'none';
        });
      }

      // Tab button click
      tabbar.addEventListener('click', function (e) {
        var btn = e.target.closest('.hot-example-tab');
        if (!btn) return;

        activeTab = parseInt(btn.dataset.tab, 10);

        // Update button active states
        tabbar.querySelectorAll('.hot-example-tab').forEach(function (t) {
          var isActive = parseInt(t.dataset.tab, 10) === activeTab;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Deactivate the lang dropdown trigger when another tab is active
        var langTrigger = tabbar.querySelector('.hot-example-lang-trigger');
        if (langTrigger) {
          langTrigger.classList.toggle('is-active', activeTab === 0);
        }

        // Close the lang menu if open
        var langMenu = tabbar.querySelector('.hot-example-lang-menu');
        if (langMenu) langMenu.hidden = true;
        if (langTrigger) langTrigger.setAttribute('aria-expanded', 'false');

        updatePanels();
      });

      // Language dropdown
      var langDropdown = tabbar.querySelector('.hot-example-lang-dropdown');
      var langTrigger = tabbar.querySelector('.hot-example-lang-trigger');
      var langMenu = tabbar.querySelector('.hot-example-lang-menu');

      if (langDropdown && langTrigger && langMenu) {
        // Toggle menu on trigger click
        langTrigger.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = !langMenu.hidden;
          langMenu.hidden = isOpen;
          langTrigger.setAttribute('aria-expanded', String(!isOpen));

          // Also activate the script tab
          if (activeTab !== 0) {
            activeTab = 0;
            tabbar.querySelectorAll('.hot-example-tab').forEach(function (t) {
              t.classList.remove('is-active');
              t.setAttribute('aria-selected', 'false');
            });
            langTrigger.classList.add('is-active');
            updatePanels();
          }
        });

        // Option click
        langMenu.addEventListener('click', function (e) {
          var option = e.target.closest('.hot-example-lang-option');
          if (!option) return;

          activeScript = parseInt(option.dataset.value, 10);
          activeTab = 0;

          // Update selected state
          langMenu.querySelectorAll('.hot-example-lang-option').forEach(function (opt) {
            var sel = opt.dataset.value === String(activeScript);
            opt.classList.toggle('is-selected', sel);
            opt.setAttribute('aria-selected', sel ? 'true' : 'false');
            // active state handled by CSS box-shadow
          });

          // Update trigger label
          langTrigger.innerHTML = scriptLangs[activeScript] + ' <svg class="hot-example-lang-chevron" aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6-6"/></svg>';

          // Follow the active JS/TS tab in the runner link, if present.
          var runnerBtn = hotExample.querySelector('.hot-example-runner-btn');
          if (runnerBtn && runnerBtn.dataset.docsJs && runnerBtn.dataset.docsTs) {
            var docsPath = scriptLangs[activeScript] === 'TypeScript'
              ? runnerBtn.dataset.docsTs : runnerBtn.dataset.docsJs;
            runnerBtn.href = 'https://demos.handsontable.com/?docs=' + docsPath +
              '&v=' + runnerBtn.dataset.runnerVersion;
          }

          // Deactivate tab buttons, activate dropdown
          tabbar.querySelectorAll('.hot-example-tab').forEach(function (t) {
            t.classList.remove('is-active');
            t.setAttribute('aria-selected', 'false');
          });
          langTrigger.classList.add('is-active');

          // Close menu
          langMenu.hidden = true;
          langTrigger.setAttribute('aria-expanded', 'false');

          updatePanels();
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
          if (!langDropdown.contains(e.target)) {
            langMenu.hidden = true;
            langTrigger.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Initial panel visibility
      updatePanels();
    }

    // Move panels into code section
    panels.forEach(function (panel) {
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

});
