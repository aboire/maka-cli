Command.create({
  name: 'build',
  usage: 'maka build [opts]',
  description: 'Build your application into the build folder.',
  examples: [
    'maka build'
  ]
}, function (args, opts) {
  if (!this.findAppDirectory())
    throw new Command.NoMeteorAppFoundError;

  var config = CurrentConfig.withConfigFile(function() {
    return this.CurrentConfig.get();
  });

  var args = [this.pathFromProject('build')]
  .concat(process.argv.slice(3))

  if (opts._.indexOf('docker') > 0) {
    var buildPath = this.pathFromProject('build');
    var nodeVer = this.execSync('maka node --version', {}, false).replace(/\r?\n|\r/g, "");
    var tagString = '-t ' + this.fileCase(config.appName) + '/latest';
    if (opts.tag) {
      tagString = '-t ' + opts.tag;
    }
    var dockerBuildString = 'docker build -q --build-arg NODE_VERSION=' + nodeVer + ' ' + tagString + ' ' + buildPath;
    this.invokeMeteorCommand('build', buildPath);
    this.logWithSpinner('[+] Building docker image...\n');
    this.execSync(dockerBuildString);
    return;
  }

  return this.invokeMeteorCommand('build', args);
});
