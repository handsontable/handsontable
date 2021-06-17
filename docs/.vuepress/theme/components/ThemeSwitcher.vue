<template>
  <span v-on:click="toggleTheme" class="theme-switcher">{{themeIcon}}</span>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';
const DEFAULT_THEME_ICON = '☀️';
const DARK_THEME_ICON = '🌙';

const getHTMLElement = () => {
  return document.querySelector('html');
}

const getCurrentThemeIcon = () => {
  return getHTMLElement().classList.contains(CLASS_THEME_DARK) ? DARK_THEME_ICON : DEFAULT_THEME_ICON;
}

const toggleClassOnHTML = () => {
  const htmlEl = getHTMLElement();
  const isDarkTheme = htmlEl.classList.contains(CLASS_THEME_DARK);

  isDarkTheme ? htmlEl.classList.remove(CLASS_THEME_DARK) : htmlEl.classList.add(CLASS_THEME_DARK);
}

export default {
  name: 'ThemeSwitcher',
  methods:{
    toggleTheme(){
      toggleClassOnHTML();
      this.themeIcon = getCurrentThemeIcon();
    }
  },
  data(){
    return {
      themeIcon: DEFAULT_THEME_ICON
    }
  },
};
</script>
