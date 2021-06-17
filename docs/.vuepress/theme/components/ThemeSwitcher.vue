<template>
  <label  id="switch" class="switch">
      <input type="checkbox" v-on:change="toggleTheme" id="slider" :checked="isLightTheme">
      <span class="slider round"></span>
  </label>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';

const getHTMLElement = () => {
  return document.querySelector('html');
}

const isDarkTheme = () => {
  const htmlEl = getHTMLElement();

  return htmlEl.classList.contains(CLASS_THEME_DARK);
}

const toggleClassOnHTML = () => {
  const htmlEl = getHTMLElement();

  isDarkTheme() ? htmlEl.classList.remove(CLASS_THEME_DARK) : htmlEl.classList.add(CLASS_THEME_DARK);
}

export default {
  name: 'ThemeSwitcher',
  methods:{
    toggleTheme(){
      toggleClassOnHTML();
    }
  },
  data() {
    return {
      isLightTheme: !isDarkTheme()
    }
  }
};
</script>
