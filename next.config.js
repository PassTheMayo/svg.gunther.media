const path = require('path');

module.exports = {
    sassOptions: {
        silenceDeprecations: ['legacy-js-api']
    },
    webpack: (config) => {
        config.resolve.alias['@'] = path.resolve(__dirname, 'src');

        config.module.rules.push({
            test: /\.svg$/,
            use: [
                { loader: '@svgr/webpack' }
            ]
        });

        return config;
    }
};