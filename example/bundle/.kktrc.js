import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
// import fs from 'fs-extra';


export const loaderOneOf = [
  [require.resolve('@kkt/loader-less'), {} ],
];

export default (conf, options) => {
  if (options.yargsArgs && options.yargsArgs.bundle) {
    conf.devtool = false;
    const regexp = /(HtmlWebpackPlugin|InlineChunkHtmlPlugin|InterpolateHtmlPlugin|MiniCssExtractPlugin|ManifestPlugin|IgnorePlugin|GenerateSW)/;
    conf.plugins = conf.plugins.map((item) => {
      if (item.constructor && item.constructor.name && regexp.test(item.constructor.name)) {
        return null;
      }
      return item;
    }).filter(Boolean);
    conf.entry = path.join(process.cwd(), 'src/components/index.js');
    conf.output = {
      path: path.join(process.cwd(), 'dist'),
      futureEmitAssets: true,
      filename: 'uiw.js',
      library: 'UIW',
      libraryTarget: 'umd',
    }
    conf.externals = {
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react',
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs2: 'react-dom',
        commonjs: 'react-dom',
        amd: 'react-dom',
      },
    }
    conf.optimization = {
      minimize: options.isEnvProduction,
      minimizer: [],
    };
    if (options.yargsArgs && options.yargsArgs.mini) {
      conf.output.filename = 'uiw.min.js';
      conf.plugins = [
        ...conf.plugins,
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'uiw.min.css',
          // allChunks: true because we want all css to be included in the main
          // css bundle when doing code splitting to avoid FOUC:
          // https://github.com/facebook/create-react-app/issues/2415
          allChunks: true,
        })
      ];
    } else {
      conf.optimization.minimize = false;
      conf.plugins = [
        ...conf.plugins,
        new MiniCssExtractPlugin({
          filename: 'uiw.css',
          allChunks: true,
        })
      ];
    }
  }
  return conf
}