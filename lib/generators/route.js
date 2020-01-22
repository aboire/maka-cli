var path = require('path');
var _ = require('underscore');

var RouteGenerator = Generator.create({
    name: 'route',
    aliases: [''],
    usage: 'maka {generate, g}:{route, r} [path/]<name> [url]',
    description: 'Generate scaffolding for a Route.',
    examples: [
        'maka g:route todosIndex todos',
        'maka g:route todosEdit todos/:id/edit',
        'maka g:route usersShow users/:id/show --layout userView',
        'maka g:route lists/listIndex lists',
    ]
}, function (args, opts) {

    var config = (opts.config) ? opts.config : CurrentConfig.get();

    // Get the full name, not just the resource name
    var name = this.fileCase(opts.resourceName);

    // If no URL was specified, use /<name>
    var url = '/' + name;
    if (args.length > 1) {
        url = '/' + args.filter(function (ele) { return ele !== '/' }).join('/').toLowerCase();
    }

    // Change slashes to camelCase
    // For example if the path is todos/edit, the route name will be todosEdit
    name = name.replace(/\//, "-");
    name = this.classCase(name);
    opts.layout = this.classCase(opts.layout);

    var pathToTemplate = path.join(
        '/imports/ui/pages',
        opts.dir,
        this.fileCase(opts.resourceName),
        this.fileCase(opts.resourceName)
    );

    var context = {
        name: name,
        fileCase: this.fileCase(opts.resourceName),
        camelCaseName: this.camelCase(name),
        url: url,
        layout: opts.layout || "MasterLayout",
        templatePath: pathToTemplate,
        templateName: name,
        client: config.engines.client,
    };

    var destpath, content;
    if (config.engines.client === 'blaze') {
        destpath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/client/routes.js'));
        content = this.templateContent('route/route.js', context);
        this.injectAtEndOfFile(destpath, '\n' + content);
    } else if (config.engines.client === 'react' || config.engines.client === 'reflux') {
        if (config.engines.ssr === 'true') {
            destpath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/lib/routes.' + config.engines.js));
        } else {
            destpath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/client/routes.' + config.engines.js));
        }
        content = this.templateContent('route/route.js', context);

        var arrayOfBools = _.map(this.readFileLines(destpath), function(item) {
            return (item.indexOf('\"*\"') > -1);
        });
        var hasWildCard = arrayOfBools.indexOf(true) > -1;

        var end = (hasWildCard) ? '<Route' : '</Router>';

        this.injectIntoFile(destpath, '\n      ' + content + '\n      ', '<Router', end);
    } else if (config.engines.client === 'vanilla' ) {
      destpath = this.rewriteDestinationPathForEngine(this.pathFromApp('imports/startup/client/routes.js'));
      content = this.templateContent('route/route.js', context);
      this.injectAtEndOfFile(destpath, '\n' + content);
    }


    var isOriginGen = (opts._ && opts._[0] === 'g:route');
    var configRoute = config.route || {};

    if (configRoute.template && isOriginGen && !opts.only) {
        opts.layout = null;
        opts.route = true;
        Maka.findGenerator('template').invoke(args, opts);
    }
});
