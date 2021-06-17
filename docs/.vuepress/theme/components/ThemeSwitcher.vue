<template>
  <label  id="switch" class="switch">
      <input type="checkbox" v-on:change="toggleTheme" id="slider" :checked="!isDarkTheme">
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

const isDarkTheme = () => {
  const htmlEl = getDomElement('html');

  return htmlEl.classList.contains(CLASS_THEME_DARK);
}

const toggleClassOnHTML = (htmlDomElement) => {
  isDarkTheme() ? htmlDomElement.classList.remove(CLASS_THEME_DARK) : htmlDomElement.classList.add(CLASS_THEME_DARK);
}

const changeLogo = (isDarkTheme) => {
  const logo = getDomElement('header.navbar .logo');
  logo.src = isDarkTheme ? SRC_LOGO_WHITE : SRC_LOGO_DEFAULT;
}

export default {
  name: 'ThemeSwitcher',
  methods:{
    toggleTheme(){
      const htmlEl = getDomElement('html');
      toggleClassOnHTML(htmlEl);
      this.isDarkTheme = isDarkTheme();
      changeLogo(this.isDarkTheme);
    }
  },
  data() {
    return {
      isDarkTheme: isDarkTheme()
    }
  }
};
</script>
