<template>
  <label id="switch" class="dark-mode" :class="{ ready: isReady }">
    <span class="inner" v-show="isReady">
      <input type="checkbox" v-on:change="toggleTheme" :checked="isDarkTheme" />
      <span v-show="isDarkTheme" aria-label="Light mode">
        <i class="ico i-dm-dark"></i>
      </span>
      <span v-show="!isDarkTheme" aria-label="Dark mode">
        <i class="ico i-dm-light"></i>
      </span>
    </span>
  </label>
</template>

<script>
/* global instanceRegister, hotThemeManager */
const CLASS_THEME_DARK = 'theme-dark';
const CLASS_DISABLE_TRANSITION = 'disable-transition';
const STORAGE_KEY = 'handsontable/docs::color-scheme';
// The "SELECTED_COLOR_SCHEME" const is defined in the script that is injected in the VuePress config.js file.
// The script executes the logic before the VuePress app is initialized to prevent page flickering (#8288).
const SELECTED_THEME =
  typeof window === 'undefined' ? undefined : window.SELECTED_COLOR_SCHEME;

export default {
  name: 'ThemeSwitcher',
  methods: {
    toggleTheme() {
      document.documentElement.classList.add(CLASS_DISABLE_TRANSITION);

      this.isDarkTheme = !this.isDarkTheme;

      localStorage.setItem(STORAGE_KEY, this.isDarkTheme ? 'dark' : 'light');

      if (this.isDarkTheme) {
        document.documentElement.classList.add(CLASS_THEME_DARK);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove(CLASS_THEME_DARK);
        document.documentElement.setAttribute('data-theme', 'light');
      }

      hotThemeManager.switchExamplesTheme(instanceRegister.getAllHotInstances());

      requestAnimationFrame(() => {
        document.documentElement.classList.remove(CLASS_DISABLE_TRANSITION);
      });
    },
  },
  data() {
    return {
      isDarkTheme: false,
      isReady: false,
    };
  },
  mounted() {
    this.isDarkTheme = SELECTED_THEME === 'dark';
    this.isReady = typeof SELECTED_THEME === 'string';
  },
};
</script>
