// craco.config.js
const path = require("path");

module.exports = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  devServer: (devServerConfig) => {
    // webpack-dev-server v5 removed these v4-era hooks that CRA still injects
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;
    devServerConfig.setupMiddlewares = (middlewares) => middlewares;
    devServerConfig.allowedHosts = "all";
    // v5 replaced the `https` boolean with a `server` type
    if (typeof devServerConfig.https !== "undefined") {
      devServerConfig.server = devServerConfig.https ? "https" : "http";
      delete devServerConfig.https;
    }
    return devServerConfig;
  },
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig) => {
      // Reduce watched directories
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/build/**",
          "**/dist/**",
          "**/coverage/**",
          "**/public/**",
        ],
      };
      return webpackConfig;
    },
  },
};
