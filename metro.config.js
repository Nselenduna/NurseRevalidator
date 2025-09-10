// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require("expo/metro-config");

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname, {
  // Enable CSS support
  isCSSEnabled: true,
});

// Add SVG support
const { transformer, resolver } = config;

// Use worker threads for faster bundling
config.maxWorkers = 4;

// For NativeWind v3.0.0-next.34, we can just export the config directly
// without the withNativeWind function since the CSS loading is
// handled through the css import in App.tsx
module.exports = config;
