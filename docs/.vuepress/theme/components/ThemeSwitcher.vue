<template>
  <span v-on:click="toggleTheme" class="theme-switcher">{{themeIcon}}</span>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';
const DEFAULT_THEME_CLASS = 'theme-light';
const DEFAULT_THEME_ICON = '☀️';
const DARK_THEME_ICON = '🌙';

const getBodyElement = () => {
  return document.querySelector('body');
}

const getCurrentThemeIcon = () => {
  return getBodyElement().classList.contains(CLASS_THEME_DARK) ? DARK_THEME_ICON : DEFAULT_THEME_ICON;
}

const toggleClassOnBody = () => {
  const body = getBodyElement();
  const isDefaultTheme = body.classList.contains(DEFAULT_THEME_CLASS);

  body.classList.remove(isDefaultTheme ? DEFAULT_THEME_CLASS : CLASS_THEME_DARK);
  body.classList.add(isDefaultTheme ? CLASS_THEME_DARK : DEFAULT_THEME_CLASS);
}

const setClassOnBody = (className) => {
  getBodyElement().classList.add(className);
}

export default {
  name: 'ThemeSwitcher',
  methods:{
    toggleTheme(){
      toggleClassOnBody();
      this.themeIcon = getCurrentThemeIcon();
    }
  },
  data(){
    return {
      themeIcon: DEFAULT_THEME_ICON
    }
  },
  beforeMount() {
    setClassOnBody(DEFAULT_THEME_CLASS);
  }
};
</script>
