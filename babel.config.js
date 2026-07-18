module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo automatically adds the Reanimated 4 worklets
    // plugin when react-native-worklets is installed, so no manual
    // plugin entry is needed here.
    presets: ["babel-preset-expo"],
  };
};
