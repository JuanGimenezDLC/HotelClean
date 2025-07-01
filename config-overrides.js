const { override, addWebpackPlugin } = require('customize-cra');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = override(
  // addWebpackPlugin(
  //   new InjectManifest({
  //     swSrc: './src/service-worker.ts',
  //     swDest: 'service-worker.js',
  //   })
  // )
);
