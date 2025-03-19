const { exec } = require('child_process');
const { merge } = require('webpack-merge');

// Load configurations
const commonConfig = require('./webpack.common.js');
const devConfig = require('./webpack.dev.js');
const prodConfig = require('./webpack.prod.js');

function getWebpackCommand(env) {
    let finalConfig = {};
    if (env === 'prod') {
        finalConfig = merge(commonConfig, prodConfig);
    } else {  // default to development configuration
        finalConfig = merge(commonConfig, devConfig);
    }

    // Create a temporary webpack config file or use a similar method to handle this
    const configFilePath = `webpack.config.${env}.js`;
    require('fs').writeFileSync(configFilePath, `module.exports = ${JSON.stringify(finalConfig, null, 2)};`);

    return `webpack --config ${configFilePath}`;
}

const env = process.argv[2] || 'dev';  // Default to 'dev' if no argument is provided
const webpackCommand = getWebpackCommand(env);

exec(webpackCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`);
    }
    console.log(`Stdout: ${stdout}`);
});
