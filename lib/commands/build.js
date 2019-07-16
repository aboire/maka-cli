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

  var args = [this.pathFromProject('build')]
  .concat(process.argv.slice(3))

  this.invokeMeteorCommand('npm', 'audit');
  return this.invokeMeteorCommand('build', args);
});
