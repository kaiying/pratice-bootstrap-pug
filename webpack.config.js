const fs = require("fs");
const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var webpack = require("webpack");

let pages = [];
// 需要忽略的資料夾
let pageIgnore = ["try"];

// 搜尋目錄中檔案並 gen HtmlWebPackPlugin
function generateHtmlPlugins(templateDir) {
  // Read files in template directory
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  const extensionName = "pug";

  templateFiles.forEach(item => {
    // Split names and extension
    const parts = item.split(".");
    const name = parts[0] || undefined;
    const extension = parts[1] || undefined;

    // 忽略沒檔名且第一個字為底線的
    let checkName = name !== undefined && name.substr(0, 1) !== "_";
    // 忽略 pageIgnore 內的資料夾及資料夾名第一次為底線的
    let checkDirectoryName =
      extension === undefined &&
      pageIgnore.indexOf(name) === -1 &&
      name.substr(0, 1) !== "_";

    if (checkDirectoryName) {
      var newTemplateDir = templateDir + "/" + name;
      generateHtmlPlugins(newTemplateDir);
    }

    // Create new HtmlWebPackPlugin with options
    if (name !== undefined && checkName && extension === extensionName) {
      pages.push(
        new HtmlWebPackPlugin({
          filename: `${name}.html`,
          template: path.resolve(
            __dirname,
            `${templateDir}/${name}.${extension}`
          )
        })
      );
    }
  });
  return pages;
}

// pug 全域變數
// let globalJsonData = require(path.resolve(__dirname, "src/define.json"));

// Call our function on our views directory.
const htmlPlugins = generateHtmlPlugins("./mockup") || [];

let config = {
  entry: ["./src/main.js", "./src/main.scss"],
  output: {
    path: __dirname + "/dist"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.pug$/,
        use: "pug-loader?pretty=true&self=true"
      },
      {
        // css / sass / scss loader for webpack
        test: /\.(css|sass|scss)$/,
        use: ExtractTextPlugin.extract({
          use: ["css-loader", "sass-loader"]
        })
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "fonts/"
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([]),
    new ExtractTextPlugin({
      filename: "[name].bundle.css"
    }),
    new webpack.ProvidePlugin({
      // 利用 webpack.ProvidePlugin 讓 $ 和 jQuery 可以連結到 jquery library
      $: "jquery",
      jQuery: "jquery",
      "window.jquery": "jquery"
    }),
    new CleanWebpackPlugin({}),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }],
      },
      canPrint: true
    })
  ].concat(htmlPlugins),
  devServer: {
    inline: true,
    contentBase: "./dist",
    port: 3000
  }
};

module.exports = config;
