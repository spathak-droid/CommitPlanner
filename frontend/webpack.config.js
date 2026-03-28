const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      publicPath: 'auto',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.css$/,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'weeklyCommitRemote',
        filename: 'remoteEntry.js',
        exposes: {
          './WeeklyCommitApp': './src/App',
          './WeeklyPlanView': './src/pages/WeeklyPlanPage',
          './ManagerDashboard': './src/pages/ManagerDashboardPage',
          './TeamAlignmentView': './src/pages/TeamAlignmentPage',
          './AdminSetupView': './src/pages/SettingsPage',
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
          zustand: { singleton: true, requiredVersion: '^4.5.0' },
        },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      ...(isDev ? [] : [new MiniCssExtractPlugin()]),
    ],
    devServer: {
      port: 3001,
      hot: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  };
};
