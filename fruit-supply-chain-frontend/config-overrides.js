const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = function override(config) {
  config.plugins = config.plugins || [];
  config.plugins.push(
    new NodePolyfillPlugin({
      excludeAliases: ["console"], // Giữ console để debug
    })
  );
  return config;
};
