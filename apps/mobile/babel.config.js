module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "react" }]],
    plugins: [
      // Must stay last: Reanimated's worklet transform has to run after
      // everything else has finished rewriting the code.
      "react-native-reanimated/plugin",
    ],
  };
};
