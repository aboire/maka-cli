var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var JSDOC_COMMAND_DESCRIPTION = 'Use the popular JSDoc documentation generator\n\n' +
  'which will create a JSDoc config file and store it in,\n' +
  'config/jsdoc-config.json \n\n' +
  '"$ maka jsdoc" will recursively traverse the app/ directory\n' +
  'for all JSDoc comment syntax and output the result in\n' +
  '<project-dir>/docs/ directory.\n' +
  'You may use $ maka jsdoc anywhere in the project.';

Command.create({
  name: 'jsdoc',
  usage: 'maka jsdoc',
  description: JSDOC_COMMAND_DESCRIPTION,
  examples: [
    'maka jsdoc --init',
    'maka jsdoc',
  ]
}, function (args, opts) {
  if (opts.help)
    throw new Command.UsageError;

  if (!this.findAppDirectory())
    throw new Command.NoMeteorAppFoundError;


  var outputDest = path.join(this.pathFromProject() + '/docs');
  var configFile = path.join(this.pathFromProject() + '/config/jsdoc-config.json');
  var cwd = this.pathFromProject();

  var jsDocCommand = 'jsdoc';

  if (!this.isFile(configFile)) {
    var jsDocJson = {
      "plugins": ["plugins/markdown"],
      "tags": {
        "allowUnknownTags": true,
        "dictionaries": ["jsdoc","closure"]
      },
      "source": {
        "includePattern": ".+\\.js(doc|x)?$",
        "excludePattern": "(.+\\.app-tests.js)|(^|\\/|\\\\)_",
        "exclude": [
          "app/packages",
          "app/node_modules",
          "app/public",
          "app/private"
        ]
      },
      "templates": {
        "cleverLinks": false,
        "monospaceLinks": false
      },
      "opts": {
        "recursive": true,
        "encoding": "utf-8"
      }
    };
    fs.writeFileSync(configFile, JSON.stringify(jsDocJson, null, 4));
  }

  var spinHandle = this.logWithSpinner('Running ' + jsDocCommand);

  try {
    var exec = jsDocCommand + ' -c ' + configFile + ' -r app/ -d ' + outputDest;
    console.log(exec);

    this.execSync(exec, { cwd: cwd });
  } catch(e) {
    this.logError(e);
  } finally {
    spinHandle.stop();
  }

});
