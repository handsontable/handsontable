<template>
  <label  id="switch" class="switch">
      <input type="checkbox" v-on:change="toggleTheme" id="slider" :checked="isDarkTheme">
      <span class="slider round"></span>
  </label>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';
const SRC_LOGO_DEFAULT = '/img/handsontable-logo.svg'
const SRC_LOGO_WHITE = '/img/handsontable-logo-white.svg';

const getDomElement = (selector) => {
  return document.querySelector(selector);
}

const toggleDarkThemeClassOnHTML = (htmlDomElement, isDarkTheme) => {
  isDarkTheme ? htmlDomElement.classList.add(CLASS_THEME_DARK) : htmlDomElement.classList.remove(CLASS_THEME_DARK);
}

const changeLogo = (logoEl, isDarkTheme) => {
  logoEl.src = isDarkTheme ? SRC_LOGO_WHITE : SRC_LOGO_DEFAULT;
}

export default {
  name: 'ThemeSwitcher',
  methods:{
    toggleTheme(){
      this.isDarkTheme = !this.isDarkTheme;

      toggleDarkThemeClassOnHTML(this.htmlDomEl, this.isDarkTheme);
      changeLogo(this.logoDomEl, this.isDarkTheme);
    }
  },
  data() {
    return {
      isDarkTheme: null,
      htmlDomEl: null,
      logoDomEl: null
    }
  },
  beforeMount() {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    
    if (prefersDarkScheme.matches) {
      this.isDarkTheme = true;
    } else {
      this.isDarkTheme = false;
    }
  },
  mounted() {
    this.htmlDomEl = getDomElement('html');
    this.logoDomEl = getDomElement('header.navbar .logo');

    toggleDarkThemeClassOnHTML(this.htmlDomEl, this.isDarkTheme)

    changeLogo(this.logoDomEl, this.isDarkTheme);
  }
};
</script>
