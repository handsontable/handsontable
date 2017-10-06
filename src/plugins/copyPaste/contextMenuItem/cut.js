export default function cutItem(copyPastePlugin) {
  return {
    key: 'cut',
    name: 'Cut',
    callback() {
      copyPastePlugin.textarea.select();
      copyPastePlugin.setCopyableText();
      copyPastePlugin.cut();
    },
    disabled() {
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
