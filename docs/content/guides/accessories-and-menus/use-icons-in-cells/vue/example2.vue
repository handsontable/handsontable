<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';
import { createIcons, Flag, FlagOff } from 'lucide';

registerAllModules();

interface Task {
  task: string;
  assignee: string;
  dueDate: string;
  flagged: boolean;
}

const data: Task[] = [
  { task: 'Update API docs', assignee: 'Ana García', dueDate: '2025-06-30', flagged: true },
  { task: 'Deploy hotfix', assignee: 'James Okafor', dueDate: '2025-06-18', flagged: false },
  { task: 'Review pull request', assignee: 'Li Wei', dueDate: '2025-06-20', flagged: false },
  { task: 'Write release notes', assignee: 'Sara Nowak', dueDate: '2025-06-25', flagged: true },
  { task: 'Fix flaky test', assignee: 'Marco Rossi', dueDate: '2025-06-22', flagged: false },
];

// The Vue wrapper renders cells through a renderer function rather than a
// component, so this uses the same `data-lucide` placeholder as vanilla
// JavaScript: write the placeholder, then let Lucide swap it for an `<svg>`.
const flagRenderer: BaseRenderer = (instance, td, row, _col, _prop, value) => {
  const taskName = String(instance.getDataAtCell(row, 0));
  const button = document.createElement('button');

  button.type = 'button';
  button.style.cssText = 'background: none; border: none; cursor: pointer; padding: 0.25rem;';
  button.innerHTML = `<i data-lucide="${value ? 'flag' : 'flag-off'}"></i>`;
  // The icon has no accessible name, so the button carries an `aria-label`
  // that describes what clicking it does.
  button.setAttribute(
    'aria-label',
    value ? `Remove the follow-up flag from ${taskName}` : `Flag ${taskName} for follow-up`
  );
  button.addEventListener('click', () => {
    instance.setDataAtCell(row, 3, !value);
  });

  td.innerText = '';
  td.appendChild(button);

  // `root` scopes the scan to this cell. Without it, Lucide walks the whole
  // document on every cell render, which a grid does once per visible cell.
  // `currentColor` keeps the icon visible in both light and dark themes.
  createIcons({
    icons: { Flag, FlagOff },
    attrs: { width: '18', height: '18', stroke: 'currentColor' },
    root: td,
  });

  return td;
};

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Task', 'Assignee', 'Due date', 'Flagged'],
  columns: [
    { data: 'task' },
    { data: 'assignee' },
    { data: 'dueDate', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
    { data: 'flagged', renderer: flagRenderer, className: 'htCenter' },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>
