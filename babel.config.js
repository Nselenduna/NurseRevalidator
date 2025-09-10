module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // NativeWind disabled for now - our components use StyleSheet and work fine
      // TODO: Re-enable NativeWind later if needed for other components
      // "nativewind/babel",
      "react-native-reanimated/plugin",
    ],
  };
};
