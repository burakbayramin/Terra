// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

const config = getDefaultConfig(__dirname);

// Reanimated için sarmalıyoruz
module.exports = wrapWithReanimatedMetroConfig(config);
