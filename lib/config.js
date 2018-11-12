var fs = require('fs');
var path = require('path');
var tools = require('./tools');
var _ = require('underscore');

/**
 * CurrentConfig is a dynamic variable that works with one stack (not multiple
 * fibers). You can dynamically set the CurrentConfig value for a given position
 * in the stack by calling CurrentConfig.withValue and passing a value and a
 * callback function. You can get the current value by calling
 * CurrentConfig.get(). Calling CurrentConfig.withConfigFile(func) will read
 * the config file from the .maka/config.json path and deserialize the json
 * into an object.
 *
 */

function defaultValue (val, defaultVal) {
    return typeof val === 'undefined' ? defaultVal : val;
}

/**
 * Validate the config file.
 */
function withValidation (configValue) {
    // as we add more engines for each file type, add them to the supported
    // lists here. Each supported engine must have corresponding template files
    // in each of the template folders. See explanation above on engines.
    var supportedEngines = {
        html: ['html', 'jade'],
        js: ['js', 'jsx', 'ts', 'tsx'],
        css: ['css', 'less', 'scss'],
        api: ['rest', 'restivus', 'graphql', 'none'],
        test: ['jasmine', 'mocha', 'none'],
        client: ['blaze', 'react', 'reflux'],
        graphql: ['apollo'],
        ssr: [true, false]
    };

    var engines = configValue.engines = defaultValue(configValue.engines, {});

    if (engines.html && !_.contains(supportedEngines.html, engines.html))
        throw new Error("Unsported html engine: " + engines.html);

    if (engines.js && !_.contains(supportedEngines.js, engines.js))
        throw new Error("Unsported js engine: " + engines.js);

    if (engines.css && !_.contains(supportedEngines.css, engines.css))
        throw new Error("Unsported css engine: " + engines.css);

    if (engines.api && !_.contains(supportedEngines.api, engines.api))
        throw new Error("Unsupported api engine: " + engines.api);

   if (engines.client && !_.contains(supportedEngines.client, engines.client))
        throw new Error("Unsupported client engine: " + engines.api);

    // set default engines
    engines.html = defaultValue(engines.html, 'html');
    engines.js = defaultValue(engines.js, 'js');
    engines.css = defaultValue(engines.css, 'css');
    engines.client = defaultValue(engines.client, 'react');
    engines.api = defaultValue(engines.api, 'none');

    return configValue;
}

var current = null;
var CurrentConfig = {
    get: function() {
        return current;
    },

    withValue: function (value, func) {
        var saved = current;
        var ret;

        try {
            current = withValidation(value);
            ret = func();
        } finally {
            current = saved;
        }

        return ret;
    },

    withConfigFile: function (func) {
        var configFilePath = tools.pathFromProject('.maka', 'config.json');

        if (!configFilePath) {
            throw new Error("Must be in a project directory to read .maka/config.json");
        }

        if (!tools.isFile(configFilePath)) {
            throw new Error(".maka/config.json doesn't exist");
        }

        var json = fs.readFileSync(configFilePath, 'utf8');
        var value;
        try {
            value = JSON.parse(json);
        } catch(e) {
            if (e instanceof SyntaxError) {
                throw new Error("Error parsing .maka/config.json: " + e.message)
            } else {
                throw e;
            }
        }

        return this.withValue(value, func);
    }
};

module.exports = CurrentConfig;
