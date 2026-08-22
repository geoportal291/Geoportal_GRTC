const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 0. Alias "@/" -> src/ (ya declarado en jsconfig.json para el editor;
      //    aquí se conecta al build para que webpack también lo resuelva)
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
      };

      // 1. Polyfills para Webpack 5 (Requeridos por Cesium)
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        https: require.resolve('https-browserify'),
        http: require.resolve('stream-http'),
        zlib: require.resolve('browserify-zlib'),
        url: require.resolve('url/'),
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser.js'),
        punycode: require.resolve('punycode'),
      };

      // 2. Plugins globales
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // 3. Copiar assets de Cesium al directorio cesium/
      webpackConfig.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: 'node_modules/cesium/Build/Cesium',
              to: 'cesium',
              globOptions: {
                ignore: ['**/index.js']
              }
            }
          ]
        })
      );

      // 4. IGNORAR completamente Cesium del bundle (se carga vía script tag en index.html)
      webpackConfig.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^cesium$/
        })
      );

      // 5. Ignorar advertencias de archivos grandes (típico en Cesium)
      webpackConfig.module.unknownContextCritical = false;

      return webpackConfig;
    }
  }
};
