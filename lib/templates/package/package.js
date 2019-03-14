Package.describe({
  name: "<%= name %>",
  summary: "What this does",
  version: "0.0.1",
  git: "https://github.com/<username>/<%= fileName %>.git",
});

//Npm.depends({});

Package.onUse(function(api) {
  api.versionsFrom('1.8');

  <% if (client === 'vanilla') { %>api.use(['ecmascript']);<% } else { %>
  api.use(['ecmascript', 'templating', 'modules']);<% } %>

  var packages = [
  ];

  api.use(packages);
  api.imply(packages);

  api.mainModule('server/<%= fileName %>.js', 'server');
  api.mainModule('client/<%= fileName %>.js', 'client');

  api.addFiles('lib/<%= fileName %>.js', ['client', 'server']);

  api.export('<%= className %>');
});

Package.onTest(function(api) {
  api.use('<%= name %>');
  api.use('ecmascript');
  api.use('sanjo:jasmine@1.0.0');
  api.use('velocity:html-reporter@0.10.0');
  api.addFiles('tests/server/<%= fileName %>.js', 'server');
  api.addFiles('tests/client/<%= fileName %>.js', 'client');
});
