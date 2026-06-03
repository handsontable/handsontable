<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const localeOptions = [
  { value: 'ar-AR', label: 'Arabic (Global)' },
  { value: 'cs-CZ', label: 'Czech (Czechia)' },
  { value: 'de-CH', label: 'German (Switzerland)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fa-IR', label: 'Persian (Iran)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'hr-HR', label: 'Croatian (Croatia)' },
  { value: 'it-IT', label: 'Italian (Italy)' },
  { value: 'ja-JP', label: 'Japanese (Japan)' },
  { value: 'ko-KR', label: 'Korean (Korea)' },
  { value: 'lv-LV', label: 'Latvian (Latvia)' },
  { value: 'nb-NO', label: 'Norwegian Bokmal (Norway)' },
  { value: 'nl-NL', label: 'Dutch (Netherlands)' },
  { value: 'pl-PL', label: 'Polish (Poland)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ru-RU', label: 'Russian (Russia)' },
  { value: 'sr-SP', label: 'Serbian Latin (Serbia)' },
  { value: 'zh-CN', label: 'Chinese (Simplified, China)' },
  { value: 'zh-TW', label: 'Chinese (Traditional, Taiwan)' },
];

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);
const isOpen = ref(false);
const locale = ref('en-US');

const selectedLabel = () => localeOptions.find((o) => o.value === locale.value)?.label;

const handleSelect = (value: string) => {
  locale.value = value;
  isOpen.value = false;
  hotRef.value?.hotInstance?.updateSettings({ locale: value } as GridSettings);
};

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

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('keydown', handleEscape);
});

const data = [
  {
    car: 'Mercedes A 160',
    product_date: '2002-06-15',
    payment_date: '2002-05-20',
    registration_date: '2002-07-01',
  },
  {
    car: 'Citroën C4 Coupe',
    product_date: '2007-03-22',
    payment_date: '2007-02-28',
    registration_date: '2007-04-10',
  },
  {
    car: 'Audi A4 Avant',
    product_date: '2011-09-08',
    payment_date: '2011-08-15',
    registration_date: '2011-09-20',
  },
  {
    car: 'Opel Astra',
    product_date: '2012-01-30',
    payment_date: '2012-01-10',
    registration_date: '2012-02-14',
  },
  {
    car: 'BMW 320i Coupe',
    product_date: '2004-11-12',
    payment_date: '2004-10-20',
    registration_date: '2004-12-01',
  },
];

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Car', 'Product date', 'Payment date', 'Registration date'],
  locale: 'en-US',
  columns: [
    {
      type: 'text',
      data: 'car',
    },
    {
      type: 'intl-date',
      data: 'product_date',
      dateFormat: { dateStyle: 'short' },
    },
    {
      type: 'intl-date',
      data: 'payment_date',
      dateFormat: {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    },
    {
      type: 'intl-date',
      data: 'registration_date',
      dateFormat: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    },
  ],
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <div class="theme-dropdown" ref="dropdownRef">
          <button
            class="theme-dropdown-trigger"
            type="button"
            aria-haspopup="listbox"
            :aria-expanded="isOpen"
            @click="isOpen = !isOpen"
          >
            <span>{{ selectedLabel() }}</span>
            <svg class="theme-dropdown-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"/></svg>
          </button>
          <ul v-if="isOpen" class="theme-dropdown-menu" role="listbox">
            <li
              v-for="opt in localeOptions"
              :key="opt.value"
              role="option"
              :aria-selected="locale === opt.value"
              @click="handleSelect(opt.value)"
            >
              {{ opt.label }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>
