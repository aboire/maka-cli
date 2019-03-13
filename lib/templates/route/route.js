<% if (client === 'vanilla') { %>if (this.window.location.pathname === '<%= url %>') {
  import <%= camelCaseName %>Page from '/imports/ui/pages/<%= cssCaseName %>/<%= cssCaseName %>';
}<% } else { %>/**
 * * Name: <%= name %>
 * * URL: <%= url %>
 * * Layout: <%= layout %>
 * * Template: <%= templateName %>
 * @memberof Client.Routes
 * @member <%= name %>
 */
FlowRouter.route('<%= url %>', {
  name: '<%= name %>',
  action() {
    BlazeLayout.render('<%= layout %>', {yield: "<%= name %>"});
  }
});<% } %>
