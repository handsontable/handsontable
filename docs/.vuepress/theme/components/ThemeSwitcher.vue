<template>
  <span v-on:click="toggleTheme" class="theme-switcher">{{themeIcon}}</span>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';
const DEFAULT_THEME_CLASS = 'theme-light';
const DEFAULT_THEME_ICON = '☀️';
const DARK_THEME_ICON = '🌙';

const getHTMLElement = () => {
  return document.querySelector('html');
}

const getCurrentThemeIcon = () => {
  return getHTMLElement().classList.contains(CLASS_THEME_DARK) ? DARK_THEME_ICON : DEFAULT_THEME_ICON;
}

const toggleClassOnHTML = () => {
  const html = getHTMLElement();
  const isDefaultTheme = html.classList.contains(DEFAULT_THEME_CLASS);

  html.classList.remove(isDefaultTheme ? DEFAULT_THEME_CLASS : CLASS_THEME_DARK);
  html.classList.add(isDefaultTheme ? CLASS_THEME_DARK : DEFAULT_THEME_CLASS);
}

const setClassOnHTML = (className) => {
  getHTMLElement().classList.add(className);
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
  beforeMount() {
    setClassOnHTML(DEFAULT_THEME_CLASS);
  }
};
</script>
