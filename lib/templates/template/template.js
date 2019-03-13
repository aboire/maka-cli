<% if (client === 'vanilla') { %>import '/imports/ui/layouts/master-layout/master-layout';
<% if (isComponent) { %>class <%= className %>Component {<% } else { %>class <%= className %>Page {<% } %>
  constructor() {
    this.text = `<h2>Find me in <%= myPath %></h2>`
    this.render();
  }
  
  markup() {
    return `
      <% if (isComponent) { %><div id="<%= cssCaseName %>-component">${this.text}</div><% } else { %><div id="<%= cssCaseName %>-page">${this.text}</div><% } %>
    `;
  }

  render() {<% if (isComponent) { %>
    const el = document.getElementById('<%= cssCaseName %>');
    el.innerHTML = this.markup(); <% } else { %>
    const el = document.getElementById('master-layout');
    el.innerHTML = this.markup(); <% } %>
  }
}

<% if (isComponent) { %>export default <%= camelCaseName %>Component = new <%= className %>Component();<% } else { %>export default <%= camelCaseName %>Page = new <%= className %>Page();<% } } else {%>
import { Template } from 'meteor/templating';

/**
 * @namespace Client.Templates.<%= className %>
 * @memberof Client.Templates
 */

/*****************************************************************************/
/**
 * <%= className %>: Event Handlers
 * @memberof Client.Templates.<%= className %>
 * @member Events
 */
/*****************************************************************************/
Template.<%= className %>.events({
});

/*****************************************************************************/
/**
 * <%= className %>: Helpers
 * @memberof Client.Templates.<%= className %>
 * @member Helpers
 */
/*****************************************************************************/
Template.<%= className %>.helpers({
});

/*****************************************************************************/
/** <%= className %>: Life cycle hooks */
/*****************************************************************************/
/**
 * @memberof Client.Templates.<%= className %>
 * @member onCreated
 */
Template.<%= className %>.onCreated(function() {
});

/**
 * @memberof Client.Templates.<%= className %>
 * @member onRendered
 */
Template.<%= className %>.onRendered(function() {
});

/**
 * @memberof Client.Templates.<%= className %>
 * @member onDestroyed
 */
Template.<%= className %>.onDestroyed(function() {
});<% } %>
