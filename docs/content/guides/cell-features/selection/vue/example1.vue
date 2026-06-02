<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const options = [
  { value: 'single', label: 'Single selection' },
  { value: 'range', label: 'Range selection' },
  { value: 'multiple', label: 'Multiple ranges selection' },
] as const;

const dropdownRef = ref<HTMLDivElement | null>(null);
const isOpen = ref(false);
const selected = ref<'single' | 'range' | 'multiple'>('multiple');

const selectedLabel = computed(() => options.find((o) => o.value === selected.value)?.label);

const hotSettings = computed<GridSettings>(() => ({
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6'],
    ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7'],
    ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8'],
    ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9'],
  ],
  width: 'auto',
  height: 'auto',
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  selectionMode: selected.value,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
}));

const handleOutsideClick = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('keydown', handleEscape);
});

const handleSelect = (value: 'single' | 'range' | 'multiple') => {
  selected.value = value;
  isOpen.value = false;
};
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <div ref="dropdownRef" class="theme-dropdown">
          <button
            class="theme-dropdown-trigger"
            type="button"
            aria-haspopup="listbox"
            :aria-expanded="isOpen"
            @click="isOpen = !isOpen"
          >
            <span>{{ selectedLabel }}</span>
            <svg
              class="theme-dropdown-chevron"
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 9l6 6l6 -6" />
            </svg>
          </button>
          <ul v-if="isOpen" class="theme-dropdown-menu" role="listbox">
            <li
              v-for="opt in options"
              :key="opt.value"
              role="option"
              :aria-selected="selected === opt.value"
              @click="handleSelect(opt.value)"
            >
              {{ opt.label }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <HotTable :key="selected" :settings="hotSettings" />
  </div>
</template>
