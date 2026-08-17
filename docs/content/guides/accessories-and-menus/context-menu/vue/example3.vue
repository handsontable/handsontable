<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import type { DetailedSettings } from 'handsontable/plugins/contextMenu';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const ALLOWED_TAGS = ['B', 'I', 'EM', 'STRONG', 'BR'];

// Handsontable has no built-in sanitizer since v18.0. This minimal allowlist keeps
// the example self-contained -- in production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeMenuLabel = (html: string): string => {
  const template = document.createElement('template');

  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (ALLOWED_TAGS.includes(element.tagName)) {
      Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
    } else {
      // Unwrap a disallowed element, keeping its text content
      element.replaceWith(...Array.from(element.childNodes));
    }
  });

  return template.innerHTML;
};

const contextMenuSettings: DetailedSettings = {
  callback(key, selection, clickEvent) {
    console.log(key, selection, clickEvent);
  },
  items: {
    row_above: {
      disabled() {
        return this.getSelectedLast()?.[0] === 0;
      },
    },
    sp1: ContextMenu.SEPARATOR,
    row_below: {
      name: 'Click to add row below',
    },
    about: {
      name() {
        return '<b>Custom option</b>';
      },
      hidden() {
        return this.getSelectedLast()?.[1] == 0;
      },
      callback() {
        setTimeout(() => {
          alert('Hello world!');
        }, 0);
      },
    },
    colors: {
      name: 'Colors...',
      submenu: {
        items: [
          {
            key: 'colors:red',
            name: 'Red',
            callback() {
              setTimeout(() => {
                alert('You clicked red!');
              }, 0);
            },
          },
          { key: 'colors:green', name: 'Green' },
          { key: 'colors:blue', name: 'Blue' },
        ],
      },
    },
    credits: {
      renderer() {
        const elem = document.createElement('marquee');

        elem.style.cssText = 'background: lightgray; color: #222222;';
        elem.textContent = 'Brought to you by...';

        return elem;
      },
      disableSelection: true,
      isCommand: false,
    },
  },
};

const hotSettings = ref<GridSettings>({
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
    ['2021', 10, 11, 12, 13, 15, 16],
  ],
  rowHeaders: true,
  colHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  contextMenu: contextMenuSettings,
  // Required for the HTML in the `about` item's label to be rendered safely
  sanitizer: sanitizeMenuLabel,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>
