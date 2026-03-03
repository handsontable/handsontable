const api = require('./api/sidebar').sidebar;
const guides = require('./guides/sidebar').sidebar;
const recipes = require('./recipes/sidebar').sidebar;

module.exports = {
  recipes, api, guides
};
