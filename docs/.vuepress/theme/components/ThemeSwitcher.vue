<template>
  <label id="switch" class="switch">
      <input type="checkbox" v-on:change="toggleTheme" id="slider" :checked="isDarkTheme">
      <span class="slider round"></span>
  </label>
</template>

<script>
const CLASS_THEME_DARK = 'theme-dark';

const getDomElement = (selector) => {
  return document.querySelector(selector);
};

const toggleDarkThemeClassOnHTML = (htmlDomElement, isDarkTheme) => {
  if (isDarkTheme) {
    htmlDomElement.classList.add(CLASS_THEME_DARK);

    return;
  }

  htmlDomElement.classList.remove(CLASS_THEME_DARK);
};

export default {
  name: 'ThemeSwitcher',
  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      const theme = this.isDarkTheme ? 'dark' : 'light';

      if (localStorage) {
        localStorage.setItem('theme', theme);
      }

      toggleDarkThemeClassOnHTML(this.htmlDomEl, this.isDarkTheme);
    }
  },
  data() {
    return {
      isDarkTheme: null,
      htmlDomEl: null,
      logoDomEl: null
    };
  },
  beforeMount() {
    const userPrefferedTheme = localStorage ? localStorage.getItem('theme') : 'light';

    if (userPrefferedTheme) {
      this.isDarkTheme = userPrefferedTheme === 'dark';

      return;
    }

    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    if (prefersDarkScheme.matches) {
      this.isDarkTheme = true;
    } else {
      this.isDarkTheme = false;
    }
  },
  mounted() {
    this.htmlDomEl = getDomElement('html');
    this.logoDomEl = getDomElement('header.navbar .logo');

    toggleDarkThemeClassOnHTML(this.htmlDomEl, this.isDarkTheme);

  }
};
</script>

<style lang="stylus">
/* Hide the theme switcher in the sidebar on wide screen and show on narrow screen */
.sidebar.sidebar .switch {
  display: none;
  margin-bottom: 0;
  top: 8px;
  left: 22px;

  @media (max-width: $MQNarrow) {
    & {
      display: inline-block;
    }
  }
}
</style>

<style lang="stylus" scoped>

/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  margin-right 1.5rem
  top: 8px;
  left: -9px;

  /* Hide the theme switcher on narrow screen */
  @media (max-width: $MQNarrow) {
    display none
  }
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 0px;
  bottom: 4px;
  top: 0;
  bottom: 0;
  margin: auto 0;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  box-shadow: 0 0px 3px #2020203d;
  background: #ffffff url('/img/light-theme-icon.svg');
  background-size: 70%;
  background-repeat: no-repeat;
  background-position: center;
}

input:checked + .slider {
  background-color: #2196f3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(16px);
  -ms-transform: translateX(16px);
  transform: translateX(16px);
  background: #ffffff url('/img/dark-theme-icon.svg');
  background-size: 70%;
  background-repeat: no-repeat;
  background-position: center;
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

</style>
